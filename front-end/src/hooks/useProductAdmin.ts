import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

// Define error type to replace 'any'
interface ApiError {
  message?: string;
  [key: string]: unknown;
}

// Định nghĩa interface cho ProductImage (tương tự backend)
export interface ProductImageAdmin {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  publicId?: string;
}

// Định nghĩa interface cho ProductDescription (tương tự backend)
export interface ProductDescriptionAdmin {
  short?: string;
  full?: string;
}

// Định nghĩa interface cho AdminProduct
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string; // Giá đã định dạng chuỗi (ví dụ: "100.000đ")
  originalPrice: number; // Giá gốc dạng số
  currentPrice: number; // Giá hiện tại dạng số
  category?: string; // Tên danh mục đầu tiên (vẫn giữ nếu cần)
  categoryNames?: string[]; // Mảng tên tất cả danh mục
  categoryIds: string[];
  brand: string;
  brandId: string;
  image: string; // URL ảnh chính (vẫn giữ lại nếu UI đang dùng)
  images?: ProductImageAdmin[]; // Mảng tất cả hình ảnh
  description?: ProductDescriptionAdmin; // Thêm mô tả
  barcode?: string; // Thêm mã vạch
  weightValue?: number; // Thêm trọng lượng
  weightUnit?: string; // Thêm đơn vị trọng lượng
  loyaltyPoints?: number; // Thêm điểm tích lũy
  lowStockThreshold?: number; // Thêm tồn kho nhỏ nhất
  stock: number;
  status: string;
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';
// Không cần thêm /api nếu đã có trong BASE_URL
const API_URL = BASE_URL;
const ADMIN_PRODUCTS_API = `${API_URL}/admin/products/list`;

interface UseProductAdminProps {
  initialPage?: number;
  initialLimit?: number;
  initialProducts?: AdminProduct[];
  initialTotalItems?: number;
  initialTotalPages?: number;
}

