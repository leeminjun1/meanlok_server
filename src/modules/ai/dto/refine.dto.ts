import { IsString } from 'class-validator';

export class RefineDto {
  @IsString()
  text!: string;
}
