// ProductForm types definitions

// Props cho component ProductForm chính
export interface ProductFormProps {
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isViewMode?: boolean;
}

// Dữ liệu tổng thể của form
export interface ProductFormData {
  // Thông tin cơ bản
  id?: string;
  name: string;
  sku: string;
  slug: string;
  price: number;
  currentPrice: number;
  status: 'active' | 'out_of_stock' | 'discontinued';
  brandId: string;
  categoryIds: string[];
  tags: string[];

  // Flags
  flags: ProductFlags;

  // Mô tả
  description: ProductDescription;

  // SEO
  seo?: ProductSeo;

  // Hình ảnh
  images: ProductImage[];

  // Biến thể
  variants: ProductVariant[];

  // Thông tin mỹ phẩm
  cosmetic_info: CosmeticInfo;

  // Tồn kho
  inventory: InventoryItem[];

  // Quà tặng kèm
  gifts: GiftItem[];

  // Các mối quan hệ
  relatedProducts?: string[];
  relatedEvents?: string[];
  relatedCampaigns?: string[];
}

// Flags
export interface ProductFlags {
  isBestSeller: boolean;
  isNew: boolean;
  isOnSale: boolean;
  hasGifts: boolean;
}

// Mô tả sản phẩm
export interface ProductDescription {
  short: string;
  full: string;
}

// SEO
export interface ProductSeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

// Hình ảnh
export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  id?: string;
  file?: File;
  preview?: string;
}

// Biến thể sản phẩm
export interface ProductVariant {
  variantId?: string;
  name: string;
  sku?: string;
  options: {
    color: string;
    shade: string;
    size: string;
  };
  price: number;
  images: string[];
}

// Thông tin mỹ phẩm
export interface CosmeticInfo {
  skinType: string[];
  concerns: string[];
  ingredients: string[];
  volume: {
    value: number;
    unit: string;
  };
  expiry: {
    shelf: number;
    afterOpening: number;
  };
  usage: string;
  madeIn: string;
}

// Tồn kho
export interface InventoryItem {
  branchId: string;
  branchName: string;
  quantity: number;
  lowStockThreshold: number;
}

// Quà tặng
export interface GiftItem {
  giftId: string;
  name: string;
  description: string;
  productId?: string;
  image: {
    url: string;
    alt: string;
  };
  quantity: number;
  value: number;
  type: 'product' | 'sample' | 'voucher' | 'other';
  conditions: {
    minPurchaseAmount: number;
    minQuantity: number;
    startDate: string;
    endDate: string;
    limitedQuantity: number;
  };
  status: 'active' | 'inactive';
}

// Định nghĩa các store data
export interface StoreData {
  brands: BrandItem[];
  categories: CategoryItem[];
  branches: BranchItem[];
}

export interface BrandItem {
  id: string;
  name: string;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface BranchItem {
  id: string;
  name: string;
} 