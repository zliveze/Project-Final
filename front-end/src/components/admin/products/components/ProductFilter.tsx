import React, { useState } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiList } from 'react-icons/fi';
import { ProductStatus } from './ProductStatusBadge';

interface ProductFilterProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: ProductFilterState) => void;
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  loading?: boolean;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
}

export interface ProductFilterState {
  searchTerm: string;
  categories: string[];
  brands: string[];
  status?: ProductStatus;
  flags: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  onSearch,
  onFilterChange,
  categories,
  brands,
  loading = false,
  itemsPerPage = 20,
  onItemsPerPageChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>('');
  const [selectedFlags, setSelectedFlags] = useState({
    isBestSeller: false,
    isNew: false,
    isOnSale: false,
    hasGifts: false
  });

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(updatedCategories);
    applyFilters({ categories: updatedCategories });
  };

  const handleBrandChange = (brandId: string) => {
    const updatedBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId];
    
    setSelectedBrands(updatedBrands);
    applyFilters({ brands: updatedBrands });
  };

  const handleStatusChange = (status: ProductStatus | '') => {
    setSelectedStatus(status);
    applyFilters({ status: status || undefined });
  };

  const handleFlagChange = (flag: keyof typeof selectedFlags) => {
    const updatedFlags = {
      ...selectedFlags,
      [flag]: !selectedFlags[flag]
    };
    
    setSelectedFlags(updatedFlags);
    applyFilters({ flags: updatedFlags });
  };

  const applyFilters = (partialFilters: Partial<ProductFilterState>) => {
    const filters: ProductFilterState = {
      searchTerm,
      categories: selectedCategories,
      brands: selectedBrands,
      status: selectedStatus as ProductStatus | undefined,
      flags: selectedFlags,
      ...partialFilters
    };
    
    onFilterChange(filters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedStatus('');
    setSelectedFlags({
      isBestSeller: false,
      isNew: false,
      isOnSale: false,
      hasGifts: false
    });
    
    onSearch('');
    onFilterChange({
      searchTerm: '',
      categories: [],
      brands: [],
      flags: {}
    });
  };

  const hasActiveFilters = () => {
    return (
      searchTerm !== '' ||
      selectedCategories.length > 0 ||
      selectedBrands.length > 0 ||
      selectedStatus !== '' ||
      Object.values(selectedFlags).some(value => value)
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã SKU..."
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
            >
              Tìm kiếm
            </button>
            
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
            >
              <FiFilter className="mr-1" />
              Lọc nâng cao
              {showAdvancedFilters ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
            </button>
            
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
              >
                <FiX className="mr-1" />
                Xóa bộ lọc
              </button>
            )}

            {onItemsPerPageChange && (
              <div className="ml-4 flex items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap flex items-center">
                    <FiList className="mr-1" /> Hiển thị:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md text-sm p-1 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    disabled={loading}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showAdvancedFilters && (
          <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Bộ lọc danh mục */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Danh mục</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      disabled={loading}
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                      {category.name}
                    </label>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không có danh mục</p>
                )}
              </div>
            </div>
            
            {/* Bộ lọc thương hiệu */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Thương hiệu</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center">
                    <input
                      id={`brand-${brand.id}`}
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      checked={selectedBrands.includes(brand.id)}
                      onChange={() => handleBrandChange(brand.id)}
                      disabled={loading}
                    />
                    <label htmlFor={`brand-${brand.id}`} className="ml-2 text-sm text-gray-700">
                      {brand.name}
                    </label>
                  </div>
                ))}
                {brands.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không có thương hiệu</p>
                )}
              </div>
            </div>
            
            {/* Bộ lọc trạng thái */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Trạng thái</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input
                    id="status-all"
                    type="radio"
                    name="status"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    checked={selectedStatus === ''}
                    onChange={() => handleStatusChange('')}
                    disabled={loading}
                  />
                  <label htmlFor="status-all" className="ml-2 text-sm text-gray-700">
                    Tất cả
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="status-active"
                    type="radio"
                    name="status"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    checked={selectedStatus === 'active'}
                    onChange={() => handleStatusChange('active')}
                    disabled={loading}
                  />
                  <label htmlFor="status-active" className="ml-2 text-sm text-gray-700">
                    Đang bán
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="status-out_of_stock"
                    type="radio"
                    name="status"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    checked={selectedStatus === 'out_of_stock'}
                    onChange={() => handleStatusChange('out_of_stock')}
                    disabled={loading}
                  />
                  <label htmlFor="status-out_of_stock" className="ml-2 text-sm text-gray-700">
                    Hết hàng
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="status-discontinued"
                    type="radio"
                    name="status"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    checked={selectedStatus === 'discontinued'}
                    onChange={() => handleStatusChange('discontinued')}
                    disabled={loading}
                  />
                  <label htmlFor="status-discontinued" className="ml-2 text-sm text-gray-700">
                    Ngừng kinh doanh
                  </label>
                </div>
              </div>
            </div>
            
            {/* Bộ lọc flags */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Đặc điểm</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input
                    id="flag-bestseller"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    checked={selectedFlags.isBestSeller}
                    onChange={() => handleFlagChange('isBestSeller')}
                    disabled={loading}
                  />
                  <label htmlFor="flag-bestseller" className="ml-2 text-sm text-gray-700">
                    Bán chạy
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="flag-new"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    checked={selectedFlags.isNew}
                    onChange={() => handleFlagChange('isNew')}
                    disabled={loading}
                  />
                  <label htmlFor="flag-new" className="ml-2 text-sm text-gray-700">
                    Mới
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="flag-sale"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    checked={selectedFlags.isOnSale}
                    onChange={() => handleFlagChange('isOnSale')}
                    disabled={loading}
                  />
                  <label htmlFor="flag-sale" className="ml-2 text-sm text-gray-700">
                    Giảm giá
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="flag-gifts"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    checked={selectedFlags.hasGifts}
                    onChange={() => handleFlagChange('hasGifts')}
                    disabled={loading}
                  />
                  <label htmlFor="flag-gifts" className="ml-2 text-sm text-gray-700">
                    Có quà tặng
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilter; 