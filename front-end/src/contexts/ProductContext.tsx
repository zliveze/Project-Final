import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from './AdminAuthContext';

// Define Product interface based on the backend model
export interface Product {
  _id?: string;
  sku: string;
  name: string;
  slug: string;
  description?: {
    short?: string;
    full?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  price: number;
  currentPrice?: number;
  status?: 'active' | 'out_of_stock' | 'discontinued';
  brandId?: string;
  categoryIds?: string[];
  tags?: string[];
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
  variants?: Array<{
    variantId?: string;
    sku: string;
    options?: {
      color?: string;
      shade?: string;
      size?: string;
    };
    price?: number;
    images?: Array<{
      url: string;
      alt?: string;
      publicId?: string;
      isPrimary?: boolean;
    }>;
  }>;
  images?: Array<{
    url: string;
    alt?: string;
    publicId?: string;
    isPrimary?: boolean;
    file?: File;       // For file uploads
    preview?: string;  // For image previews
    id?: string;       // Temporary ID for new images
  }>;
  inventory?: Array<{
    branchId: string;
    quantity: number;
    lowStockThreshold?: number;
  }>;
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  gifts?: Array<{
    giftId?: string;
    name: string;
    description?: string;
    image?: {
      url: string;
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
  }>;
  relatedProducts?: string[];
  relatedEvents?: string[];
  relatedCampaigns?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Define ProductContext type
interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  apiHealthStatus: 'online' | 'offline' | 'checking';
  checkApiHealth: () => Promise<boolean>;
  statistics: {
    total: number;
    active: number;
    outOfStock: number;
    discontinued: number;
    withVariants: number;
    withGifts: number;
    bestSellers: number;
    newProducts: number;
    onSale: number;
  } | null;
  // Image upload method
  uploadProductImage: (
    file: File,
    productId: string,
    isPrimary?: boolean
  ) => Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
  // CRUD methods
  fetchProducts: (
    page?: number,
    limit?: number,
    search?: string,
    brandId?: string,
    categoryId?: string,
    status?: string,
    minPrice?: number,
    maxPrice?: number,
    tags?: string,
    skinTypes?: string,
    concerns?: string,
    isBestSeller?: boolean,
    isNew?: boolean,
    isOnSale?: boolean,
    hasGifts?: boolean,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product>;
  fetchProductBySlug: (slug: string) => Promise<Product>;
  createProduct: (productData: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  updateInventory: (id: string, branchId: string, quantity: number) => Promise<Product>;
  updateProductFlags: (id: string, flags: any) => Promise<Product>;
  addVariant: (id: string, variantData: any) => Promise<Product>;
  updateVariant: (id: string, variantId: string, variantData: any) => Promise<Product>;
  removeVariant: (id: string, variantId: string) => Promise<Product>;
  fetchStatistics: () => Promise<void>;
}

// Create context
const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Hook to use the context
export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

// API configuration
// Check if API_URL already includes '/api' to avoid duplication
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

const PRODUCT_API = {
  ADMIN: `${API_URL}/admin/products`,
  PUBLIC: `${API_URL}/products`
};

// Log the API URLs for debugging
console.log('Product API URLs:', PRODUCT_API);

// Provider component
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { accessToken: _ } = useAdminAuth(); // Using accessToken in getAuthHeader
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [statistics, setStatistics] = useState<ProductContextType['statistics']>(null);
  const [apiHealthStatus, setApiHealthStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Last fetch timestamp to prevent duplicate calls
  const lastFetchTimestampRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestParamsRef = useRef<string>(''); // Lưu trữ tham số request cuối cùng
  const isFetchingRef = useRef<boolean>(false); // Trạng thái đang fetch

  // Get auth header
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }, []);

  // Kiểm tra sức khỏe API
  const checkApiHealth = useCallback(async () => {
    try {
      setApiHealthStatus('checking');
      // Sử dụng timeout để tránh chờ quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout

      const response = await fetch(`${API_URL}/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('API đang hoạt động bình thường');
        setApiHealthStatus('online');
        setError(null);
        return true;
      } else {
        console.error('API không phản hồi đúng cách:', response.status);
        setApiHealthStatus('offline');
        setError('API không phản hồi đúng cách. Vui lòng kiểm tra trạng thái server.');
        return false;
      }
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra sức khỏe API:', error);
      setApiHealthStatus('offline');
      if (error.name === 'AbortError') {
        setError('Kết nối API quá hạn, vui lòng kiểm tra lại server hoặc mạng của bạn.');
      } else {
        setError('Không thể kết nối đến API. Vui lòng đảm bảo server backend đang chạy.');
      }
      return false;
    }
  }, [API_URL]);

  // Kiểm tra sức khỏe API khi component được mount
  useEffect(() => {
    checkApiHealth();
  }, [checkApiHealth]);

  // Error handling
  const handleError = useCallback((error: any) => {
    console.error('Product operation error:', error);
    const errorMessage = error.message || 'Đã xảy ra lỗi';
    setError(errorMessage);

    // Redirect to login page if authentication error
    if (error.status === 401) {
      router.push('/admin/login');
    }

    return errorMessage;
  }, [router]);

  // Upload product image
  const uploadProductImage = useCallback(async (
    file: File,
    productId: string,
    isPrimary: boolean = false
  ) => {
    try {
      setLoading(true);

      console.log(`Đang tải lên ảnh cho sản phẩm ${productId}...`);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('isPrimary', isPrimary.toString());

      const response = await fetch(`${PRODUCT_API.ADMIN}/${productId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader().Authorization
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi tải ảnh:', errorData);
        throw new Error(errorData.message || `Lỗi khi tải lên ảnh: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Tải ảnh thành công, URL: ${data.url ? data.url.substring(0, 50) + '...' : 'không có'}`);
      return data;
    } catch (error: any) {
      console.error('Chi tiết lỗi tải ảnh:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch products with filtering and pagination
  const fetchProducts = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    brandId: string = '',
    categoryId: string = '',
    status: string = '',
    minPrice?: number,
    maxPrice?: number,
    tags: string = '',
    skinTypes: string = '',
    concerns: string = '',
    isBestSeller?: boolean,
    isNew?: boolean,
    isOnSale?: boolean,
    hasGifts?: boolean,
    sortBy: string = '',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    // Xây dựng query params để so sánh với request cuối cùng
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search);
    if (brandId) queryParams.append('brandId', brandId);
    if (categoryId) queryParams.append('categoryId', categoryId);
    if (status) queryParams.append('status', status);
    if (minPrice !== undefined) queryParams.append('minPrice', minPrice.toString());
    if (maxPrice !== undefined) queryParams.append('maxPrice', maxPrice.toString());
    if (tags) queryParams.append('tags', tags);
    if (skinTypes) queryParams.append('skinTypes', skinTypes);
    if (concerns) queryParams.append('concerns', concerns);
    if (isBestSeller !== undefined) queryParams.append('isBestSeller', isBestSeller.toString());
    if (isNew !== undefined) queryParams.append('isNew', isNew.toString());
    if (isOnSale !== undefined) queryParams.append('isOnSale', isOnSale.toString());
    if (hasGifts !== undefined) queryParams.append('hasGifts', hasGifts.toString());
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);

    const currentQueryString = queryParams.toString();
    const url = `${PRODUCT_API.ADMIN}?${currentQueryString}`;

    // Implement debounce to prevent frequent API calls
    const currentTime = Date.now();
    const debounceTime = 2000; // Tăng thời gian debounce lên 2 giây

    // Kiểm tra kỹ hơn để tránh gọi API trùng lặp
    if (isFetchingRef.current) {
      console.log('Bỏ qua fetchProducts - Đang trong quá trình fetch');
      return Promise.resolve();
    }

    // Nếu request giống hệt request trước đó và chưa quá thời gian debounce lớn hơn
    if (currentQueryString === lastRequestParamsRef.current && 
       currentTime - lastFetchTimestampRef.current < debounceTime * 3) {
      console.log('Bỏ qua fetchProducts - Request trùng lặp trong thời gian debounce');
      return Promise.resolve();
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Return a promise that will be resolved when the API call is made
    return new Promise<void>((resolve, reject) => {
      fetchTimeoutRef.current = setTimeout(async () => {
        // Đánh dấu đang bắt đầu fetch để hiển thị loading
        setLoading(true);
        
        // Double-check if we've made this exact request recently
        if (currentQueryString === lastRequestParamsRef.current && 
            currentTime - lastFetchTimestampRef.current < debounceTime * 3) {
          console.log('Bỏ qua fetchProducts do trùng lặp sau khi timeout');
          setLoading(false); // Đảm bảo tắt loading khi bỏ qua request
          resolve();
          return;
        }

        // Đặt flag đang fetch và lưu thông tin request
        isFetchingRef.current = true;
        lastRequestParamsRef.current = currentQueryString;
        lastFetchTimestampRef.current = Date.now(); // Cập nhật lại timestamp hiện tại
        
        try {
          // Kiểm tra sức khỏe API trước khi lấy dữ liệu nếu đang trong trạng thái offline
          if (apiHealthStatus === 'offline') {
            const isApiHealthy = await checkApiHealth();
            if (!isApiHealthy) {
              setLoading(false); // Đảm bảo tắt loading
              throw new Error('API đang offline. Vui lòng khởi động lại server backend.');
            }
          }

          setError(null);

          console.log('Đang lấy danh sách sản phẩm từ URL:', url);
          
          // Kiểm tra kết nối API trước khi thực hiện fetch
          try {
            // Thiết lập timeout để tránh chờ đợi quá lâu
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
            
            const response = await fetch(url, {
              headers: getAuthHeader(),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
              let errorMessage = `Lỗi khi lấy danh sách sản phẩm: ${response.status}`;
              try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
              } catch (parseError) {
                console.error('Lỗi phân tích JSON response:', parseError);
              }
              throw new Error(errorMessage);
            }

            const data = await response.json();
            
            setProducts(data.items || []);
            setTotalProducts(data.total || 0);
            setCurrentPage(data.page || 1);
            setTotalPages(data.totalPages || 1);
            setItemsPerPage(data.limit || limit);
            setError(null);
            resolve();
          } catch (fetchError: any) {
            if (fetchError.name === 'AbortError') {
              throw new Error('Kết nối API quá hạn, vui lòng kiểm tra lại server hoặc mạng của bạn');
            } else if (fetchError.message.includes('Failed to fetch')) {
              throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra xem server API đã được khởi động chưa.');
            } else {
              throw fetchError;
            }
          }
        } catch (error: any) {
          console.error('Lỗi trong fetchProducts:', error);
          handleError(error);
          
          // Đặt giá trị mặc định để tránh crash UI
          setProducts([]);
          setTotalProducts(0);
          setCurrentPage(1);
          setTotalPages(1);
          reject(error);
        } finally {
          setLoading(false);
          // Reset trạng thái fetch sau một khoảng thời gian
          setTimeout(() => {
            isFetchingRef.current = false;
          }, 1000); // Tăng khoảng thời gian trước khi reset trạng thái
        }
      }, debounceTime);
    });
  }, [getAuthHeader, handleError, checkApiHealth, apiHealthStatus]);

  // Fetch featured products for public pages
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);

      console.log('Đang lấy sản phẩm nổi bật cho trang public');
      
      const response = await fetch(`${PRODUCT_API.PUBLIC}?isBestSeller=true&limit=8`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi khi lấy sản phẩm nổi bật:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Lỗi khi lấy sản phẩm nổi bật: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Lỗi khi lấy sản phẩm nổi bật: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log(`Đã lấy ${data.items ? data.items.length : 0} sản phẩm nổi bật thành công`);

      setProducts(data.items || data);
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy sản phẩm nổi bật:', error);
      setError(error.message || 'Lỗi khi lấy sản phẩm nổi bật');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch product by ID
  const fetchProductById = useCallback(async (id: string): Promise<Product> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}`, {
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi lấy thông tin sản phẩm: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch product by slug
  const fetchProductBySlug = useCallback(async (slug: string): Promise<Product> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${PRODUCT_API.PUBLIC}/slug/${slug}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi lấy thông tin sản phẩm theo slug: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Create product
  const createProduct = useCallback(async (productData: Partial<Product>): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang tạo sản phẩm mới:', {
        name: productData.name,
        sku: productData.sku,
        price: productData.price
      });
      
      // Chuẩn bị dữ liệu sản phẩm trước khi gửi đi
      const processedData = {...productData};
      
      // Chuyển đổi brandId từ string thành ObjectId
      if (processedData.brandId && typeof processedData.brandId === 'string') {
        // Kiểm tra nếu brandId không phải định dạng ObjectId hợp lệ thì bỏ qua
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(processedData.brandId);
        if (!isValidObjectId) {
          delete processedData.brandId;
        }
      }
      
      const response = await fetch(PRODUCT_API.ADMIN, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(processedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi tạo sản phẩm: ${response.status}`);
      }

      const data = await response.json();
      console.log('Tạo sản phẩm thành công:', data._id);

      // Update product list if on page 1
      if (currentPage === 1) {
        fetchProducts(1, itemsPerPage);
      }

      return data;
    } catch (error: any) {
      console.error('Chi tiết lỗi tạo sản phẩm:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchProducts, currentPage, itemsPerPage]);

  // Update product
  const updateProduct = useCallback(async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang cập nhật sản phẩm:', id);
      
      // Chuẩn bị dữ liệu sản phẩm trước khi gửi đi
      const processedData = {...productData};
      
      // Chuyển đổi brandId từ string thành ObjectId
      if (processedData.brandId && typeof processedData.brandId === 'string') {
        // Kiểm tra nếu brandId không phải định dạng ObjectId hợp lệ thì bỏ qua
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(processedData.brandId);
        if (!isValidObjectId) {
          delete processedData.brandId;
        }
      }
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(processedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi cập nhật sản phẩm: ${response.status}`);
      }

      const data = await response.json();

      // Update product in list
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === id ? data : product
        )
      );

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Delete product
  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);

      console.log('Đang xóa sản phẩm:', id);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi xóa sản phẩm: ${response.status}`);
      }

      // Update product list
      setProducts(prevProducts =>
        prevProducts.filter(product => product._id !== id)
      );

      // Update total count
      setTotalProducts(prev => prev - 1);

      // Refresh list if current page is empty
      if (products.length === 1 && currentPage > 1) {
        fetchProducts(currentPage - 1, itemsPerPage);
      } else {
        fetchProducts(currentPage, itemsPerPage);
      }
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchProducts, products.length, currentPage, itemsPerPage]);

  // Update inventory
  const updateInventory = useCallback(async (id: string, branchId: string, quantity: number): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang cập nhật hàng tồn kho cho sản phẩm:', id, 'chi nhánh:', branchId, 'số lượng:', quantity);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}/inventory/${branchId}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi cập nhật tồn kho: ${response.status}`);
      }

      const data = await response.json();

      // Update product in list
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === id ? data : product
        )
      );

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Update product flags
  const updateProductFlags = useCallback(async (id: string, flags: any): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang cập nhật cờ cho sản phẩm:', id, flags);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}/flags`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(flags)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi cập nhật cờ: ${response.status}`);
      }

