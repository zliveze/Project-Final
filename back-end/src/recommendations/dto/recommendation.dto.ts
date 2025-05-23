import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '../schemas/user-activity.schema';

export class LogProductViewDto {
  @ApiPropertyOptional({ description: 'Thời gian người dùng tương tác với sản phẩm (giây)' })
  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @ApiPropertyOptional({ description: 'ID của biến thể sản phẩm (nếu có)' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class LogProductInteractionDto {
  @ApiPropertyOptional({ description: 'ID của biến thể sản phẩm (nếu có)' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class LogSearchDto {
  @ApiProperty({ description: 'Từ khóa tìm kiếm' })
  @IsString()
  searchQuery: string;
}

export class PriceFilterDto {
  @ApiPropertyOptional({ description: 'Giá tối thiểu' })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ description: 'Giá tối đa' })
  @IsOptional()
  @IsNumber()
  max?: number;
}

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Lọc theo giá' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PriceFilterDto)
  price?: PriceFilterDto;

  @ApiPropertyOptional({ description: 'Lọc theo danh mục', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Lọc theo thương hiệu', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];

  @ApiPropertyOptional({ description: 'Lọc theo tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Lọc theo loại da', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skinType?: string[];

  @ApiPropertyOptional({ description: 'Lọc theo vấn đề da', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  concerns?: string[];
}

export class UserActivityDto {
  @ApiProperty({ description: 'ID của người dùng' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'ID của sản phẩm (nếu liên quan)' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: 'Loại hoạt động', enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiPropertyOptional({ description: 'Metadata của hoạt động' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}