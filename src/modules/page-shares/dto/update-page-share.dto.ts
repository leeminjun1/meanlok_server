import { PageRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePageShareDto {
  @IsEnum(PageRole)
  role!: PageRole;
}
