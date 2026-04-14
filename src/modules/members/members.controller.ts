import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { WorkspaceRole } from '../../common/decorators/workspace-role.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.membersService.findAll(workspaceId);
  }

  @WorkspaceRole(Role.OWNER)
  @Patch(':memberId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(workspaceId, memberId, dto);
  }

  @WorkspaceRole(Role.OWNER)
  @Delete(':memberId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.remove(workspaceId, memberId);
  }
}
