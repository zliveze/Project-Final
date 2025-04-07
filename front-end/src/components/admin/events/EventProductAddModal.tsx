import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiSearch, FiPlus, FiChevronLeft, FiChevronRight, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useProduct } from '@/contexts/ProductContext';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { toast } from 'react-hot-toast';

// Định nghĩa interface cho sản phẩm từ API
interface Product {
  _id?: string;
  id?: string;
  name: string;
  image: string;
  price: number | string;
  currentPrice?: number | string;
  originalPrice?: number | string;
  brandId?: string;
  brand?: string;
  status?: string;
  sku?: string;
  categoryIds?: string[];
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  images?: Array<{url: string, alt: string, isPrimary?: boolean}>;
}

// Interface cho bộ lọc sản phẩm
interface ProductFilter {
  brandId?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  hasGifts?: boolean;
}

// Interface để phù hợp với AdminProduct từ API
interface AdminProductResponse {
  products: Product[];
  total: number;
  totalPages: number;
}

// Thêm định nghĩa cho tham số fetchAdminProductList
interface AdminProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  hasGifts?: boolean;
}

interface EventProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (products: {
    productId: string;
    variantId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[]) => void;
  excludedProductIds?: string[]; // Các sản phẩm đã được thêm vào sự kiện
}

