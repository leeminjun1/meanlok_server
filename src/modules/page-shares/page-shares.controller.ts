import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PageAccess } from '../../common/decorators/page-access.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PageAccessGuard } from '../../common/guards/page-access.guard';
import { CreatePageShareDto } from './dto/create-page-share.dto';
import { UpdatePageShareDto } from './dto/update-page-share.dto';
import { PageSharesService } from './page-shares.service';

@Controller('workspaces/:workspaceId/pages/:pageId/shares')
@UseGuards(JwtAuthGuard, PageAccessGuard)
export class PageSharesController {
  constructor(private readonly pageSharesService: PageSharesService) {}

  @PageAccess('VIEWER')
  @Get()
  list(@Param('workspaceId') workspaceId: string, @Param('pageId') pageId: string) {
    return this.pageSharesService.listShares(workspaceId, pageId);
  }

  @PageAccess('EDITOR')
  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @CurrentUser() user: Profile,
    @Body() dto: CreatePageShareDto,
  ) {
    return this.pageSharesService.addShare(workspaceId, pageId, user, dto);
  }

  @PageAccess('EDITOR')
  @Patch(':shareId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('shareId') shareId: string,
    @Body() dto: UpdatePageShareDto,
  ) {
    return this.pageSharesService.updateShare(workspaceId, pageId, shareId, dto);
  }

  @PageAccess('EDITOR')
  @Delete(':shareId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('shareId') shareId: string,
  ) {
    return this.pageSharesService.removeShare(workspaceId, pageId, shareId);
  }
}
