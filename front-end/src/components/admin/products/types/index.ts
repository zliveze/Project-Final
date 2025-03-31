// Types for product management

import { ProductFormData } from '../ProductForm/types';

// Các trạng thái sản phẩm
export type ProductStatus = 'active' | 'out_of_stock' | 'discontinued';

// Cấu trúc dữ liệu sản phẩm hiển thị trong danh sách
export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  currentPrice: number;
  category: string;
  categoryId: string;
  brand: string;
  brandId: string;
  status: ProductStatus;
  inventory: number;
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  updatedAt: string;
  createdAt: string;
}

// Cấu trúc dữ liệu thương hiệu
export interface Brand {
  id: string;
  name: string;
}

// Cấu trúc dữ liệu danh mục
export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

// Cấu trúc dữ liệu sự kiện/chiến dịch
export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Các tùy chọn lọc sản phẩm
export interface ProductFilterOptions {
  categories?: string[];
  brands?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  status?: ProductStatus[];
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  events?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  searchTerm?: string;
}

// Các tùy chọn sắp xếp sản phẩm
export type SortField = 'name' | 'price' | 'inventory' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface ProductSortOptions {
  field: SortField;
  direction: SortDirection;
}

// Các tùy chọn phân trang
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

// Các thao tác hàng loạt
export type BulkAction = 
  | 'delete'
  | 'set-status'
  | 'set-bestseller'
  | 'set-new'
  | 'set-sale'
  | 'unset-bestseller'
  | 'unset-new'
  | 'unset-sale'
  | 'export';

// Cấu trúc thống kê sản phẩm
export interface ProductStatistics {
  total: number;
  byStatus: {
    active: number;
    out_of_stock: number;
    discontinued: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  topSelling: Array<{
    id: string;
    name: string;
    sales: number;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    inventory: number;
  }>;
}

// Kết quả tải danh sách sản phẩm
export interface ProductListResult {
  products: ProductListItem[];
  pagination: PaginationOptions;
}

// Cấu hình hiển thị cột trong bảng sản phẩm
export interface TableColumnConfig {
  id: keyof ProductListItem | 'actions';
  label: string;
  visible: boolean;
  width?: string;
  sortable?: boolean;
} 