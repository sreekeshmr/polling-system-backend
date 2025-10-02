import { 
  IsArray, 
  IsEnum, 
  IsNumber, 
  IsString, 
  Min, 
  Max, 
  IsOptional, 
  ArrayNotEmpty,
  MinLength,
  ArrayMaxSize,
  ValidateIf,
  IsEmail
} from 'class-validator';
import { PollVisibility } from '../../shared/entities/poll.entity';
import { Type } from 'class-transformer';

export class CreatePollDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  options: string[];

  @IsEnum(PollVisibility)
  visibility: PollVisibility;

  @IsNumber()
  @Min(0.1)
  @Max(2)
  @Type(() => Number)
  durationHours: number;

  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true })
  @ArrayMaxSize(100)
  @ValidateIf(o => o.visibility === PollVisibility.PRIVATE)
  allowedUserEmails?: string[];
}