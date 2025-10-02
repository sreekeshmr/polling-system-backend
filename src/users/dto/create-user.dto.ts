import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../../shared/entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}