import { IsEmail, IsOptional, IsString, MinLength, IsEnum, IsBoolean, IsDate } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['user', 'admin', 'superadmin'], { message: 'Role phải là user, admin hoặc superadmin' })
  role?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
  
  @IsOptional()
  @IsString()
  googleId?: string;
  
  @IsOptional()
  @IsString()
  refreshToken?: string;
  
  @IsOptional()
  @IsString()
  resetPasswordToken?: string;
  
  @IsOptional()
  @IsDate()
  resetPasswordExpires?: Date;
  
  @IsOptional()
  @IsString()
  verificationToken?: string;
  
  @IsOptional()
  @IsDate()
  verificationExpires?: Date;
} 