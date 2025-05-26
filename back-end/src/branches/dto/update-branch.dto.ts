import { IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Tên chi nhánh không được để trống' })
  @Length(2, 100, { message: 'Tên chi nhánh phải từ 2-100 ký tự' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Địa chỉ chi nhánh không được để trống' })
  @Length(5, 255, { message: 'Địa chỉ phải từ 5-255 ký tự' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50, { message: 'Thông tin liên hệ không được quá 50 ký tự' })
  @Transform(({ value }) => value?.trim())
  contact?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Mã tỉnh/thành phố không được để trống nếu được cung cấp' })
  @Matches(/^\d+$/, { message: 'Mã tỉnh/thành phố phải là số' })
  provinceCode?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Mã quận/huyện không được để trống nếu được cung cấp' })
  @Matches(/^\d+$/, { message: 'Mã quận/huyện phải là số' })
  districtCode?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Mã phường/xã không được để trống nếu được cung cấp' })
  @Matches(/^\d+$/, { message: 'Mã phường/xã phải là số' })
  wardCode?: string;
}
