import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PageAccess } from '../../common/decorators/page-access.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PageAccessGuard } from '../../common/guards/page-access.guard';
import { UpsertDocumentDto } from './dto/upsert-document.dto';
import { DocumentsService } from './documents.service';

@Controller('workspaces/:workspaceId/pages/:pageId/document')
@UseGuards(JwtAuthGuard, PageAccessGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @PageAccess('EDITOR')
  @Put()
  upsert(
    @Param('workspaceId') workspaceId: string,
    @Param('pageId') pageId: string,
    @CurrentUser() user: Profile,
    @Body() dto: UpsertDocumentDto,
  ) {
    return this.documentsService.upsert(workspaceId, pageId, user, dto);
  }
}
