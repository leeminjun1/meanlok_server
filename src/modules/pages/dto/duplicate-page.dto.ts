import { IsOptional, IsString } from 'class-validator';

export class DuplicatePageDto {
  @IsOptional()
  @IsString()
  targetWorkspaceId?: string;

  @IsOptional()
  @IsString()
  targetParentId?: string;
}
