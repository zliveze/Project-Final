import { IsArray, IsDate, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Schema as MongooseSchema } from 'mongoose';

export class ProductInEventDto {
  @ApiProperty({ description: 'Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Product Variant ID (optional)', required: false })
  @IsMongoId()
  @IsOptional()
  variantId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Product Combination ID (optional)', required: false })
  @IsMongoId()
  @IsOptional()
  combinationId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Adjusted price for the product during the event' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;

  @ApiProperty({ description: 'Variant attributes (e.g., color, size)', required: false })
  @IsObject()
  @IsOptional()
  variantAttributes?: Record<string, string>;

  // Thêm các trường mới
  @ApiProperty({ description: 'Product name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Product image URL', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ description: 'Original price of the product', required: false })
  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @ApiProperty({ description: 'Product SKU', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ description: 'Product status', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Brand ID', required: false })
  @IsMongoId()
  @IsOptional()
  brandId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Brand name', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ description: 'Variant name', required: false })
  @IsString()
  @IsOptional()
  variantName?: string;

  @ApiProperty({ description: 'Variant SKU', required: false })
  @IsString()
  @IsOptional()
  variantSku?: string;

  @ApiProperty({ description: 'Variant price', required: false })
  @IsNumber()
  @IsOptional()
  variantPrice?: number;

  @ApiProperty({ description: 'Combination price', required: false })
  @IsNumber()
  @IsOptional()
  combinationPrice?: number;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Event tags', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Event start date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Event end date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({
    description: 'Products in event with adjusted prices',
    type: [ProductInEventDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductInEventDto)
  @IsOptional()
  products?: ProductInEventDto[];
}