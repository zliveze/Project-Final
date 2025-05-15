import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewImageDto {
  @ApiProperty({ description: 'URL của hình ảnh đánh giá' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Mô tả hình ảnh' })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiPropertyOptional({ description: 'ID công khai của hình ảnh trên Cloudinary' })
  @IsString()
  @IsOptional()
  publicId?: string;
}

export class CreateReviewDto {
  @ApiProperty({ description: 'ID của người dùng đánh giá' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'ID của sản phẩm được đánh giá' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'ID của biến thể sản phẩm (nếu có)' })
  @IsMongoId()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'ID của đơn hàng chứa sản phẩm này' })
  @IsMongoId()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Tên sản phẩm' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ description: 'Hình ảnh sản phẩm' })
  @IsString()
  @IsNotEmpty()
  productImage: string;

  @ApiProperty({ description: 'Đánh giá sao (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Nội dung đánh giá' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Danh sách hình ảnh đánh giá', type: [ReviewImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewImageDto)
  @IsOptional()
  images?: ReviewImageDto[];

  @ApiPropertyOptional({ description: 'Trạng thái đánh giá', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  @IsEnum(['pending', 'approved', 'rejected'])
  @IsOptional()
  status?: string = 'pending';

  @ApiPropertyOptional({ description: 'Đánh dấu đánh giá đã được xác minh', default: false })
  @IsOptional()
  verified?: boolean = false;

  @ApiPropertyOptional({ description: 'Các tag cho đánh giá' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  @IsOptional()
  metadata?: Record<string, any>;
}
