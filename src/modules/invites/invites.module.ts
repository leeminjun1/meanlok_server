import { Module } from '@nestjs/common';
import { InvitesController } from './invites.controller';
import { WorkspaceInvitesController } from './workspace-invites.controller';
import { InvitesService } from './invites.service';

@Module({
  controllers: [WorkspaceInvitesController, InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
