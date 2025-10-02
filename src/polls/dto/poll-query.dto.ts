import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PollStatus, PollVisibility } from '../../shared/entities/poll.entity';
import { Type } from 'class-transformer';

export class PollQueryDto {
  @IsEnum(PollStatus)
  @IsOptional()
  status?: PollStatus;

  @IsEnum(PollVisibility)
  @IsOptional()
  visibility?: PollVisibility;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeExpired?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  myPolls?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  expired?: boolean;
}