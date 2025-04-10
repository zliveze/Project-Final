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
      itemsPerPage: 12, // Default items per page for shop
      filters: {},
      selectedCampaign: null,
      fetchProducts: async () => { console.warn('ShopProductProvider not available.'); },
      setFilters: () => { console.warn('ShopProductProvider not available.'); },
      changePage: () => { console.warn('ShopProductProvider not available.'); },
      changeLimit: () => { console.warn('ShopProductProvider not available.'); },
      fetchCampaign: async () => { console.warn('ShopProductProvider not available.'); },
      addToWishlist: async () => { console.warn('ShopProductProvider not available.'); return false; },
      addToCart: async () => { console.warn('ShopProductProvider not available.'); return false; }
    };
  }
  return context;
};

// Thêm biến tĩnh ở mức module để lưu yêu cầu cuối cùng 
let lastRequestKey: string = '';
let debounceTimer: NodeJS.Timeout | null = null;

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
  const [selectedCampaign, setSelectedCampaign] = useState<UserCampaign | null>(null);

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
      console.log('Bỏ qua yêu cầu trùng lặp:', requestKey);
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
      console.log(`Fetching products for page ${page}, limit ${limit} with filters:`, currentFilters);
      
      // Kiểm tra và log thông tin campaignId nếu có
      if (currentFilters.campaignId) {
        console.log('Đang lọc theo campaign ID:', currentFilters.campaignId);
      }

      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        // Append filters to params
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
            // Ensure boolean values are correctly stringified
            if (typeof value === 'boolean') {
              params.append(key, value.toString());
            } else {
              params.append(key, String(value));
            }
          }
        });

        const requestURL = `${API_URL}/products/light?${params.toString()}`;
        console.log('Gửi request API đến:', requestURL);
        console.log('Chi tiết params:', Object.fromEntries(params.entries()));
        const response = await axios.get<LightProductsApiResponse>(`${API_URL}/products/light`, { params });
        console.log('Nhận response từ API:', response.status, response.statusText);

        if (response.data && response.data.products) {
           // Đảm bảo sản phẩm có thông tin chi tiết promotion đầy đủ
           const productsWithId = response.data.products.map(p => {
             // Đảm bảo mỗi sản phẩm có id dựa trên _id
             const product = { ...p, id: p._id };
             
             // Cập nhật thêm thông tin promotion chi tiết hơn nếu có
             if (product.promotion) {
               console.log('Sản phẩm có promotion:', product.name, product.promotion);
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
           
           // Kiểm tra sản phẩm có campaign không
           if (currentFilters.campaignId) {
             const productsWithCampaign = productsWithId.filter(p => 
               p.promotion && p.promotion.type === 'campaign' && p.promotion.id === currentFilters.campaignId
             );
             console.log(`Tìm thấy ${productsWithCampaign.length} sản phẩm thuộc chiến dịch ${currentFilters.campaignId}`);
             
             if (productsWithCampaign.length > 0) {
               console.log('Thông tin chiến dịch từ sản phẩm đầu tiên:', productsWithCampaign[0].promotion);
             } else {
               console.log('Không tìm thấy sản phẩm nào trong chiến dịch này');
             }
           }
           
           // Kiểm tra sản phẩm có event không
           if (currentFilters.eventId) {
             const productsWithEvent = productsWithId.filter(p => 
               p.promotion && p.promotion.type === 'event' && p.promotion.id === currentFilters.eventId
             );
             console.log(`Tìm thấy ${productsWithEvent.length} sản phẩm thuộc sự kiện ${currentFilters.eventId}`);
             
             if (productsWithEvent.length > 0) {
               console.log('Thông tin sự kiện từ sản phẩm đầu tiên:', productsWithEvent[0].promotion);
             } else {
               console.log('Không tìm thấy sản phẩm nào trong sự kiện này');
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
    }, 300); // Thêm 300ms debounce để tránh gọi API quá nhiều lần
  }, [currentPage, itemsPerPage, filters]);

  // Function to update filters and trigger fetch
  const setFilters = useCallback((newFilters: Partial<ShopProductFilters>, skipFetch: boolean = false) => {
    console.log('setFilters called with:', newFilters, 'skipFetch:', skipFetch);
    console.log('Current filters before update:', filters);
    
    // Xử lý đặc biệt cho các key có giá trị undefined
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key as keyof ShopProductFilters] === undefined) {
        console.log(`Removing ${key} from filters`);
      }
    });
    
    const updatedFilters = { ...filters, ...newFilters };
    console.log('Updated filters after merge:', updatedFilters);
    
    // Reset page to 1 when filters change
    setCurrentPage(1);
    setFiltersState(updatedFilters);
    
    // Chỉ gọi fetchProducts nếu không được yêu cầu bỏ qua
    if (!skipFetch) {
      console.log('Calling fetchProducts with new filters');
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
