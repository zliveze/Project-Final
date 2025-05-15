import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReviewDto {
  @ApiPropertyOptional({ description: 'Trang hiện tại', default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng đánh giá mỗi trang', default: 10 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'ID của người dùng' })
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID của sản phẩm' })
  @IsMongoId()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Trạng thái đánh giá', enum: ['pending', 'approved', 'rejected', 'all'] })
  @IsEnum(['pending', 'approved', 'rejected', 'all'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Đánh giá sao (1-5)' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm trong nội dung đánh giá' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Sắp xếp theo trường', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ReviewResponseDto {
  reviewId: string;
  userId: string;
  productId: string;
  variantId?: string;
  productName: string;
  productImage: string;
  rating: number;
  content: string;
  images: any[];
  likes: number;
  status: string;
  verified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class PaginatedReviewsResponseDto {
  reviews: ReviewResponseDto[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}
