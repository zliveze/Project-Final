import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiSearch, FiX, FiCheck, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Product } from '@/contexts/ProductContext';
import { useCategory, Category } from '@/contexts/CategoryContext';
import { useBrands, Brand } from '@/contexts/BrandContext';
import { useVoucherProductSearch } from '@/contexts/VoucherProductSearchContext';
import { createPortal } from 'react-dom';

interface VoucherProductsPopupProps {
  selectedProducts: string[];
  onProductsChange: (productIds: string[]) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const VoucherProductsPopup: React.FC<VoucherProductsPopupProps> = ({
  selectedProducts,
  onProductsChange,
  onClose,
  position
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedProducts));
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Use Contexts
  const { products, pagination, loading, error: productsError, searchProducts } = useVoucherProductSearch();
  const { categories, loading: categoriesLoading, fetchCategories } = useCategory();
  const { brands, loading: brandsLoading, fetchBrands } = useBrands();

  const isInitialMount = useRef(true);
  const previousSearchParams = useRef({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm,
    brandId: selectedBrandId,
    categoryId: selectedCategoryId
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data with filters
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentParams = {
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm,
      brandId: selectedBrandId,
      categoryId: selectedCategoryId
    };

    // Kiểm tra xem các tham số tìm kiếm có thay đổi không
    const hasParamsChanged = JSON.stringify(currentParams) !== JSON.stringify(previousSearchParams.current);

    if (!loading && hasParamsChanged && mounted) {
      console.log('Params changed, fetching new data:', currentParams);
      previousSearchParams.current = currentParams;

      const timeoutId = setTimeout(() => {
        searchProducts(currentParams);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, selectedBrandId, selectedCategoryId, searchProducts, loading, mounted]);

  // Initial data fetch
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        if (!categories.length || !brands.length) {
          await Promise.all([
            fetchCategories(1, 100),
            fetchBrands(1, 100)
          ]);
        }
        
        if (isMounted && !loading) {
          await searchProducts({
            page: 1,
            limit: itemsPerPage
          });
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo dữ liệu:', error);
      }
    };

    if (!mounted) {
      setMounted(true);
      initializeData();
    }

    return () => {
      isMounted = false;
      setMounted(false);
    };
  }, []);

  // Update total pages when pagination changes
  useEffect(() => {
    if (pagination) {
      const total = pagination.total;
      setTotalPages(Math.ceil(total / itemsPerPage));
      console.log(`Tổng số trang: ${Math.ceil(total / itemsPerPage)}, Tổng số sản phẩm: ${total}`);
    }
  }, [pagination, itemsPerPage]);

  // Handlers
  const toggleProduct = useCallback((productId: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      onProductsChange(Array.from(newSelected));
      return newSelected;
    });
  }, [onProductsChange]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSave = useCallback(() => {
    onProductsChange(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onProductsChange, onClose]);

  const resetFilters = useCallback(() => {
    setSelectedBrandId('');
    setSelectedCategoryId('');
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.getElementById('voucher-products-popup');
      if (popup && !popup.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Pagination UI
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === i
              ? 'bg-pink-500 text-white'
              : 'text-gray-700 hover:bg-pink-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1 rounded-md ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-pink-50'
          }`}
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-pink-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}
        {pages}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-pink-50"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1 rounded-md ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-pink-50'
          }`}
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const popupContent = (
    <div 
      id="voucher-products-popup"
      className="fixed bg-white rounded-lg shadow-xl w-[800px] max-h-[700px] flex flex-col"
      style={{
        top: position?.y || '50%',
        left: position?.x || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
        <h3 className="text-base font-medium text-gray-900">Chọn sản phẩm</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 p-1"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              showFilters ? 'bg-pink-50 text-pink-700 border-pink-200' : 'border-gray-300 text-gray-700 bg-white'
            } hover:bg-gray-50`}
          >
            <FiFilter className="h-4 w-4 mr-2" />
            Bộ lọc
            {(selectedBrandId || selectedCategoryId) && (
              <span className="ml-2 bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-xs">
                {(selectedBrandId ? 1 : 0) + (selectedCategoryId ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thương hiệu
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => {
                  setSelectedBrandId(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
              >
                <option value="">Tất cả thương hiệu</option>
                {brands.map((brand: Brand) => (
                  <option key={brand._id || brand.id} value={brand._id || brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category: Category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedBrandId || selectedCategoryId || searchTerm) && (
              <button
                type="button"
                onClick={resetFilters}
                className="col-span-2 text-sm text-pink-600 hover:text-pink-700"
              >
                ↺ Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : productsError ? (
          <div className="text-center py-8 text-red-500">
            Có lỗi xảy ra khi tải danh sách sản phẩm
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedBrandId || selectedCategoryId
              ? 'Không tìm thấy sản phẩm phù hợp'
              : 'Chưa có sản phẩm nào'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product._id || product.id}
                onClick={() => toggleProduct(product._id || product.id || '')}
                className={`flex items-center p-3 rounded-md border cursor-pointer transition-all duration-200 ${
                  selectedIds.has(product._id || product.id || '')
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                }`}
              >
                {/* Product Image */}
                {product.images?.[0]?.url && (
                  <div className="flex-shrink-0 w-12 h-12 mr-3">
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                )}
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  {product.sku && (
                    <p className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </p>
                  )}
                  <p className="text-sm font-medium text-pink-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(product.price)}
                  </p>
                </div>

                {/* Checkbox */}
                <div className="ml-3 flex-shrink-0">
                  {selectedIds.has(product._id || product.id || '') && (
                    <FiCheck className="h-5 w-5 text-pink-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="px-4 py-3 border-t">
          {renderPagination()}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center rounded-b-lg">
        <div className="text-sm text-gray-500">
          Đã chọn: <span className="font-medium text-gray-900">{selectedIds.size}</span> sản phẩm
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  // Render using portal
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      {popupContent}
    </>,
    document.body
  );
}; 