import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Tên chi nhánh không được để trống' })
  name?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Địa chỉ chi nhánh không được để trống' })
  address?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Mã tỉnh/thành phố không được để trống nếu được cung cấp' })
  provinceCode?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Mã quận/huyện không được để trống nếu được cung cấp' })
  districtCode?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Mã phường/xã không được để trống nếu được cung cấp' })
  wardCode?: string;
}
