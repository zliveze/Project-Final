import { ApiProperty } from '@nestjs/swagger';

export class VoucherApplyResponseDto {
  @ApiProperty({ description: 'ID của voucher', example: '64a1b2c3d4e5f6g7h8i9j0k1' })
  voucherId: string;

  @ApiProperty({ description: 'Số tiền được giảm giá', example: 50000 })
  discountAmount: number;

  @ApiProperty({ description: 'Tổng số tiền sau khi áp dụng voucher', example: 450000 })
  finalAmount: number;

  @ApiProperty({ description: 'Thông báo kết quả', example: 'Áp dụng voucher thành công' })
  message: string;
}

export class VoucherStatisticsDto {
  @ApiProperty({ description: 'Tổng số voucher', example: 50 })
  totalVouchers: number;

  @ApiProperty({ description: 'Số voucher đang hoạt động', example: 20 })
  activeVouchers: number;

  @ApiProperty({ description: 'Số voucher đã hết hạn', example: 15 })
  expiredVouchers: number;

  @ApiProperty({ description: 'Số voucher chưa được sử dụng', example: 10 })
  unusedVouchers: number;

  @ApiProperty({ description: 'Danh sách voucher được sử dụng nhiều nhất', type: 'array' })
  topUsedVouchers: any[];

  @ApiProperty({ 
    description: 'Thông tin thống kê sử dụng',
    example: {
      totalUsed: 250,
      totalLimit: 500,
      usageRate: 50
    }
  })
  usageStatistics: {
    totalUsed: number;
    totalLimit: number;
    usageRate: number;
  };
}

export class PaginatedVouchersResponseDto {
  @ApiProperty({ description: 'Danh sách voucher', type: 'array' })
  data: any[];

  @ApiProperty({ description: 'Tổng số voucher', example: 50 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({ description: 'Số lượng trên mỗi trang', example: 10 })
  limit: number;
} 