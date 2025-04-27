import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStripePaymentDto {
  @ApiProperty({ description: 'Số tiền thanh toán (đơn vị: VND)' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Loại tiền tệ', default: 'vnd' })
  @IsNotEmpty()
  @IsString()
  currency: string = 'vnd';

  @ApiProperty({ description: 'ID đơn hàng (nếu đã có)', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: 'Mô tả đơn hàng', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Metadata bổ sung', required: false })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Dữ liệu đơn hàng (dùng khi tạo đơn hàng mới)', required: false })
  @IsOptional()
  orderData?: any;

  @ApiProperty({ description: 'URL chuyển hướng sau khi thanh toán thành công', required: false })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
