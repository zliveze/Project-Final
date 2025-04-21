import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus, PaymentStatus } from '../schemas/order.schema';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  trackingCode?: string;

  @IsMongoId()
  @IsOptional()
  updatedBy?: string; // ID của admin cập nhật đơn hàng
}
