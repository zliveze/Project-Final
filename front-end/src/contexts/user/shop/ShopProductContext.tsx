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
  selectedCampaign: UserCampaign | null;
  fetchProducts: (page?: number, limit?: number, newFilters?: ShopProductFilters, forceRefresh?: boolean) => Promise<void>;
  setFilters: (newFilters: Partial<ShopProductFilters>, skipFetch?: boolean) => void;
  changePage: (newPage: number) => void;
  changeLimit: (newLimit: number) => void;
  fetchCampaign: (campaignId: string) => Promise<void>;
  fetchSkinTypeOptions: () => Promise<{ id: string; label: string }[]>;
  fetchConcernOptions: () => Promise<{ id: string; label: string }[]>;
  skinTypeOptions: { id: string; label: string }[];
  concernOptions: { id: string; label: string }[];
  addToWishlist?: (productId: string) => Promise<boolean>;
  addToCart?: (productId: string, quantity: number, variantId?: string) => Promise<boolean>;
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
      itemsPerPage: 24, // Default items per page for shop
      filters: {},
      selectedCampaign: null,
      fetchProducts: async () => { console.warn('ShopProductProvider not available.'); },
      setFilters: () => { console.warn('ShopProductProvider not available.'); },
      changePage: () => { console.warn('ShopProductProvider not available.'); },
      changeLimit: () => { console.warn('ShopProductProvider not available.'); },
      fetchCampaign: async () => { console.warn('ShopProductProvider not available.'); },
      fetchSkinTypeOptions: async () => { console.warn('ShopProductProvider not available.'); return []; },
      fetchConcernOptions: async () => { console.warn('ShopProductProvider not available.'); return []; },
      skinTypeOptions: [],
      concernOptions: [],
      addToWishlist: async () => { console.warn('ShopProductProvider not available.'); return false; },
      addToCart: async () => { console.warn('ShopProductProvider not available.'); return false; }
    };
  }
  return context;
};

// Thêm biến tĩnh ở mức module để lưu yêu cầu cuối cùng
let lastRequestKey: string = '';
let debounceTimer: NodeJS.Timeout | null = null;
// Thêm cache kết quả với TTL dài hơn
const resultsCache: { [key: string]: { timestamp: number, data: LightProductsApiResponse } } = {};
const CACHE_TTL = 300000; // Tăng lên 5 phút cache

// Thêm cache cho các options
const optionsCache = {
  skinTypes: { data: null as any, timestamp: 0 },
  concerns: { data: null as any, timestamp: 0 }
};
const OPTIONS_CACHE_TTL = 3600000; // 1 giờ cho options cache

