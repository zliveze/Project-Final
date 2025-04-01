import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BannerResponseDto {
  @ApiProperty({ description: 'ID của banner' })
  _id: string;

  @ApiProperty({ description: 'Tiêu đề banner' })
  title: string;

  @ApiPropertyOptional({ description: 'ID của chiến dịch liên kết' })
  campaignId?: string;

  @ApiProperty({ description: 'URL ảnh cho desktop' })
  desktopImage: string;

  @ApiProperty({ description: 'URL ảnh cho mobile' })
  mobileImage: string;

  @ApiPropertyOptional({ description: 'Mô tả alt cho ảnh' })
  alt?: string;

  @ApiPropertyOptional({ description: 'Link khi click vào banner' })
  href?: string;

  @ApiProperty({ description: 'Trạng thái hiển thị' })
  active: boolean;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  order: number;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu hiển thị banner' })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Ngày kết thúc hiển thị banner' })
  endDate?: Date;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật cuối cùng' })
  updatedAt: Date;
} 