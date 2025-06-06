import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from './AdminAuthContext';
import axios from 'axios';
import { useRouter } from 'next/router';

// Định nghĩa API_URL từ biến môi trường hoặc giá trị mặc định
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Định nghĩa kiểu dữ liệu

// Interface cho error response từ API
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// Interface cho campaign data từ API
interface CampaignApiData {
  _id: string;
  title: string;
  description: string;
  type: 'Hero Banner' | 'Sale Event';
  startDate: string | Date;
  endDate: string | Date;
  products: ProductInCampaign[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Interface cho paginated response từ API
interface PaginatedApiResponse {
  campaigns: CampaignApiData[];
  total: number;
  page: number | string;
  limit: number;
}

// Định nghĩa interface cho tổ hợp biến thể trong campaign
export interface CombinationInCampaign {
  combinationId: string;
  attributes: Record<string, string>;
  combinationPrice?: number;
  adjustedPrice: number;
  originalPrice?: number;
}

// Định nghĩa interface cho biến thể trong campaign
export interface VariantInCampaign {
  variantId: string;
  variantName?: string;
  variantSku?: string;
  variantAttributes?: Record<string, string>;
  variantPrice?: number;
  adjustedPrice: number;
  originalPrice?: number;
  image?: string;
  combinations?: CombinationInCampaign[];
}

// Định nghĩa interface cho sản phẩm trong campaign
export interface ProductInCampaign {
  productId: string;
  adjustedPrice: number;
  name?: string;
  image?: string;
  originalPrice?: number;
  sku?: string;
  status?: string;
  brandId?: string;
  brand?: string;
  variants?: VariantInCampaign[];
}

export interface Campaign {
  _id: string;
  title: string;
  description: string;
  type: 'Hero Banner' | 'Sale Event';
  startDate: Date;
  endDate: Date;
  products: ProductInCampaign[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedCampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignStats {
  total: number;
  active: number;
  scheduled: number;
  drafts: number;
  ended: number;
}

export interface CampaignDashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  expiringSoon: number;
  topPerformingCampaigns: Array<{
    _id: string;
    title: string;
    type: string;
    totalOrders: number;
    totalRevenue: number;
    endDate: Date;
    daysLeft: number;
  }>;
}

interface CampaignContextProps {
  // State
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  selectedCampaign: Campaign | null;
  stats: CampaignStats;
  dashboardStats: CampaignDashboardStats | null;
  isLoading: boolean;
  error: string | null;

  // Phân trang
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;

  // Admin Actions
  fetchCampaigns: (
    page?: number,
    limit?: number,
    search?: string,
    type?: string,
    startDateFrom?: Date,
    startDateTo?: Date,
    endDateFrom?: Date,
    endDateTo?: Date
  ) => Promise<Campaign[] | null | undefined>;
  fetchCampaignById: (id: string) => Promise<Campaign | null>;
  createCampaign: (campaignData: Partial<Campaign>) => Promise<Campaign | null>;
  updateCampaign: (id: string, campaignData: Partial<Campaign>) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;

  // Quản lý sản phẩm trong chiến dịch
  addProductsToCampaign: (campaignId: string, products: ProductInCampaign[]) => Promise<Campaign | null>;
  removeProductFromCampaign: (campaignId: string, productId: string, variantId?: string, combinationId?: string) => Promise<Campaign | null>;
  updateProductPriceInCampaign: (campaignId: string, productId: string, adjustedPrice: number, variantId?: string, combinationId?: string, showToast?: boolean) => Promise<Campaign | null>;

  // Public Actions
  fetchActiveCampaigns: () => Promise<void>;
  fetchCampaignStats: () => Promise<void>;

  // Utility Functions
  resetState: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

// Khởi tạo context
const CampaignContext = createContext<CampaignContextProps>({} as CampaignContextProps);

// Hook để sử dụng context
export const useCampaign = () => useContext(CampaignContext);

// Provider component
export const CampaignProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { accessToken, isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();

  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [dashboardStats, setDashboardStats] = useState<CampaignDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Thống kê
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    scheduled: 0,
    drafts: 0,
    ended: 0
  });

  // Hàm xử lý lỗi
  const handleError = useCallback((error: ApiErrorResponse) => {
    console.error('Campaign API Error:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi không xác định';
    setError(errorMessage);
    toast.error(errorMessage);

    // Xử lý lỗi 401: Đăng xuất và chuyển hướng
    if (error?.response?.status === 401) {
      console.log('Lỗi 401, đăng xuất và chuyển hướng đến trang đăng nhập.');
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      // Sử dụng logout từ AdminAuthContext
      logout().then(() => {
         router.push('/admin/auth/login');
      }).catch(logoutError => {
         console.error('Lỗi khi tự động đăng xuất:', logoutError);
         // Vẫn chuyển hướng dù có lỗi logout
         router.push('/admin/auth/login');
      });
       // Reset state của context này để tránh hiển thị dữ liệu cũ
       setCampaigns([]);
       setActiveCampaigns([]);
       setSelectedCampaign(null);
       setStats({ total: 0, active: 0, scheduled: 0, drafts: 0, ended: 0 });
       setCurrentPage(1);
       setTotalItems(0);
       setTotalPages(1);
    }

    return null;
  }, [logout, router]);

  // Hàm chuẩn hóa dữ liệu từ API
  const normalizeCampaign = (campaignData: CampaignApiData): Campaign => {
    return {
      ...campaignData,
      startDate: campaignData.startDate ? new Date(campaignData.startDate) : new Date(),
      endDate: campaignData.endDate ? new Date(campaignData.endDate) : new Date(),
      createdAt: campaignData.createdAt ? new Date(campaignData.createdAt) : new Date(),
      updatedAt: campaignData.updatedAt ? new Date(campaignData.updatedAt) : new Date(),
    };
  };

  // API Client với xác thực
  const apiClient = axios.create({
    baseURL: API_URL,
  });

  // Thêm interceptor để đính kèm token trong header
  apiClient.interceptors.request.use(
    (config) => {
      // Log để kiểm tra token trước khi gửi request
      console.log('[CampaignContext Interceptor] Authentication Status:', accessToken ? 'Token present' : 'No token');
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Tính toán thống kê từ campaigns
  useEffect(() => {
    // Tính toán số lượng chiến dịch theo trạng thái
    const calculateStats = () => {
      if (!campaigns || campaigns.length === 0) {
        setStats({
          total: 0,
          active: 0,
          scheduled: 0,
          drafts: 0,
          ended: 0
        });
        return;
      }

      const now = new Date();

      const activeCount = campaigns.filter(
        campaign => campaign.startDate <= now && campaign.endDate >= now
      ).length;

      const scheduledCount = campaigns.filter(
        campaign => campaign.startDate > now
      ).length;

      const endedCount = campaigns.filter(
        campaign => campaign.endDate < now
      ).length;

      setStats({
        total: campaigns.length,
        active: activeCount,
        scheduled: scheduledCount,
        drafts: 0, // Chưa có trạng thái draft trong model
        ended: endedCount
      });
    };

    calculateStats();
  }, [campaigns]);

  // Lấy danh sách chiến dịch (admin)
  const fetchCampaigns = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    type?: string,
    startDateFrom?: Date,
    startDateTo?: Date,
    endDateFrom?: Date,
    endDateTo?: Date
  ) => {
    setIsLoading(true);
    setError(null);

    // Log kiểm tra trạng thái xác thực và token trước khi gọi API
    console.log(`[fetchCampaigns] Attempting fetch. IsAuthenticated: ${isAuthenticated}, AccessToken exists: ${!!accessToken}`);
    if (!isAuthenticated || !accessToken) {
       console.warn('[fetchCampaigns] Not authenticated or no access token. Aborting fetch.');
       setIsLoading(false);
       // Không nên gọi handleError ở đây vì đây không phải lỗi API mà là điều kiện chưa thỏa mãn
       // Có thể set lỗi hoặc trả về giá trị rỗng tùy theo logic mong muốn
       setError("Yêu cầu xác thực để tải dữ liệu.");
       setCampaigns([]); // Clear data
       setTotalItems(0);
       setTotalPages(1);
       return; // Dừng thực thi sớm
    }

    try {
      // Xây dựng query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (startDateFrom) params.append('startDateFrom', startDateFrom.toISOString());
      if (startDateTo) params.append('startDateTo', startDateTo.toISOString());
      if (endDateFrom) params.append('endDateFrom', endDateFrom.toISOString());
      if (endDateTo) params.append('endDateTo', endDateTo.toISOString());

      const response = await apiClient.get(`/campaigns?${params.toString()}`);
      const data = response.data as PaginatedApiResponse;

      // Chuẩn hóa dữ liệu chiến dịch
      const normalizedCampaigns = data.campaigns.map((campaign: CampaignApiData) => normalizeCampaign(campaign));

      setCampaigns(normalizedCampaigns);
      // Đảm bảo data.page luôn được xử lý như một number
      const backendPage = parseInt(String(data.page), 10); // Chuyển sang string rồi parse để an toàn
      setCurrentPage(isNaN(backendPage) ? 1 : backendPage); // Nếu parse lỗi, mặc định về 1
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / data.limit));

      return normalizedCampaigns;
    } catch (error) {
      return handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, apiClient, handleError]);

  // Lấy chi tiết chiến dịch theo ID
  const fetchCampaignById = useCallback(async (id: string): Promise<Campaign | null> => {
    setIsLoading(true);
    setError(null);

    // Thêm kiểm tra xác thực nếu cần thiết
    console.log(`[fetchCampaignById] Attempting fetch for ID: ${id}. IsAuthenticated: ${isAuthenticated}, AccessToken exists: ${!!accessToken}`);
    if (!isAuthenticated || !accessToken) {
      console.warn('[fetchCampaignById] Not authenticated or no access token. Aborting fetch.');
      setIsLoading(false);
      setError("Yêu cầu xác thực để tải dữ liệu.");
      return null;
    }

    try {
      const response = await apiClient.get(`/campaigns/${id}`);
      const campaignData = normalizeCampaign(response.data as CampaignApiData);

      setSelectedCampaign(campaignData);
      return campaignData;
    } catch (error) {
      return handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, apiClient, handleError]);

  // Tạo chiến dịch mới
  const createCampaign = useCallback(async (campaignData: Partial<Campaign>): Promise<Campaign | null> => {
    setIsLoading(true);
    setError(null);

    // Thêm kiểm tra xác thực
    console.log(`[createCampaign] Attempting create. IsAuthenticated: ${isAuthenticated}, AccessToken exists: ${!!accessToken}`);
     if (!isAuthenticated || !accessToken) {
      console.warn('[createCampaign] Not authenticated or no access token. Aborting create.');
      setIsLoading(false);
      setError("Yêu cầu xác thực để thực hiện hành động này.");
      return null;
    }

    try {
      // Chuyển đổi dữ liệu về đúng định dạng
      const payload = {
        ...campaignData,
        startDate: campaignData.startDate?.toISOString(),
        endDate: campaignData.endDate?.toISOString(),
      };

      const response = await apiClient.post('/campaigns', payload);
      const newCampaign = normalizeCampaign(response.data as CampaignApiData);

      // Cập nhật state
      setCampaigns(prev => [...prev, newCampaign]);

      toast.success('Tạo chiến dịch mới thành công!');
      return newCampaign;
    } catch (error) {
      return handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, apiClient, handleError]);

  // Cập nhật chiến dịch
  const updateCampaign = useCallback(async (id: string, campaignData: Partial<Campaign>): Promise<Campaign | null> => {
    setIsLoading(true);
    setError(null);

    // Thêm kiểm tra xác thực
    console.log(`[updateCampaign] Attempting update for ID: ${id}. IsAuthenticated: ${isAuthenticated}, AccessToken exists: ${!!accessToken}`);
     if (!isAuthenticated || !accessToken) {
       console.warn('[updateCampaign] Not authenticated or no access token. Aborting update.');
       setIsLoading(false);
       setError("Yêu cầu xác thực để thực hiện hành động này.");
       return null;
     }

    try {
      // Chuyển đổi dữ liệu về đúng định dạng
      const payload = {
        ...campaignData,
        startDate: campaignData.startDate instanceof Date ? campaignData.startDate.toISOString() : campaignData.startDate,
        endDate: campaignData.endDate instanceof Date ? campaignData.endDate.toISOString() : campaignData.endDate,
      };

      console.log('[CampaignContext] Updating campaign ID:', id);
      console.log('[CampaignContext] Update payload:', JSON.stringify(payload, null, 2)); // Log payload chi tiết

      const response = await apiClient.patch(`/campaigns/${id}`, payload);
      const updatedCampaign = normalizeCampaign(response.data as CampaignApiData);

      // Cập nhật state
      setCampaigns(prev =>
        prev.map(campaign => campaign._id === id ? updatedCampaign : campaign)
      );

      if (selectedCampaign?._id === id) {
        setSelectedCampaign(updatedCampaign);
      }

      toast.success('Cập nhật chiến dịch thành công!');
      return updatedCampaign;
    } catch (error) {
      return handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, selectedCampaign, apiClient, handleError]);

  // Xóa chiến dịch
  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    // Thêm kiểm tra xác thực
     console.log(`[deleteCampaign] Attempting delete for ID: ${id}. IsAuthenticated: ${isAuthenticated}, AccessToken exists: ${!!accessToken}`);
      if (!isAuthenticated || !accessToken) {
        console.warn('[deleteCampaign] Not authenticated or no access token. Aborting delete.');
        setIsLoading(false);
        setError("Yêu cầu xác thực để thực hiện hành động này.");
        return false;
      }

    try {
      await apiClient.delete(`/campaigns/${id}`);

      // Cập nhật state
      setCampaigns(prev => prev.filter(campaign => campaign._id !== id));

      if (selectedCampaign?._id === id) {
        setSelectedCampaign(null);
      }

      toast.success('Xóa chiến dịch thành công!');
      return true;
    } catch (error) {
      handleError(error as ApiErrorResponse);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, selectedCampaign, apiClient, handleError]);

  // Thêm sản phẩm vào chiến dịch
  const addProductsToCampaign = useCallback(async (
    campaignId: string,
    products: ProductInCampaign[]
  ): Promise<Campaign | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Chuyển đổi cấu trúc dữ liệu phân cấp thành cấu trúc phân cấp mới
      const restructuredProducts = products.map(product => {
        // Nếu sản phẩm đã có cấu trúc phân cấp mới, sử dụng trực tiếp
        if (product.variants) {
          return product;
        }

        // Nếu không, tạo cấu trúc phân cấp mới
        const newProduct: ProductInCampaign = {
          productId: product.productId,
          adjustedPrice: product.adjustedPrice,
          name: product.name,
          image: product.image,
          originalPrice: product.originalPrice,
          sku: product.sku,
          status: product.status,
          brandId: product.brandId,
          brand: product.brand,
          variants: []
        };

        return newProduct;
      });

      const response = await apiClient.post(
        `/campaigns/${campaignId}/products`,
        { products: restructuredProducts }
      );

      const updatedCampaign = normalizeCampaign(response.data as CampaignApiData);

      // Cập nhật state campaigns
      setCampaigns(prev => prev.map(campaign =>
        campaign._id === campaignId ? updatedCampaign : campaign
      ));

      // Cập nhật selectedCampaign nếu đang xem chiến dịch này
      if (selectedCampaign?._id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }

      toast.success('Đã thêm sản phẩm vào chiến dịch thành công', { id: 'campaign-add-product-success' });
      return updatedCampaign;
    } catch (error) {
      return handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, apiClient, selectedCampaign, handleError]);

  // Xóa sản phẩm khỏi chiến dịch
  const removeProductFromCampaign = useCallback(async (
    campaignId: string,
    productId: string,
    variantId?: string,
    combinationId?: string
  ): Promise<Campaign | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Tạo query params nếu có variantId hoặc combinationId
      let url = `/campaigns/${campaignId}/products/${productId}`;
      const params = new URLSearchParams();

      if (variantId) {
        params.append('variantId', variantId);
      }

      if (combinationId) {
        params.append('combinationId', combinationId);
      }

      // Thêm query params vào URL nếu có
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await apiClient.delete(url);

      const updatedCampaign = normalizeCampaign(response.data as CampaignApiData);

      // Cập nhật state campaigns
      setCampaigns(prev => prev.map(campaign =>
        campaign._id === campaignId ? updatedCampaign : campaign
      ));

      // Cập nhật selectedCampaign nếu đang xem chiến dịch này
      if (selectedCampaign?._id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }

      toast.success('Đã xóa sản phẩm khỏi chiến dịch thành công', { id: 'campaign-remove-product-success' });
      return updatedCampaign;
    } catch (error) {
      return handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, apiClient, selectedCampaign, handleError]);

  // Cập nhật giá sản phẩm trong chiến dịch
  const updateProductPriceInCampaign = useCallback(async (
    campaignId: string,
    productId: string,
    adjustedPrice: number,
    variantId?: string,
    combinationId?: string,
    showToast: boolean = false
  ): Promise<Campaign | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Tạo payload với các thông tin cần thiết
      const payload: {
        adjustedPrice: number;
        variantId?: string;
        combinationId?: string;
      } = {
        adjustedPrice
      };

      // Thêm variantId và combinationId vào payload nếu có
      if (variantId) {
        payload.variantId = variantId;
      }

      if (combinationId) {
        payload.combinationId = combinationId;
      }

      const response = await apiClient.patch(
        `/campaigns/${campaignId}/products/${productId}/price`,
        payload
      );

      const updatedCampaign = normalizeCampaign(response.data as CampaignApiData);

      // Cập nhật state campaigns
      setCampaigns(prev => prev.map(campaign =>
        campaign._id === campaignId ? updatedCampaign : campaign
      ));

      // Cập nhật selectedCampaign nếu đang xem chiến dịch này
      if (selectedCampaign?._id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }

      // Hiển thị thông báo nếu được yêu cầu
      if (showToast) {
        toast.success('Đã cập nhật giá sản phẩm trong chiến dịch thành công', { id: 'campaign-update-price-success' });
      }

      return updatedCampaign;
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      const errorMessage = apiError.response?.data?.message || 'Không thể cập nhật giá sản phẩm trong chiến dịch';
      setError(errorMessage);
      // Luôn hiển thị thông báo lỗi
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, apiClient, selectedCampaign]);

  // Lấy chiến dịch đang hoạt động (public)
  const fetchActiveCampaigns = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/campaigns/active`);
      const activeCampaignsData = (response.data as CampaignApiData[]).map((campaign: CampaignApiData) => normalizeCampaign(campaign));

      setActiveCampaigns(activeCampaignsData);
    } catch (error) {
      handleError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Lấy thống kê chiến dịch cho dashboard
  const fetchCampaignStats = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !accessToken) {
      console.warn('[fetchCampaignStats] Not authenticated or no access token. Aborting fetch.');
      return;
    }

    // Không set isLoading để không ảnh hưởng đến UI chính
    try {
      const response = await apiClient.get('/campaigns/stats');
      const statsData = response.data;

      // Chuẩn hóa dữ liệu endDate trong topPerformingCampaigns
      if (statsData.topPerformingCampaigns) {
        statsData.topPerformingCampaigns = statsData.topPerformingCampaigns.map((campaign: {
          _id: string;
          title: string;
          type: string;
          totalOrders: number;
          totalRevenue: number;
          endDate: string | Date;
          daysLeft: number;
        }) => ({
          ...campaign,
          endDate: new Date(campaign.endDate)
        }));
      }

      setDashboardStats(statsData);
      console.log('[fetchCampaignStats] Stats loaded successfully:', statsData);
    } catch (error) {
      // Không gọi handleError để tránh hiển thị toast error cho stats
      console.error('Error fetching campaign stats:', error);
      setDashboardStats(null);
    }
  }, [isAuthenticated, accessToken, apiClient]);

  // Reset state
  const resetState = useCallback(() => {
    setCampaigns([]);
    setSelectedCampaign(null);
    setDashboardStats(null);
    setError(null);
    setCurrentPage(1);
    setTotalItems(0);
    setTotalPages(1);
  }, []);

  // Context value
  const value: CampaignContextProps = {
    campaigns,
    activeCampaigns,
    selectedCampaign,
    stats,
    dashboardStats,
    isLoading,
    error,
    currentPage,
    totalItems,
    itemsPerPage,
    totalPages,
    fetchCampaigns,
    fetchCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addProductsToCampaign,
    removeProductFromCampaign,
    updateProductPriceInCampaign,
    fetchActiveCampaigns,
    fetchCampaignStats,
    resetState,
    setCurrentPage,
    setItemsPerPage
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};

export default CampaignProvider;
