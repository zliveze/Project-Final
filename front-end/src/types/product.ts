// Base interfaces - these might need to be expanded based on actual API responses

export interface Image {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: Image;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
}

export interface InventoryItem {
  branchId: string;
  quantity: number;
  branchName?: string;
}

// Promotion interface
export interface Promotion {
  type: 'event' | 'campaign';
  id: string;
  name: string;
  adjustedPrice: number;
}

// Variant inventory interface
export interface VariantInventoryItem {
  branchId: string;
  branchName?: string;
  variantId: string;
  quantity: number;
  lowStockThreshold?: number;
}

// Combination inventory interface
export interface CombinationInventoryItem {
  branchId: string;
  branchName?: string;
  variantId: string;
  combinationId: string;
  quantity: number;
  lowStockThreshold?: number;
}

// Gift item interface
export interface GiftItem {
  giftId?: string;
  productId?: string;
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
}

// Event interface
export interface Event {
  _id: string;
  title: string;
  description: string;
  tags?: string[];
  startDate: Date;
  endDate: Date;
  products?: Array<{
    productId: string;
    adjustedPrice: number;
    variants?: Array<{
      variantId: string;
      adjustedPrice: number;
      combinations?: Array<{
        combinationId: string;
        adjustedPrice: number;
      }>;
    }>;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Campaign interface
export interface Campaign {
  _id: string;
  title: string;
  description: string;
  type: 'Hero Banner' | 'Sale Event';
  startDate: Date;
  endDate: Date;
  products?: Array<{
    productId: string;
    adjustedPrice: number;
    variants?: Array<{
      variantId: string;
      adjustedPrice: number;
      combinations?: Array<{
        combinationId: string;
        adjustedPrice: number;
      }>;
    }>;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Variant {
  variantId: string;
  sku: string;
  price: number;
  currentPrice?: number;
  images?: (string | Image)[];
  options?: {
    color?: string;
    sizes?: string[];
    shades?: string[];
  };
  inventory?: InventoryItem[];
  combinationInventory?: CombinationInventoryItem[];
  totalStock?: number;
}

export interface VariantWithPromotion extends Variant {
  promotion?: Promotion;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  brandId: string;
  categoryIds?: string[];
  description?: {
    short?: string;
    full?: string;
  };
  price?: number;
  currentPrice?: number;
  images?: Image[];
  variants?: VariantWithPromotion[];
  variantInventory?: VariantInventoryItem[];
  combinationInventory?: CombinationInventoryItem[];
  inventory?: InventoryItem[];
  status?: 'active' | 'inactive' | 'archived';
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  cosmetic_info?: {
    skinType?: string[];
    concerns?: string[];
    ingredients?: string[];
    volume?: {
      value: number;
      unit: string;
    };
    madeIn?: string;
    expiry?: {
      shelf: number; // in months
      afterOpening?: number; // in months
    };
  };
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  gifts?: GiftItem[];
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  tags?: string[];
}

export interface ProductPageProps {
  product: Product;
  fullBrand?: Brand;
  productCategories?: Category[];
  branches?: Branch[];
  categories?: Category[];
  events?: Event[];
  campaigns?: Campaign[];
  isAuthenticated: boolean;
}