export interface ProductAdminFilter {
  page: number;
  limit: number;
  search?: string;
  brandId?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  skinTypes?: string;
  concerns?: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  hasGifts?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProductAdminResponse {
  items: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useProductAdmin = ({
  initialPage = 1,
  initialLimit = 10,
  initialProducts,
  initialTotalItems,
  initialTotalPages,
}: UseProductAdminProps = {}) => {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProducts); // Start loading only if no initial data
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductAdminFilter>({
    page: initialPage,
    limit: initialLimit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalItems, setTotalItems] = useState<number>(initialTotalItems || 0);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages || 0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialLimit);
  // Track if initial data was provided via SSR
  const hasInitialData = !!initialProducts;

  // Lấy token xác thực từ localStorage hoặc Cookies
  const getAuthHeader = useCallback((): HeadersInit => {
    // Kiểm tra nếu đã đăng xuất
    if (sessionStorage.getItem('adminLoggedOut') === 'true') {
      console.log('Người dùng đã đăng xuất, không thực hiện yêu cầu API');
      return {
        'Content-Type': 'application/json'
      };
    }

    // Lấy token từ localStorage hoặc từ cookie nếu không có trong localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || Cookies.get('adminToken') : null;
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }, []);

  // Fetch sản phẩm
  const fetchProducts = useCallback(async (newFilters?: Partial<ProductAdminFilter>) => {
    try {
      // Kiểm tra nếu đã đăng xuất
      if (sessionStorage.getItem('adminLoggedOut') === 'true') {
        if (process.env.NODE_ENV === 'development') {
          console.log('Người dùng đã đăng xuất, không thực hiện yêu cầu API');
        }
        return null;
      }

      setLoading(true);
      setError(null);

      // Cập nhật filters nếu có
      const currentFilters = newFilters
        ? { ...filters, ...newFilters }
        : filters;

      // Lưu filters mới nếu có sự thay đổi
      if (newFilters) {
        setFilters(currentFilters);

        // Cập nhật state cho currentPage và itemsPerPage
        if (newFilters.page !== undefined) {
          setCurrentPage(newFilters.page);
        }
        if (newFilters.limit !== undefined) {
          setItemsPerPage(newFilters.limit);
        }
      }

      // Xây dựng query string - cải thiện xử lý các tham số lọc
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== false) {
          if ((key === 'brandId' || key === 'categoryId') && value === '') {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Bỏ qua tham số ${key} vì giá trị rỗng`);
            }
          } else {
            params.append(key, String(value));
          }
        }
      });

      // Log URL params chỉ trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log('Query params:', params.toString());
      }

      // Gọi API
      const response = await fetch(`${ADMIN_PRODUCTS_API}?${params.toString()}`, {
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          Cookies.remove('adminToken');
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/auth/login?error=session_expired';
          }
          return null;
        }
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data: ProductAdminResponse = await response.json();

      // Cập nhật state
      setProducts(data.items);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
      setItemsPerPage(data.limit);

      return data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching products:', error);
      }
      setError(apiError.message || 'Có lỗi xảy ra khi tải dữ liệu sản phẩm');
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters, getAuthHeader]);

  // Thay đổi trang
  const changePage = useCallback((page: number) => {
    fetchProducts({ page });
  }, [fetchProducts]);

  // Thay đổi số lượng sản phẩm trên trang
  const changeLimit = useCallback((limit: number) => {
    fetchProducts({ page: 1, limit });
  }, [fetchProducts]);

  // Tìm kiếm sản phẩm
  const searchProducts = useCallback((search: string) => {
    fetchProducts({ page: 1, search });
  }, [fetchProducts]);

  // Áp dụng filter
  const applyFilters = useCallback((newFilters: Partial<ProductAdminFilter>) => {
    fetchProducts({ page: 1, ...newFilters });
  }, [fetchProducts]);

  // Chọn/Bỏ chọn sản phẩm
  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  // Chọn tất cả sản phẩm trên trang hiện tại
  const selectAllProducts = useCallback(() => {
    const allSelected = products.every(product => selectedProductIds.includes(product.id));

    if (allSelected) {
      // Bỏ chọn tất cả sản phẩm trên trang hiện tại
      setSelectedProductIds(prev =>
        prev.filter(id => !products.some(product => product.id === id))
      );
    } else {
      // Chọn tất cả sản phẩm trên trang hiện tại
      const currentPageIds = products.map(product => product.id);
      const newSelected = [...selectedProductIds];

      currentPageIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });

      setSelectedProductIds(newSelected);
    }
  }, [products, selectedProductIds]);

  // Bỏ chọn tất cả sản phẩm
  const clearSelection = useCallback(() => {
    setSelectedProductIds([]);
  }, []);

  // Xóa nhiều sản phẩm
  const deleteMultipleProducts = useCallback(async (): Promise<boolean> => {
    if (selectedProductIds.length === 0) return false;

    try {
      setLoading(true);

      // Lặp qua từng sản phẩm đã chọn và xóa
      const deletePromises = selectedProductIds.map(id =>
        fetch(`${API_URL}/admin/products/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        })
      );

      const results = await Promise.all(deletePromises);

      // Kiểm tra nếu có bất kỳ lỗi nào
      const hasErrors = results.some(res => !res.ok);

      if (hasErrors) {
        throw new Error('Không thể xóa một số sản phẩm');
      }

      // Fetch lại dữ liệu sau khi xóa
      await fetchProducts();

      // Xóa khỏi danh sách đã chọn
      clearSelection();

      return true;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error deleting products:', error);
      setError(apiError.message || 'Có lỗi xảy ra khi xóa sản phẩm');
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedProductIds, getAuthHeader, fetchProducts, clearSelection]);

  // Cập nhật trạng thái nhiều sản phẩm
  const updateMultipleProductsStatus = useCallback(async (status: string): Promise<boolean> => {
    if (selectedProductIds.length === 0) return false;

    try {
      setLoading(true);

      // Lặp qua từng sản phẩm đã chọn và cập nhật trạng thái
      const updatePromises = selectedProductIds.map(id =>
        fetch(`${API_URL}/admin/products/${id}`, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ status })
        })
      );