const EventProductAddModal: React.FC<EventProductAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  excludedProductIds = []
}) => {
  const { fetchAdminProductList } = useProduct();
  const { brands } = useBrands();
  const { categories } = useCategory();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<{
    productId: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(30); // Mặc định giảm 30%
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // State cho filter nâng cao
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [brandsList, setBrands] = useState<{id: string, name: string}[]>([]);
  const [categoriesList, setCategories] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState<ProductFilter>({
    status: 'active',
  });
  const [tempFilters, setTempFilters] = useState<ProductFilter>({
    status: 'active',
  });

  // Chỉ cập nhật danh sách brandsList và categoriesList khi brands hoặc categories thay đổi
  useEffect(() => {
    if (brands && brands.length > 0) {
      const brandItems = brands.map(brand => ({
        id: brand.id || '',
        name: brand.name
      }));
      setBrands(brandItems);
    }
  }, [brands]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      const categoryItems = categories.map(category => ({
        id: category._id || '',
        name: category.name
      }));
      setCategories(categoryItems);
    }
  }, [categories]);

  // Effect for modal visibility and resetting state
  useEffect(() => {
    let visibilityTimer: NodeJS.Timeout | null = null;
    if (isOpen) {
      setModalVisible(true);
      setSelectedProducts([]); // Reset selection when modal opens
      setIsInitialLoad(true); // Reset initial load flag
    } else {
      // Delay hiding for animation
      visibilityTimer = setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
    };
  }, [isOpen]);

  // Hàm lấy danh sách sản phẩm từ API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: AdminProductListParams = {
        page: page,
        limit: 12,
        search: searchTerm,
        status: filters.status || 'active',
        brandId: filters.brandId,
        categoryId: filters.categoryId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        isBestSeller: filters.isBestSeller,
        isNew: filters.isNew,
        isOnSale: filters.isOnSale,
        hasGifts: filters.hasGifts
      };

      console.log('Tham số gửi đến API để lọc sản phẩm:', params);
      const result = await fetchAdminProductList(params);
      console.log('Kết quả trả về từ API:', result);
      
      if (result) {
        // Kiểm tra kiểu dữ liệu của sản phẩm đầu tiên nếu có
        if (result.products && result.products.length > 0) {
          console.log('Chi tiết sản phẩm đầu tiên:', result.products[0]);
          console.log('Giá gốc (price):', result.products[0].price, 'kiểu:', typeof result.products[0].price);
          console.log('Giá hiện tại (currentPrice):', result.products[0].currentPrice, 'kiểu:', typeof result.products[0].currentPrice);
          console.log('Giá gốc dạng số (originalPrice):', result.products[0].originalPrice, 'kiểu:', typeof result.products[0].originalPrice);
        }
        
        // Chuyển đổi price từ string sang number nếu cần
        const formattedProducts = result.products.map(product => {
          // Chuyển đổi product sang product với _id
          const formattedProduct = {
            ...product,
            _id: product.id,
            // Đảm bảo đặt giá đúng
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            currentPrice: product.currentPrice !== undefined ? 
              (typeof product.currentPrice === 'string' ? parseFloat(product.currentPrice) : product.currentPrice) : 
              (typeof product.price === 'string' ? parseFloat(product.price) : product.price),
            originalPrice: product.originalPrice !== undefined ? 
              (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice) : 
              (typeof product.price === 'string' ? parseFloat(product.price) : product.price)
          };
          console.log(`Sản phẩm ${product.name} sau khi format:`, {
            price: formattedProduct.price,
            currentPrice: formattedProduct.currentPrice,
            originalPrice: formattedProduct.originalPrice
          });
          return formattedProduct;
        });
        
        setProducts(formattedProducts);
        setTotalPages(result.totalPages);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err: any) { // Explicitly type err
      console.error('Error fetching products:', err);
      const errorMessage = err?.response?.data?.message || 'Không thể tải danh sách sản phẩm.'; // Safely access error message
      setError(errorMessage);
      toast.error(`Lỗi tải sản phẩm: ${errorMessage}`); // Keep standard error toast
    } finally {
      setLoading(false);
    }
  }, [fetchAdminProductList, page, searchTerm, filters]);

  // Effect for fetching data (initial with delay, subsequent immediately)
  useEffect(() => {
    let fetchTimer: NodeJS.Timeout | null = null;
    // Fetch only when modal is open and visible
    if (isOpen && modalVisible) {
      const delay = isInitialLoad ? 150 : 0; // Apply delay only on initial load
      
      // Set initial load to false *before* the timeout to prevent potential re-trigger issues
      if (isInitialLoad) {
        setIsInitialLoad(false); 
      }

      fetchTimer = setTimeout(() => {
        fetchProducts();
      }, delay);
    }

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (fetchTimer) clearTimeout(fetchTimer);
    };
  // Fetch when modal is open/visible, page/search changes, or on initial load flag change
  }, [isOpen, modalVisible, page, searchTerm, fetchProducts, isInitialLoad, filters]);

  // Xử lý tìm kiếm với debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset về trang 1 khi tìm kiếm
  };
  
  // Xử lý thay đổi filter
  const handleFilterChange = (name: keyof ProductFilter, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Áp dụng bộ lọc
  const applyFilters = () => {
    console.log('Applying filters:', tempFilters);
    // Đảm bảo các giá trị lọc được chuyển đúng định dạng
    const sanitizedFilters = {
      ...tempFilters,
      brandId: tempFilters.brandId || undefined,
      categoryId: tempFilters.categoryId || undefined,
      isBestSeller: tempFilters.isBestSeller === true ? true : undefined,
      isNew: tempFilters.isNew === true ? true : undefined,
      isOnSale: tempFilters.isOnSale === true ? true : undefined,
      hasGifts: tempFilters.hasGifts === true ? true : undefined,
    };
    
    console.log('Sanitized filters:', sanitizedFilters);
    setFilters(sanitizedFilters);
    setPage(1); // Reset về trang 1 khi áp dụng bộ lọc
    setShowAdvancedFilters(false); // Đóng bộ lọc nâng cao
  };
  
  // Xóa bộ lọc
  const clearFilters = () => {
    const defaultFilters = { status: 'active' };
    console.log('Clearing filters, setting to:', defaultFilters);
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setPage(1);
  };
  
  // Lọc sản phẩm đã được thêm vào sự kiện
  const filteredProducts = products.filter(product => 
    !excludedProductIds.includes(product._id || product.id || '')
  );
  
  // Kiểm tra xem sản phẩm đã được chọn chưa
  const isProductSelected = (productId: string) => {
    return selectedProducts.some(product => product.productId === productId);
  };
  
  // Xử lý chọn/bỏ chọn sản phẩm
  const toggleProductSelection = (product: Product) => {
    const productId = product._id || product.id || '';
    
    if (isProductSelected(productId)) {
      // Bỏ chọn sản phẩm
      setSelectedProducts(prev => prev.filter(item => item.productId !== productId));
    } else {
      // Chọn sản phẩm và tính giá sau khi áp dụng % giảm giá
      // Ưu tiên lấy giá từ originalPrice (giá thực trong DB) nếu có
      let productPrice = 0;
      
      if (product.originalPrice) {
        productPrice = typeof product.originalPrice === 'string' ? 
          parseFloat(product.originalPrice) : product.originalPrice;
      } else if (product.price) {
        productPrice = typeof product.price === 'string' ? 
          parseFloat(product.price) : (product.price || 0);
      }
      
      const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);
      
      // Lấy ảnh đầu tiên hoặc ảnh được đánh dấu là primary từ mảng images nếu có
      let productImage = product.image;
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary);
        productImage = primaryImage ? primaryImage.url : product.images[0].url;
      }
      
      setSelectedProducts(prev => [...prev, {
        productId: productId,
        adjustedPrice,
        name: product.name,
        image: productImage,
        originalPrice: productPrice
      }]);
    }
  };
  
  // Xử lý thay đổi % giảm giá
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setDiscountPercent(value);
      
      // Cập nhật giá của tất cả sản phẩm đã chọn
      setSelectedProducts(prev => prev.map(product => {
        const originalProduct = products.find(p => (p._id || p.id) === product.productId);
        let originalPrice = product.originalPrice || 0;
        
        if (originalProduct) {
          // Ưu tiên lấy giá từ originalPrice (giá thực trong DB) nếu có
          if (originalProduct.originalPrice) {
            originalPrice = typeof originalProduct.originalPrice === 'string' ? 
              parseFloat(originalProduct.originalPrice) : originalProduct.originalPrice;
          } else if (originalProduct.price) {
            originalPrice = typeof originalProduct.price === 'string' ? 
              parseFloat(originalProduct.price) : (originalProduct.price || 0);
          }
        }
        
        const newAdjustedPrice = Math.round(originalPrice * (100 - value) / 100);
        
        return {
          ...product,
          adjustedPrice: newAdjustedPrice,
          originalPrice
        };
      }));
    }
  };
  
  // Xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Xử lý thêm sản phẩm vào sự kiện
  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      setSubmitting(true);
      
      // Thêm sản phẩm vào sự kiện (gọi callback)
      onAdd(selectedProducts);
      
      // Reset state sau khi thêm
      setSelectedProducts([]);
      
      // Đóng modal sau khi thêm thành công
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error('Đã xảy ra lỗi khi thêm sản phẩm vào sự kiện!');
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm định dạng giá tiền
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    // Không nhân lên 1000 nữa vì giá trong DB đã đúng (150000)
    return new Intl.NumberFormat('vi-VN').format(numPrice) + ' ₫';
  };

  if (!modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thêm sản phẩm vào sự kiện
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Search and Discount */}
          <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Discount Percentage */}
              <div className="flex items-center gap-2">
                <label htmlFor="discountPercent" className="text-sm font-medium text-gray-700">
                  Giảm giá:
                </label>
                <div className="relative w-24">
                  <input
                    type="number"
                    id="discountPercent"
                    min="0"
                    max="100"
                    className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={discountPercent}
                    onChange={handleDiscountChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
              >
                <FiFilter className="mr-1" />
                Lọc nâng cao
                {showAdvancedFilters ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
              </button>
            </div>
            
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu
                  </label>
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={tempFilters.brandId || ''}
                    onChange={(e) => {
                      console.log('Selected brand ID:', e.target.value);
                      handleFilterChange('brandId', e.target.value || undefined);
                    }}
                  >
                    <option value="">Tất cả thương hiệu</option>
                    {brandsList.map((brand) => (
                      <option key={brand.id} value={brand.id}>
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
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={tempFilters.categoryId || ''}
                    onChange={(e) => {
                      console.log('Selected category ID:', e.target.value);
                      handleFilterChange('categoryId', e.target.value || undefined);
                    }}
                  >
                    <option value="">Tất cả danh mục</option>
                    {categoriesList.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={tempFilters.status || 'active'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="active">Đang bán</option>
                    <option value="out_of_stock">Hết hàng</option>
                    <option value="discontinued">Ngừng kinh doanh</option>
                    <option value="">Tất cả trạng thái</option>
                  </select>
                </div>
                
                {/* Price Range Filter */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá từ</label>
                    <input
                      type="number"
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={tempFilters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0đ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến</label>
                    <input
                      type="number"
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={tempFilters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="1,000,000đ"
                    />
                  </div>
                </div>
                
                {/* Flag Filters */}
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Các đặc tính
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center">
                      <input
                        id="flag-best-seller"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={!!tempFilters.isBestSeller}
                        onChange={(e) => handleFilterChange('isBestSeller', e.target.checked || undefined)}
                      />
                      <label htmlFor="flag-best-seller" className="ml-2 block text-sm text-gray-700">
                        Bán chạy
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="flag-new"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={!!tempFilters.isNew}
                        onChange={(e) => handleFilterChange('isNew', e.target.checked || undefined)}
                      />
                      <label htmlFor="flag-new" className="ml-2 block text-sm text-gray-700">
                        Sản phẩm mới
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="flag-on-sale"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={!!tempFilters.isOnSale}
                        onChange={(e) => handleFilterChange('isOnSale', e.target.checked || undefined)}
                      />
                      <label htmlFor="flag-on-sale" className="ml-2 block text-sm text-gray-700">
                        Đang giảm giá
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="flag-has-gifts"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={!!tempFilters.hasGifts}
                        onChange={(e) => handleFilterChange('hasGifts', e.target.checked || undefined)}
                      />
                      <label htmlFor="flag-has-gifts" className="ml-2 block text-sm text-gray-700">
                        Có quà tặng
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Filter Actions */}
                <div className="col-span-full flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="mt-2 text-sm text-pink-600 hover:text-pink-500"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Không tìm thấy sản phẩm nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {filteredProducts.map((product) => {
                  const productId = product._id || product.id || '';
                  const isSelected = isProductSelected(productId);
                  
                  // Ưu tiên lấy giá từ originalPrice (giá thực trong DB) sau đó mới đến price
                  let productPrice = 0;
                  // Log để debug
                  console.log(`Sản phẩm ${product.name}:`, product);
                  
                  if (product.originalPrice) {
                    productPrice = typeof product.originalPrice === 'string' ? 
                      parseFloat(product.originalPrice) : product.originalPrice;
                  } else if (product.price) {
                    productPrice = typeof product.price === 'string' ? 
                      parseFloat(product.price) : product.price;
                  }
                  
                  console.log(`Giá cuối cùng của sản phẩm ${product.name}: ${productPrice}`);
                  
                  const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);
                  
                  // Lấy ảnh sản phẩm
                  let productImage = product.image;
                  if (product.images && product.images.length > 0) {
                    const primaryImage = product.images.find(img => img.isPrimary);
                    productImage = primaryImage ? primaryImage.url : product.images[0].url;
                  }
                  
                  // Tính phần trăm giảm giá thực tế
                  const actualDiscount = Math.round(((productPrice - adjustedPrice) / productPrice) * 100);
                  
                  return (
                    <div
                      key={productId}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                      }`}
                      onClick={() => toggleProductSelection(product)}
                    >
                      <div className="p-4">
                        <div className="flex mb-2">
                          <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h4>
                            {product.brand && (
                              <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                            )}
                            {product.sku && (
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            <span className="line-through">{formatPrice(productPrice)}</span>
                          </div>
                          <div className="text-sm font-semibold text-pink-600">
                            {formatPrice(adjustedPrice)}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {isSelected ? 'Đã chọn' : 'Chưa chọn'}
                          </div>
                          <div className="text-xs font-medium text-pink-600">
                            -{actualDiscount}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`p-2 rounded-md ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`p-2 rounded-md ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-between">
            <div>
              <span className="text-sm text-gray-700">
                Đã chọn {selectedProducts.length} sản phẩm 
                {selectedProducts.length > 10 && 
                  <span className="text-orange-500 ml-1">(Khuyến nghị: Nên chọn tối đa 10 sản phẩm mỗi lần)</span>
                }
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddProducts}
                disabled={selectedProducts.length === 0 || submitting}
                className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${selectedProducts.length === 0 || submitting
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'}`}
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiPlus className="inline-block h-4 w-4 mr-1" />
                    Thêm vào sự kiện
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventProductAddModal;
