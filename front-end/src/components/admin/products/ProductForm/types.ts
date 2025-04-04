import { Product } from '@/contexts/ProductContext';

// Định nghĩa interface cho hình ảnh sản phẩm
export interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  publicId?: string;
  isPrimary?: boolean;
  file?: File; // Chỉ lưu giữ tạm thời, không gửi đến server
  preview?: string; // Chỉ lưu giữ URL.createObjectURL tạm thời để hiển thị
}

// Định nghĩa interface cho biến thể sản phẩm
export interface ProductVariant {
  variantId?: string;
  id?: string;
  sku: string;
  price?: number;
  stock?: number;
  options?: {
    color?: string;
    shade?: string;
    size?: string;
  };
  images?: ProductImage[];
}

// Định nghĩa interface cho data của form sản phẩm
export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  currentPrice?: number;
  status?: 'active' | 'out_of_stock' | 'discontinued';
  brandId?: string;
  categoryIds?: string[];
  tags?: string[];
  description?: {
    short?: string;
    full?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
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
  inventory?: Array<{
    branchId: string;
    quantity: number;
    lowStockThreshold?: number;
  }>;
  variants?: ProductVariant[];
  images?: ProductImage[];
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
      url?: string;
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
} 