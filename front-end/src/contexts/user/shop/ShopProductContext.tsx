import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
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
      fetchSkinTypeOptions: async () => { console.warn('ShopProductProvider not available.'); return []; }, // Keep return type consistent
      fetchConcernOptions: async () => { console.warn('ShopProductProvider not available.'); return []; }, // Keep return type consistent
      skinTypeOptions: [], // Updated type
      concernOptions: [], // Updated type
      addToWishlist: async () => { console.warn('ShopProductProvider not available.'); return false; },
      addToCart: async () => { console.warn('ShopProductProvider not available.'); return false; },
      logSearch: async () => { console.warn('ShopProductProvider not available.'); },
      logProductView: async () => { console.warn('ShopProductProvider not available.'); },
      logProductClick: async () => { console.warn('ShopProductProvider not available.'); },
      logFilterUse: async () => { console.warn('ShopProductProvider not available.'); }
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

// Thêm cache cho các options (sử dụng string[] giờ)
const optionsCache = {
  skinTypes: { data: null as string[] | null, timestamp: 0 },
  concerns: { data: null as string[] | null, timestamp: 0 }
};
const OPTIONS_CACHE_TTL = 300000; // Giảm xuống 5 phút (300,000 ms) cho options cache

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
  const [skinTypeOptions, setSkinTypeOptions] = useState<string[]>([]); // Updated type
  const [concernOptions, setConcernOptions] = useState<string[]>([]); // Updated type
  const { isAuthenticated, user } = useAuth();

  const fetchProducts = useCallback(async (
    page: number = currentPage,
    limit: number = itemsPerPage,
    currentFilters: ShopProductFilters = filters,
    forceRefresh: boolean = false
  ) => {
    // Luôn refresh khi có tìm kiếm để đảm bảo hiển thị kết quả mới nhất
    if (currentFilters.search) {
      forceRefresh = true;
      console.log('Tìm kiếm phát hiện, bắt buộc refresh dữ liệu:', currentFilters.search);
    }

    // Thêm logic đặc biệt: Khi URL chứa search parameter, luôn force refresh
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('search')) {
        console.log('Phát hiện search param trong URL, force refresh');
        forceRefresh = true;
      }
    }

    // Sử dụng JSON.stringify với sắp xếp key để đảm bảo tạo chuỗi nhất quán
    const sortedFilters = { ...currentFilters };
    const filterString = JSON.stringify(sortedFilters, Object.keys(sortedFilters).sort());
    const requestKey = `${page}-${limit}-${filterString}`;

    // Kiểm tra nếu filters trống (trường hợp reset)
    const isEmptyFilters = Object.values(currentFilters).every(val => val === undefined || val === null || val === '');

    // Thêm log để debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`fetchProducts gọi với key: ${requestKey}`);
      console.log(`Last request key: ${lastRequestKey}`);
      console.log(`Force refresh: ${forceRefresh}`);
      console.log(`Is empty filters: ${isEmptyFilters}`);
    }

    // Kiểm tra nếu yêu cầu này giống với yêu cầu cuối cùng và không yêu cầu refresh
    if (!forceRefresh && requestKey === lastRequestKey) {
      console.log('Bỏ qua yêu cầu trùng lặp:', requestKey);
      return;
    }

    // Lưu request key hiện tại cho lần so sánh tiếp theo
    // Điều này giúp ngăn chặn vòng lặp vô hạn
    const previousRequestKey = lastRequestKey;
    lastRequestKey = requestKey;

    // Lưu ý: Không kiểm tra đặc biệt cho empty filters nữa vì đã kiểm tra requestKey

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

    // Giảm thời gian debounce cho tìm kiếm để cải thiện trải nghiệm người dùng
    const debounceTime = currentFilters.search ? 100 : 200;

    // Thêm debounce trước khi thực sự gọi API
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching products for page ${page}, limit ${limit} with filters:`, currentFilters);

        // Check các giá trị undefined/null để debug
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            console.log(`Filter ${key} có giá trị trống:`, value);
          }
        });

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

        // Log trong cả môi trường development và production khi có search để debug vấn đề
        if (currentFilters.search || process.env.NODE_ENV === 'development') {
          console.log('Gửi request API tìm kiếm đến:', requestURL);
          console.log('Chi tiết params:', Object.fromEntries(params.entries()));
        }

        const response = await axiosInstance.get<LightProductsApiResponse>('/products/light', { params });

        if (currentFilters.search || process.env.NODE_ENV === 'development') {
          console.log('Nhận response từ API:', response.status, response.statusText);
          if (response.data && response.data.products) {
            console.log(`Tìm thấy ${response.data.products.length} sản phẩm từ API`);
          }
        }

        if (response.data && response.data.products) {
           // Lưu kết quả vào cache chỉ khi không phải request tìm kiếm
           if (!currentFilters.search) {
             resultsCache[requestKey] = {
               timestamp: Date.now(),
               data: response.data
             };
           }

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

           // Log kết quả tìm kiếm cho debugging
           if (currentFilters.search) {
             console.log(`Kết quả tìm kiếm cho "${currentFilters.search}": Tìm thấy ${productsWithId.length} sản phẩm`);
             if (productsWithId.length > 0) {
               console.log('Danh sách sản phẩm tìm thấy:', productsWithId.map(p => p.name));
             } else {
               console.log(`Không tìm thấy sản phẩm nào với từ khóa "${currentFilters.search}"`);
             }
           }

           setProducts(productsWithId);
           setTotalProducts(response.data.total);
           setCurrentPage(response.data.page);
           setItemsPerPage(response.data.limit);
           setTotalPages(response.data.totalPages);

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
    }, debounceTime); // Giảm debounce cho tìm kiếm
  }, [currentPage, itemsPerPage, filters]);

  // Thêm biến để theo dõi timer debounce cho setFilters
  const [setFiltersDebounceTimer, setSetFiltersDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Function to update filters and trigger fetch
  const setFilters = useCallback((newFilters: Partial<ShopProductFilters>, skipFetch: boolean = false) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ShopProductContext] setFilters called with:', newFilters, 'skipFetch:', skipFetch);
      console.log('[ShopProductContext] Current filters before update:', filters);
    }

    const isResettingAll = Object.values(newFilters).every(v => v === undefined);
    const isSettingEmptySearch = 'search' in newFilters && newFilters.search === '';

    // Tạo một bản sao của newFilters để chuẩn hóa
    const normalizedNewFilters = { ...newFilters };
    if (isSettingEmptySearch) {
      normalizedNewFilters.search = undefined; // Chuẩn hóa search rỗng thành undefined
    }

    // Kiểm tra sự thay đổi thực sự
    let hasChanged = false;
    const finalUpdatedFilters = { ...filters }; // Bắt đầu với filters hiện tại

    for (const key in normalizedNewFilters) {
      const filterKey = key as keyof ShopProductFilters;
      const newValue = normalizedNewFilters[filterKey];
      const oldValue = filters[filterKey];

      // Nếu giá trị mới khác giá trị cũ (kể cả undefined vs giá trị thực)
      if (String(oldValue ?? '') !== String(newValue ?? '')) {
        // Sửa lỗi TypeScript bằng cách chỉ định kiểu rõ ràng
        finalUpdatedFilters[filterKey] = newValue as any;
        hasChanged = true;
      }
    }

    let filtersToSet = { ...finalUpdatedFilters }; // Sử dụng bản sao để tránh thay đổi finalUpdatedFilters nếu không cần thiết

    // Nếu đang reset tất cả và không có thay đổi nào khác, vẫn coi là có thay đổi
    if (isResettingAll && !hasChanged && Object.keys(filters).some(k => filters[k as keyof ShopProductFilters] !== undefined)) {
        hasChanged = true;
        // Tạo một object hoàn toàn mới với tất cả các key có giá trị undefined
        const allKeys = Object.keys(filters) as Array<keyof ShopProductFilters>;
        const completelyResetFilters: Partial<ShopProductFilters> = {};
        allKeys.forEach(key => {
            completelyResetFilters[key] = undefined;
        });
        // Gán thêm các key từ newFilters (nếu có, mặc dù trong trường hợp reset thì newFilters cũng là undefined)
        Object.keys(normalizedNewFilters).forEach(key => {
            completelyResetFilters[key as keyof ShopProductFilters] = undefined;
        });
        filtersToSet = completelyResetFilters;
    }


    if (!hasChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ShopProductContext] No actual change in filters, skipping update.');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[ShopProductContext] Filters to set state with:', filtersToSet);
    }

    setCurrentPage(1); // Luôn reset về trang 1 khi filter thay đổi
    setFiltersState(filtersToSet);

    if (setFiltersDebounceTimer) {
      clearTimeout(setFiltersDebounceTimer);
    }

    if (!skipFetch) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ShopProductContext] Calling fetchProducts with new filters (debounced)');
      }

      const searchChanged = 'search' in normalizedNewFilters; // Kiểm tra search có trong payload không, kể cả khi là undefined

      const newTimer = setTimeout(() => {
        // Quan trọng: Truyền filtersToSet (là state đã được tính toán mới nhất) vào fetchProducts
        fetchProducts(1, itemsPerPage, filtersToSet, searchChanged || isResettingAll);
        setSetFiltersDebounceTimer(null);
      }, searchChanged ? 100 : 300); // Debounce ngắn hơn nếu search thay đổi

      setSetFiltersDebounceTimer(newTimer);
    }
  }, [filters, itemsPerPage, fetchProducts, setFiltersDebounceTimer]);

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

      const response = await axiosInstance.get(`/campaigns/public/${campaignId}`);
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
  const fetchSkinTypeOptions = useCallback(async (): Promise<string[]> => {
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
          // Validate if it's an array of strings
          if (Array.isArray(parsedOptions) && parsedOptions.every(item => typeof item === 'string')) {
            setSkinTypeOptions(parsedOptions);
            optionsCache.skinTypes = { data: parsedOptions, timestamp: Date.now() };
            return parsedOptions;
          } else {
            localStorage.removeItem('skinTypeOptions'); // Remove invalid cache
          }
        } catch (e) {
           localStorage.removeItem('skinTypeOptions'); // Remove corrupted cache
        }
      }

      // Gọi API để lấy dữ liệu từ database
      const response = await axiosInstance.get<{ skinTypes: string[] }>('/products/filters/skin-types');
      if (response.data && response.data.skinTypes && Array.isArray(response.data.skinTypes)) {
        const apiSkinTypes = response.data.skinTypes; // Directly use the string array

        localStorage.setItem('skinTypeOptions', JSON.stringify(apiSkinTypes));
        setSkinTypeOptions(apiSkinTypes);
        optionsCache.skinTypes = { data: apiSkinTypes, timestamp: Date.now() };
        return apiSkinTypes;
      } else {
        // Handle case where API returns unexpected data but doesn't throw error
        console.warn('API did not return expected skin types data.');
        setSkinTypeOptions([]); // Set to empty array
        return [];
      }
    } catch (err) {
      console.error('Error fetching skin types from API:', err);
      // Fallback to empty array on error
      setSkinTypeOptions([]);
      return [];
    }
  }, []); // Dependencies remain empty

  const fetchConcernOptions = useCallback(async (): Promise<string[]> => {
    console.log('[fetchConcernOptions] Function entered.'); // <-- Thêm log ngay đây
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
          // Validate if it's an array of strings
          if (Array.isArray(parsedOptions) && parsedOptions.every(item => typeof item === 'string')) {
            setConcernOptions(parsedOptions);
            optionsCache.concerns = { data: parsedOptions, timestamp: Date.now() };
            return parsedOptions;
          } else {
            localStorage.removeItem('concernOptions'); // Remove invalid cache
          }
        } catch (e) {
           localStorage.removeItem('concernOptions'); // Remove corrupted cache
        }
      }

      // Gọi API để lấy dữ liệu từ database
      console.log(`[fetchConcernOptions] Calling API: /products/filters/concerns`); // Thêm log
      const response = await axiosInstance.get<{ concerns: string[] }>('/products/filters/concerns');
      console.log('[fetchConcernOptions] API Response:', response); // Thêm log chi tiết response

      if (response.data && response.data.concerns && Array.isArray(response.data.concerns)) {
        const apiConcerns = response.data.concerns; // Directly use the string array
        console.log('[fetchConcernOptions] Concerns received from API:', apiConcerns); // Thêm log dữ liệu nhận được

        localStorage.setItem('concernOptions', JSON.stringify(apiConcerns));
        setConcernOptions(apiConcerns);
        optionsCache.concerns = { data: apiConcerns, timestamp: Date.now() };
        return apiConcerns;
      } else {
        // Handle case where API returns unexpected data but doesn't throw error
        console.warn('API did not return expected concerns data.');
        setConcernOptions([]); // Set to empty array
        return [];
      }
    } catch (err) {
      console.error('Error fetching concerns from API:', err);
      // Fallback to empty array on error
      setConcernOptions([]);
      return [];
    }
  }, []); // Dependencies remain empty

  // Effect để fetch skin type và concern options khi component mount
  // Sử dụng Promise.all để tải song song
  useEffect(() => {
    console.log('[ShopProductProvider useEffect] Running loadOptions effect.'); // Log khi effect chạy
    const loadOptions = async () => {
      console.log('[ShopProductProvider loadOptions] Starting Promise.all.'); // Log trước Promise.all
      await Promise.all([
        fetchSkinTypeOptions(),
        fetchConcernOptions() // Kiểm tra xem lời gọi này có xảy ra không
      ]);
      console.log('[ShopProductProvider loadOptions] Finished Promise.all.'); // Log sau Promise.all
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

  // Ghi lại hoạt động tìm kiếm
  const logSearch = async (searchQuery: string) => {
    if (!isAuthenticated) return;

    try {
      // Sử dụng endpoint POST để log search
      await axiosInstance.post('/recommendations/log/search', {
        searchQuery: searchQuery
      });
    } catch (error) {
      console.error('Error logging search activity:', error);
    }
  };

  // Thêm vào giỏ hàng và đồng thời ghi lại hoạt động
  const addToCart = async (productId: string, quantity: number = 1, variantId?: string): Promise<boolean> => {
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      console.error('Error adding product to cart:', error);
      return false;
    }
  };

  // Thêm vào danh sách yêu thích và đồng thời ghi lại hoạt động
  const addToWishlist = async (productId: string): Promise<boolean> => {
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể thêm sản phẩm vào danh sách yêu thích';
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      console.error('Error adding product to wishlist:', error);
      return false;
    }
  };

  // Ghi lại hoạt động xem sản phẩm
  const logProductView = async (productId: string, timeSpent?: number) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.post(`/recommendations/log/view/${productId}`, {
        timeSpent
      });
    } catch (error) {
      console.error('Error logging product view activity:', error);
    }
  };

  // Ghi lại hoạt động click vào sản phẩm
  const logProductClick = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.post(`/recommendations/log/click/${productId}`, {});
    } catch (error) {
      console.error('Error logging product click activity:', error);
    }
  };

  // Ghi lại hoạt động sử dụng bộ lọc
  const logFilterUse = async (filters: {
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
  };

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
    addToWishlist,
    addToCart,
    logSearch,
    logProductView,
    logProductClick,
    logFilterUse
  };

  return (
    <ShopProductContext.Provider value={contextValue}>
      {children}
    </ShopProductContext.Provider>
  );
};
