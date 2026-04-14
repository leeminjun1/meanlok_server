import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Role,
  type Page,
  type Profile,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { AccessService } from '../../common/services/access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { cloneSubtree, collectDescendantIds } from '../../shared/tree/tree.util';
import { CreatePageDto } from './dto/create-page.dto';
import { DuplicatePageDto } from './dto/duplicate-page.dto';
import { MovePageDto } from './dto/move-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

type TxClient = Prisma.TransactionClient | PrismaClient;

const WORKSPACE_EDITOR_PRIORITY: Record<Role, number> = {
  [Role.OWNER]: 3,
  [Role.EDITOR]: 2,
  [Role.VIEWER]: 1,
};

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: AccessService,
  ) {}

  private async getPageOrThrow(
    tx: TxClient,
    workspaceId: string,
    pageId: string,
  ): Promise<Page> {
    const page = await tx.page.findFirst({
      where: {
        id: pageId,
        workspaceId,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  private async assertWorkspaceEditorRole(userId: string, workspaceId: string) {
    const membershipRole = await this.accessService.getWorkspaceMemberRole(userId, workspaceId);

    if (!membershipRole || WORKSPACE_EDITOR_PRIORITY[membershipRole] < WORKSPACE_EDITOR_PRIORITY.EDITOR) {
      throw new ForbiddenException('Insufficient workspace role for target workspace');
    }
  }

  private async assertEditableTarget(
    userId: string,
    workspaceId: string,
    parentId?: string,
  ) {
    if (!parentId) {
      await this.assertWorkspaceEditorRole(userId, workspaceId);
      return;
    }

    const targetAccess = await this.accessService.assertPageAccess(userId, parentId, 'EDITOR');
    if (targetAccess.workspaceId !== workspaceId) {
      throw new BadRequestException('Invalid parent page');
    }
  }

  async create(workspaceId: string, user: Profile, dto: CreatePageDto) {
    if (dto.parentId) {
      const parentAccess = await this.accessService.assertPageAccess(
        user.id,
        dto.parentId,
        'EDITOR',
      );

      if (parentAccess.workspaceId !== workspaceId) {
        throw new BadRequestException('Invalid parent page');
      }
    } else {
      await this.assertWorkspaceEditorRole(user.id, workspaceId);
    }

    const maxOrder = await this.prisma.page.aggregate({
      where: {
        workspaceId,
        parentId: dto.parentId ?? null,
      },
      _max: { order: true },
    });

    return this.prisma.page.create({
      data: {
        workspaceId,
        parentId: dto.parentId ?? null,
        title: dto.title,
        icon: dto.icon ?? null,
        order: (maxOrder._max.order ?? 0) + 1,
        authorId: user.id,
        document: {
          create: {},
        },
      },
      include: {
        document: true,
      },
    });
  }

  async findAll(workspaceId: string, user: Profile) {
    const memberRole = await this.accessService.getWorkspaceMemberRole(user.id, workspaceId);

    if (memberRole) {
      const pages = await this.prisma.page.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          parentId: true,
          order: true,
          icon: true,
        },
        orderBy: { order: 'asc' },
      });

      return {
        pages,
        viewerRole: 'MEMBER' as const,
        memberRole,
      };
    }

    const rootShareIds = await this.accessService.listAccessibleRootPageIds(
      user.id,
      workspaceId,
    );

    if (rootShareIds.length === 0) {
      throw new NotFoundException('Workspace not found');
    }

    const accessibleIdSet = new Set<string>();
    for (const rootShareId of rootShareIds) {
      const ids = await this.accessService.collectDescendants(rootShareId);
      ids.forEach((id) => accessibleIdSet.add(id));
    }

    const pages = await this.prisma.page.findMany({
      where: {
        workspaceId,
        id: {
          in: [...accessibleIdSet],
        },
      },
      select: {
        id: true,
        title: true,
        parentId: true,
        order: true,
        icon: true,
      },
      orderBy: { order: 'asc' },
    });

    return {
      pages,
      viewerRole: 'GUEST' as const,
      memberRole: null,
    };
  }

  async findOne(workspaceId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        workspaceId,
        id: pageId,
      },
      include: {
        document: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(workspaceId: string, pageId: string, dto: UpdatePageDto) {
    await this.getPageOrThrow(this.prisma, workspaceId, pageId);

    if (dto.parentId === pageId) {
      throw new BadRequestException('Page cannot be parent of itself');
    }

    if (dto.parentId) {
      const parent = await this.prisma.page.findFirst({
        where: {
          id: dto.parentId,
          workspaceId,
        },
        select: { id: true },
      });

      if (!parent) {
        throw new BadRequestException('Invalid parent page');
      }

      const descendants = await collectDescendantIds(this.prisma, pageId);
      if (descendants.has(dto.parentId)) {
        throw new BadRequestException('Cannot move page into its own descendant');
      }
    }

    return this.prisma.page.update({
      where: { id: pageId },
      data: {
        title: dto.title,
        icon: dto.icon,
        parentId: dto.parentId,
        order: dto.order,
      },
      include: {
        document: true,
      },
    });
  }

  async remove(workspaceId: string, pageId: string) {
    await this.getPageOrThrow(this.prisma, workspaceId, pageId);

    await this.prisma.page.delete({
      where: { id: pageId },
    });

    return { ok: true };
  }

  async duplicate(
    workspaceId: string,
    pageId: string,
    user: Profile,
    dto: DuplicatePageDto,
  ) {
    await this.getPageOrThrow(this.prisma, workspaceId, pageId);

    const targetWorkspaceId = dto.targetWorkspaceId ?? workspaceId;
    const targetParentId = dto.targetParentId;

    await this.assertEditableTarget(user.id, targetWorkspaceId, targetParentId);

    return this.prisma.$transaction(async (tx) => {
      const newRootId = await cloneSubtree(tx, pageId, {
        targetWorkspaceId,
        targetParentId,
        authorId: user.id,
      });

      const maxOrder = await tx.page.aggregate({
        where: {
          workspaceId: targetWorkspaceId,
          parentId: targetParentId ?? null,
          id: { not: newRootId },
        },
        _max: { order: true },
      });

      await tx.page.update({
        where: { id: newRootId },
        data: {
          order: (maxOrder._max.order ?? 0) + 1,
        },
      });

      return tx.page.findUnique({
        where: { id: newRootId },
        include: { document: true },
      });
    });
  }

  async move(workspaceId: string, pageId: string, user: Profile, dto: MovePageDto) {
    await this.getPageOrThrow(this.prisma, workspaceId, pageId);

    const targetWorkspaceId = dto.targetWorkspaceId ?? workspaceId;
    const targetParentId = dto.targetParentId ?? null;

    await this.assertEditableTarget(user.id, targetWorkspaceId, targetParentId ?? undefined);

    return this.prisma.$transaction(async (tx) => {
      const descendantIds = await collectDescendantIds(tx, pageId);

      if (targetParentId && descendantIds.has(targetParentId)) {
        throw new BadRequestException('Cannot move page into its own descendant');
      }

      if (targetWorkspaceId !== workspaceId) {
        await tx.page.updateMany({
          where: {
            id: {
              in: [...descendantIds],
            },
          },
          data: {
            workspaceId: targetWorkspaceId,
          },
        });
      }

      const maxOrder = await tx.page.aggregate({
        where: {
          workspaceId: targetWorkspaceId,
          parentId: targetParentId,
          id: { not: pageId },
        },
        _max: { order: true },
      });

      return tx.page.update({
        where: { id: pageId },
        data: {
          workspaceId: targetWorkspaceId,
          parentId: targetParentId,
          order: dto.order ?? (maxOrder._max.order ?? 0) + 1,
        },
        include: {
          document: true,
        },
      });
    });
  }
}
