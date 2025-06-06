import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Định nghĩa kiểu dữ liệu cho banner
export interface Banner {
  _id?: string;
  title: string;
  campaignId?: string;
  desktopImage: string;
  desktopImagePublicId?: string;
  desktopImageData?: string;
  mobileImage: string;
  mobileImagePublicId?: string;
  mobileImageData?: string;
  alt: string;
  href: string;
  active: boolean;
  order: number;
  startDate?: Date | string;
  endDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Định nghĩa kiểu dữ liệu cho context
interface BannerContextType {
  banners: Banner[];
  loading: boolean;
  error: string | null;
  totalBanners: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  statistics: {
    total: number;
    active: number;
    inactive: number;
    expiringSoon: number;
  } | null;
  // Phương thức cho Cloudinary
  uploadBannerImage: (
    imageData: string, 
    type: 'desktop' | 'mobile',
    campaignId?: string
  ) => Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
  // Các phương thức CRUD
  fetchBanners: (
    page?: number,
    limit?: number,
    search?: string,
    campaignId?: string,
    active?: boolean,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
  fetchActiveBanners: () => Promise<void>;
  fetchBannerById: (id: string) => Promise<Banner>;
  createBanner: (bannerData: Partial<Banner>) => Promise<Banner>;
  updateBanner: (id: string, bannerData: Partial<Banner>) => Promise<Banner>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<Banner>;
  changeBannerOrder: (id: string, direction: 'up' | 'down') => Promise<Banner[]>;
  fetchStatistics: () => Promise<void>;
}

// Tạo context
const BannerContext = createContext<BannerContextType | undefined>(undefined);

// Hook để sử dụng context
export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};

// Cấu hình API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';
const BANNER_API = {
  ADMIN: `${API_URL}/admin/banners`,
  PUBLIC: `${API_URL}/banners`
};

// Provider component
export const BannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBanners, setTotalBanners] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [statistics, setStatistics] = useState<BannerContextType['statistics']>(null);

  // Hàm lấy header xác thực
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    return {
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, []);

  // Xử lý lỗi chung
  const handleError = useCallback((error: Error & { status?: number }) => {
    console.error('Banner operation error:', error);
    const errorMessage = error.message || 'Đã xảy ra lỗi';
    setError(errorMessage);
    
    // Nếu là lỗi xác thực, chuyển hướng về trang đăng nhập
    if (error.status === 401) {
      router.push('/admin/login');
    }
    
    return errorMessage;
  }, [router]);

  // Upload ảnh lên Cloudinary thông qua API
  const uploadBannerImage = useCallback(async (
    imageData: string, 
    type: 'desktop' | 'mobile',
    campaignId?: string
  ) => {
    try {
      setLoading(true);
      
      console.log(`Đang tải lên ảnh ${type} lên Cloudinary...`);
      
      const response = await fetch(`${BANNER_API.ADMIN}/upload/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          imageData,
          type,
          campaignId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi upload Cloudinary:', errorData);
        throw new Error(errorData.message || `Lỗi khi tải lên ảnh: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Tải lên ảnh ${type} thành công, URL: ${data.url ? data.url.substring(0, 50) + '...' : 'không có'}`);
      return data;
    } catch (error) {
      console.error('Chi tiết lỗi upload ảnh:', error);
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch banners với phân trang và bộ lọc
  const fetchBanners = useCallback(async (
    page = 1,
    limit = 10,
    search = '',
    campaignId = '',
    active?: boolean,
    sortBy = 'order',
    sortOrder: 'asc' | 'desc' = 'asc',
    startDate = '',
    endDate = ''
  ) => {
    try {
      setLoading(true);
      
      // Tạo query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search);
      if (campaignId) queryParams.append('campaignId', campaignId);
      if (active !== undefined) queryParams.append('active', active.toString());
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await fetch(`${BANNER_API.ADMIN}?${queryParams.toString()}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching banners: ${response.status}`);
      }
      
      const data = await response.json();
      
      setBanners(data.items);
      setTotalBanners(data.total);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setItemsPerPage(data.limit);
      setError(null);
    } catch (error) {
      handleError(error as Error & { status?: number });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch banner by ID
  const fetchBannerById = useCallback(async (id: string): Promise<Banner> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BANNER_API.ADMIN}/${id}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching banner: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Create banner
  const createBanner = useCallback(async (bannerData: Partial<Banner>): Promise<Banner> => {
    try {
      setLoading(true);
      
      console.log('Đang tạo banner mới:', {
        title: bannerData.title,
        campaignId: bannerData.campaignId,
        hasDesktopImage: !!bannerData.desktopImage,
        hasDesktopImageData: !!(bannerData.desktopImageData && bannerData.desktopImageData.length > 100),
        hasMobileImage: !!bannerData.mobileImage,
        hasMobileImageData: !!(bannerData.mobileImageData && bannerData.mobileImageData.length > 100)
      });
      
      const response = await fetch(BANNER_API.ADMIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(bannerData)
      });
      
      // Đọc body response dưới dạng text trước để debug nếu có lỗi JSON
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError);
        console.error('Response text:', responseText.substring(0, 500));
        throw new Error(`Lỗi phân tích response từ server: ${(parseError as Error).message}`);
      }
      
      if (!response.ok) {
        console.error('Lỗi tạo banner:', data);
        throw new Error(data.message || `Lỗi tạo banner: ${response.status}`);
      }
      
      console.log('Tạo banner thành công:', data._id);
      
      // Cập nhật danh sách banner nếu đang ở trang 1
      if (currentPage === 1) {
        fetchBanners(1, itemsPerPage);
      }

      return data;
    } catch (error) {
      console.error('Chi tiết lỗi tạo banner:', error);
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchBanners, currentPage, itemsPerPage]);

  // Update banner
  const updateBanner = useCallback(async (id: string, bannerData: Partial<Banner>): Promise<Banner> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BANNER_API.ADMIN}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(bannerData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error updating banner: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cập nhật danh sách banner
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner._id === id ? data : banner
        )
      );

      return data;
    } catch (error) {
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Delete banner
  const deleteBanner = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BANNER_API.ADMIN}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error deleting banner: ${response.status}`);
      }
      
      // Cập nhật danh sách banner
      setBanners(prevBanners => 
        prevBanners.filter(banner => banner._id !== id)
      );
      
      // Cập nhật tổng số banner
      setTotalBanners(prev => prev - 1);
      
      // Refresh danh sách nếu trang hiện tại trống
      if (banners.length === 1 && currentPage > 1) {
        fetchBanners(currentPage - 1, itemsPerPage);
      } else {
        fetchBanners(currentPage, itemsPerPage);
      }
    } catch (error) {
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchBanners, banners.length, currentPage, itemsPerPage]);

  // Toggle banner status (active/inactive)
  const toggleBannerStatus = useCallback(async (id: string): Promise<Banner> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BANNER_API.ADMIN}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error toggling banner status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cập nhật danh sách banner
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner._id === id ? data : banner
        )
      );

      return data;
    } catch (error) {
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Change banner order (up/down)
  const changeBannerOrder = useCallback(async (id: string, direction: 'up' | 'down'): Promise<Banner[]> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BANNER_API.ADMIN}/${id}/change-order/${direction}`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error changing banner order: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Refresh danh sách sau khi thay đổi thứ tự
      fetchBanners(currentPage, itemsPerPage);

      return data;
    } catch (error) {
      handleError(error as Error & { status?: number });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchBanners, currentPage, itemsPerPage]);

  // Fetch banner statistics
  const fetchStatistics = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BANNER_API.ADMIN}/statistics`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching statistics: ${response.status}`);
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      handleError(error as Error & { status?: number });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch active banners (for public pages)
  const fetchActiveBanners = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      console.log('Đang lấy banner active cho trang public');
      
      const response = await fetch(`${BANNER_API.PUBLIC}/active`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi khi lấy banner active:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Lỗi khi lấy banner active: ${response.status}`);
        } catch {
          throw new Error(`Lỗi khi lấy banner active: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log(`Đã lấy ${data.length} banner active thành công`);
      
      setBanners(data);
      setError(null);
    } catch (error) {
      console.error('Chi tiết lỗi khi lấy banner active:', error);
      setError((error as Error).message || 'Lỗi khi lấy danh sách banner');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chuẩn bị giá trị cho context
  const value: BannerContextType = {
    banners,
    loading,
    error,
    totalBanners,
    currentPage,
    totalPages,
    itemsPerPage,
    statistics,
    uploadBannerImage,
    fetchBanners,
    fetchActiveBanners,
    fetchBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    changeBannerOrder,
    fetchStatistics
  };

  return (
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
};

export default BannerContext; 