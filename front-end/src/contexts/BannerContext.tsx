import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth } from './AdminAuthContext';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho Banner
export interface Banner {
  _id: string;
  title: string;
  campaignId?: string;
  desktopImage: string;
  mobileImage: string;
  alt?: string;
  href?: string;
  active: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Response từ API phân trang
export interface PaginatedBannersResponse {
  items: Banner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Định nghĩa kiểu dữ liệu cho việc lọc banner
export interface BannerFilter {
  page?: number;
  limit?: number;
  search?: string;
  campaignId?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

// Định nghĩa kiểu dữ liệu cho form thêm/sửa banner
export interface BannerFormData {
  title: string;
  campaignId?: string;
  desktopImage: string;
  mobileImage: string;
  alt?: string;
  href?: string;
  active?: boolean;
  order?: number;
  startDate?: string;
  endDate?: string;
}

// Kiểu dữ liệu thống kê
export interface BannerStats {
  total: number;
  active: number;
  inactive: number;
  expiringSoon: number;
}

// Định nghĩa kiểu dữ liệu cho context
interface BannerContextType {
  // Dữ liệu
  banners: Banner[];
  activeBanners: Banner[];
  currentBanner: Banner | null;
  loading: boolean;
  error: string | null;
  stats: BannerStats | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchBanners: (filter?: BannerFilter) => Promise<void>;
  fetchActiveBanners: () => Promise<void>;
  fetchBannerById: (id: string) => Promise<Banner>;
  createBanner: (data: BannerFormData) => Promise<Banner>;
  updateBanner: (id: string, data: Partial<BannerFormData>) => Promise<Banner>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<Banner>;
  changeBannerOrder: (id: string, direction: 'up' | 'down') => Promise<Banner[]>;
  fetchBannerStats: () => Promise<void>;
}

// Tạo context
const BannerContext = createContext<BannerContextType | undefined>(undefined);

// Các hàm tiện ích cho xác thực và token
const getAuthToken = (): string | null => {
  // Thứ tự ưu tiên: token từ cookie > token từ localStorage
  const token = Cookies.get('adminToken') || localStorage.getItem('adminToken');
  return token;
};

// Tạo instance axios với xử lý token
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor để thêm token vào request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor để xử lý refresh token khi token hết hạn
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Thử làm mới token
        const refreshToken = Cookies.get('adminRefreshToken') || localStorage.getItem('adminRefreshToken');
        if (!refreshToken) {
          throw new Error('Không tìm thấy refresh token');
        }
        
        const response = await axios.post('/api/admin/auth/refresh', { refreshToken });
        
        if (response.data && response.data.accessToken) {
          // Lưu token mới
          Cookies.set('adminToken', response.data.accessToken, { expires: 1/24 }); // 1 giờ
          localStorage.setItem('adminToken', response.data.accessToken);
          
          // Thêm token mới vào request gốc và thử lại
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Lỗi khi làm mới token:', refreshError);
        // Chuyển hướng về trang đăng nhập nếu refresh token thất bại
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Provider
export const BannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const adminAuth = useAdminAuth();
  const { isAuthenticated } = adminAuth;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Hàm xử lý lỗi
  const handleError = (error: any) => {
    console.error('Banner API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  // Lấy danh sách banner (phân trang, lọc)
  const fetchBanners = async (filter: BannerFilter = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Tạo query string từ filter
      const queryParams = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get<PaginatedBannersResponse>(
        `/admin/banners?${queryParams.toString()}`
      );
      
      setBanners(response.data.items);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách banner đang active (cho homepage)
  const fetchActiveBanners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<Banner[]>(
        `/banners/active`
      );
      
      setActiveBanners(response.data);
    } catch (err: any) {
      // Đặc biệt xử lý trường hợp API không có sẵn (404)
      console.error('Banner API Error:', err);
      
      // Nếu là lỗi 404, đặt mảng rỗng và không hiển thị lỗi
      if (err.response && err.response.status === 404) {
        setActiveBanners([]);
        setError('API chưa sẵn sàng');
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải banner';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin chi tiết banner
  const fetchBannerById = async (id: string): Promise<Banner> => {
    if (!isAuthenticated) throw new Error('Không có quyền truy cập');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<Banner>(
        `/admin/banners/${id}`
      );
      
      setCurrentBanner(response.data);
      return response.data;
    } catch (err: any) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Tạo banner mới
  const createBanner = async (data: BannerFormData): Promise<Banner> => {
    if (!isAuthenticated) throw new Error('Không có quyền truy cập');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<Banner>(
        `/admin/banners`,
        data
      );
      
      // Cập nhật danh sách banner và đảm bảo hoàn thành trước khi trả về kết quả
      await fetchBanners({ page: pagination.page, limit: pagination.limit });
      
      return response.data;
    } catch (err: any) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật banner
  const updateBanner = async (id: string, data: Partial<BannerFormData>): Promise<Banner> => {
    if (!isAuthenticated) throw new Error('Không có quyền truy cập');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch<Banner>(
        `/admin/banners/${id}`,
        data
      );
      
      // Cập nhật danh sách banner và đảm bảo hoàn thành trước khi trả về kết quả
      await fetchBanners({ page: pagination.page, limit: pagination.limit });
      
      return response.data;
    } catch (err: any) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa banner
  const deleteBanner = async (id: string): Promise<void> => {
    if (!isAuthenticated) throw new Error('Không có quyền truy cập');
    
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(
        `/admin/banners/${id}`
      );
      
      // Cập nhật danh sách banner
      await fetchBanners({ page: pagination.page, limit: pagination.limit });
    } catch (err: any) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Bật/tắt trạng thái banner
  const toggleBannerStatus = async (id: string): Promise<Banner> => {
    if (!isAuthenticated) throw new Error('Không có quyền truy cập');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch<Banner>(
        `/admin/banners/${id}/toggle-status`,
        {}
      );
      
      // Cập nhật danh sách banner
      await fetchBanners({ page: pagination.page, limit: pagination.limit });
      
      return response.data;
    } catch (err: any) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Thay đổi thứ tự hiển thị banner
  const changeBannerOrder = async (id: string, direction: 'up' | 'down'): Promise<Banner[]> => {
    if (!isAuthenticated) throw new Error('Không có quyền truy cập');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch<Banner[]>(
        `/admin/banners/${id}/change-order/${direction}`,
        {}
      );
      
      // Cập nhật danh sách banner
      await fetchBanners({ page: pagination.page, limit: pagination.limit });
      
      return response.data;
    } catch (err: any) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy thống kê banner
  const fetchBannerStats = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<BannerStats>(
        `/admin/banners/statistics`
      );
      
      setStats(response.data);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BannerContext.Provider value={{
      // State
      banners,
      activeBanners,
      currentBanner,
      loading,
      error,
      stats,
      pagination,
      
      // Actions
      fetchBanners,
      fetchActiveBanners,
      fetchBannerById,
      createBanner,
      updateBanner,
      deleteBanner,
      toggleBannerStatus,
      changeBannerOrder,
      fetchBannerStats
    }}>
      {children}
    </BannerContext.Provider>
  );
};

// Custom hook để sử dụng banner context
export const useBanner = () => {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}; 