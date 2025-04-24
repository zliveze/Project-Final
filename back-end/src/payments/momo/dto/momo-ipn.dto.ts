import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MomoIpnDto {
  @ApiProperty({
    description: 'Mã đối tác MoMo',
    example: 'MOMOBKUN20180529',
  })
  @IsNotEmpty()
  @IsString()
  partnerCode: string;

  @ApiProperty({
    description: 'ID đơn hàng từ MoMo',
    example: 'MOMOBKUN20180529_1624345678',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'ID yêu cầu thanh toán',
    example: 'MOMOBKUN20180529_1624345678',
  })
  @IsNotEmpty()
  @IsString()
  requestId: string;

  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán đơn hàng Yumin',
  })
  @IsNotEmpty()
  @IsString()
  orderInfo: string;

  @ApiProperty({
    description: 'Loại đơn hàng',
    example: 'momo_wallet',
  })
  @IsNotEmpty()
  @IsString()
  orderType: string;

  @ApiProperty({
    description: 'ID giao dịch MoMo',
    example: 2323232323,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  transId?: number;

  @ApiProperty({
    description: 'Mã kết quả',
    example: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  resultCode: number;

  @ApiProperty({
    description: 'Thông báo kết quả',
    example: 'Successful',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Dữ liệu bổ sung',
    example: 'eyJvcmRlcklkIjoiNjUwZDA5YjYwYzU4ZjFhOTE3Y2E5ZWMxIiwiaXNOZXdPcmRlciI6ZmFsc2V9',
    required: false,
  })
  @IsOptional()
  @IsString()
  extraData?: string;

  @ApiProperty({
    description: 'Chữ ký số xác thực từ MoMo',
    example: '2097c478c30739e5b003bc87f3fff1d8b9ff2f5bd5078b75c79b8f73500bbb26',
  })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    example: 'napas',
    required: false,
  })
  @IsOptional()
  @IsString()
  payType?: string;
}
