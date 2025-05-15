import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewImageDto } from './create-review.dto';

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'ID của biến thể sản phẩm (nếu có)' })
  @IsMongoId()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Đánh giá sao (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Nội dung đánh giá' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Danh sách hình ảnh đánh giá', type: [ReviewImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewImageDto)
  @IsOptional()
  images?: ReviewImageDto[];

  @ApiPropertyOptional({ description: 'Trạng thái đánh giá', enum: ['pending', 'approved', 'rejected'] })
  @IsEnum(['pending', 'approved', 'rejected'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu đánh giá đã được xác minh' })
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Các tag cho đánh giá' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  @IsOptional()
  metadata?: Record<string, any>;
}
