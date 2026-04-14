import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('accept')
  accept(@CurrentUser() user: Profile, @Body() dto: AcceptInviteDto) {
    return this.invitesService.accept(user, dto);
  }
}
