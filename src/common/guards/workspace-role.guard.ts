import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, type Profile } from '@prisma/client';
import { WORKSPACE_ROLE_KEY } from '../decorators/workspace-role.decorator';
import { PrismaService } from '../../prisma/prisma.service';

const ROLE_PRIORITY: Record<Role, number> = {
  [Role.OWNER]: 3,
  [Role.EDITOR]: 2,
  [Role.VIEWER]: 1,
};

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as Profile | undefined;
    const workspaceId = request.params?.workspaceId as string | undefined;

    if (!user?.id || !workspaceId) {
      return true;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    const requiredRole = this.reflector.getAllAndOverride<Role | undefined>(WORKSPACE_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    if (ROLE_PRIORITY[membership.role] < ROLE_PRIORITY[requiredRole]) {
      throw new ForbiddenException('Insufficient workspace role');
    }

    return true;
  }
}
