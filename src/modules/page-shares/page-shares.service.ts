import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageRole, type Profile } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AcceptPageInviteDto } from './dto/accept-page-invite.dto';
import { CreatePageShareDto } from './dto/create-page-share.dto';
import { UpdatePageShareDto } from './dto/update-page-share.dto';

const PAGE_ROLE_PRIORITY: Record<PageRole, number> = {
  [PageRole.EDITOR]: 2,
  [PageRole.VIEWER]: 1,
};

@Injectable()
export class PageSharesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getPageOrThrow(workspaceId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        id: pageId,
        workspaceId,
      },
      select: {
        id: true,
        title: true,
        parentId: true,
        workspaceId: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private createLinkOnlyInviteEmail() {
    return `link-${randomBytes(8).toString('hex')}@share.meanlok.local`;
  }

  private async createInvite(params: {
    pageId: string;
    email: string;
    role: PageRole;
    inviterId: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.pageInvite.create({
      data: {
        pageId: params.pageId,
        email: params.email,
        role: params.role,
        token: randomBytes(24).toString('hex'),
        inviterId: params.inviterId,
        expiresAt,
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  private shareOutput(share: {
    id: string;
    role: PageRole;
    createdAt: Date;
    user: { id: string; email: string; name: string };
  }) {
    return {
      id: share.id,
      role: share.role,
      user: share.user,
      createdAt: share.createdAt,
    };
  }

  async listShares(workspaceId: string, pageId: string) {
    const page = await this.getPageOrThrow(workspaceId, pageId);

    const directShares = await this.prisma.pageShare.findMany({
      where: { pageId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const ancestorPages: Array<{ id: string; title: string; parentId: string | null }> = [];
    let currentParentId = page.parentId;

    while (currentParentId) {
      const parent = await this.prisma.page.findUnique({
        where: { id: currentParentId },
        select: {
          id: true,
          title: true,
          parentId: true,
        },
      });

      if (!parent) {
        break;
      }

      ancestorPages.push(parent);
      currentParentId = parent.parentId;
    }

    const inheritedShares =
      ancestorPages.length === 0
        ? []
        : await this.prisma.pageShare.findMany({
            where: {
              pageId: {
                in: ancestorPages.map((ancestor) => ancestor.id),
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });

    const ancestorTitleMap = new Map(ancestorPages.map((ancestor) => [ancestor.id, ancestor.title]));
    const directUserIds = new Set(directShares.map((share) => share.userId));

    const inheritedByUser = new Map<
      string,
      {
        role: PageRole;
        user: { id: string; email: string; name: string };
        sourcePage: { id: string; title: string };
        createdAt: Date;
      }
    >();

    for (const share of inheritedShares) {
      if (directUserIds.has(share.userId)) {
        continue;
      }

      const title = ancestorTitleMap.get(share.pageId);
      if (!title) {
        continue;
      }

      const existing = inheritedByUser.get(share.userId);
      if (
        !existing ||
        PAGE_ROLE_PRIORITY[share.role] > PAGE_ROLE_PRIORITY[existing.role] ||
        (share.role === existing.role && share.createdAt > existing.createdAt)
      ) {
        inheritedByUser.set(share.userId, {
          role: share.role,
          user: share.user,
          sourcePage: {
            id: share.pageId,
            title,
          },
          createdAt: share.createdAt,
        });
      }
    }

    return {
      direct: directShares.map((share) => this.shareOutput(share)),
      inherited: [...inheritedByUser.values()],
    };
  }

  async addShare(
    workspaceId: string,
    pageId: string,
    inviter: Profile,
    dto: CreatePageShareDto,
  ) {
    await this.getPageOrThrow(workspaceId, pageId);

    if (dto.userId && dto.email) {
      throw new BadRequestException('Provide either userId or email');
    }

    if (dto.userId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      });

      if (!profile) {
        throw new NotFoundException('User not found');
      }

      const share = await this.prisma.pageShare.upsert({
        where: {
          pageId_userId: {
            pageId,
            userId: dto.userId,
          },
        },
        create: {
          pageId,
          userId: dto.userId,
          role: dto.role,
        },
        update: {
          role: dto.role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return {
        kind: 'share' as const,
        data: this.shareOutput(share),
      };
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : null;

    if (email) {
      const profile = await this.prisma.profile.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
        },
      });

      if (profile) {
        const share = await this.prisma.pageShare.upsert({
          where: {
            pageId_userId: {
              pageId,
              userId: profile.id,
            },
          },
          create: {
            pageId,
            userId: profile.id,
            role: dto.role,
          },
          update: {
            role: dto.role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        return {
          kind: 'share' as const,
          data: this.shareOutput(share),
        };
      }
    }

    const invite = await this.createInvite({
      pageId,
      email: email ?? this.createLinkOnlyInviteEmail(),
      role: dto.role,
      inviterId: inviter.id,
    });

    return {
      kind: 'invite' as const,
      data: invite,
    };
  }

  async updateShare(
    workspaceId: string,
    pageId: string,
    shareId: string,
    dto: UpdatePageShareDto,
  ) {
    const share = await this.prisma.pageShare.findUnique({
      where: { id: shareId },
      select: {
        id: true,
        pageId: true,
        page: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!share || share.pageId !== pageId || share.page.workspaceId !== workspaceId) {
      throw new NotFoundException('Page share not found');
    }

    const updated = await this.prisma.pageShare.update({
      where: { id: shareId },
      data: {
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return this.shareOutput(updated);
  }

  async removeShare(workspaceId: string, pageId: string, shareId: string) {
    const deleted = await this.prisma.pageShare.deleteMany({
      where: {
        id: shareId,
        pageId,
        page: {
          workspaceId,
        },
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Page share not found');
    }

    return { ok: true };
  }

  async listPendingInvites(workspaceId: string, pageId: string) {
    await this.getPageOrThrow(workspaceId, pageId);

    return this.prisma.pageInvite.findMany({
      where: {
        pageId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revokeInvite(workspaceId: string, pageId: string, inviteId: string) {
    const deleted = await this.prisma.pageInvite.deleteMany({
      where: {
        id: inviteId,
        pageId,
        page: {
          workspaceId,
        },
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Page invite not found');
    }

    return { ok: true };
  }

  async acceptInvite(user: Profile, dto: AcceptPageInviteDto) {
    const invite = await this.prisma.pageInvite.findUnique({
      where: { token: dto.token },
      include: {
        page: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Page invite not found');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Page invite already accepted');
    }

    if (invite.expiresAt <= new Date()) {
      throw new BadRequestException('Page invite expired');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pageShare.upsert({
        where: {
          pageId_userId: {
            pageId: invite.pageId,
            userId: user.id,
          },
        },
        update: {
          role: invite.role,
        },
        create: {
          pageId: invite.pageId,
          userId: user.id,
          role: invite.role,
        },
      });

      await tx.pageInvite.update({
        where: { id: invite.id },
        data: {
          acceptedAt: new Date(),
        },
      });
    });

    return {
      workspaceId: invite.page.workspaceId,
      pageId: invite.page.id,
    };
  }
}
