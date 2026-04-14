import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { PageAccess } from '../../common/decorators/page-access.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PageAccessGuard } from '../../common/guards/page-access.guard';
import { PageSharesService } from './page-shares.service';

@Controller('workspaces/:workspaceId/pages/:pageId/invites')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@PageAccess('EDITOR')
export class PageInvitesController {
  constructor(private readonly pageSharesService: PageSharesService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string, @Param('pageId') pageId: string) {
    return this.pageSharesService.listPendingInvites(workspaceId, pageId);
  }

  @Delete(':inviteId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.pageSharesService.revokeInvite(workspaceId, pageId, inviteId);
  }
}
