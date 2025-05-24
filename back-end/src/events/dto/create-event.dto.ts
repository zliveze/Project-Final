import { IsArray, IsDate, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Schema as MongooseSchema } from 'mongoose';

// DTO cho tổ hợp biến thể trong sự kiện
export class CombinationInEventDto {
  @ApiProperty({ description: 'Combination ID' })
  @IsMongoId()
  @IsOptional()
  combinationId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Combination attributes (e.g., color, size)' })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ApiProperty({ description: 'Combination price' })
  @IsNumber()
  @IsOptional()
  combinationPrice?: number;

  @ApiProperty({ description: 'Adjusted price for the combination during the event' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;

  @ApiProperty({ description: 'Original price of the combination' })
  @IsNumber()
  @IsOptional()
  originalPrice?: number;
}

// DTO cho biến thể trong sự kiện
export class VariantInEventDto {
  @ApiProperty({ description: 'Variant ID' })
  @IsMongoId()
  @IsOptional()
  variantId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Variant name' })
  @IsString()
  @IsOptional()
  variantName?: string;

  @ApiProperty({ description: 'Variant SKU' })
  @IsString()
  @IsOptional()
  variantSku?: string;

  @ApiProperty({ description: 'Variant attributes (e.g., color, size)' })
  @IsObject()
  @IsOptional()
  variantAttributes?: Record<string, string>;

  @ApiProperty({ description: 'Variant price' })
  @IsNumber()
  @IsOptional()
  variantPrice?: number;

  @ApiProperty({ description: 'Adjusted price for the variant during the event' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;

  @ApiProperty({ description: 'Original price of the variant' })
  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @ApiProperty({ description: 'Variant image URL' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ description: 'Combinations of the variant', type: [CombinationInEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombinationInEventDto)
  @IsOptional()
  combinations?: CombinationInEventDto[];
}

// DTO cho sản phẩm trong sự kiện
export class ProductInEventDto {
  @ApiProperty({ description: 'Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Adjusted price for the product during the event' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Product slug' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Product image URL' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ description: 'Original price of the product' })
  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @ApiProperty({ description: 'Product SKU' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ description: 'Product status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Brand ID' })
  @IsMongoId()
  @IsOptional()
  brandId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Brand name' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ description: 'Variants of the product', type: [VariantInEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantInEventDto)
  @IsOptional()
  variants?: VariantInEventDto[];
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