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
  // Các trường của CalculateShippingDto cũ
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

  // Các trường của API getPrice của Viettel Post
  @IsNumber()
  @IsOptional()
  PRODUCT_WEIGHT?: number;

  @IsNumber()
  @IsOptional()
  PRODUCT_PRICE?: number;

  @IsNumber()
  @IsOptional()
  MONEY_COLLECTION?: number;

  @IsString()
  @IsOptional()
  ORDER_SERVICE_ADD?: string;

  @IsString()
  @IsOptional()
  ORDER_SERVICE?: string;

  @IsString()
  @IsOptional()
  SENDER_PROVINCE?: string;

  @IsString()
  @IsOptional()
  SENDER_DISTRICT?: string;

  @IsString()
  @IsOptional()
  RECEIVER_PROVINCE?: string;

  @IsString()
  @IsOptional()
  RECEIVER_DISTRICT?: string;

  @IsString()
  @IsOptional()
  PRODUCT_TYPE?: string;

  @IsNumber()
  @IsOptional()
  NATIONAL_TYPE?: number;

  @IsNumber()
  @IsOptional()
  PRODUCT_LENGTH?: number;

  @IsNumber()
  @IsOptional()
  PRODUCT_WIDTH?: number;

  @IsNumber()
  @IsOptional()
  PRODUCT_HEIGHT?: number;
}

export class ShippingFeeResponseDto {
  success: boolean;
  fee: number;
  estimatedDeliveryTime?: string;
  selectedServiceCode?: string; // Thêm mã dịch vụ đã chọn
  availableServices?: Array<{
    serviceCode: string;
    serviceName: string;
    fee: number;
    estimatedDeliveryTime: string;
  }>;
  error?: string;
}
