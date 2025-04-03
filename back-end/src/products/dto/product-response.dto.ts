import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsBoolean, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @ApiProperty({ description: 'The URL of the image' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'The alt text for the image' })
  @IsString()
  alt: string;

  @ApiProperty({ description: 'The public ID of the image (for Cloudinary)' })
  @IsString()
  publicId: string;

  @ApiProperty({ description: 'Whether this is the primary image' })
  @IsBoolean()
  isPrimary: boolean;
}

export class ProductVariantDto {
  @ApiProperty({ description: 'The ID of the variant' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The name of the variant' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The price of the variant' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'The SKU of the variant' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'The inventory level of the variant' })
  @IsNumber()
  inventoryQuantity: number;

  @ApiProperty({ description: 'Additional options for the variant' })
  @IsOptional()
  options?: Record<string, any>;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'The ID of the product' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The name of the product' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The description of the product' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'The price of the product' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'The cost price of the product' })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiProperty({ description: 'The category of the product' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'The brand of the product' })
  @IsString()
  brand: string;

  @ApiProperty({ description: 'The SKU of the product' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Whether the product is featured' })
  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ description: 'Whether the product is active' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'The inventory level of the product' })
  @IsNumber()
  inventoryQuantity: number;

  @ApiProperty({ description: 'Images of the product', type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];

  @ApiProperty({ description: 'Variants of the product', type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @ApiProperty({ description: 'Creation date' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @IsDate()
  updatedAt: Date;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ description: 'Array of products', type: [ProductResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductResponseDto)
  items: ProductResponseDto[];

  @ApiProperty({ description: 'Total number of products' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Current page' })
  @IsNumber()
  page: number;

  @ApiProperty({ description: 'Number of products per page' })
  @IsNumber()
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  @IsNumber()
  pages: number;

  @ApiProperty({ description: 'Total number of pages (alias for pages)' })
  @IsNumber()
  @IsOptional()
  totalPages?: number;
}
