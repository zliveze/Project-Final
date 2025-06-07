import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import axios from 'axios'; // Import axios for type checking
import { AxiosError } from 'axios'; // Import AxiosError for type checking
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'react-toastify';
import { useAuth } from '../../AuthContext';

// Định nghĩa thêm campaign và event cho sản phẩm
export interface ProductPromotion {
  type: 'event' | 'campaign';
  id: string;  // ID của sự kiện hoặc chiến dịch
  name: string;
  adjustedPrice: number;
  startDate?: Date;
  endDate?: Date;
}

// Thêm interface Campaign mới
export interface UserCampaign {
  _id: string;
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  products: Array<{
    productId: string;
    productName?: string;
    originalPrice?: number;
    adjustedPrice: number;
    image?: string;
  }>;
}

// Interface for the API response of a campaign, assuming dates are strings
interface CampaignApiResponse extends Omit<UserCampaign, 'startDate' | 'endDate'> {
  startDate: string;
  endDate: string;
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
  soldCount?: number; // Số lượng sản phẩm đã bán
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
  selectedCampaign: UserCampaign | null;
  fetchProducts: (page?: number, limit?: number, newFilters?: ShopProductFilters, forceRefresh?: boolean) => Promise<void>;
  setFilters: (newFilters: Partial<ShopProductFilters>, skipFetch?: boolean) => void;
  changePage: (newPage: number) => void;
  changeLimit: (newLimit: number) => void;
  fetchCampaign: (campaignId: string) => Promise<void>;
  fetchSkinTypeOptions: () => Promise<string[]>; // Updated return type
  fetchConcernOptions: () => Promise<string[]>; // Updated return type
  skinTypeOptions: string[]; // Updated type
  concernOptions: string[]; // Updated type
  addToWishlist?: (productId: string) => Promise<boolean>;
  addToCart?: (productId: string, quantity: number, variantId?: string) => Promise<boolean>;
  logSearch: (searchQuery: string) => Promise<void>;
  logProductView: (productId: string, timeSpent?: number) => Promise<void>;
  logProductClick: (productId: string) => Promise<void>;
  logFilterUse: (filters: {
    price?: { min?: number; max?: number };
    categoryIds?: string[];
    brandIds?: string[];
    tags?: string[];
    skinType?: string[];
    concerns?: string[];
  }) => Promise<void>;
  fetchTopProducts: (period?: 'all-time' | '30-days', limit?: number) => Promise<LightProduct[]>;
}

// API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app';
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
      itemsPerPage: 24, // Default items per page for shop
      filters: {},
      selectedCampaign: null,
      fetchProducts: async () => { console.warn('ShopProductProvider not available.'); },
      setFilters: () => { console.warn('ShopProductProvider not available.'); },
      changePage: () => { console.warn('ShopProductProvider not available.'); },
      changeLimit: () => { console.warn('ShopProductProvider not available.'); },
      fetchCampaign: async () => { console.warn('ShopProductProvider not available.'); },
      fetchSkinTypeOptions: async () => { console.warn('ShopProductProvider not available.'); return []; }, // Keep return type consistent
      fetchConcernOptions: async () => { console.warn('ShopProductProvider not available.'); return []; }, // Keep return type consistent
      skinTypeOptions: [], // Updated type
      concernOptions: [], // Updated type
      addToWishlist: async () => { console.warn('ShopProductProvider not available.'); return false; },
      addToCart: async () => { console.warn('ShopProductProvider not available.'); return false; },
      logSearch: async () => { console.warn('ShopProductProvider not available.'); },
      logProductView: async () => { console.warn('ShopProductProvider not available.'); },
      logProductClick: async () => { console.warn('ShopProductProvider not available.'); },
      logFilterUse: async () => { console.warn('ShopProductProvider not available.'); },
      fetchTopProducts: async () => { console.warn('ShopProductProvider not available.'); return []; }
    };
  }
  return context;
};

// Tối ưu cache với Map thay vì object để có hiệu suất tốt hơn
const resultsCache = new Map<string, { timestamp: number, data: LightProductsApiResponse }>();
const CACHE_TTL = 300000; // 5 phút cache