      const data = await response.json();

      // Update product in list
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === id ? data : product
        )
      );

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Add variant
  const addVariant = useCallback(async (id: string, variantData: any): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang thêm biến thể cho sản phẩm:', id, variantData);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}/variants`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi thêm biến thể: ${response.status}`);
      }

      const data = await response.json();

      // Update product in list
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === id ? data : product
        )
      );

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Update variant
  const updateVariant = useCallback(async (id: string, variantId: string, variantData: any): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang cập nhật biến thể:', id, variantId, variantData);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi cập nhật biến thể: ${response.status}`);
      }

      const data = await response.json();

      // Update product in list
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === id ? data : product
        )
      );

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Remove variant
  const removeVariant = useCallback(async (id: string, variantId: string): Promise<Product> => {
    try {
      setLoading(true);

      console.log('Đang xóa biến thể:', id, variantId);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/${id}/variants/${variantId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi xóa biến thể: ${response.status}`);
      }

      const data = await response.json();

      // Update product in list
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === id ? data : product
        )
      );

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch product statistics
  const fetchStatistics = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${PRODUCT_API.ADMIN}/statistics`, {
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi lấy thống kê: ${response.status}`);
      }

      const data = await response.json();
      setStatistics(data);
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Context value
  const value: ProductContextType = {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    apiHealthStatus,
    checkApiHealth,
    statistics,
    // Image upload method
    uploadProductImage,
    // CRUD methods
    fetchProducts,
    fetchFeaturedProducts,
    fetchProductById,
    fetchProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    updateInventory,
    updateProductFlags,
    addVariant,
    updateVariant,
    removeVariant,
    fetchStatistics
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;

