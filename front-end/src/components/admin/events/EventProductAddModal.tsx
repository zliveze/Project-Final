import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiSearch, FiPlus, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Pagination from '@/components/admin/common/Pagination';
import { useProduct } from '@/contexts/ProductContext';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { toast } from 'react-hot-toast';
import useProductPromotionCheck from '@/hooks/useProductPromotionCheck';

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

// Định nghĩa cho tham số fetchAdminProductList được sử dụng trong fetchProducts
// Không cần export vì chỉ sử dụng nội bộ trong component này

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
  const { brands, fetchBrands } = useBrands();
  const { categories, fetchCategories } = useCategory();
  const { checkProducts } = useProductPromotionCheck();
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
  const productsInCampaign = new Map<string, string>();

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
    } else if (isOpen) {
      // Tải brands nếu chưa có khi modal mở
      console.log('Tải danh sách thương hiệu...');
      fetchBrands(1, 100); // Tải tối đa 100 brands
    }
  }, [brands, isOpen, fetchBrands]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      const categoryItems = categories.map(category => ({
        id: category._id || '',
        name: category.name
      }));
      setCategories(categoryItems);
    } else if (isOpen) {
      // Tải categories nếu chưa có khi modal mở
      console.log('Tải danh sách danh mục...');
      fetchCategories(1, 100); // Tải tối đa 100 categories
    }
  }, [categories, isOpen, fetchCategories]);

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

  // Hàm để lấy danh sách sản phẩm từ API
  const fetchProducts = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdminProductList({
        page,
        limit: 12,
        search: searchTerm,
        brandId: filters.brandId,
        categoryId: filters.categoryId,
        status: filters.status,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        isBestSeller: filters.isBestSeller,
        isNew: filters.isNew,
        isOnSale: filters.isOnSale,
        hasGifts: filters.hasGifts,
      });

      if (result && result.products) {
        // Lấy danh sách product IDs
        const fetchedProductIds = result.products.map(product => {
          // Đảm bảo luôn có một ID hợp lệ để tham chiếu
          return ((product as any)._id || product.id || '').toString();
        }).filter(id => id !== ''); // Loại bỏ các ID rỗng

        try {
          // Thay vì sử dụng filterProductsNotInCampaign, sử dụng checkProducts trực tiếp
          const checkResults = await checkProducts(fetchedProductIds);

          // Lọc ra các sản phẩm không thuộc về Campaign
          const validProductIds = Array.isArray(checkResults)
            ? checkResults
              .filter(result => !result.inCampaign)
              .map(result => result.productId)
            : fetchedProductIds; // Nếu checkResults không phải mảng, giữ nguyên danh sách

          // Lọc danh sách sản phẩm chỉ lấy những sản phẩm không thuộc về Campaign
          const filteredProducts = result.products.filter(product => {
            const productId = ((product as any)._id || product.id || '').toString();
            return validProductIds.includes(productId);
          });

          setProducts(filteredProducts);
        } catch (filterError) {
          console.error('Lỗi khi lọc sản phẩm theo Campaign:', filterError);
          // Nếu lọc thất bại, hiển thị tất cả sản phẩm
          setProducts(result.products);
        }

        setTotalPages(Math.ceil(result.total / 12));
      }
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      console.error('Lỗi khi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAdminProductList, page, filters, searchTerm, isOpen, checkProducts]);

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

  // Lọc sản phẩm đã được thêm vào sự kiện hoặc đã thuộc về Campaign
  const filteredProducts = products.filter(product => {
    const productId = product._id || product.id || '';
    // Loại bỏ sản phẩm đã được thêm vào sự kiện
    if (excludedProductIds.includes(productId)) {
      return false;
    }
    // Loại bỏ sản phẩm đã thuộc về Campaign
    if (productsInCampaign.has(productId)) {
      return false;
    }
    return true;
  });

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
    // Tránh việc gọi API liên tục khi đang ở cùng trang
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      console.log('Chuyển đến trang:', newPage);
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

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          {/* Header */}
          <div className="bg-pink-50 px-6 py-4 border-b border-pink-100 sm:px-8 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-800">
              Thêm sản phẩm vào sự kiện
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-pink-500 focus:outline-none transition-colors duration-200 bg-white rounded-full p-1.5 hover:bg-pink-50"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Search and Discount */}
          <div className="px-6 py-4 sm:px-8 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-200"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Discount Percentage */}
              <div className="flex items-center gap-3">
                <label htmlFor="discountPercent" className="text-sm font-medium text-gray-700">
                  Giảm giá:
                </label>
                <div className="relative w-28">
                  <input
                    type="number"
                    id="discountPercent"
                    min="0"
                    max="100"
                    className="block w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-200"
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
                className="px-4 py-2.5 bg-pink-50 text-pink-700 rounded-md hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500 flex items-center transition-colors duration-200"
              >
                <FiFilter className="mr-1.5" />
                Lọc nâng cao
                {showAdvancedFilters ? <FiChevronUp className="ml-1.5" /> : <FiChevronDown className="ml-1.5" />}
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Brand Filter */}
                <div>
                  <label htmlFor="brandFilter" className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                  <select
                    id="brandFilter"
                    name="brandId"
                    value={tempFilters.brandId || ''}
                    onChange={(e) => handleFilterChange('brandId', e.target.value || undefined)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
                  >
                    <option value="">Tất cả thương hiệu</option>
                    {brandsList.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    id="categoryFilter"
                    name="categoryId"
                    value={tempFilters.categoryId || ''}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categoriesList.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    id="statusFilter"
                    name="status"
                    value={tempFilters.status || 'active'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                    <option value="draft">Bản nháp</option>
                    <option value="">Tất cả</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="minPriceFilter" className="block text-sm font-medium text-gray-700 mb-1">Giá từ</label>
                    <input
                      type="number"
                      id="minPriceFilter"
                      name="minPrice"
                      placeholder="0đ"
                      value={tempFilters.minPrice?.toString() || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxPriceFilter" className="block text-sm font-medium text-gray-700 mb-1">Đến</label>
                    <input
                      type="number"
                      id="maxPriceFilter"
                      name="maxPrice"
                      placeholder="1,000,000đ"
                      value={tempFilters.maxPrice?.toString() || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>

                {/* Product Flags */}
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đặc điểm sản phẩm</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center">
                      <input
                        id="isBestSeller"
                        name="isBestSeller"
                        type="checkbox"
                        checked={tempFilters.isBestSeller || false}
                        onChange={(e) => handleFilterChange('isBestSeller', e.target.checked)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isBestSeller" className="ml-2 block text-sm text-gray-700">
                        Bán chạy
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isNew"
                        name="isNew"
                        type="checkbox"
                        checked={tempFilters.isNew || false}
                        onChange={(e) => handleFilterChange('isNew', e.target.checked)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isNew" className="ml-2 block text-sm text-gray-700">
                        Mới
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isOnSale"
                        name="isOnSale"
                        type="checkbox"
                        checked={tempFilters.isOnSale || false}
                        onChange={(e) => handleFilterChange('isOnSale', e.target.checked)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isOnSale" className="ml-2 block text-sm text-gray-700">
                        Đang giảm giá
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="hasGifts"
                        name="hasGifts"
                        type="checkbox"
                        checked={tempFilters.hasGifts || false}
                        onChange={(e) => handleFilterChange('hasGifts', e.target.checked)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hasGifts" className="ml-2 block text-sm text-gray-700">
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
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="max-h-[450px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-2 text-sm text-pink-600 hover:text-pink-500 focus:outline-none focus:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Không tìm thấy sản phẩm nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                {filteredProducts.map((product) => {
                  const productId = product._id || product.id || '';
                  const isSelected = isProductSelected(productId);

                  // Ưu tiên lấy giá từ originalPrice sau đó mới đến price
                  let productPrice = 0;
                  if (product.originalPrice) {
                    productPrice = typeof product.originalPrice === 'string' ?
                      parseFloat(product.originalPrice) : product.originalPrice;
                  } else if (product.price) {
                    productPrice = typeof product.price === 'string' ?
                      parseFloat(product.price) : product.price;
                  }

                  const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);
                  const actualDiscount = Math.round(((productPrice - adjustedPrice) / productPrice) * 100);

                  // Lấy ảnh sản phẩm
                  let productImage = product.image;
                  if (product.images && product.images.length > 0) {
                    const primaryImage = product.images.find(img => img.isPrimary);
                    productImage = primaryImage ? primaryImage.url : product.images[0].url;
                  }

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
          <div className="px-6 py-3 sm:px-8 border-t border-gray-200 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              maxVisiblePages={5}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 sm:px-8 border-t border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-700 flex items-center">
                <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                  {selectedProducts.length}
                </span>
                Sản phẩm đã chọn
                {selectedProducts.length > 10 &&
                  <span className="text-orange-500 ml-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Khuyến nghị: Nên chọn tối đa 10 sản phẩm mỗi lần
                  </span>
                }
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`py-2.5 px-5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors duration-200`}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddProducts}
                disabled={selectedProducts.length === 0 || submitting}
                className={`py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white
                  ${selectedProducts.length === 0 || submitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-200 transform hover:-translate-y-0.5'}`}
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiPlus className="inline-block h-4 w-4 mr-1.5" />
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