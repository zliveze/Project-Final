import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiList } from 'react-icons/fi';
import { ProductStatus } from './ProductStatusBadge';
import { useProduct } from '@/contexts/ProductContext';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';

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
  // Access the ProductContext for additional functionality
  const { statistics, fetchStatistics, loading: contextLoading } = useProduct();
  
  // Sử dụng BrandContext và CategoryContext
  const { brands: brandsList, fetchBrands, loading: brandsLoading } = useBrands();
  const { categories: categoriesList, fetchCategories, loading: categoriesLoading } = useCategory();
  
  // Lấy danh sách brands và categories từ statistics nếu có
  const statisticsBrands = (statistics as any)?.brands || [];
  const statisticsCategories = (statistics as any)?.categories || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Fetch statistics when component mounts or when advanced filters are shown
  useEffect(() => {
    // Gọi API khi component mount hoặc khi người dùng mở filter nâng cao
    if (!statistics || showAdvancedFilters) {
      fetchStatistics();
    }
  }, [statistics, fetchStatistics, showAdvancedFilters]);
  
  // Đảm bảo gọi API khi component mount
  useEffect(() => {
    fetchStatistics();
    fetchBrands(1, 100);
    fetchCategories(1, 100);
  }, []);
  
  // Hàm xử lý khi người dùng bấm vào nút lọc nâng cao
  const handleToggleAdvancedFilters = () => {
    const newState = !showAdvancedFilters;
    setShowAdvancedFilters(newState);
    
    // Nếu đang mở filter, gọi API để lấy dữ liệu
    if (newState) {
      console.log('Mở filter nâng cao, đang gọi API...');
      fetchStatistics();
      fetchBrands(1, 100); // Lấy tối đa 100 thương hiệu
      fetchCategories(1, 100); // Lấy tối đa 100 danh mục
    }
  };
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>('');
  const [selectedFlags, setSelectedFlags] = useState({
    isBestSeller: false,
    isNew: false,
    isOnSale: false,
    hasGifts: false
  });

  // Kết hợp trạng thái loading từ props và context
  const combinedLoading = loading || contextLoading || brandsLoading || categoriesLoading;

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

  // Sử dụng statistics từ context để hiển thị số lượng cho các danh mục, thương hiệu, v.v.
  const getCountForCategory = (categoryId: string) => {
    if (!(statistics as any)?.categories) return null;
    const categoryStats = (statistics as any).categories.find((cat: any) => cat.id === categoryId);
    return categoryStats ? categoryStats.count : null;
  };

  const getCountForBrand = (brandId: string) => {
    if (!(statistics as any)?.brands) return null;
    const brandStats = (statistics as any).brands.find((brand: any) => brand.id === brandId);
    return brandStats ? brandStats.count : null;
  };
  
  // Hàm kiểm tra xem có dữ liệu brands và categories từ statistics hay không
  const hasDataFromStatistics = () => {
    return statistics && (
      ((statistics as any)?.brands && (statistics as any).brands.length > 0) ||
      ((statistics as any)?.categories && (statistics as any).categories.length > 0)
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
                disabled={combinedLoading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSearch}
              disabled={combinedLoading}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
            >
              Tìm kiếm
            </button>

            <button
              onClick={handleToggleAdvancedFilters}
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
                    disabled={combinedLoading}
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
                {(categoriesList.length > 0 ? categoriesList : (statisticsCategories.length > 0 ? statisticsCategories : categories)).map((category: any) => {
                  const categoryCount = getCountForCategory(category.id);
                  return (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id={`category-${category.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          disabled={combinedLoading}
                        />
                        <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                          {category.name}
                        </label>
                      </div>
                      {categoryCount !== null && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {categoryCount}
                        </span>
                      )}
                    </div>
                  );
                })}
                {categories.length === 0 && statisticsCategories.length === 0 && categoriesList.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không có danh mục</p>
                )}
              </div>
            </div>

            {/* Bộ lọc thương hiệu */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Thương hiệu</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                {combinedLoading ? (
                  <div className="py-2 px-1">
                    <div className="animate-pulse flex space-x-2">
                      <div className="rounded-full bg-gray-200 h-4 w-4"></div>
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="animate-pulse flex space-x-2 mt-2">
                      <div className="rounded-full bg-gray-200 h-4 w-4"></div>
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="animate-pulse flex space-x-2 mt-2">
                      <div className="rounded-full bg-gray-200 h-4 w-4"></div>
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Ưu tiên sử dụng brands từ context, nếu không có thì sử dụng từ statistics hoặc props
                  (brandsList.length > 0 ? brandsList : (statisticsBrands.length > 0 ? statisticsBrands : brands)).map((brand: any) => {
                    const brandCount = getCountForBrand(brand.id);
                    return (
                      <div key={brand.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id={`brand-${brand.id}`}
                            type="checkbox"
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            checked={selectedBrands.includes(brand.id)}
                            onChange={() => handleBrandChange(brand.id)}
                            disabled={combinedLoading}
                          />
                          <label htmlFor={`brand-${brand.id}`} className="ml-2 text-sm text-gray-700">
                            {brand.name}
                          </label>
                        </div>
                        {brandCount !== null && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {brandCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                {!combinedLoading && brands.length === 0 && statisticsBrands.length === 0 && brandsList.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không có thương hiệu</p>
                )}
              </div>
            </div>

            {/* Bộ lọc trạng thái */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Trạng thái</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="status-all"
                      type="radio"
                      name="status"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      checked={selectedStatus === ''}
                      onChange={() => handleStatusChange('')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-all" className="ml-2 text-sm text-gray-700">
                      Tất cả
                    </label>
                  </div>
                  {statistics?.total && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.total}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="status-active"
                      type="radio"
                      name="status"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      checked={selectedStatus === 'active'}
                      onChange={() => handleStatusChange('active')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-active" className="ml-2 text-sm text-gray-700">
                      Đang bán
                    </label>
                  </div>
                  {statistics?.active !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.active}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="status-out_of_stock"
                      type="radio"
                      name="status"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      checked={selectedStatus === 'out_of_stock'}
                      onChange={() => handleStatusChange('out_of_stock')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-out_of_stock" className="ml-2 text-sm text-gray-700">
                      Hết hàng
                    </label>
                  </div>
                  {statistics?.outOfStock !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.outOfStock}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="status-discontinued"
                      type="radio"
                      name="status"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      checked={selectedStatus === 'discontinued'}
                      onChange={() => handleStatusChange('discontinued')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-discontinued" className="ml-2 text-sm text-gray-700">
                      Ngừng kinh doanh
                    </label>
                  </div>
                  {statistics?.discontinued !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.discontinued}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bộ lọc flags */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Đặc điểm</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-bestseller"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      checked={selectedFlags.isBestSeller}
                      onChange={() => handleFlagChange('isBestSeller')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-bestseller" className="ml-2 text-sm text-gray-700">
                      Bán chạy
                    </label>
                  </div>
                  {statistics?.bestSellers !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.bestSellers}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-new"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      checked={selectedFlags.isNew}
                      onChange={() => handleFlagChange('isNew')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-new" className="ml-2 text-sm text-gray-700">
                      Mới
                    </label>
                  </div>
                  {statistics?.newProducts !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.newProducts}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-sale"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      checked={selectedFlags.isOnSale}
                      onChange={() => handleFlagChange('isOnSale')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-sale" className="ml-2 text-sm text-gray-700">
                      Giảm giá
                    </label>
                  </div>
                  {statistics?.onSale !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.onSale}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-gifts"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      checked={selectedFlags.hasGifts}
                      onChange={() => handleFlagChange('hasGifts')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-gifts" className="ml-2 text-sm text-gray-700">
                      Có quà tặng
                    </label>
                  </div>
                  {statistics?.withGifts !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statistics.withGifts}
                    </span>
                  )}
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