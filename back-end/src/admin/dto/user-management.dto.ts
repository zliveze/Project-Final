import { IsEmail, IsOptional, IsString, IsEnum, IsDateString, IsBoolean, IsNumber, Min, Max, IsNotEmpty, MinLength, IsIn, Length, Matches, IsPhoneNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UserFilterDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'active', 'inactive', 'blocked'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'user', 'admin', 'superadmin', 'moderator'])
  role?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
  })
  password?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng' })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin', 'moderator'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
  })
  newPassword: string;
}

export class ChangeUserStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['active', 'inactive', 'blocked'])
  status: string;
}

export class ChangeUserRoleDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'admin', 'moderator'])
  role: string;
}

export class ChangeUserCustomerLevelDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['Khách hàng mới', 'Khách hàng bạc', 'Khách hàng vàng', 'Khách hàng thân thiết'])
  customerLevel: string;
}

export class CreateUserByAdminDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
  })
  password: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng' })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin', 'moderator'])
  role?: string = 'user';
} 