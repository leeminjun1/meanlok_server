import { Injectable, NotFoundException } from '@nestjs/common';
import { DocFormat, type Profile } from '@prisma/client';
import { AccessService } from '../../common/services/access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SanitizeService } from '../../shared/sanitize/sanitize.service';
import { UpsertDocumentDto } from './dto/upsert-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: AccessService,
    private readonly sanitizeService: SanitizeService,
  ) {}

  async upsert(
    workspaceId: string,
    pageId: string,
    user: Profile,
    dto: UpsertDocumentDto,
  ) {
    const access = await this.accessService.assertPageAccess(user.id, pageId, 'EDITOR');
    if (access.workspaceId !== workspaceId) {
      throw new NotFoundException('Page not found');
    }

    const shouldSanitize = dto.format === DocFormat.HTML;
    const body = shouldSanitize ? this.sanitizeService.sanitize(dto.body) : dto.body;

    return this.prisma.document.upsert({
      where: { pageId },
      update: {
        body,
        format: dto.format,
      },
      create: {
        pageId,
        body,
        format: dto.format,
      },
    });
  }
}
