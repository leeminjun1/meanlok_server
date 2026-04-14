import { DocFormat } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class UpsertDocumentDto {
  @IsString()
  body!: string;

  @IsEnum(DocFormat)
  format!: DocFormat;
}
