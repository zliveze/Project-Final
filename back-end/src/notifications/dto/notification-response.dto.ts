import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID của thông báo' })
  _id: string;

  @ApiProperty({ description: 'Nội dung thông báo' })
  content: string;

  @ApiProperty({ description: 'Loại thông báo', enum: ['voucher', 'shipping', 'promotion', 'system'] })
  type: string;

  @ApiPropertyOptional({ description: 'Đường dẫn liên kết (nếu có)' })
  link?: string;

  @ApiProperty({ description: 'Độ ưu tiên hiển thị' })
  priority: number;

  @ApiProperty({ description: 'Ngày bắt đầu hiển thị' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'Ngày kết thúc hiển thị (nếu có)' })
  endDate?: Date;

  @ApiProperty({ description: 'Trạng thái hiển thị' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Màu nền (mã màu HEX hoặc tên màu)' })
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Màu chữ (mã màu HEX hoặc tên màu)' })
  textColor?: string;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty({ description: 'Danh sách thông báo', type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({ description: 'Tổng số thông báo' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số lượng mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
} 