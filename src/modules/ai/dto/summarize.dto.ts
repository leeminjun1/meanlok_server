import { IsString } from 'class-validator';

export class SummarizeDto {
  @IsString()
  text!: string;
}
