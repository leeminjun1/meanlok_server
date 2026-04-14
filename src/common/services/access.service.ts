import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { collectDescendantIds } from '../../shared/tree/tree.util';

export type EffectivePageRole = 'EDITOR' | 'VIEWER' | null;

export interface EffectivePageAccess {
  role: EffectivePageRole;
  viaMember: boolean;
  workspaceId: string;
}

const PAGE_ROLE_PRIORITY: Record<'EDITOR' | 'VIEWER', number> = {
  EDITOR: 2,
  VIEWER: 1,
};

const WORKSPACE_TO_PAGE_ROLE: Record<Role, EffectivePageRole> = {
  OWNER: 'EDITOR',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
};

function toPriority(role: EffectivePageRole): number {
  if (!role) {
    return 0;
  }

  return PAGE_ROLE_PRIORITY[role];
}

function maxRole(a: EffectivePageRole, b: EffectivePageRole): EffectivePageRole {
  return toPriority(a) >= toPriority(b) ? a : b;
}

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceMemberRole(userId: string, workspaceId: string): Promise<Role | null> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    });

    return membership?.role ?? null;
  }

  async getEffectivePageRole(
    userId: string,
    pageId: string,
  ): Promise<EffectivePageAccess> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        workspaceId: true,
        parentId: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const ancestorIds = [page.id];
    let currentParentId = page.parentId;

    while (currentParentId) {
      const parent = await this.prisma.page.findUnique({
        where: { id: currentParentId },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!parent) {
        break;
      }

      ancestorIds.push(parent.id);
      currentParentId = parent.parentId;
    }

    const pageShares = await this.prisma.pageShare.findMany({
      where: {
        userId,
        pageId: {
          in: ancestorIds,
        },
      },
      select: {
        role: true,
      },
    });

    const pageRole = pageShares.reduce<EffectivePageRole>((acc, share) => {
      const current = share.role as PageRole;
      const nextRole: EffectivePageRole = current === PageRole.EDITOR ? 'EDITOR' : 'VIEWER';
      return maxRole(acc, nextRole);
    }, null);

    const workspaceMemberRole = await this.getWorkspaceMemberRole(userId, page.workspaceId);
    const workspaceRole = workspaceMemberRole
      ? WORKSPACE_TO_PAGE_ROLE[workspaceMemberRole]
      : null;

    const role = maxRole(workspaceRole, pageRole);

    return {
      role,
      viaMember: toPriority(workspaceRole) >= toPriority(pageRole) && Boolean(workspaceRole),
      workspaceId: page.workspaceId,
    };
  }

  async assertPageAccess(
    userId: string,
    pageId: string,
    required: 'VIEWER' | 'EDITOR',
  ): Promise<EffectivePageAccess> {
    const effective = await this.getEffectivePageRole(userId, pageId);

    if (toPriority(effective.role) < PAGE_ROLE_PRIORITY[required]) {
      throw new ForbiddenException('Insufficient page access');
    }

    return effective;
  }

  async isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
    const role = await this.getWorkspaceMemberRole(userId, workspaceId);
    return role !== null;
  }

  async listAccessibleRootPageIds(userId: string, workspaceId: string): Promise<string[]> {
    const shares = await this.prisma.pageShare.findMany({
      where: {
        userId,
        page: {
          workspaceId,
        },
      },
      select: {
        pageId: true,
      },
    });

    return shares.map((share) => share.pageId);
  }

  async collectDescendants(pageId: string): Promise<Set<string>> {
    return collectDescendantIds(this.prisma, pageId);
  }
}
