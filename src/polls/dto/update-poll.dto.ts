import { PartialType } from '@nestjs/mapped-types';
import { CreatePollDto } from './create-poll.dto';
import { 
  IsArray, 
  IsOptional, 
  IsEmail, 
  ArrayMaxSize, 
  ValidateIf 
} from 'class-validator';
import { PollVisibility } from '../../shared/entities/poll.entity';

export class UpdatePollDto extends PartialType(CreatePollDto) {
  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true })
  @ArrayMaxSize(100)
  @ValidateIf(o => o.visibility === PollVisibility.PRIVATE)
  allowedUserEmails?: string[];
}