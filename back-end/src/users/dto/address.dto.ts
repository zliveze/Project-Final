import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsNotEmpty()
  @IsString()
  addressLine: string;

  @IsNotEmpty()
  @IsString()
  wardName: string;

  @IsNotEmpty()
  @IsString()
  wardCode: string;

  @IsNotEmpty()
  @IsString()
  districtName: string;

  @IsNotEmpty()
  @IsString()
  districtCode: string;

  @IsNotEmpty()
  @IsString()
  provinceName: string;

  @IsNotEmpty()
  @IsString()
  provinceCode: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}