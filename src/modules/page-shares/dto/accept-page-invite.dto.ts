import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptPageInviteDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
