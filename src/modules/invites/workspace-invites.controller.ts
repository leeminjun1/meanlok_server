import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role, type Profile } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole } from '../../common/decorators/workspace-role.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

@Controller('workspaces/:workspaceId/invites')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
@WorkspaceRole(Role.OWNER)
export class WorkspaceInvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: Profile,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.create(workspaceId, user, dto);
  }

  @Get()
  findPending(@Param('workspaceId') workspaceId: string) {
    return this.invitesService.findPending(workspaceId);
  }

  @Delete(':inviteId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invitesService.remove(workspaceId, inviteId);
  }
}
