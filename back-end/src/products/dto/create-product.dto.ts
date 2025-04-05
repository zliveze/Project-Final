import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  IsBoolean, 
  IsEnum, 
  ValidateNested, 
  IsMongoId,
  Min,
  IsNotEmpty,
  IsUrl,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';

// Product Image DTO
export class ProductImageDto {
  @ApiProperty({ description: 'Image URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Image alt text' })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiPropertyOptional({ description: 'Cloudinary public ID' })
  @IsString()
  @IsOptional()
  publicId?: string;

  @ApiPropertyOptional({ description: 'Is primary image' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

// Variant Options DTO
export class VariantOptionsDto {
  @ApiPropertyOptional({ description: 'Color option' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Shade options', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  shades?: string[]; // Renamed and changed to array

  @ApiPropertyOptional({ description: 'Size options', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[]; // Renamed and changed to array
}

// Product Variant DTO
export class ProductVariantDto {
  @ApiProperty({ description: 'Variant SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ description: 'Variant options' })
  @ValidateNested()
  @Type(() => VariantOptionsDto)
  @IsOptional()
  options?: VariantOptionsDto;

  @ApiPropertyOptional({ description: 'Variant price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Variant images' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];
}

// Product Inventory DTO
export class ProductInventoryDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsMongoId()
  branchId: string;

  @ApiProperty({ description: 'Quantity in stock' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;
}

// Product Description DTO
export class ProductDescriptionDto {
  @ApiPropertyOptional({ description: 'Short description' })
  @IsString()
  @IsOptional()
  short?: string;

  @ApiPropertyOptional({ description: 'Full description' })
  @IsString()
  @IsOptional()
  full?: string;
}

// Product SEO DTO
export class ProductSeoDto {
  @ApiPropertyOptional({ description: 'Meta title' })
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description' })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'SEO keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}

// Product Volume DTO
export class ProductVolumeDto {
  @ApiPropertyOptional({ description: 'Volume value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ description: 'Volume unit (ml, g, oz)' })
  @IsString()
  @IsOptional()
  unit?: string;
}

// Product Expiry DTO
export class ProductExpiryDto {
  @ApiPropertyOptional({ description: 'Shelf life in months' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shelf?: number;

  @ApiPropertyOptional({ description: 'After opening life in months' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  afterOpening?: number;
}

// Cosmetic Info DTO
export class CosmeticInfoDto {
  @ApiPropertyOptional({ description: 'Skin types', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skinType?: string[];

  @ApiPropertyOptional({ description: 'Skin concerns', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  concerns?: string[];

  @ApiPropertyOptional({ description: 'Ingredients', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ingredients?: string[];

  @ApiPropertyOptional({ description: 'Product volume' })
  @ValidateNested()
  @Type(() => ProductVolumeDto)
  @IsOptional()
  volume?: ProductVolumeDto;

  @ApiPropertyOptional({ description: 'Usage instructions' })
  @IsString()
  @IsOptional()
  usage?: string;

  @ApiPropertyOptional({ description: 'Country of origin' })
  @IsString()
  @IsOptional()
  madeIn?: string;

  @ApiPropertyOptional({ description: 'Expiry information' })
  @ValidateNested()
  @Type(() => ProductExpiryDto)
  @IsOptional()
  expiry?: ProductExpiryDto;
}

// Product Flags DTO
export class ProductFlagsDto {
  @ApiPropertyOptional({ description: 'Is bestseller' })
  @IsBoolean()
  @IsOptional()
  isBestSeller?: boolean;

  @ApiPropertyOptional({ description: 'Is new product' })
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Is on sale' })
  @IsBoolean()
  @IsOptional()
  isOnSale?: boolean;

  @ApiPropertyOptional({ description: 'Has gifts' })
  @IsBoolean()
  @IsOptional()
  hasGifts?: boolean;
}

// Gift Conditions DTO
export class GiftConditionsDto {
  @ApiPropertyOptional({ description: 'Minimum purchase amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPurchaseAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limited quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  limitedQuantity?: number;
}

// Gift Image DTO
export class GiftImageDto {
  @ApiProperty({ description: 'Image URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Image alt text' })
  @IsString()
  @IsOptional()
  alt?: string;
}

// Product Gift DTO
export class ProductGiftDto {
  @ApiPropertyOptional({ description: 'Gift product ID' })
  @IsMongoId()
  @IsOptional()
  giftId?: string;

  @ApiProperty({ description: 'Gift name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Gift description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Gift image' })
  @ValidateNested()
  @Type(() => GiftImageDto)
  @IsOptional()
  image?: GiftImageDto;

  @ApiPropertyOptional({ description: 'Gift quantity' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Gift value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ description: 'Gift type', enum: ['product', 'sample', 'voucher', 'other'] })
  @IsEnum(['product', 'sample', 'voucher', 'other'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Gift conditions' })
  @ValidateNested()
  @Type(() => GiftConditionsDto)
  @IsOptional()
  conditions?: GiftConditionsDto;

  @ApiPropertyOptional({ description: 'Gift status', enum: ['active', 'inactive', 'out_of_stock'] })
  @IsEnum(['active', 'inactive', 'out_of_stock'])
  @IsOptional()
  status?: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Product slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @ValidateNested()
  @Type(() => ProductDescriptionDto)
  @IsOptional()
  description?: ProductDescriptionDto;

  @ApiPropertyOptional({ description: 'Product SEO information' })
  @ValidateNested()
  @Type(() => ProductSeoDto)
  @IsOptional()
  seo?: ProductSeoDto;

  @ApiProperty({ description: 'Product base price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Product current price (after discounts)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentPrice?: number;

  @ApiPropertyOptional({ description: 'Product status', enum: ['active', 'out_of_stock', 'discontinued'] })
  @IsEnum(['active', 'out_of_stock', 'discontinued'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsMongoId()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Category IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Product tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Cosmetic information' })
  @ValidateNested()
  @Type(() => CosmeticInfoDto)
  @IsOptional()
  cosmetic_info?: CosmeticInfoDto;

  @ApiPropertyOptional({ description: 'Product variants', type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ description: 'Product images', type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];

  @ApiPropertyOptional({ description: 'Product inventory', type: [ProductInventoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductInventoryDto)
  @IsOptional()
  inventory?: ProductInventoryDto[];

  @ApiPropertyOptional({ description: 'Product flags' })
  @ValidateNested()
  @Type(() => ProductFlagsDto)
  @IsOptional()
  flags?: ProductFlagsDto;

  @ApiPropertyOptional({ description: 'Product gifts', type: [ProductGiftDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductGiftDto)
  @IsOptional()
  gifts?: ProductGiftDto[];

  @ApiPropertyOptional({ description: 'Related product IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  relatedProducts?: string[];

  @ApiPropertyOptional({ description: 'Related event IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  relatedEvents?: string[];

  @ApiPropertyOptional({ description: 'Related campaign IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  relatedCampaigns?: string[];
}
