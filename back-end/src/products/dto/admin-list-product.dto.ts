import { ApiProperty } from '@nestjs/swagger';

export class AdminListProductItemDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Formatted price string (e.g. "350,000đ")' })
  price: string;

  @ApiProperty({ description: 'Original price as number' })
  originalPrice: number;

  @ApiProperty({ description: 'Current price after discount' })
  currentPrice: number;

  @ApiProperty({ description: 'Category name' })
  category: string;

  @ApiProperty({ description: 'Category IDs array' })
  categoryIds: string[];

  @ApiProperty({ description: 'Brand name' })
  brand: string;

  @ApiProperty({ description: 'Brand ID' })
  brandId: string;

  @ApiProperty({ description: 'Primary image URL' })
  image: string;

  @ApiProperty({ description: 'Total stock across all branches' })
  stock: number;

  @ApiProperty({ description: 'Product status' })
  status: string;

  @ApiProperty({ description: 'Product flags' })
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };

  @ApiProperty({ description: 'Creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;
}

export class AdminListProductResponseDto {
  @ApiProperty({ type: [AdminListProductItemDto] })
  items: AdminListProductItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
} 