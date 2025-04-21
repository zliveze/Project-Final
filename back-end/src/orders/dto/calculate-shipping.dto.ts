import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ShippingCalculationAddressDto {
  @IsString()
  @IsNotEmpty()
  wardCode: string;

  @IsString()
  @IsNotEmpty()
  districtCode: string;

  @IsString()
  @IsNotEmpty()
  provinceCode: string;
}

export class ProductInfoDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  weight: number = 500; // Mặc định 500g

  @IsNumber()
  @Min(0)
  length: number = 20; // Mặc định 20cm

  @IsNumber()
  @Min(0)
  width: number = 15; // Mặc định 15cm

  @IsNumber()
  @Min(0)
  height: number = 10; // Mặc định 10cm
}

export class CalculateShippingDto {
  @ValidateNested()
  @Type(() => ShippingCalculationAddressDto)
  shippingAddress: ShippingCalculationAddressDto;

  @ValidateNested()
  @Type(() => ProductInfoDto)
  productInfo: ProductInfoDto;

  @IsNumber()
  @Min(0)
  orderValue: number;

  @IsString()
  @IsOptional()
  serviceCode?: string = 'LCOD'; // Mặc định là LCOD (Chuyển phát tiêu chuẩn)
}

export class ShippingFeeResponseDto {
  success: boolean;
  fee: number;
  estimatedDeliveryTime?: string;
  availableServices?: Array<{
    serviceCode: string;
    serviceName: string;
    fee: number;
    estimatedDeliveryTime: string;
  }>;
  error?: string;
}