      const results = await Promise.all(updatePromises);

      // Kiểm tra nếu có bất kỳ lỗi nào
      const hasErrors = results.some(res => !res.ok);

      if (hasErrors) {
        throw new Error('Không thể cập nhật trạng thái một số sản phẩm');
      }

      // Fetch lại dữ liệu sau khi cập nhật
      await fetchProducts();

      return true;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating products status:', error);
      setError(apiError.message || 'Có lỗi xảy ra khi cập nhật trạng thái sản phẩm');
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedProductIds, getAuthHeader, fetchProducts]);

  // Cập nhật flag nhiều sản phẩm
  const updateMultipleProductsFlag = useCallback(async (flagName: string, value: boolean): Promise<boolean> => {
    if (selectedProductIds.length === 0) return false;

    try {
      setLoading(true);

      // Lặp qua từng sản phẩm đã chọn và cập nhật flag
      const updatePromises = selectedProductIds.map(id =>
        fetch(`${API_URL}/admin/products/${id}/flags`, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ flags: { [flagName]: value } })
        })
      );

      const results = await Promise.all(updatePromises);

      // Kiểm tra nếu có bất kỳ lỗi nào
      const hasErrors = results.some(res => !res.ok);

      if (hasErrors) {
        throw new Error('Không thể cập nhật flag một số sản phẩm');
      }

      // Fetch lại dữ liệu sau khi cập nhật
      await fetchProducts();

      return true;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating products flag:', error);
      setError(apiError.message || 'Có lỗi xảy ra khi cập nhật flag sản phẩm');
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedProductIds, getAuthHeader, fetchProducts]);

  // Phương thức kiểm tra API health
  const checkApiHealth = useCallback(async (): Promise<boolean> => {
    try {
      // Kiểm tra nếu đã đăng xuất hoặc đang ở trang login
      const isLoggedOut = sessionStorage.getItem('adminLoggedOut') === 'true';
      const isLoginPage = window.location.pathname.includes('/admin/auth/login');
      const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');

      if (isLoggedOut || isLoginPage || !adminToken) {
        console.log('Người dùng đã đăng xuất hoặc đang ở trang đăng nhập, không kiểm tra kết nối API');
        return true; // Trả về true để không hiển thị lỗi
      }

      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }, []);

  // Load sản phẩm khi component mount only if no initial data was provided
  useEffect(() => {
    // If initial data was provided via SSR, don't fetch again on mount
    if (hasInitialData) {
      console.log('Dữ liệu ban đầu được cung cấp qua SSR, bỏ qua fetch ban đầu.');
      return;
    }

    // Kiểm tra token trước khi tải dữ liệu
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    const isLoggedOut = sessionStorage.getItem('adminLoggedOut') === 'true';
    const isLoginPage = window.location.pathname.includes('/admin/auth/login');

    if (!adminToken || isLoggedOut || isLoginPage) {
      console.log('Không có token admin hoặc đã đăng xuất/ở trang login, bỏ qua việc tải dữ liệu sản phẩm');
      return;
    }

    console.log('Không có dữ liệu ban đầu, đang tải dữ liệu sản phẩm phía client...');
    fetchProducts();
    // fetchProducts is stable due to useCallback, but adding it ensures correctness if it changes
  }, [fetchProducts, hasInitialData]);

  return {
    products,
    loading,
    error,
    filters,
    totalItems,
    totalPages,
    selectedProductIds,
    currentPage,
    itemsPerPage,
    fetchProducts,
    changePage,
    changeLimit,
    searchProducts,
    applyFilters,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    deleteMultipleProducts,
    updateMultipleProductsStatus,
    updateMultipleProductsFlag,
    checkApiHealth,
    isAllSelected: products.length > 0 && products.every(product => selectedProductIds.includes(product.id)),
    hasSelection: selectedProductIds.length > 0
  };
};
