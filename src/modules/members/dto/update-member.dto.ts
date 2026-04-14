import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMemberDto {
  @IsEnum(Role)
  role!: Role;
}
