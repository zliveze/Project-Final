import { ApiProperty } from '@nestjs/swagger';

export class LightProductDto {
  @ApiProperty({ description: 'Product ID' })
  _id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Original price' })
  price: number;

  @ApiProperty({ description: 'Current price (after discount)' })
  currentPrice?: number;

  @ApiProperty({ description: 'Status of the product' })
  status: string;

  @ApiProperty({ description: 'Primary image URL' })
  imageUrl: string;

  @ApiProperty({ description: 'Brand ID' })
  brandId?: string;

  @ApiProperty({ description: 'Brand name' })
  brandName?: string;

  @ApiProperty({ description: 'Product flags' })
  flags?: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };

  @ApiProperty({ description: 'Reviews information' })
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
}

export class LightProductResponseDto {
  @ApiProperty({ type: [LightProductDto] })
  products: LightProductDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
} 