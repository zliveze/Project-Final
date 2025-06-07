import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMomoPaymentDto {
  @ApiProperty({
    description: 'ID của đơn hàng cần thanh toán (hoặc "new" nếu là đơn hàng mới)',
    example: '650d09b60c58f1a917ca9ec1',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Số tiền cần thanh toán (VND)',
    example: 100000,
    minimum: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({
    description: 'URL chuyển hướng sau khi thanh toán',
    example: 'https://project-final-livid.vercel.app/payments/success',
  })
  @IsNotEmpty()
  @IsString()
  returnUrl: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán đơn hàng Yumin',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderInfo?: string;

  @ApiProperty({
    description: 'Dữ liệu đơn hàng (chỉ cần thiết khi tạo đơn hàng mới)',
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  orderData?: Record<string, any>;
}
