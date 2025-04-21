import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../schemas/order.schema';

export class QueryOrderDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  @IsString()
  search?: string; // Tìm kiếm theo orderNumber hoặc thông tin khách hàng

  @IsOptional()
  @IsString()
  fromDate?: string; // Ngày bắt đầu tìm kiếm (YYYY-MM-DD)

  @IsOptional()
  @IsString()
  toDate?: string; // Ngày kết thúc tìm kiếm (YYYY-MM-DD)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class OrderResponseDto {
  _id: any;
  orderNumber: string;
  userId: any;
  userName?: string;
  userEmail?: string;
  items: any[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalPrice: number;
  voucher?: any;
  finalPrice: number;
  status: string;
  shippingAddress: any;
  paymentMethod: string;
  paymentStatus: string;
  trackingCode?: string;
  createdAt: any;
  updatedAt: any;
}

export class PaginatedOrdersResponseDto {
  data: OrderResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
