import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';

export enum CampaignType {
  HERO_BANNER = 'Hero Banner',
  SALE_EVENT = 'Sale Event',
}

// DTO cho tổ hợp biến thể trong chiến dịch
export class CombinationInCampaignDto {
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

  @ApiProperty({ description: 'Adjusted price for the combination during the campaign' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;

  @ApiProperty({ description: 'Original price of the combination' })
  @IsNumber()
  @IsOptional()
  originalPrice?: number;
}

// DTO cho biến thể trong chiến dịch
export class VariantInCampaignDto {
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

  @ApiProperty({ description: 'Adjusted price for the variant during the campaign' })
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

  @ApiProperty({ description: 'Combinations of the variant', type: [CombinationInCampaignDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombinationInCampaignDto)
  @IsOptional()
  combinations?: CombinationInCampaignDto[];
}

// DTO cho sản phẩm trong chiến dịch
export class ProductInCampaignDto {
  @ApiProperty({ description: 'Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Adjusted price for the product during the campaign' })
  @IsNumber()
  @IsNotEmpty()
  adjustedPrice: number;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiProperty({ description: 'Variants of the product', type: [VariantInCampaignDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantInCampaignDto)
  @IsOptional()
  variants?: VariantInCampaignDto[];
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Tiêu đề chiến dịch' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả chiến dịch', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Loại chiến dịch',
    enum: CampaignType,
    enumName: 'CampaignType',
  })
  @IsEnum(CampaignType)
  @IsNotEmpty()
  type: CampaignType;

  @ApiProperty({ description: 'Ngày bắt đầu chiến dịch' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Ngày kết thúc chiến dịch' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({
    description: 'Danh sách sản phẩm trong chiến dịch',
    type: [ProductInCampaignDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductInCampaignDto)
  @IsOptional()
  products?: ProductInCampaignDto[];
}