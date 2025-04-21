import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chi nhánh không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi nhánh không được để trống' })
  address: string;

  @IsString()
  @IsOptional()
  contact: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã tỉnh/thành phố không được để trống' })
  provinceCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã quận/huyện không được để trống' })
  districtCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã phường/xã không được để trống' })
  wardCode: string;
}
