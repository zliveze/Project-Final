import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiSearch, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useProduct } from '@/contexts/ProductContext';
import { toast } from 'react-hot-toast';

// Định nghĩa interface cho sản phẩm từ API
interface Product {
  _id?: string;
  id?: string;
  name: string;
  image: string;
  price: number | string;
  currentPrice?: number | string;
  brandId?: string;
  brand?: string;
  status?: string;
  sku?: string;
}

// Interface để phù hợp với AdminProduct từ API
interface AdminProductResponse {
  products: Product[];
  total: number;
  totalPages: number;
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
    // toast.info(`Fetching products... Page: ${page}, Search: "${searchTerm}"`); // Removed temporary log
    try {
      setLoading(true);
      setError(null);

      const result = await fetchAdminProductList({
        page: page,
        limit: 12,
        search: searchTerm,
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (result) {
        // Chuyển đổi price từ string sang number nếu cần
        const formattedProducts = result.products.map(product => ({
          ...product,
          _id: product.id,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          currentPrice: typeof product.currentPrice === 'string' ? 
            parseFloat(product.currentPrice) : product.currentPrice
        }));
        
        setProducts(formattedProducts);
        setTotalPages(result.totalPages);
        // toast.success(`Fetched ${formattedProducts.length} products.`); // Removed temporary log
      } else {
        setProducts([]);
        setTotalPages(1);
        // toast.warn('API returned no result for products.'); // Removed temporary log
      }
    } catch (err: any) { // Explicitly type err
      console.error('Error fetching products:', err);
      const errorMessage = err?.response?.data?.message || 'Không thể tải danh sách sản phẩm.'; // Safely access error message
      setError(errorMessage);
      toast.error(`Lỗi tải sản phẩm: ${errorMessage}`); // Keep standard error toast
    } finally {
      setLoading(false);
    }
  }, [fetchAdminProductList, page, searchTerm]);

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
  }, [isOpen, modalVisible, page, searchTerm, fetchProducts, isInitialLoad]);

  // Xử lý tìm kiếm với debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset về trang 1 khi tìm kiếm
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
      const productPrice = typeof product.price === 'string' ? 
        parseFloat(product.price) : (product.price || 0);
      const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);
      
      setSelectedProducts(prev => [...prev, {
        productId: productId,
        adjustedPrice,
        name: product.name,
        image: product.image,
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
          originalPrice = typeof originalProduct.price === 'string' ? 
            parseFloat(originalProduct.price) : (originalProduct.price || 0);
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
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(numPrice);
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
            </div>
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
                  const productPrice = typeof product.price === 'string' ? 
                    parseFloat(product.price) : (product.price || 0);
                  const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);
                  
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
                            {product.image ? (
                              <img
                                src={product.image}
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
                            -{discountPercent}%
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
