import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Profile, Role } from '@prisma/client';
import {
  PAGE_ACCESS_KEY,
  type PageAccessRole,
} from '../decorators/page-access.decorator';
import { AccessService } from '../services/access.service';

const WORKSPACE_EDITOR_ROLES: Role[] = ['OWNER', 'EDITOR'];

@Injectable()
export class PageAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as Profile | undefined;
    const workspaceId = request.params?.workspaceId as string | undefined;

    if (!user?.id || !workspaceId) {
      return true;
    }

    const requiredRole =
      this.reflector.getAllAndOverride<PageAccessRole | undefined>(PAGE_ACCESS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'VIEWER';

    const pageId = request.params?.pageId as string | undefined;
    const parentId = request.body?.parentId as string | undefined;

    if (!pageId && !parentId) {
      const memberRole = await this.accessService.getWorkspaceMemberRole(user.id, workspaceId);
      if (!memberRole || !WORKSPACE_EDITOR_ROLES.includes(memberRole)) {
        throw new ForbiddenException('Insufficient workspace role');
      }

      request.pageAccess = {
        role: 'EDITOR',
        viaMember: true,
        workspaceId,
        pageId: null,
      };

      return true;
    }

    const targetPageId = pageId ?? parentId;
    if (!targetPageId) {
      throw new NotFoundException('Page not found');
    }

    const effective = await this.accessService.assertPageAccess(
      user.id,
      targetPageId,
      requiredRole,
    );

    if (effective.workspaceId !== workspaceId) {
      throw new NotFoundException('Page not found');
    }

    request.pageAccess = {
      role: effective.role,
      viaMember: effective.viaMember,
      workspaceId,
      pageId: targetPageId,
    };

    return true;
  }
}
