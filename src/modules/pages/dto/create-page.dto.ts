import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  icon?: string | null;
}
