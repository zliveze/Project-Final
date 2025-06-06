import { ApiProperty } from '@nestjs/swagger';

export class MomoPaymentResponseDto {
  @ApiProperty({
    description: 'Mã kết quả từ MoMo',
    example: 0,
  })
  resultCode: number;

  @ApiProperty({
    description: 'Thông báo từ MoMo',
    example: 'Successful',
  })
  message: string;

  @ApiProperty({
    description: 'URL thanh toán MoMo',
    example: 'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT0JLVU4yMDE4MDUyOV8xNjI0MzQ1Njc4',
  })
  payUrl: string;

  @ApiProperty({
    description: 'ID yêu cầu thanh toán',
    example: 'MOMOBKUN20180529_1624345678',
  })
  requestId: string;

  @ApiProperty({
    description: 'ID đơn hàng MoMo',
    example: 'MOMOBKUN20180529_1624345678',
  })
  orderId: string;

  @ApiProperty({
    description: 'Dữ liệu bổ sung',
    example: 'eyJvcmRlcklkIjoiNjUwZDA5YjYwYzU4ZjFhOTE3Y2E5ZWMxIiwiaXNOZXdPcmRlciI6ZmFsc2V9',
  })
  extraData: string;

  @ApiProperty({
    description: 'Loại yêu cầu',
    example: 'captureWallet',
  })
  requestType: string;

  @ApiProperty({
    description: 'URL nhận thông báo từ MoMo',
    example: 'https://backendyumin.vercel.app/api/payments/momo/ipn',
  })
  ipnUrl: string;

  @ApiProperty({
    description: 'URL chuyển hướng sau khi thanh toán',
    example: 'http://localhost:3000/payments/success',
  })
  redirectUrl: string;
}
