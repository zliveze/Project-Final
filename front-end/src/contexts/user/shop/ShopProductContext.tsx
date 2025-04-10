import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Định nghĩa thêm campaign và event cho sản phẩm
export interface ProductPromotion {
  type: 'event' | 'campaign';
  id: string;  // ID của sự kiện hoặc chiến dịch
  name: string;
  adjustedPrice: number;
  startDate?: Date;
  endDate?: Date;
}

// Define the structure for a lightweight product (adjust based on actual API response)
export interface LightProduct {
  _id: string;
  id: string; // Add id field for consistency
  name: string;
  slug: string;
  sku: string;
  price: number;
  currentPrice: number;
  status: 'active' | 'out_of_stock' | 'discontinued';
  imageUrl: string; // Primary image URL
  brandId?: string;
  brandName?: string;
  categoryIds?: Array<{
    id: string;
    name: string;
  }>;
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  promotion?: ProductPromotion | null;
}

// Define the structure for the API response of /products/light
interface LightProductsApiResponse {
  products: LightProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Define the filters type
export interface ShopProductFilters {
  search?: string;
  brandId?: string;
  categoryId?: string;
  eventId?: string; // ID của sự kiện để lọc sản phẩm
  campaignId?: string; // ID của chiến dịch để lọc sản phẩm 
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string; // Comma-separated
  skinTypes?: string; // Comma-separated
  concerns?: string; // Comma-separated
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  hasGifts?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Define Context type
interface ShopProductContextType {
  products: LightProduct[];
  loading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  filters: ShopProductFilters;
  fetchProducts: (page?: number, limit?: number, newFilters?: ShopProductFilters) => Promise<void>;
  setFilters: (newFilters: Partial<ShopProductFilters>) => void;
  changePage: (newPage: number) => void;
  changeLimit: (newLimit: number) => void;
}

// API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Create context
const ShopProductContext = createContext<ShopProductContextType | undefined>(undefined);

// Hook to use the context
export const useShopProduct = (): ShopProductContextType => {
  const context = useContext(ShopProductContext);
  if (!context) {
    // Provide a default/mock context or throw an error if used outside provider
    // This helps prevent crashes if the context is accessed unexpectedly
    console.warn('useShopProduct called outside of ShopProductProvider. Returning default values.');
    return {
      products: [],
      loading: false,
      error: null,
      totalProducts: 0,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 12, // Default items per page for shop
      filters: {},
      fetchProducts: async () => { console.warn('ShopProductProvider not available.'); },
      setFilters: () => { console.warn('ShopProductProvider not available.'); },
      changePage: () => { console.warn('ShopProductProvider not available.'); },
      changeLimit: () => { console.warn('ShopProductProvider not available.'); },
    };
  }
  return context;
};

// Provider component
export const ShopProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<LightProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12); // Default for shop view
  const [filters, setFiltersState] = useState<ShopProductFilters>({});

  const fetchProducts = useCallback(async (
    page: number = currentPage,
    limit: number = itemsPerPage,
    currentFilters: ShopProductFilters = filters
  ) => {
    // Thêm kiểm tra để tránh gọi API liên tục khi tham số giống với lần gọi trước
    const filterString = JSON.stringify(currentFilters);
    const requestKey = `${page}-${limit}-${filterString}`;
    
    // Biến static để lưu trữ yêu cầu cuối cùng
    if ((fetchProducts as any).lastRequest === requestKey) {
      console.log('Bỏ qua yêu cầu trùng lặp:', requestKey);
      return;
    }
    
    // Lưu yêu cầu hiện tại
    (fetchProducts as any).lastRequest = requestKey;
    
    setLoading(true);
    setError(null);
    console.log(`Fetching products for page ${page}, limit ${limit} with filters:`, currentFilters);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Append filters to params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
           // Ensure boolean values are correctly stringified
           if (typeof value === 'boolean') {
             params.append(key, value.toString());
           } else {
             params.append(key, String(value));
           }
        }
      });

      const response = await axios.get<LightProductsApiResponse>(`${API_URL}/products/light`, { params });

      if (response.data && response.data.products) {
         // Đảm bảo sản phẩm có thông tin chi tiết promotion đầy đủ
         const productsWithId = response.data.products.map(p => {
           // Đảm bảo mỗi sản phẩm có id dựa trên _id
           const product = { ...p, id: p._id };
           
           // Cập nhật thêm thông tin promotion chi tiết hơn nếu có
           if (product.promotion) {
             // Chuyển đổi startDate và endDate thành đối tượng Date nếu có
             if (product.promotion.startDate) {
               product.promotion.startDate = new Date(product.promotion.startDate);
             }
             if (product.promotion.endDate) {
               product.promotion.endDate = new Date(product.promotion.endDate);
             }
           }
           
           return product;
         });
         
         setProducts(productsWithId);
         setTotalProducts(response.data.total);
         setCurrentPage(response.data.page);
         setItemsPerPage(response.data.limit);
         setTotalPages(response.data.totalPages);
         console.log('Products fetched successfully:', response.data);
      } else {
        console.warn('API response format might be incorrect:', response.data);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error fetching shop products:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải sản phẩm.';
      setError(errorMessage);
      toast.error(errorMessage);
      setProducts([]); // Clear products on error
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]); // Dependencies for useCallback

  // Function to update filters and trigger fetch
  const setFilters = useCallback((newFilters: Partial<ShopProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    // Reset page to 1 when filters change
    setCurrentPage(1);
    setFiltersState(updatedFilters);
    // Fetch products with the new filters and reset page
    fetchProducts(1, itemsPerPage, updatedFilters);
  }, [filters, itemsPerPage, fetchProducts]);

  // Function to change page
  const changePage = useCallback((newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchProducts(newPage, itemsPerPage, filters);
    }
  }, [totalPages, itemsPerPage, filters, fetchProducts]);

  // Function to change items per page
  const changeLimit = useCallback((newLimit: number) => {
    setCurrentPage(1); // Reset page when limit changes
    setItemsPerPage(newLimit);
    fetchProducts(1, newLimit, filters);
  }, [filters, fetchProducts]);

  // Initial fetch on component mount
  useEffect(() => {
    console.log("ShopProductProvider mounted. Performing initial fetch.");
    fetchProducts(currentPage, itemsPerPage, filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const contextValue: ShopProductContextType = {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    filters,
    fetchProducts,
    setFilters,
    changePage,
    changeLimit,
  };

  return (
    <ShopProductContext.Provider value={contextValue}>
      {children}
    </ShopProductContext.Provider>
  );
};
