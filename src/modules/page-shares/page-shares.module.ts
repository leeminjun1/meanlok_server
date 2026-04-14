import { Module } from '@nestjs/common';
import { PageInviteAcceptController } from './page-invite-accept.controller';
import { PageInvitesController } from './page-invites.controller';
import { PageSharesController } from './page-shares.controller';
import { PageSharesService } from './page-shares.service';

@Module({
  controllers: [
    PageSharesController,
    PageInvitesController,
    PageInviteAcceptController,
  ],
  providers: [PageSharesService],
})
export class PageSharesModule {}
