import { IsString } from 'class-validator';

export class DraftDto {
  @IsString()
  prompt!: string;
}
