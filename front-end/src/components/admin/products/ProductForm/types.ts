import { Product } from '@/contexts/ProductContext';

// Định nghĩa interface cho thương hiệu (sử dụng trong form)
export interface BrandItem {
  id: string;
  name: string;
}

// Định nghĩa interface cho danh mục (sử dụng trong form)
export interface CategoryItem {
  id: string;
  name: string;
}

// Định nghĩa interface cho chi nhánh (sử dụng trong form)
export interface BranchItem {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

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
    shades?: string[]; // Renamed and changed to array
    sizes?: string[];  // Renamed and changed to array
  };
  images?: ProductImage[];
}

// Định nghĩa interface cho quà tặng
export interface GiftItem {
  giftId?: string;
  productId?: string; // Added field to link to the selected product
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
  gifts?: GiftItem[]; // Use the extracted GiftItem interface
  relatedProducts?: string[];
}


// Định nghĩa props cho ProductForm component
export interface ProductFormProps {
  initialData?: Partial<ProductFormData>; // Dữ liệu ban đầu (có thể không đầy đủ)
  onSubmit: (data: ProductFormData) => Promise<any>; // Hàm xử lý khi submit
  onCancel: () => void; // Hàm xử lý khi hủy
  isViewMode?: boolean; // Chế độ chỉ xem
}
