import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AcceptPageInviteDto } from './dto/accept-page-invite.dto';
import { PageSharesService } from './page-shares.service';

@Controller('page-invites')
@UseGuards(JwtAuthGuard)
export class PageInviteAcceptController {
  constructor(private readonly pageSharesService: PageSharesService) {}

  @Post('accept')
  accept(@CurrentUser() user: Profile, @Body() dto: AcceptPageInviteDto) {
    return this.pageSharesService.acceptInvite(user, dto);
  }
}
