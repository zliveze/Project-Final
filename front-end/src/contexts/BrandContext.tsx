import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
// Remove import from BrandForm if defined here now
// import { Brand } from '@/components/admin/brands/BrandForm';
import { useAdminAuth } from './AdminAuthContext';
import toast from 'react-hot-toast';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = false;

// Hàm debug có điều kiện
const debugLog = (message: string, data?: unknown) => {
  if (DEBUG_MODE) {
    console.log(`[BrandContext] ${message}`, data || '');
  }
};

// Define and Export Brand interface here
export interface Brand {
  id?: string; // Use id primarily from API response (_id might be internal)
  _id?: string; // Keep _id for potential internal use or older data
  name: string;
  slug?: string;
  description?: string;
  logo?: {
    url?: string;
    alt?: string;
    publicId?: string;
  };
  logoFile?: File; // For client-side handling before upload
  origin?: string;
  website?: string;
  featured?: boolean;
  status?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  productCount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}


export interface BrandStatistics {
  total: number;
  active: number;
  inactive: number;
  featured: number;
}

export interface BrandContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  statistics: BrandStatistics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  // Update fetchBrands signature to accept filters
  fetchBrands: (page: number, limit: number, filters?: Record<string, unknown>) => Promise<{
    items: Brand[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | undefined>; // Return data for ItemSelectionModal
  fetchBrand: (id: string) => Promise<Brand | null>;
  createBrand: (brandData: Partial<Brand>) => Promise<Brand | null>;
  updateBrand: (id: string, brandData: Partial<Brand>) => Promise<Brand | null>;
  deleteBrand: (id: string) => Promise<boolean>;
  toggleBrandStatus: (id: string) => Promise<Brand | null>;
  toggleBrandFeatured: (id: string) => Promise<Brand | null>;
  uploadBrandLogo: (file: File) => Promise<{url: string, publicId: string} | null>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrands = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};

interface BrandProviderProps {
  children: ReactNode;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const { accessToken, isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();

  // Tách endpoint sang biến riêng để dễ quản lý - gọi trực tiếp đến backend API
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const API_ENDPOINTS = {
    BRANDS: `${API_BASE_URL}/admin/brands`,
    BRAND_DETAIL: (id: string) => `${API_BASE_URL}/admin/brands/${id}`,
    BRAND_STATUS: (id: string) => `${API_BASE_URL}/admin/brands/${id}/toggle-status`,
    BRAND_FEATURED: (id: string) => `${API_BASE_URL}/admin/brands/${id}/toggle-featured`,
    BRAND_LOGO_UPLOAD: `${API_BASE_URL}/admin/brands/upload/logo`,
    BRAND_STATISTICS: `${API_BASE_URL}/admin/brands/statistics`
  };

  // Chuyển đổi dữ liệu từ API sang định dạng frontend
  const transformBrand = (brandData: {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    logo?: {
      url: string;
      alt?: string;
      publicId?: string;
    };
    origin?: string;
    website?: string;
    featured?: boolean;
    status?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
    };
    productCount?: number;
    createdAt?: string;
    updatedAt?: string;
  }): Brand => {
    return {
      id: brandData._id,
      name: brandData.name,
      slug: brandData.slug || brandData.name.toLowerCase().replace(/\s+/g, '-'),
      description: brandData.description || '',
      logo: {
        url: brandData.logo?.url || '',
        alt: brandData.logo?.alt || brandData.name
      },
      origin: brandData.origin || '',
      website: brandData.website || '',
      featured: brandData.featured || false,
      status: brandData.status || 'active',
      socialMedia: {
        facebook: brandData.socialMedia?.facebook || '',
        instagram: brandData.socialMedia?.instagram || '',
        youtube: brandData.socialMedia?.youtube || ''
      },
      productCount: brandData.productCount || 0,
      createdAt: brandData.createdAt,
      updatedAt: brandData.updatedAt
    };
  };

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BRAND_STATISTICS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        debugLog('Error fetching brand statistics:', response.statusText);
        return null;
      }

      const data = await response.json();
      setStatistics(data);
      return data;
    } catch (err) {
      debugLog('Error fetching brand statistics:', err);
      return null;
    }
  }, [accessToken, API_ENDPOINTS.BRAND_STATISTICS]);

  const fetchBrands = useCallback(async (page = 1, limit = 10, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Kiểm tra xác thực trước khi gọi API
      if (!isAuthenticated || !accessToken) {
        console.log('Không có token hoặc chưa xác thực, bỏ qua việc tải dữ liệu thương hiệu');
        setLoading(false);
        return;
      }

      // Chuẩn bị params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Thêm các bộ lọc
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value as string);
        }
      });

      debugLog(`Đang gọi API lấy danh sách thương hiệu...`);

      const paramsString = params.toString();
      const url = `${API_ENDPOINTS.BRANDS}${paramsString ? `?${paramsString}` : ''}`;

      // Gọi API lấy danh sách thương hiệu
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Xử lý ngay trường hợp lỗi xác thực 401
      if (response.status === 401) {
        debugLog('Token hết hạn hoặc không hợp lệ, chuyển hướng đến trang đăng nhập');
        setLoading(false);
        // Không throw error ở đây để tránh lỗi unhandled
        setBrands([]);
        await logout();
        router.push('/admin/auth/login');
        return;
      }

      // Đọc response dưới dạng text trước để xử lý lỗi JSON
      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Lỗi khi phân tích JSON từ phản hồi API:', parseError);
        debugLog('Phản hồi thô từ server:', responseText.substring(0, 200));
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        debugLog(`Lỗi khi lấy danh sách thương hiệu, status: ${response.status}`, data);
        throw new Error(data.message || 'Lỗi khi lấy danh sách thương hiệu');
      }

      if (!data.items || !Array.isArray(data.items)) {
        debugLog('Server trả về dữ liệu không hợp lệ (không có mảng items):', data);
        setBrands([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        });
        return data;
      }

      // Cập nhật danh sách thương hiệu và thông tin phân trang
      setBrands(data.items.map(transformBrand));
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });

      // Gọi API lấy thống kê
      fetchStatistics();

      return data;
    } catch (err) {
      debugLog('Error fetching brands:', err);

      // Xử lý lỗi
      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 ||
          typeof error.message === 'string' && (
            error.message.includes('xác thực') ||
            error.message.includes('Unauthorized') ||
            error.message.toLowerCase().includes('token')
          )
      ) {
        debugLog('Phiên đăng nhập hết hạn, đăng xuất và chuyển hướng');
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        setBrands([]);

        try {
          await logout();
          router.push('/admin/auth/login');
        } catch (logoutError) {
          debugLog('Lỗi khi đăng xuất:', logoutError);
        }
      } else {
        setError(error.message || 'Có lỗi xảy ra khi lấy danh sách thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi lấy danh sách thương hiệu');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, logout, router, API_ENDPOINTS.BRANDS, fetchStatistics]);



  const fetchBrand = async (id: string): Promise<Brand | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.BRAND_DETAIL(id), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi lấy thông tin thương hiệu');
      }

      const data = await response.json();
      return transformBrand(data);
    } catch (err) {
      debugLog('Error fetching brand details:', err);

      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 || error.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi lấy thông tin thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi lấy thông tin thương hiệu');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brandData: Partial<Brand>): Promise<Brand | null> => {
    setLoading(true);
    setError(null);

    try {
      // Chuẩn bị dữ liệu để gửi đến API
      const apiData: {
        name?: string;
        description?: string;
        origin?: string;
        website?: string;
        featured?: boolean;
        status?: string;
        socialMedia?: {
          facebook?: string;
          instagram?: string;
          youtube?: string;
        };
        logo?: {
          url: string;
          alt?: string;
          publicId?: string;
        };
      } = {
        name: brandData.name,
        description: brandData.description,
        origin: brandData.origin,
        website: brandData.website,
        featured: brandData.featured,
        status: brandData.status,
        socialMedia: brandData.socialMedia
      };

      // Xử lý tải lên logo nếu có file
      if (brandData.logoFile) {
        debugLog('createBrand: Có logo file, gửi lên server');
        const uploadResult = await uploadBrandLogo(brandData.logoFile);
        if (uploadResult) {
          debugLog('createBrand: Upload logo thành công, url:', uploadResult.url);
          apiData.logo = {
            url: uploadResult.url,
            alt: brandData.logo?.alt || brandData.name,
            publicId: uploadResult.publicId
          };
        } else {
          debugLog('createBrand: Upload logo thất bại');
          throw new Error('Không thể tải ảnh logo lên, vui lòng thử lại');
        }
      } else if (brandData.logo?.url) {
        debugLog('createBrand: Sử dụng URL logo có sẵn');
        apiData.logo = {
          url: brandData.logo.url,
          alt: brandData.logo.alt || brandData.name
        };
      } else {
        debugLog('createBrand: Không có thông tin logo');
        // Không còn yêu cầu bắt buộc phải có logo
      }

      const response = await fetch(API_ENDPOINTS.BRANDS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi thêm thương hiệu');
      }

      const data = await response.json();

      // Chuyển đổi dữ liệu từ API sang định dạng phù hợp
      const newBrand = transformBrand(data);

      // Thêm thương hiệu mới vào state
      setBrands(prevBrands => [...prevBrands, newBrand]);

      // Cập nhật thống kê
      fetchStatistics();

      toast.success('Thêm thương hiệu thành công!');
      return newBrand;
    } catch (err) {
      debugLog('Error creating brand:', err);

      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 || error.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi thêm thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi thêm thương hiệu');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (id: string, brandData: Partial<Brand>): Promise<Brand | null> => {
    setLoading(true);
    setError(null);

    try {
      // Chuẩn bị dữ liệu để gửi đến API
      const apiData: {
        name?: string;
        description?: string;
        origin?: string;
        website?: string;
        featured?: boolean;
        status?: string;
        socialMedia?: {
          facebook?: string;
          instagram?: string;
          youtube?: string;
        };
        logo?: {
          url: string;
          alt?: string;
          publicId?: string;
        };
      } = {
        name: brandData.name,
        description: brandData.description,
        origin: brandData.origin,
        website: brandData.website,
        featured: brandData.featured,
        status: brandData.status,
        socialMedia: brandData.socialMedia
      };

      // Xử lý tải lên logo nếu có file mới
      if (brandData.logoFile) {
        debugLog('updateBrand: Có logo file mới, gửi lên server');
        const uploadResult = await uploadBrandLogo(brandData.logoFile);
        if (uploadResult) {
          debugLog('updateBrand: Upload logo thành công, url:', uploadResult.url);
          apiData.logo = {
            url: uploadResult.url,
            alt: brandData.logo?.alt || brandData.name,
            publicId: uploadResult.publicId
          };
        } else {
          debugLog('updateBrand: Upload logo thất bại');
          throw new Error('Không thể tải ảnh logo lên, vui lòng thử lại');
        }
      } else if (brandData.logo?.url) {
        // Nếu không có file mới, sử dụng URL logo hiện tại
        debugLog('updateBrand: Giữ nguyên URL logo hiện tại');
        apiData.logo = {
          url: brandData.logo.url,
          alt: brandData.logo.alt || brandData.name,
          publicId: brandData.logo.publicId // Đảm bảo giữ lại publicId nếu có
        };
      }

      // Kiểm tra ID thương hiệu trước khi gửi yêu cầu
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('ID thương hiệu không hợp lệ');
      }

      debugLog(`Đang gửi yêu cầu cập nhật cho brand ID: ${id}`, apiData);

      // Sử dụng đúng định dạng ID trong URL API
      const response = await fetch(API_ENDPOINTS.BRAND_DETAIL(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(apiData)
      });

      // Đọc response dưới dạng text trước để kiểm tra
      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error('Lỗi phân tích JSON response');
        debugLog('Response text:', responseText);
        throw new Error('Lỗi khi phân tích dữ liệu phản hồi từ server');
      }

      if (!response.ok) {
        debugLog(`Lỗi cập nhật brand, status: ${response.status}`, data);
        throw new Error(data.message || 'Lỗi khi cập nhật thương hiệu');
      }

      // Cập nhật danh sách thương hiệu
      const updatedBrand = transformBrand(data);
      setBrands(prevBrands =>
        prevBrands.map(brand =>
          brand.id === id ? updatedBrand : brand
        )
      );

      toast.success('Cập nhật thương hiệu thành công!');
      return updatedBrand;
    } catch (err) {
      debugLog('Error updating brand:', err);

      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 || error.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi cập nhật thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi cập nhật thương hiệu');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Kiểm tra ID thương hiệu trước khi gửi yêu cầu
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('ID thương hiệu không hợp lệ');
      }

      const response = await fetch(API_ENDPOINTS.BRAND_DETAIL(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi xóa thương hiệu');
      }

      // Cập nhật danh sách thương hiệu
      setBrands(prevBrands => prevBrands.filter(brand => brand.id !== id));

      // Cập nhật thống kê
      fetchStatistics();

      toast.success('Xóa thương hiệu thành công!');
      return true;
    } catch (err) {
      debugLog('Error deleting brand:', err);

      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 || error.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi xóa thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi xóa thương hiệu');
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandStatus = async (id: string): Promise<Brand | null> => {
    setLoading(true);
    setError(null);

    try {
      const brand = brands.find(b => b.id === id);
      if (!brand) {
        throw new Error('Không tìm thấy thương hiệu');
      }

      // Đảo ngược trạng thái hiện tại
      const newStatus = brand.status === 'active' ? 'inactive' : 'active';

      const response = await fetch(API_ENDPOINTS.BRAND_STATUS(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi thay đổi trạng thái thương hiệu');
      }

      const data = await response.json();

      // Cập nhật danh sách thương hiệu
      const updatedBrand = transformBrand(data);
      setBrands(prevBrands =>
        prevBrands.map(brand =>
          brand.id === id ? updatedBrand : brand
        )
      );

      // Cập nhật thống kê
      fetchStatistics();

      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} thương hiệu!`);
      return updatedBrand;
    } catch (err) {
      debugLog('Error toggling brand status:', err);

      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 || error.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi thay đổi trạng thái thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi thay đổi trạng thái thương hiệu');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandFeatured = async (id: string): Promise<Brand | null> => {
    setLoading(true);
    setError(null);

    try {
      const brand = brands.find(b => b.id === id);
      if (!brand) {
        throw new Error('Không tìm thấy thương hiệu');
      }

      // Đảo ngược trạng thái hiện tại
      const newFeatured = !brand.featured;

      const response = await fetch(API_ENDPOINTS.BRAND_FEATURED(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ featured: newFeatured })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi thay đổi trạng thái nổi bật của thương hiệu');
      }

      const data = await response.json();

      // Cập nhật danh sách thương hiệu
      const updatedBrand = transformBrand(data);
      setBrands(prevBrands =>
        prevBrands.map(brand =>
          brand.id === id ? updatedBrand : brand
        )
      );

      // Cập nhật thống kê
      fetchStatistics();

      toast.success(`Đã ${newFeatured ? 'đánh dấu' : 'bỏ đánh dấu'} thương hiệu nổi bật!`);
      return updatedBrand;
    } catch (err) {
      debugLog('Error toggling brand featured status:', err);

      const error = err as Error & { response?: { status: number } };
      if (error.response?.status === 401 || error.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi thay đổi trạng thái nổi bật của thương hiệu');
        toast.error(error.message || 'Có lỗi xảy ra khi thay đổi trạng thái nổi bật của thương hiệu');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadBrandLogo = async (file: File): Promise<{url: string, publicId: string} | null> => {
    setLoading(true);
    try {
      // Tạo FormData để gửi file
      console.log('Bắt đầu uploadBrandLogo với file:', file.name, 'size:', file.size, 'type:', file.type);

      const formData = new FormData();
      formData.append('file', file);

      console.log(`Đã tạo FormData, gửi request đến ${API_ENDPOINTS.BRAND_LOGO_UPLOAD}`);

      // Gọi API backend trực tiếp
      const response = await fetch(API_ENDPOINTS.BRAND_LOGO_UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      debugLog('Nhận response, status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        debugLog('Response error:', error);
        throw new Error(error.message || 'Lỗi khi tải ảnh lên');
      }

      const data = await response.json();
      debugLog('Upload thành công, data:', data);

      return {
        url: data.url,
        publicId: data.publicId
      };
    } catch (err) {
      debugLog('Error uploading logo:', err);
      const error = err as Error;
      setError(error.message || 'Có lỗi xảy ra khi tải logo');
      toast.error(error.message || 'Có lỗi xảy ra khi tải logo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tải thương hiệu khi component được mount và khi accessToken thay đổi
  useEffect(() => {
    const loadBrands = async () => {
      try {
        // Chỉ gọi API khi người dùng đã xác thực và có accessToken
        if (isAuthenticated && accessToken) {
          // Kiểm tra đường dẫn hiện tại, chỉ gọi API nếu người dùng đang ở trang brands
          const isAdminBrandsPage = router.pathname.includes('/admin/brands');

          if (isAdminBrandsPage) {
            debugLog('Đang ở trang brands, tải dữ liệu thương hiệu...');
            // Thêm timeout nhỏ để đảm bảo accessToken đã được cập nhật đầy đủ
            setTimeout(() => {
              fetchBrands().catch(err => {
                debugLog('Không thể tải dữ liệu brands:', err);
                // Error đã được xử lý trong fetchBrands, không cần throw
              });
            }, 300);
          } else {
            debugLog('Không ở trang brands, bỏ qua việc tải dữ liệu thương hiệu');
          }
        } else {
          debugLog('Chưa đăng nhập hoặc không có token, bỏ qua việc tải dữ liệu thương hiệu');
        }
      } catch (error) {
        debugLog('Lỗi trong useEffect của BrandContext:', error);
      }
    };

    loadBrands();
  }, [isAuthenticated, accessToken, router.pathname, fetchBrands]);

  const value: BrandContextType = {
    brands,
    loading,
    error,
    statistics,
    pagination,
    fetchBrands,
    fetchBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    toggleBrandStatus,
    toggleBrandFeatured,
    uploadBrandLogo
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};
