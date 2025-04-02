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
} 