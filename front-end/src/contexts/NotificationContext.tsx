import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from './AdminAuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';

// Định nghĩa API_URL từ biến môi trường hoặc giá trị mặc định
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Định nghĩa kiểu dữ liệu
export interface Notification {
  _id?: string;
  content: string;
  type: string;
  link?: string;
  priority: number;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationStats {
  total: number;
  active: number;
  inactive: number;
  expiringSoon: number;
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Định nghĩa kiểu dữ liệu cho context
interface NotificationContextProps {
  // State
  notifications: Notification[];
  activeNotifications: Notification[];
  stats: NotificationStats;
  paginatedData: PaginatedResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedNotification: Notification | null;
  
  // Admin Actions
  getNotifications: (params?: QueryParams) => Promise<void>;
  getStatistics: () => Promise<void>;
  getNotificationById: (id: string) => Promise<Notification | null>;
  createNotification: (data: Partial<Notification>) => Promise<boolean>;
  updateNotification: (id: string, data: Partial<Notification>) => Promise<boolean>;
  toggleNotificationStatus: (id: string) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  
  // User Actions
  getActiveNotifications: () => Promise<void>;
  
  // Utilities
  formatNotificationDate: (date: Date | string | null | undefined) => string;
  resetError: () => void;
}

// Khởi tạo context với giá trị mặc định
const NotificationContext = createContext<NotificationContextProps>({} as NotificationContextProps);

// Custom hook để sử dụng context
export const useNotification = () => useContext(NotificationContext);

// Các hàm tiện ích cho xác thực và token
const getAuthToken = (): string | null => {
  // Thứ tự ưu tiên: accessToken từ context > token từ cookie > token từ localStorage
  const token = Cookies.get('adminToken') || localStorage.getItem('adminToken');
  return token;
};

// Tạo instance axios với xử lý token
const apiClient = axios.create({
  baseURL: API_URL,
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
        
        const response = await axios.post(`${API_URL}/admin/auth/refresh`, { refreshToken });
        
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

// Provider component
export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Sử dụng context admin auth
  const { accessToken } = useAdminAuth();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    active: 0,
    inactive: 0,
    expiringSoon: 0,
  });
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Hàm xử lý lỗi
  const handleError = (error: any) => {
    console.error('Notification API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định';
    setError(errorMessage);
    toast.error(errorMessage);
    return false;
  };

  // Hàm format dữ liệu thông báo từ API
  const formatNotification = (notificationData: any): Notification => {
    return {
      ...notificationData,
      startDate: notificationData.startDate ? new Date(notificationData.startDate) : new Date(),
      endDate: notificationData.endDate ? new Date(notificationData.endDate) : null,
      createdAt: notificationData.createdAt ? new Date(notificationData.createdAt) : undefined,
      updatedAt: notificationData.updatedAt ? new Date(notificationData.updatedAt) : undefined,
    };
  };

  // Hàm format ngày tháng
  const formatNotificationDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Không giới hạn';
    try {
      return new Date(date).toLocaleDateString('vi-VN');
    } catch (error) {
      return String(date);
    }
  };

  // Hàm reset error
  const resetError = () => {
    setError(null);
  };

  // API Functions cho Admin
  
  // Lấy danh sách thông báo có phân trang
  const getNotifications = async (params: QueryParams = {}): Promise<void> => {
    setIsLoading(true);
    resetError();
    
    try {
      // Xây dựng query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      // Gọi API
      const response = await apiClient.get(`/admin/notifications?${queryParams.toString()}`);
      
      const data = response.data;
      
      // Format dữ liệu thông báo
      const formattedItems = Array.isArray(data.items) 
        ? data.items.map((item: any) => formatNotification(item))
        : [];
      
      // Cập nhật state
      setPaginatedData({
        items: formattedItems,
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || 1
      });
      setNotifications(formattedItems);
    } catch (error: any) {
      console.error('Chi tiết lỗi getNotifications:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lấy thống kê thông báo
  const getStatistics = async (): Promise<void> => {
    setIsLoading(true);
    resetError();
    
    try {
      // Gọi API thống kê
      const response = await apiClient.get('/admin/notifications/statistics');
      
      const data = response.data;
      setStats(data);
    } catch (error: any) {
      console.error('Chi tiết lỗi getStatistics:', error);
      // Đặt giá trị mặc định cho stats khi có lỗi
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        expiringSoon: 0
      });
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lấy chi tiết thông báo theo ID
  const getNotificationById = async (id: string): Promise<Notification | null> => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await apiClient.get(`/admin/notifications/${id}`);
      
      const data = response.data;
      const formattedNotification = formatNotification(data);
      
      setSelectedNotification(formattedNotification);
      return formattedNotification;
    } catch (error: any) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Tạo thông báo mới
  const createNotification = async (data: Partial<Notification>): Promise<boolean> => {
    setIsLoading(true);
    resetError();
    
    try {
      await apiClient.post('/admin/notifications', data);
      
      toast.success('Tạo thông báo mới thành công!');
      
      // Cập nhật lại danh sách và thống kê
      await getNotifications();
      await getStatistics();
      
      return true;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cập nhật thông báo
  const updateNotification = async (id: string, data: Partial<Notification>): Promise<boolean> => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await apiClient.patch(`/admin/notifications/${id}`, data);
      
      toast.success('Cập nhật thông báo thành công!');
      
      // Cập nhật lại danh sách và thống kê
      await getNotifications();
      await getStatistics();
      
      if (selectedNotification && selectedNotification._id === id) {
        const updatedNotification = response.data;
        setSelectedNotification(formatNotification(updatedNotification));
      }
      
      return true;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Bật/tắt trạng thái thông báo
  const toggleNotificationStatus = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await apiClient.patch(`/admin/notifications/${id}/toggle-status`);
      
      toast.success('Thay đổi trạng thái thông báo thành công!');
      
      // Cập nhật lại danh sách và thống kê
      await getNotifications();
      await getStatistics();
      
      if (selectedNotification && selectedNotification._id === id) {
        const updatedNotification = response.data;
        setSelectedNotification(formatNotification(updatedNotification));
      }
      
      return true;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Xóa thông báo
  const deleteNotification = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    resetError();
    
    try {
      await apiClient.delete(`/admin/notifications/${id}`);
      
      toast.success('Xóa thông báo thành công!');
      
      // Cập nhật lại danh sách và thống kê
      await getNotifications();
      await getStatistics();
      
      if (selectedNotification && selectedNotification._id === id) {
        setSelectedNotification(null);
      }
      
      return true;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // API Functions cho User
  
  // Lấy danh sách thông báo đang hiển thị
  const getActiveNotifications = async (): Promise<void> => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await fetch(`${API_URL}/notifications`);
      
      if (!response.ok) {
        throw new Error('Không thể tải thông báo');
      }
      
      const data = await response.json();
      const formattedNotifications = data.map((item: any) => formatNotification(item));
      
      setActiveNotifications(formattedNotifications);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Khởi tạo giá trị mặc định cho stats
  useEffect(() => {
    setStats({
      total: 0,
      active: 0,
      inactive: 0,
      expiringSoon: 0
    });
  }, []);

  // Context value
  const value = {
    notifications,
    activeNotifications,
    stats,
    paginatedData,
    isLoading,
    error,
    selectedNotification,
    getNotifications,
    getStatistics,
    getNotificationById,
    createNotification,
    updateNotification,
    toggleNotificationStatus,
    deleteNotification,
    getActiveNotifications,
    formatNotificationDate,
    resetError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 