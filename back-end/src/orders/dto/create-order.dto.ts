import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../schemas/order.schema';

export class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsMongoId()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsObject()
  @IsOptional()
  options?: Record<string, string>;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class OrderVoucherDto {
  @IsMongoId()
  voucherId: string;

  @IsNumber()
  @Min(0)
  discountAmount: number;

  @IsString()
  @IsOptional()
  code?: string;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsOptional()
  wardCode?: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsOptional()
  districtCode?: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsOptional()
  provinceCode?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class CreateOrderDto {
  @IsMongoId()
  @IsOptional()
  userId?: string; // Có thể lấy từ JWT token

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsObject()
  @ValidateNested()
  @Type(() => OrderVoucherDto)
  @IsOptional()
  voucher?: OrderVoucherDto;

  @IsNumber()
  @Min(0)
  finalPrice: number;

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsMongoId()
  @IsOptional()
  branchId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
