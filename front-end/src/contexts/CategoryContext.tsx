import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from './AdminAuthContext';

// Định nghĩa kiểu dữ liệu cho danh mục
export interface Category {
  _id?: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  level: number;
  image?: {
    url: string;
    alt?: string;
    publicId?: string;
  };
  status: string;
  featured: boolean;
  order: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  parent?: {
    _id: string;
    name: string;
    slug: string;
  };
  childrenCount?: number;
}

// Định nghĩa kiểu dữ liệu cho context
interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  totalCategories: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  statistics: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
  } | null;
  // Phương thức cho Cloudinary
  uploadCategoryImage: (
    imageData: string, 
    alt?: string
  ) => Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
  // Các phương thức CRUD
  fetchCategories: (
    page?: number,
    limit?: number,
    search?: string,
    parentId?: string,
    status?: string,
    featured?: boolean,
    level?: number,
    sort?: string
  ) => Promise<void>;
  fetchActiveCategories: () => Promise<void>;
  fetchCategoryById: (id: string) => Promise<Category>;
  fetchCategoryBySlug: (slug: string) => Promise<Category>;
  createCategory: (categoryData: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<Category>;
  toggleCategoryFeatured: (id: string) => Promise<Category>;
  changeCategoryOrder: (id: string, order: number) => Promise<Category>;
  uploadImage: (id: string, base64Image: string, alt?: string) => Promise<Category>;
  fetchStatistics: () => Promise<void>;
}

// Tạo context
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Hook để sử dụng context
export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};

// Cấu hình API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const CATEGORY_API = {
  ADMIN: `${API_URL}/admin/categories`,
  PUBLIC: `${API_URL}/categories`
};