// Provider component
export const ShopProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<LightProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24); // Default for shop view
  const [filters, setFiltersState] = useState<ShopProductFilters>({});
  const [selectedCampaign, setSelectedCampaign] = useState<UserCampaign | null>(null);
  const [skinTypeOptions, setSkinTypeOptions] = useState<{ id: string; label: string }[]>([]);
  const [concernOptions, setConcernOptions] = useState<{ id: string; label: string }[]>([]);

  const fetchProducts = useCallback(async (
    page: number = currentPage,
    limit: number = itemsPerPage,
    currentFilters: ShopProductFilters = filters,
    forceRefresh: boolean = false
  ) => {
    // Thêm kiểm tra để tránh gọi API liên tục khi tham số giống với lần gọi trước
    const filterString = JSON.stringify(currentFilters);
    const requestKey = `${page}-${limit}-${filterString}`;

    // Kiểm tra nếu yêu cầu này giống với yêu cầu cuối cùng và không yêu cầu refresh
    if (!forceRefresh && requestKey === lastRequestKey) {
      // Bỏ qua yêu cầu trùng lặp mà không cần log
      return;
    }

    // Kiểm tra cache
    if (!forceRefresh && resultsCache[requestKey] &&
        (Date.now() - resultsCache[requestKey].timestamp) < CACHE_TTL) {
      console.log('Sử dụng kết quả từ cache cho:', requestKey);

      const cachedData = resultsCache[requestKey].data;
      // Xử lý dữ liệu từ cache
      const productsWithId = cachedData.products.map(p => {
        const product = { ...p, id: p._id };

        if (product.promotion) {
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
      setTotalProducts(cachedData.total);
      setCurrentPage(cachedData.page);
      setItemsPerPage(cachedData.limit);
      setTotalPages(cachedData.totalPages);
      console.log('Đã sử dụng dữ liệu từ cache');
      return;
    }

    // Xóa bất kỳ timer nào đang chờ
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // Lưu yêu cầu hiện tại
    lastRequestKey = requestKey;

    // Thêm debounce trước khi thực sự gọi API
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching products for page ${page}, limit ${limit} with filters:`, currentFilters);

        // Kiểm tra và log thông tin campaignId nếu có
        if (currentFilters.campaignId) {
          console.log('Đang lọc theo campaign ID:', currentFilters.campaignId);
        }
      }

      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        // Hàm kiểm tra ID có phải là MongoDB ObjectId hợp lệ không
        const isValidObjectId = (id: string): boolean => {
          return /^[0-9a-fA-F]{24}$/.test(id);
        };

        // Append filters to params
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
            // Kiểm tra đặc biệt cho brandId và categoryId
            if ((key === 'brandId' || key === 'categoryId') && typeof value === 'string') {
              // Chỉ gửi lên server nếu là ObjectId hợp lệ
              if (isValidObjectId(value)) {
                params.append(key, String(value));
              } else {
                console.warn(`Bỏ qua ${key} không hợp lệ:`, value);
              }
            }
            // Xử lý các trường khác bình thường
            else if (typeof value === 'boolean') {
              params.append(key, value.toString());
            } else {
              params.append(key, String(value));
            }
          }
        });

        const requestURL = `${API_URL}/products/light?${params.toString()}`;

        // Chỉ log trong môi trường development
        if (process.env.NODE_ENV === 'development') {
          console.log('Gửi request API đến:', requestURL);
          console.log('Chi tiết params:', Object.fromEntries(params.entries()));
        }

        const response = await axios.get<LightProductsApiResponse>(`${API_URL}/products/light`, { params });

        if (process.env.NODE_ENV === 'development') {
          console.log('Nhận response từ API:', response.status, response.statusText);
        }

        if (response.data && response.data.products) {
           // Lưu kết quả vào cache
           resultsCache[requestKey] = {
             timestamp: Date.now(),
             data: response.data
           };

           // Đảm bảo sản phẩm có thông tin chi tiết promotion đầy đủ
           const productsWithId = response.data.products.map(p => {
             // Đảm bảo mỗi sản phẩm có id dựa trên _id
             const product = { ...p, id: p._id };

             // Cập nhật thêm thông tin promotion chi tiết hơn nếu có
             if (product.promotion) {
               // Chỉ log trong môi trường development
               if (process.env.NODE_ENV === 'development') {
                 console.log('Sản phẩm có promotion:', product.name, product.promotion);
               }
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

           // Chỉ log trong môi trường development
           if (process.env.NODE_ENV === 'development') {
             console.log('Products fetched successfully:', {
               products: response.data.products.length,
               total: response.data.total,
               page: response.data.page,
               limit: response.data.limit,
               totalPages: response.data.totalPages
             });
           }

           // Kiểm tra sản phẩm có campaign không
           if (currentFilters.campaignId) {
             const productsWithCampaign = productsWithId.filter(p =>
               p.promotion && p.promotion.type === 'campaign' && p.promotion.id === currentFilters.campaignId
             );

             // Chỉ log trong môi trường development
             if (process.env.NODE_ENV === 'development') {
               console.log(`Tìm thấy ${productsWithCampaign.length} sản phẩm thuộc chiến dịch ${currentFilters.campaignId}`);

               if (productsWithCampaign.length > 0) {
                 console.log('Thông tin chiến dịch từ sản phẩm đầu tiên:', productsWithCampaign[0].promotion);
               } else {
                 console.log('Không tìm thấy sản phẩm nào trong chiến dịch này');
               }
             }
           }

           // Kiểm tra sản phẩm có event không
           if (currentFilters.eventId) {
             const productsWithEvent = productsWithId.filter(p =>
               p.promotion && p.promotion.type === 'event' && p.promotion.id === currentFilters.eventId
             );

             // Chỉ log trong môi trường development
             if (process.env.NODE_ENV === 'development') {
               console.log(`Tìm thấy ${productsWithEvent.length} sản phẩm thuộc sự kiện ${currentFilters.eventId}`);

               if (productsWithEvent.length > 0) {
                 console.log('Thông tin sự kiện từ sản phẩm đầu tiên:', productsWithEvent[0].promotion);
               } else {
                 console.log('Không tìm thấy sản phẩm nào trong sự kiện này');
               }
             }
           }
        } else {
          console.warn('Response từ API không có dữ liệu products hợp lệ');
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
    }, 200); // Giảm debounce xuống 200ms để cải thiện tốc độ phản hồi
  }, [currentPage, itemsPerPage, filters]);

  // Function to update filters and trigger fetch
  const setFilters = useCallback((newFilters: Partial<ShopProductFilters>, skipFetch: boolean = false) => {
    // Chỉ log trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      console.log('setFilters called with:', newFilters, 'skipFetch:', skipFetch);
      console.log('Current filters before update:', filters);

      // Xử lý đặc biệt cho các key có giá trị undefined
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key as keyof ShopProductFilters] === undefined) {
          console.log(`Removing ${key} from filters`);
        }
      });
    }

    const updatedFilters = { ...filters, ...newFilters };

    if (process.env.NODE_ENV === 'development') {
      console.log('Updated filters after merge:', updatedFilters);
    }

    // Reset page to 1 when filters change
    setCurrentPage(1);
    setFiltersState(updatedFilters);

    // Chỉ gọi fetchProducts nếu không được yêu cầu bỏ qua
    if (!skipFetch) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Calling fetchProducts with new filters');
      }
      // Fetch products with the new filters and reset page
      fetchProducts(1, itemsPerPage, updatedFilters, true); // Force refresh to ensure data is reloaded
    }
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
    // Thêm kiểm tra cache trước khi fetch
    const filterString = JSON.stringify(filters);
    const requestKey = `${currentPage}-${itemsPerPage}-${filterString}`;

    // Kiểm tra cache trước khi fetch
    if (resultsCache[requestKey] &&
        (Date.now() - resultsCache[requestKey].timestamp) < CACHE_TTL) {
      console.log('Sử dụng kết quả từ cache cho initial fetch');
      const cachedData = resultsCache[requestKey].data;

      const productsWithId = cachedData.products.map(p => {
        const product = { ...p, id: p._id };
        if (product.promotion) {
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
      setTotalProducts(cachedData.total);
      setCurrentPage(cachedData.page);
      setItemsPerPage(cachedData.limit);
      setTotalPages(cachedData.totalPages);
      return;
    }

    // Nếu không có cache, thực hiện fetch
    fetchProducts(currentPage, itemsPerPage, filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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

      const response = await axios.get(campaignUrl);
      console.log('Status response chiến dịch:', response.status, response.statusText);
      console.log('Kết quả lấy thông tin chiến dịch:', response.data);

      if (response.data) {
        const campaignData = {
          ...response.data,
          startDate: new Date(response.data.startDate),
          endDate: new Date(response.data.endDate)
        };

        setSelectedCampaign(campaignData);
        console.log('Đã cập nhật selectedCampaign:', campaignData);
      } else {
        console.warn('Không nhận được dữ liệu chiến dịch hợp lệ từ API');
      }
    } catch (err: any) {
      console.error('Lỗi khi lấy thông tin chiến dịch:', err.response || err);
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải thông tin chiến dịch.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Fetch Filter Options ---
  const fetchSkinTypeOptions = useCallback(async (): Promise<{ id: string; label: string }[]> => {
    try {
      // Kiểm tra memory cache trước
      if (optionsCache.skinTypes.data &&
          (Date.now() - optionsCache.skinTypes.timestamp < OPTIONS_CACHE_TTL)) {
        setSkinTypeOptions(optionsCache.skinTypes.data);
        return optionsCache.skinTypes.data;
      }

      // Kiểm tra cache trong localStorage
      const cachedOptions = localStorage.getItem('skinTypeOptions');
      if (cachedOptions) {
        try {
          const parsedOptions = JSON.parse(cachedOptions);
          if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
            setSkinTypeOptions(parsedOptions);
            // Cập nhật memory cache
            optionsCache.skinTypes = {
              data: parsedOptions,
              timestamp: Date.now()
            };
            return parsedOptions;
          }
        } catch (e) {
           localStorage.removeItem('skinTypeOptions'); // Xóa cache bị lỗi
        }
      }

      try {
        // Gọi API để lấy dữ liệu từ database
        const response = await axios.get(`${API_URL}/products/filters/skin-types`);
        if (response.data && response.data.skinTypes && Array.isArray(response.data.skinTypes)) {
          // Sử dụng trực tiếp dữ liệu từ API mà không cần chuyển đổi
          const apiSkinTypes = response.data.skinTypes.map((type: string) => ({
            id: type,
            label: type // Sử dụng chính xác tên loại da từ database
          }));

          localStorage.setItem('skinTypeOptions', JSON.stringify(apiSkinTypes));
          setSkinTypeOptions(apiSkinTypes);

          // Cập nhật memory cache
          optionsCache.skinTypes = {
            data: apiSkinTypes,
            timestamp: Date.now()
          };

          return apiSkinTypes;
        }
      } catch (apiError) {
        // Xử lý lỗi nhưng không log ra console
      }

      // Fallback options
      const exampleOptions = [
        { id: 'skibidi', label: 'skibidi' },
        { id: 'dumb bitch', label: 'dumb bitch' }
      ];
      localStorage.setItem('skinTypeOptions', JSON.stringify(exampleOptions));
      setSkinTypeOptions(exampleOptions);

      // Cập nhật memory cache
      optionsCache.skinTypes = {
        data: exampleOptions,
        timestamp: Date.now()
      };

      return exampleOptions;
    } catch (err) {
      // Fallback khi có lỗi
      const exampleOptions = [
        { id: 'skibidi', label: 'skibidi' },
        { id: 'dumb bitch', label: 'dumb bitch' }
      ];
      setSkinTypeOptions(exampleOptions);
      return exampleOptions;
    }
  }, []); // Không phụ thuộc vào state thay đổi thường xuyên

  const fetchConcernOptions = useCallback(async (): Promise<{ id: string; label: string }[]> => {
    try {
      // Kiểm tra memory cache trước
      if (optionsCache.concerns.data &&
          (Date.now() - optionsCache.concerns.timestamp < OPTIONS_CACHE_TTL)) {
        setConcernOptions(optionsCache.concerns.data);
        return optionsCache.concerns.data;
      }

      // Kiểm tra cache trong localStorage
      const cachedOptions = localStorage.getItem('concernOptions');
      if (cachedOptions) {
        try {
          const parsedOptions = JSON.parse(cachedOptions);
          if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
            setConcernOptions(parsedOptions);
            // Cập nhật memory cache
            optionsCache.concerns = {
              data: parsedOptions,
              timestamp: Date.now()
            };
            return parsedOptions;
          }
        } catch (e) {
           localStorage.removeItem('concernOptions'); // Xóa cache bị lỗi
        }
      }

      try {
        // Gọi API để lấy dữ liệu từ database
        const response = await axios.get(`${API_URL}/products/filters/concerns`);
        if (response.data && response.data.concerns && Array.isArray(response.data.concerns)) {
          // Sử dụng trực tiếp dữ liệu từ API mà không cần chuyển đổi
          const apiConcerns = response.data.concerns.map((concern: string) => ({
            id: concern,
            label: concern // Sử dụng chính xác tên vấn đề da từ database
          }));

          localStorage.setItem('concernOptions', JSON.stringify(apiConcerns));
          setConcernOptions(apiConcerns);

          // Cập nhật memory cache
          optionsCache.concerns = {
            data: apiConcerns,
            timestamp: Date.now()
          };

          return apiConcerns;
        }
      } catch (apiError) {
        // Xử lý lỗi nhưng không log ra console
      }

      // Fallback options
      const exampleOptions = [
        { id: 'ugly', label: 'ugly' },
        { id: 'too fat', label: 'too fat' }
      ];
      localStorage.setItem('concernOptions', JSON.stringify(exampleOptions));
      setConcernOptions(exampleOptions);

      // Cập nhật memory cache
      optionsCache.concerns = {
        data: exampleOptions,
        timestamp: Date.now()
      };

      return exampleOptions;
    } catch (err) {
      // Fallback khi có lỗi
      const exampleOptions = [
        { id: 'ugly', label: 'ugly' },
        { id: 'too fat', label: 'too fat' }
      ];
      setConcernOptions(exampleOptions);
      return exampleOptions;
    }
  }, []); // Không phụ thuộc vào state thay đổi thường xuyên

  // Effect để fetch skin type và concern options khi component mount
  // Sử dụng Promise.all để tải song song
  useEffect(() => {
    const loadOptions = async () => {
      await Promise.all([
        fetchSkinTypeOptions(),
        fetchConcernOptions()
      ]);
    };
    loadOptions();
  }, [fetchSkinTypeOptions, fetchConcernOptions]);

  // Thêm useEffect để tự động lấy campaign khi campaignId thay đổi
  useEffect(() => {
    if (filters.campaignId) {
      fetchCampaign(filters.campaignId);
    } else {
      setSelectedCampaign(null);
    }
  }, [filters.campaignId, fetchCampaign]);

  const contextValue: ShopProductContextType = {
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
    addToWishlist: async (productId: string) => {
      // Tạm thời implement giả cho method này
      console.warn('addToWishlist chưa được triển khai. ProductId:', productId);
      return Promise.resolve(false);
    },
    addToCart: async (productId: string, quantity: number, variantId?: string) => {
      // Tạm thời implement giả cho method này
      console.warn('addToCart chưa được triển khai. ProductId:', productId, 'quantity:', quantity, 'variantId:', variantId);
      return Promise.resolve(false);
    }
  };

  return (
    <ShopProductContext.Provider value={contextValue}>
      {children}
    </ShopProductContext.Provider>
  );
};