// Sử dụng singleton pattern cho options cache
class OptionsCache {
  private static instance: OptionsCache;
  private skinTypesCache: { data: string[] | null; timestamp: number } = { data: null, timestamp: 0 };
  private concernsCache: { data: string[] | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly OPTIONS_CACHE_TTL = 600000; // 10 phút cho options

  static getInstance(): OptionsCache {
    if (!OptionsCache.instance) {
      OptionsCache.instance = new OptionsCache();
    }
    return OptionsCache.instance;
  }

  getSkinTypes(): string[] | null {
    if (this.skinTypesCache.data && (Date.now() - this.skinTypesCache.timestamp < this.OPTIONS_CACHE_TTL)) {
      return this.skinTypesCache.data;
    }
    return null;
  }

  setCachedSkinTypes(data: string[]): void {
    this.skinTypesCache = { data, timestamp: Date.now() };
  }

  getConcerns(): string[] | null {
    if (this.concernsCache.data && (Date.now() - this.concernsCache.timestamp < this.OPTIONS_CACHE_TTL)) {
      return this.concernsCache.data;
    }
    return null;
  }

  setCachedConcerns(data: string[]): void {
    this.concernsCache = { data, timestamp: Date.now() };
  }
}

const optionsCache = OptionsCache.getInstance();

// Provider component
export const ShopProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<LightProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);
  const [filters, setFiltersState] = useState<ShopProductFilters>({});
  const [selectedCampaign, setSelectedCampaign] = useState<UserCampaign | null>(null);
  const [skinTypeOptions, setSkinTypeOptions] = useState<string[]>([]);
  const [concernOptions, setConcernOptions] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();

  // Sử dụng useRef để tránh re-create function trong mỗi render
  const lastRequestKeyRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const setFiltersDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // Tối ưu hàm tạo request key
  const createRequestKey = useCallback((page: number, limit: number, currentFilters: ShopProductFilters): string => {
    const sortedFilters = Object.keys(currentFilters)
      .sort()
      .reduce((result, key) => {
        const value = currentFilters[key as keyof ShopProductFilters];
        if (value !== undefined && value !== null && value !== '') {
          result[key] = value;
        }
        return result;
      }, {} as Record<string, unknown>);

    return `${page}-${limit}-${JSON.stringify(sortedFilters)}`;
  }, []);

  // Tối ưu fetchProducts với better caching và debouncing
  const fetchProducts = useCallback(async (
    page: number = currentPage,
    limit: number = itemsPerPage,
    currentFilters: ShopProductFilters = filters,
    forceRefresh: boolean = false
  ) => {
    const requestKey = createRequestKey(page, limit, currentFilters);

    // Kiểm tra duplicate request
    if (!forceRefresh && requestKey === lastRequestKeyRef.current) {
      console.log('Bỏ qua request trùng lặp:', requestKey);
      return;
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Kiểm tra cache trước khi set loading
    const cachedResult = resultsCache.get(requestKey);
    if (!forceRefresh && cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
      console.log('Sử dụng cache:', requestKey);
      lastRequestKeyRef.current = requestKey;

      const productsWithId = cachedResult.data.products.map(p => ({
        ...p,
        id: p._id,
        promotion: p.promotion ? {
          ...p.promotion,
          startDate: p.promotion.startDate ? new Date(p.promotion.startDate) : undefined,
          endDate: p.promotion.endDate ? new Date(p.promotion.endDate) : undefined,
        } : null
      }));

      setProducts(productsWithId);
      setTotalProducts(cachedResult.data.total);
      setCurrentPage(cachedResult.data.page);
      setItemsPerPage(cachedResult.data.limit);
      setTotalPages(cachedResult.data.totalPages);
      return;
    }

    lastRequestKeyRef.current = requestKey;

    // Debounce với thời gian tối ưu
    const debounceTime = currentFilters.search ? 300 : 100;

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        // Tối ưu việc build params
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
            if ((key === 'brandId' || key === 'categoryId') && typeof value === 'string') {
              // Handle multiple IDs (comma-separated)
              const ids = value.split(',').filter(id => id.trim());
              const validIds = ids.filter(id => /^[0-9a-fA-F]{24}$/.test(id));

              if (validIds.length > 0) {
                // Send as comma-separated string for backend to handle
                params.append(key, validIds.join(','));
              }
            } else {
              params.append(key, String(value));
            }
          }
        });

        const response = await axiosInstance.get<LightProductsApiResponse>('/products/light', { params });

        if (response.data?.products) {
          // Cache kết quả (chỉ cache khi không search để tránh cache quá nhiều)
          if (!currentFilters.search) {
            resultsCache.set(requestKey, {
              timestamp: Date.now(),
              data: response.data
            });

            // Giới hạn cache size để tránh memory leak
            if (resultsCache.size > 50) {
              const firstEntry = resultsCache.entries().next().value;
              if (firstEntry) {
                resultsCache.delete(firstEntry[0]);
              }
            }
          }

          const productsWithId = response.data.products.map(p => ({
            ...p,
            id: p._id,
            promotion: p.promotion ? {
              ...p.promotion,
              startDate: p.promotion.startDate ? new Date(p.promotion.startDate) : undefined,
              endDate: p.promotion.endDate ? new Date(p.promotion.endDate) : undefined,
            } : null
          }));

          setProducts(productsWithId);
          setTotalProducts(response.data.total);
          setCurrentPage(response.data.page);
          setItemsPerPage(response.data.limit);
          setTotalPages(response.data.totalPages);
        } else {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    }, debounceTime);
  }, [currentPage, itemsPerPage, filters, createRequestKey]);

  // Tối ưu setFilters với better change detection
  const setFilters = useCallback((newFilters: Partial<ShopProductFilters>, skipFetch: boolean = false) => {
    const normalizedNewFilters = { ...newFilters };
    if ('search' in newFilters && newFilters.search === '') {
      normalizedNewFilters.search = undefined;
    }

    // Sử dụng JSON.stringify để so sánh deep equality
    const currentFiltersString = JSON.stringify(filters);
    const updatedFilters = { ...filters, ...normalizedNewFilters };
    const updatedFiltersString = JSON.stringify(updatedFilters);

    if (currentFiltersString === updatedFiltersString) {
      return; // Không có thay đổi
    }

    setCurrentPage(1);
    setFiltersState(updatedFilters);

    if (!skipFetch) {
      if (setFiltersDebounceTimerRef.current) {
        clearTimeout(setFiltersDebounceTimerRef.current);
      }

      const searchChanged = 'search' in normalizedNewFilters;
      const debounceTime = searchChanged ? 300 : 150;

      setFiltersDebounceTimerRef.current = setTimeout(() => {
        fetchProducts(1, itemsPerPage, updatedFilters, searchChanged);
      }, debounceTime);
    }
  }, [filters, itemsPerPage, fetchProducts]);

  // Function to change page
  const changePage = useCallback((newPage: number) => {
    if (newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchProducts(newPage, itemsPerPage, filters);
    }
  }, [totalPages, currentPage, itemsPerPage, filters, fetchProducts]);

  // Function to change items per page
  const changeLimit = useCallback((newLimit: number) => {
    if (newLimit !== itemsPerPage) {
      setCurrentPage(1);
      setItemsPerPage(newLimit);
      fetchProducts(1, newLimit, filters);
    }
  }, [itemsPerPage, filters, fetchProducts]);

  // Tối ưu fetchSkinTypeOptions với better caching
  const fetchSkinTypeOptions = useCallback(async (): Promise<string[]> => {
    try {
      const cachedOptions = optionsCache.getSkinTypes();
      if (cachedOptions) {
        setSkinTypeOptions(cachedOptions);
        return cachedOptions;
      }

      // Kiểm tra localStorage
      const localCached = localStorage.getItem('skinTypeOptions');
      if (localCached) {
        try {
          const parsedOptions = JSON.parse(localCached);
          if (Array.isArray(parsedOptions) && parsedOptions.every(item => typeof item === 'string')) {
            setSkinTypeOptions(parsedOptions);
            optionsCache.setCachedSkinTypes(parsedOptions);
            return parsedOptions;
          }
          localStorage.removeItem('skinTypeOptions');
        } catch {
          localStorage.removeItem('skinTypeOptions');
        }
      }

      const response = await axiosInstance.get<{ skinTypes: string[] }>('/products/filters/skin-types');
      if (response.data?.skinTypes && Array.isArray(response.data.skinTypes)) {
        const apiSkinTypes = response.data.skinTypes;
        localStorage.setItem('skinTypeOptions', JSON.stringify(apiSkinTypes));
        setSkinTypeOptions(apiSkinTypes);
        optionsCache.setCachedSkinTypes(apiSkinTypes);
        return apiSkinTypes;
      }

      setSkinTypeOptions([]);
      return [];
    } catch (err) {
      console.error('Error fetching skin types:', err);
      setSkinTypeOptions([]);
      return [];
    }
  }, []);

  // Tối ưu fetchConcernOptions tương tự
  const fetchConcernOptions = useCallback(async (): Promise<string[]> => {
    try {
      const cachedOptions = optionsCache.getConcerns();
      if (cachedOptions) {
        setConcernOptions(cachedOptions);
        return cachedOptions;
      }

      const localCached = localStorage.getItem('concernOptions');
      if (localCached) {
        try {
          const parsedOptions = JSON.parse(localCached);
          if (Array.isArray(parsedOptions) && parsedOptions.every(item => typeof item === 'string')) {
            setConcernOptions(parsedOptions);
            optionsCache.setCachedConcerns(parsedOptions);
            return parsedOptions;
          }
          localStorage.removeItem('concernOptions');
        } catch {
          localStorage.removeItem('concernOptions');
        }
      }

      const response = await axiosInstance.get<{ concerns: string[] }>('/products/filters/concerns');
      if (response.data?.concerns && Array.isArray(response.data.concerns)) {
        const apiConcerns = response.data.concerns;
        localStorage.setItem('concernOptions', JSON.stringify(apiConcerns));
        setConcernOptions(apiConcerns);
        optionsCache.setCachedConcerns(apiConcerns);
        return apiConcerns;
      }

      setConcernOptions([]);
      return [];
    } catch (err) {
      console.error('Error fetching concerns:', err);
      setConcernOptions([]);
      return [];
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      console.log("ShopProductProvider mounted. Performing initial fetch.");

      // Load options song song
      Promise.all([
        fetchSkinTypeOptions(),
        fetchConcernOptions()
      ]).then(() => {
        console.log('Options loaded successfully');
      });

      // Initial products fetch
      fetchProducts(currentPage, itemsPerPage, filters);
    }
  }, [currentPage, filters, itemsPerPage, fetchProducts, fetchSkinTypeOptions, fetchConcernOptions]);

  // Thêm hàm fetchCampaign để lấy thông tin chiến dịch
  const fetchCampaign = useCallback(async (campaignId: string) => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      const campaignUrl = `${API_URL}/campaigns/public/${campaignId}`;
      console.log(`Đang lấy thông tin chiến dịch với URL: ${campaignUrl}`);

      // Thêm logging để debug
      console.log(`API_URL được sử dụng: ${API_URL}`);
      console.log(`BASE_URL từ env: ${process.env.NEXT_PUBLIC_API_URL || 'Không có'}`);

      const response = await axiosInstance.get<CampaignApiResponse>(`/campaigns/public/${campaignId}`);
      console.log('Status response chiến dịch:', response.status, response.statusText);
      console.log('Kết quả lấy thông tin chiến dịch:', response.data);

      if (response.data) {
        const campaignData: UserCampaign = {
          ...response.data,
          startDate: new Date(response.data.startDate),
          endDate: new Date(response.data.endDate)
        };

        setSelectedCampaign(campaignData);
        console.log('Đã cập nhật selectedCampaign:', campaignData);
      } else {
        console.warn('Không nhận được dữ liệu chiến dịch hợp lệ từ API');
        // Optionally, set an error or clear selectedCampaign
        // setSelectedCampaign(null); 
        // setError('Không nhận được dữ liệu chiến dịch.');
      }
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi khi tải thông tin chiến dịch.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        console.error('Lỗi Axios khi lấy thông tin chiến dịch:', axiosError.response?.data || axiosError.message, axiosError.toJSON());
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      } else if (err instanceof Error) {
        console.error('Lỗi chung khi lấy thông tin chiến dịch:', err.message);
        errorMessage = err.message;
      } else {
        console.error('Lỗi không xác định khi lấy thông tin chiến dịch:', err);
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ghi lại hoạt động tìm kiếm
  const logSearch = useCallback(async (searchQuery: string) => {
    if (!isAuthenticated) return;

    try {
      // Sử dụng endpoint POST để log search
      await axiosInstance.post('/recommendations/log/search', {
        searchQuery: searchQuery
      });
    } catch (error) {
      console.error('Error logging search activity:', error);
    }
  }, [isAuthenticated]);

  // Thêm vào giỏ hàng và đồng thời ghi lại hoạt động
  const addToCart = useCallback(async (productId: string, quantity: number = 1, variantId?: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return false;
    }

    try {
      // Gọi API thêm vào giỏ hàng
      const response = await axiosInstance.post('/cart/items', {
        productId,
        quantity,
        variantId
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Đã thêm sản phẩm vào giỏ hàng', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light"
        });

        // Ghi lại hoạt động thêm vào giỏ hàng
        try {
          await axiosInstance.post(`/recommendations/log/add-to-cart/${productId}`, {
            variantId
          });
        } catch (error) {
          console.error('Error logging add to cart activity:', error);
        }

        return true;
      } else {
        toast.error('Không thể thêm sản phẩm vào giỏ hàng', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light"
        });
        return false;
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      console.error('Error adding product to cart:', error);
      return false;
    }
  }, [isAuthenticated]);

  // Thêm vào danh sách yêu thích và đồng thời ghi lại hoạt động
  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return false;
    }

    try {
      // Gọi API thêm vào wishlist
      const response = await axiosInstance.post('/wishlist/items', {
        productId
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light"
        });

        // Ghi lại hoạt động thêm vào wishlist (không có endpoint riêng, có thể bỏ qua hoặc dùng click)
        try {
          await axiosInstance.post(`/recommendations/log/click/${productId}`, {});
        } catch (error) {
          console.error('Error logging wishlist activity:', error);
        }

        return true;
      } else {
        toast.error('Không thể thêm sản phẩm vào danh sách yêu thích', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light"
        });
        return false;
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Không thể thêm sản phẩm vào danh sách yêu thích';
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      console.error('Error adding product to wishlist:', error);
      return false;
    }
  }, [isAuthenticated]);

  // Ghi lại hoạt động xem sản phẩm
  const logProductView = useCallback(async (productId: string, timeSpent?: number) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.post(`/recommendations/log/view/${productId}`, {
        timeSpent
      });
    } catch (error) {
      console.error('Error logging product view activity:', error);
    }
  }, [isAuthenticated]);

  // Ghi lại hoạt động click vào sản phẩm
  const logProductClick = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.post(`/recommendations/log/click/${productId}`, {});
    } catch (error) {
      console.error('Error logging product click activity:', error);
    }
  }, [isAuthenticated]);

  // Ghi lại hoạt động sử dụng bộ lọc
  const logFilterUse = useCallback(async (filters: {
    price?: { min?: number; max?: number };
    categoryIds?: string[];
    brandIds?: string[];
    tags?: string[];
    skinType?: string[];
    concerns?: string[];
  }) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.post('/recommendations/log/filter', filters);
    } catch (error) {
      console.error('Error logging filter use activity:', error);
    }
  }, [isAuthenticated]);

  // Lấy top sản phẩm bán chạy
  const fetchTopProducts = useCallback(async (
    period: 'all-time' | '30-days' = 'all-time',
    limit: number = 20
  ): Promise<LightProduct[]> => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('limit', limit.toString());

      const response = await axiosInstance.get<LightProductsApiResponse>('/products/top-sellers', { params });

      if (response.data?.products) {
        const productsWithId = response.data.products.map(p => ({
          ...p,
          id: p._id,
          promotion: p.promotion ? {
            ...p.promotion,
            startDate: p.promotion.startDate ? new Date(p.promotion.startDate) : undefined,
            endDate: p.promotion.endDate ? new Date(p.promotion.endDate) : undefined,
          } : null
        }));

        return productsWithId;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Error fetching top products:', err);
      return [];
    }
  }, []);

  // Memoize context value để tránh re-render không cần thiết
  const contextValue = useMemo<ShopProductContextType>(() => ({
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    filters,
    selectedCampaign,
    fetchProducts,
    setFilters,
    changePage,
    changeLimit,
    fetchCampaign,
    fetchSkinTypeOptions,
    fetchConcernOptions,
    skinTypeOptions,
    concernOptions,
    addToWishlist,
    addToCart,
    logSearch,
    logProductView,
    logProductClick,
    logFilterUse,
    fetchTopProducts
  }), [
    products, loading, error, totalProducts, currentPage, totalPages, itemsPerPage,
    filters, selectedCampaign, fetchProducts, setFilters, changePage, changeLimit,
    fetchCampaign, fetchConcernOptions, fetchSkinTypeOptions, skinTypeOptions,
    concernOptions, addToWishlist, addToCart, logSearch, logProductView,
    logProductClick, logFilterUse, fetchTopProducts
  ]);

  return (
    <ShopProductContext.Provider value={contextValue}>
      {children}
    </ShopProductContext.Provider>
  );
};