// Provider component
export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { accessToken } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [statistics, setStatistics] = useState<CategoryContextType['statistics']>(null);

  // Hàm lấy header xác thực
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    return {
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, []);

  // Xử lý lỗi chung
  const handleError = useCallback((error: any) => {
    console.error('Category operation error:', error);
    const errorMessage = error.message || 'Đã xảy ra lỗi';
    setError(errorMessage);
    
    // Nếu là lỗi xác thực, chuyển hướng về trang đăng nhập
    if (error.status === 401) {
      router.push('/admin/login');
    }
    
    return errorMessage;
  }, [router]);

  // Upload ảnh lên Cloudinary thông qua API
  const uploadCategoryImage = useCallback(async (
    imageData: string, 
    alt?: string
  ) => {
    try {
      setLoading(true);
      
      console.log('Đang tải lên ảnh danh mục lên Cloudinary...');
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/temp-upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          imageData,
          alt
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi upload Cloudinary:', errorData);
        throw new Error(errorData.message || `Lỗi khi tải lên ảnh: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Tải lên ảnh thành công, URL: ${data.url ? data.url.substring(0, 50) + '...' : 'không có'}`);
      return data;
    } catch (error: any) {
      console.error('Chi tiết lỗi upload ảnh:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch categories với phân trang và bộ lọc
  const fetchCategories = useCallback(async (
    page = 1,
    limit = 10,
    search = '',
    parentId = '',
    status = '',
    featured?: boolean,
    level?: number,
    sort = 'order,asc'
  ) => {
    try {
      setLoading(true);
      
      // Tạo query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search);
      if (parentId) queryParams.append('parentId', parentId);
      if (status) queryParams.append('status', status);
      if (featured !== undefined) queryParams.append('featured', featured.toString());
      if (level !== undefined) queryParams.append('level', level.toString());
      if (sort) queryParams.append('sort', sort);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}?${queryParams.toString()}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching categories: ${response.status}`);
      }
      
      const data = await response.json();
      
      setCategories(data.items);
      setTotalCategories(data.total);
      setCurrentPage(data.page);
      setTotalPages(data.pages);
      setItemsPerPage(data.limit);
      setError(null);
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch Active Categories (frontend)
  const fetchActiveCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Đang lấy danh mục active cho trang public');
      
      const response = await fetch(`${CATEGORY_API.PUBLIC}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi khi lấy danh mục active:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Lỗi khi lấy danh mục active: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Lỗi khi lấy danh mục active: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log(`Đã lấy ${data.items.length} danh mục thành công`);
      
      setCategories(data.items);
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy danh mục active:', error);
      setError(error.message || 'Lỗi khi lấy danh sách danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category by ID
  const fetchCategoryById = useCallback(async (id: string): Promise<Category> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching category: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch category by slug
  const fetchCategoryBySlug = useCallback(async (slug: string): Promise<Category> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${CATEGORY_API.PUBLIC}/slug/${slug}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching category: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Create category
  const createCategory = useCallback(async (categoryData: Partial<Category>): Promise<Category> => {
    try {
      setLoading(true);
      
      console.log('Đang tạo danh mục mới:', {
        name: categoryData.name,
        slug: categoryData.slug,
        hasImage: !!categoryData.image
      });
      
      // Kiểm tra và xử lý nếu image.url là blob URL
      if (categoryData.image && categoryData.image.url && categoryData.image.url.startsWith('blob:')) {
        console.log('Phát hiện blob URL, cần upload ảnh lên Cloudinary trước');
        
        try {
          // Lấy dữ liệu từ blob URL
          const response = await fetch(categoryData.image.url);
          const blob = await response.blob();
          
          // Chuyển blob thành base64
          const reader = new FileReader();
          const base64ImagePromise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          const base64Image = await base64ImagePromise;
          
          // Upload lên Cloudinary
          const cloudinaryResult = await uploadCategoryImage(
            base64Image,
            categoryData.image.alt || categoryData.name
          );
          
          // Cập nhật URL trong categoryData
          categoryData.image = {
            url: cloudinaryResult.url,
            alt: categoryData.image.alt || categoryData.name || 'Category image',
            publicId: cloudinaryResult.publicId
          };
          
          console.log('Đã tải ảnh lên Cloudinary thành công:', cloudinaryResult.url);
        } catch (uploadError) {
          console.error('Lỗi khi upload ảnh từ blob URL:', uploadError);
          // Xóa image để tránh gửi blob URL lên server
          delete categoryData.image;
        }
      }
      
      const response = await fetch(CATEGORY_API.ADMIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(categoryData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating category: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Tạo danh mục thành công:', data._id);
      
      // Cập nhật danh sách danh mục nếu đang ở trang 1
      if (currentPage === 1) {
        fetchCategories(1, itemsPerPage);
      }
      
      return data;
    } catch (error: any) {
      console.error('Chi tiết lỗi tạo danh mục:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchCategories, currentPage, itemsPerPage, uploadCategoryImage]);

  // Update category
  const updateCategory = useCallback(async (id: string, categoryData: Partial<Category>): Promise<Category> => {
    try {
      setLoading(true);
      console.log(`Bắt đầu cập nhật danh mục ID: ${id}`, categoryData);
      
      // Kiểm tra và xử lý nếu image.url là blob URL
      if (categoryData.image && categoryData.image.url && categoryData.image.url.startsWith('blob:')) {
        console.log('Phát hiện blob URL trong updateCategory, cần upload ảnh lên Cloudinary trước');
        
        try {
          // Lấy dữ liệu từ blob URL
          const response = await fetch(categoryData.image.url);
          const blob = await response.blob();
          
          // Chuyển blob thành base64
          const reader = new FileReader();
          const base64ImagePromise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          const base64Image = await base64ImagePromise;
          
          // Upload lên Cloudinary
          const cloudinaryResult = await uploadCategoryImage(
            base64Image,
            categoryData.image.alt || categoryData.name
          );
          
          // Cập nhật URL trong categoryData
          categoryData.image = {
            url: cloudinaryResult.url,
            alt: categoryData.image.alt || categoryData.name || 'Category image',
            publicId: cloudinaryResult.publicId
          };
          
          console.log('Đã tải ảnh lên Cloudinary thành công:', cloudinaryResult.url);
        } catch (uploadError) {
          console.error('Lỗi khi upload ảnh từ blob URL:', uploadError);
          // Xóa image để tránh gửi blob URL lên server
          delete categoryData.image;
        }
      }
      
      console.log('Dữ liệu sẽ gửi đến API:', JSON.stringify(categoryData, null, 2));
      const token = localStorage.getItem('adminToken');
      console.log('Token xác thực:', token ? `${token.substring(0, 15)}...` : 'không có');
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(categoryData)
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body raw:', responseText);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || `Lỗi khi cập nhật danh mục: ${response.status}`;
        } catch (e) {
          errorMessage = `Lỗi khi cập nhật danh mục: ${response.status}, body: ${responseText}`;
        }
        console.error('Chi tiết lỗi cập nhật:', errorMessage);
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Dữ liệu cập nhật thành công:', data);
      } catch (e) {
        console.error('Lỗi khi parse JSON từ response:', e);
        throw new Error('Dữ liệu trả về không hợp lệ');
      }
      
      // Cập nhật danh sách danh mục
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category._id === id ? data : category
        )
      );
      
      return data;
    } catch (error: any) {
      console.error('Lỗi chi tiết khi cập nhật danh mục:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, uploadCategoryImage]);

  // Delete category
  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error deleting category: ${response.status}`);
      }
      
      // Cập nhật danh sách danh mục
      setCategories(prevCategories => 
        prevCategories.filter(category => category._id !== id)
      );
      
      // Cập nhật tổng số danh mục
      setTotalCategories(prev => prev - 1);
      
      // Refresh danh sách nếu trang hiện tại trống
      if (categories.length === 1 && currentPage > 1) {
        fetchCategories(currentPage - 1, itemsPerPage);
      } else {
        fetchCategories(currentPage, itemsPerPage);
      }
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchCategories, categories.length, currentPage, itemsPerPage]);

  // Toggle category status (active/inactive)
  const toggleCategoryStatus = useCallback(async (id: string): Promise<Category> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error toggling category status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cập nhật danh sách danh mục
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category._id === id ? data : category
        )
      );
      
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Toggle category featured
  const toggleCategoryFeatured = useCallback(async (id: string): Promise<Category> => {
    try {
      setLoading(true);
      
      const currentCategory = categories.find(c => c._id === id);
      const featured = !currentCategory?.featured;
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ featured })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error toggling category featured: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cập nhật danh sách danh mục
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category._id === id ? data : category
        )
      );
      
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, categories]);

  // Change category order
  const changeCategoryOrder = useCallback(async (id: string, order: number): Promise<Category> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ order })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error changing category order: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Refresh danh sách sau khi thay đổi thứ tự
      fetchCategories(currentPage, itemsPerPage);
      
      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError, fetchCategories, currentPage, itemsPerPage]);

  // Upload image
  const uploadImage = useCallback(async (id: string, base64Image: string, alt?: string): Promise<Category> => {
    try {
      setLoading(true);
      
      console.log(`Đang tải lên ảnh cho danh mục ID: ${id}`);
      console.log(`Alt text: ${alt || 'không có'}`);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/${id}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ base64Image, alt })
      });
      
      console.log('Upload image API response status:', response.status);
      const responseText = await response.text();
      console.log('Response body raw:', responseText);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || `Lỗi khi tải lên ảnh: ${response.status}`;
        } catch (e) {
          errorMessage = `Lỗi khi tải lên ảnh: ${response.status}, body: ${responseText}`;
        }
        console.error('Chi tiết lỗi upload:', errorMessage);
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Dữ liệu upload ảnh thành công:', data);
      } catch (e) {
        console.error('Lỗi khi parse JSON từ response:', e);
        throw new Error('Dữ liệu trả về không hợp lệ');
      }
      
      // Cập nhật danh sách danh mục
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category._id === id ? data : category
        )
      );
      
      return data;
    } catch (error: any) {
      console.error('Chi tiết lỗi upload ảnh:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Fetch statistics
  const fetchStatistics = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      console.log('Đang gọi API lấy thống kê danh mục...');
      
      const headers = getAuthHeader();
      console.log('Auth headers:', headers);
      
      const response = await fetch(`${CATEGORY_API.ADMIN}/statistics`, {
        headers: headers
      });
      
      console.log(`Kết quả API: status=${response.status}, statusText=${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lỗi API: ${errorText}`);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Lỗi khi lấy thống kê: ${response.status}`;
          console.error('Thông tin lỗi:', errorData);
        } catch (parseError) {
          console.error('Không thể phân tích dữ liệu lỗi:', parseError);
          errorMessage = `Lỗi khi lấy thống kê: ${response.status} - ${response.statusText}`;
        }
        
        setError(errorMessage);
        return; // Dừng xử lý thay vì ném lỗi để tránh unhandled exception
      }
      
      const data = await response.json();
      console.log('Dữ liệu thống kê:', data);
      
      setStatistics(data);
      setError(null);
    } catch (error: any) {
      console.error('Lỗi trong quá trình xử lý:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, handleError]);

  // Chuẩn bị giá trị cho context
  const value: CategoryContextType = {
    categories,
    loading,
    error,
    totalCategories,
    currentPage,
    totalPages,
    itemsPerPage,
    statistics,
    uploadCategoryImage,
    fetchCategories,
    fetchActiveCategories,
    fetchCategoryById,
    fetchCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    toggleCategoryFeatured,
    changeCategoryOrder,
    uploadImage,
    fetchStatistics
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext; 