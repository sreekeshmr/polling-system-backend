import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  selectedOption: string;
}