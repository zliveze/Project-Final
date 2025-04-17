import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiList, FiCheck } from 'react-icons/fi';
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

  // Hàm chuẩn hóa ID của danh mục và thương hiệu
  const getNormalizedId = (item: any) => {
    return item.id || item._id;
  };

  // State cho tìm kiếm trong danh mục và thương hiệu
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');

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
    console.log('Changing category:', categoryId);
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    console.log('Updated categories:', updatedCategories);
    setSelectedCategories(updatedCategories);

    // Khi bỏ chọn tất cả, đảm bảo gọi API với tham số rỗng
    applyFilters({ categories: updatedCategories });

    // Log thêm để debug
    if (updatedCategories.length === 0) {
      console.log('Bỏ chọn tất cả danh mục, gọi API với categories=[]');
    }
  };

  const handleBrandChange = (brandId: string) => {
    console.log('Changing brand:', brandId);
    const updatedBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId];

    console.log('Updated brands:', updatedBrands);
    setSelectedBrands(updatedBrands);

    // Khi bỏ chọn tất cả, đảm bảo gọi API với tham số rỗng
    applyFilters({ brands: updatedBrands });

    // Log thêm để debug
    if (updatedBrands.length === 0) {
      console.log('Bỏ chọn tất cả thương hiệu, gọi API với brands=[]');
    }
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
    const categoryStats = (statistics as any).categories.find((cat: any) => getNormalizedId(cat) === categoryId);
    return categoryStats ? categoryStats.count : null;
  };

  const getCountForBrand = (brandId: string) => {
    if (!(statistics as any)?.brands) return null;
    const brandStats = (statistics as any).brands.find((brand: any) => getNormalizedId(brand) === brandId);
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
    <div className="bg-white shadow rounded-xl overflow-hidden mb-6 border border-gray-100">
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã SKU..."
                className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all duration-200"
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
              className="px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              Tìm kiếm
            </button>

            <button
              onClick={handleToggleAdvancedFilters}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center transition-all duration-200"
            >
              <FiFilter className="mr-1.5 h-4 w-4" />
              Lọc nâng cao
              {showAdvancedFilters ? <FiChevronUp className="ml-1.5 h-4 w-4" /> : <FiChevronDown className="ml-1.5 h-4 w-4" />}
            </button>

            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 flex items-center transition-all duration-200"
              >
                <FiX className="mr-1.5 h-4 w-4" />
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
                    className="border border-gray-300 rounded-lg text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all duration-200"
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
          <div className="mt-5 border-t border-gray-100 pt-5 grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Bộ lọc danh mục */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Danh mục</h3>

              {/* Thêm ô tìm kiếm cho danh mục */}
              <div className="mb-2 relative">
                <input
                  type="text"
                  placeholder="Tìm danh mục..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all duration-200"
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  disabled={combinedLoading}
                />
                {categorySearchTerm && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setCategorySearchTerm('')}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Hiển thị số lượng đã chọn */}
              {selectedCategories.length > 0 && (
                <div className="mb-2 text-xs text-pink-600 flex items-center">
                  <FiCheck className="mr-1" /> Đã chọn {selectedCategories.length} danh mục
                  <button
                    className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSelectedCategories([]);
                      applyFilters({ categories: [] });
                    }}
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              )}

              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 border border-gray-100 rounded-lg p-3 shadow-sm">
                {/* Lọc danh mục theo từ khóa tìm kiếm */}
                {(categoriesList.length > 0 ? categoriesList : (statisticsCategories.length > 0 ? statisticsCategories : categories))
                  .filter((category: any) =>
                    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                  )
                  .map((category: any) => {
                    const categoryId = getNormalizedId(category);
                    const categoryCount = getCountForCategory(categoryId);
                    return (
                      <div key={categoryId} className="flex items-center justify-between hover:bg-gray-50 p-1 rounded">
                        <div className="flex items-center">
                          <input
                            id={`category-${categoryId}`}
                            type="checkbox"
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                            checked={selectedCategories.includes(categoryId)}
                            onChange={() => handleCategoryChange(categoryId)}
                            disabled={combinedLoading}
                          />
                          <label htmlFor={`category-${categoryId}`} className="ml-2 text-sm text-gray-700 cursor-pointer truncate max-w-[150px]">
                            {category.name}
                          </label>
                        </div>
                        {categoryCount !== null && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm">
                            {categoryCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                {categories.length === 0 && statisticsCategories.length === 0 && categoriesList.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không có danh mục</p>
                )}
                {/* Hiển thị thông báo khi không tìm thấy kết quả */}
                {(categoriesList.length > 0 || statisticsCategories.length > 0 || categories.length > 0) &&
                 (categoriesList.length > 0 ? categoriesList : (statisticsCategories.length > 0 ? statisticsCategories : categories))
                  .filter((category: any) =>
                    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                  ).length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không tìm thấy danh mục phù hợp</p>
                )}
              </div>
            </div>

            {/* Bộ lọc thương hiệu */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Thương hiệu</h3>

              {/* Thêm ô tìm kiếm cho thương hiệu */}
              <div className="mb-2 relative">
                <input
                  type="text"
                  placeholder="Tìm thương hiệu..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all duration-200"
                  value={brandSearchTerm}
                  onChange={(e) => setBrandSearchTerm(e.target.value)}
                  disabled={combinedLoading}
                />
                {brandSearchTerm && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setBrandSearchTerm('')}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Hiển thị số lượng đã chọn */}
              {selectedBrands.length > 0 && (
                <div className="mb-2 text-xs text-pink-600 flex items-center">
                  <FiCheck className="mr-1" /> Đã chọn {selectedBrands.length} thương hiệu
                  <button
                    className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSelectedBrands([]);
                      applyFilters({ brands: [] });
                    }}
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              )}

              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 border border-gray-100 rounded-lg p-3 shadow-sm">
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
                  // Lọc brands theo từ khóa tìm kiếm
                  (brandsList.length > 0 ? brandsList : (statisticsBrands.length > 0 ? statisticsBrands : brands))
                    .filter((brand: any) =>
                      brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
                    )
                    .map((brand: any) => {
                      const brandId = getNormalizedId(brand);
                      const brandCount = getCountForBrand(brandId);
                      return (
                        <div key={brandId} className="flex items-center justify-between hover:bg-gray-50 p-1 rounded">
                          <div className="flex items-center">
                            <input
                              id={`brand-${brandId}`}
                              type="checkbox"
                              className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                              checked={selectedBrands.includes(brandId)}
                              onChange={() => handleBrandChange(brandId)}
                              disabled={combinedLoading}
                            />
                            <label htmlFor={`brand-${brandId}`} className="ml-2 text-sm text-gray-700 cursor-pointer truncate max-w-[150px]">
                              {brand.name}
                            </label>
                          </div>
                          {brandCount !== null && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm">
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
                {/* Hiển thị thông báo khi không tìm thấy kết quả */}
                {!combinedLoading && (brandsList.length > 0 || statisticsBrands.length > 0 || brands.length > 0) &&
                 (brandsList.length > 0 ? brandsList : (statisticsBrands.length > 0 ? statisticsBrands : brands))
                  .filter((brand: any) =>
                    brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
                  ).length === 0 && (
                  <p className="text-sm text-gray-500 italic">Không tìm thấy thương hiệu phù hợp</p>
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
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 transition-all duration-200"
                      checked={selectedStatus === ''}
                      onChange={() => handleStatusChange('')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-all" className="ml-2 text-sm text-gray-700">
                      Tất cả
                    </label>
                  </div>
                  {statistics?.total && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
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
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 transition-all duration-200"
                      checked={selectedStatus === 'active'}
                      onChange={() => handleStatusChange('active')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-active" className="ml-2 text-sm text-gray-700">
                      Đang bán
                    </label>
                  </div>
                  {statistics?.active !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
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
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 transition-all duration-200"
                      checked={selectedStatus === 'out_of_stock'}
                      onChange={() => handleStatusChange('out_of_stock')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-out_of_stock" className="ml-2 text-sm text-gray-700">
                      Hết hàng
                    </label>
                  </div>
                  {statistics?.outOfStock !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
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
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 transition-all duration-200"
                      checked={selectedStatus === 'discontinued'}
                      onChange={() => handleStatusChange('discontinued')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="status-discontinued" className="ml-2 text-sm text-gray-700">
                      Ngừng kinh doanh
                    </label>
                  </div>
                  {statistics?.discontinued !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
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
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                      checked={selectedFlags.isBestSeller}
                      onChange={() => handleFlagChange('isBestSeller')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-bestseller" className="ml-2 text-sm text-gray-700">
                      Bán chạy
                    </label>
                  </div>
                  {statistics?.bestSellers !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                      {statistics.bestSellers}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-new"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                      checked={selectedFlags.isNew}
                      onChange={() => handleFlagChange('isNew')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-new" className="ml-2 text-sm text-gray-700">
                      Mới
                    </label>
                  </div>
                  {statistics?.newProducts !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                      {statistics.newProducts}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-sale"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                      checked={selectedFlags.isOnSale}
                      onChange={() => handleFlagChange('isOnSale')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-sale" className="ml-2 text-sm text-gray-700">
                      Giảm giá
                    </label>
                  </div>
                  {statistics?.onSale !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                      {statistics.onSale}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="flag-gifts"
                      type="checkbox"
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                      checked={selectedFlags.hasGifts}
                      onChange={() => handleFlagChange('hasGifts')}
                      disabled={combinedLoading}
                    />
                    <label htmlFor="flag-gifts" className="ml-2 text-sm text-gray-700">
                      Có quà tặng
                    </label>
                  </div>
                  {statistics?.withGifts !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
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