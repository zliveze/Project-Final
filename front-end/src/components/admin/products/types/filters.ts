// Types for product filters

import { ProductStatus, ProductFilterOptions } from './index';

// Props cho component FilterBar
export interface FilterBarProps {
  filters: ProductFilterOptions;
  onFilterChange: (newFilters: ProductFilterOptions) => void;
  onResetFilters: () => void;
  availableCategories: { id: string; name: string }[];
  availableBrands: { id: string; name: string }[];
  availableEvents: { id: string; name: string }[];
  isLoading?: boolean;
}

// Props cho bộ lọc danh mục
export interface CategoryFilterProps {
  selectedCategories: string[];
  availableCategories: { id: string; name: string }[];
  onChange: (categoryIds: string[]) => void;
  isLoading?: boolean;
}

// Props cho bộ lọc thương hiệu
export interface BrandFilterProps {
  selectedBrands: string[];
  availableBrands: { id: string; name: string }[];
  onChange: (brandIds: string[]) => void;
  isLoading?: boolean;
}

// Props cho bộ lọc giá
export interface PriceFilterProps {
  priceRange: {
    min?: number;
    max?: number;
  };
  onChange: (range: { min?: number; max?: number }) => void;
}

// Props cho bộ lọc trạng thái
export interface StatusFilterProps {
  selectedStatuses: ProductStatus[];
  onChange: (statuses: ProductStatus[]) => void;
}

// Props cho bộ lọc flags
export interface FlagFilterProps {
  selectedFlags: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  onChange: (flags: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  }) => void;
}

// Props cho bộ lọc sự kiện
export interface EventFilterProps {
  selectedEvents: string[];
  availableEvents: { id: string; name: string }[];
  onChange: (eventIds: string[]) => void;
  isLoading?: boolean;
}

// Props cho bộ lọc khoảng thời gian
export interface DateRangeFilterProps {
  dateRange: {
    start?: string;
    end?: string;
  };
  onChange: (range: { start?: string; end?: string }) => void;
}

// Props cho bộ lọc tìm kiếm
export interface SearchFilterProps {
  searchTerm: string;
  onChange: (term: string) => void;
  onSearch: () => void;
}

// State kiểm soát việc hiển thị các bộ lọc
export interface FilterVisibilityState {
  categories: boolean;
  brands: boolean;
  price: boolean;
  status: boolean;
  flags: boolean;
  events: boolean;
  dateRange: boolean;
}

// Kết quả áp dụng bộ lọc
export interface FilteredResult<T> {
  filteredItems: T[];
  totalItems: number;
  appliedFilters: ProductFilterOptions;
} 