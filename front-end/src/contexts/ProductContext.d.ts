export interface Product {
  _id?: string;
  sku: string;
  name: string;
  slug: string;
  description?: {
    short?: string;
    full?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  price: number;
  currentPrice?: number;
  status?: 'active' | 'out_of_stock' | 'discontinued';
  brandId?: string;
  categoryIds?: string[];
  tags?: string[];
  cosmetic_info?: {
    skinType?: string[];
    concerns?: string[];
    ingredients?: string[];
    volume?: {
      value?: number;
      unit?: string;
    };
    usage?: string;
    madeIn?: string;
    expiry?: {
      shelf?: number;
      afterOpening?: number;
    };
  };
  variants?: Array<{
    variantId?: string;
    sku: string;
    options?: {
      color?: string;
      shade?: string;
      size?: string;
    };
    price?: number;
    images?: Array<{
      url: string;
      alt?: string;
      publicId?: string;
      isPrimary?: boolean;
    }>;
  }>;
  images?: Array<{
    url: string;
    alt?: string;
    publicId?: string;
    isPrimary?: boolean;
    file?: File;       // For file uploads
    preview?: string;  // For image previews
    id?: string;       // Temporary ID for new images
  }>;
  inventory?: Array<{
    branchId: string;
    quantity: number;
    lowStockThreshold?: number;
  }>;
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  gifts?: Array<{
    giftId?: string;
    name: string;
    description?: string;
    image?: {
      url: string;
      alt?: string;
    };
    quantity?: number;
    value?: number;
    type?: 'product' | 'sample' | 'voucher' | 'other';
    conditions?: {
      minPurchaseAmount?: number;
      minQuantity?: number;
      startDate?: Date | string;
      endDate?: Date | string;
      limitedQuantity?: number;
    };
    status?: 'active' | 'inactive' | 'out_of_stock';
  }>;
  relatedProducts?: string[];
  relatedEvents?: string[];
  relatedCampaigns?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Interface cho danh sách sản phẩm tối ưu hóa cho Admin UI
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  originalPrice: number; 
  currentPrice: number;
  category: string;
  categoryIds: string[];
  brand: string;
  brandId: string;
  image: string;
  stock: number;
  status: string;
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  createdAt: string;
  updatedAt: string;
} 