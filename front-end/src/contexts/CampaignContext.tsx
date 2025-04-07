import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from './AdminAuthContext';
import axios from 'axios';
import { useRouter } from 'next/router';

// Định nghĩa API_URL từ biến môi trường hoặc giá trị mặc định
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Định nghĩa kiểu dữ liệu
export interface CampaignProduct {
  productId: string;
  productName?: string;
  variantId?: string;
  variantName?: string;
  originalPrice?: number;
  adjustedPrice: number;
  image?: string;
}

export interface Campaign {
  _id: string;
  title: string;
  description: string;
  type: 'Hero Banner' | 'Sale Event';
  startDate: Date;
  endDate: Date;
  products: CampaignProduct[];
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

interface CampaignContextProps {
  // State
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  selectedCampaign: Campaign | null;
  stats: CampaignStats;
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
  ) => Promise<void>;
  fetchCampaignById: (id: string) => Promise<Campaign | null>;
  createCampaign: (campaignData: Partial<Campaign>) => Promise<Campaign | null>;
  updateCampaign: (id: string, campaignData: Partial<Campaign>) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
  
  // Public Actions
  fetchActiveCampaigns: () => Promise<void>;
  
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
  const handleError = useCallback((error: any) => {
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
  const normalizeCampaign = (campaignData: any): Campaign => {
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
      console.log('[CampaignContext Interceptor] Attaching token:', accessToken ? `${accessToken.substring(0, 15)}...` : 'No token');
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
      const data = response.data;
      
      // Chuẩn hóa dữ liệu chiến dịch
      const normalizedCampaigns = data.campaigns.map((campaign: any) => normalizeCampaign(campaign));
      
      setCampaigns(normalizedCampaigns);
      setCurrentPage(data.page);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / data.limit));
      
      return normalizedCampaigns;
    } catch (error: any) {
      return handleError(error);
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
      const campaignData = normalizeCampaign(response.data);
      
      setSelectedCampaign(campaignData);
      return campaignData;
    } catch (error: any) {
      return handleError(error);
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
      const newCampaign = normalizeCampaign(response.data);
      
      // Cập nhật state
      setCampaigns(prev => [...prev, newCampaign]);
      
      toast.success('Tạo chiến dịch mới thành công!');
      return newCampaign;
    } catch (error: any) {
      return handleError(error);
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
        startDate: campaignData.startDate?.toISOString(),
        endDate: campaignData.endDate?.toISOString(),
      };
      
      const response = await apiClient.patch(`/campaigns/${id}`, payload);
      const updatedCampaign = normalizeCampaign(response.data);
      
      // Cập nhật state
      setCampaigns(prev => 
        prev.map(campaign => campaign._id === id ? updatedCampaign : campaign)
      );
      
      if (selectedCampaign?._id === id) {
        setSelectedCampaign(updatedCampaign);
      }
      
      toast.success('Cập nhật chiến dịch thành công!');
      return updatedCampaign;
    } catch (error: any) {
      return handleError(error);
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
    } catch (error: any) {
      handleError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, selectedCampaign, apiClient, handleError]);

  // Lấy chiến dịch đang hoạt động (public)
  const fetchActiveCampaigns = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/campaigns/active`);
      const activeCampaignsData = response.data.map((campaign: any) => normalizeCampaign(campaign));
      
      setActiveCampaigns(activeCampaignsData);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Reset state
  const resetState = useCallback(() => {
    setCampaigns([]);
    setSelectedCampaign(null);
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
    fetchActiveCampaigns,
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