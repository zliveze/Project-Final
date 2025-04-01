import { ApiProperty } from '@nestjs/swagger';
import { BannerResponseDto } from './banner-response.dto';

export class PaginatedBannersResponseDto {
  @ApiProperty({ type: [BannerResponseDto], description: 'Danh sách banner' })
  items: BannerResponseDto[];

  @ApiProperty({ description: 'Tổng số banner' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số lượng banner trên mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
} 