import { ApiProperty } from '@nestjs/swagger';
import { BrandResponseDto } from './brand-response.dto';

export class PaginatedBrandsResponseDto {
  @ApiProperty({ description: 'Danh sách thương hiệu', type: [BrandResponseDto] })
  items: BrandResponseDto[];

  @ApiProperty({ description: 'Tổng số thương hiệu' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số lượng item mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
} 