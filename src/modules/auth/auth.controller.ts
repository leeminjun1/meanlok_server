import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: Profile) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/shared-pages')
  async getSharedPages(@CurrentUser() user: Profile) {
    const shares = await this.prisma.pageShare.findMany({
      where: {
        userId: user.id,
        page: {
          workspace: {
            members: {
              none: {
                userId: user.id,
              },
            },
          },
        },
      },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            icon: true,
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
            invites: {
              where: {
                acceptedAt: {
                  not: null,
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                inviter: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return shares.map((share) => ({
      workspace: share.page.workspace,
      page: {
        id: share.page.id,
        title: share.page.title,
        icon: share.page.icon,
      },
      role: share.role,
      sharedBy: share.page.invites[0]?.inviter ?? null,
      createdAt: share.createdAt,
    }));
  }
}
