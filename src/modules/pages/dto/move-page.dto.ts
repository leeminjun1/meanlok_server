import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MovePageDto {
  @IsOptional()
  @IsString()
  targetWorkspaceId?: string;

  @IsOptional()
  @IsString()
  targetParentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}
