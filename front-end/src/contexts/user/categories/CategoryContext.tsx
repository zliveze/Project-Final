import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Định nghĩa kiểu dữ liệu cho danh mục phía người dùng
export interface Category {
  id: string; // ID của danh mục (MongoDB _id)
  name: string; // Tên danh mục
  slug: string; // Slug URL
  description?: string; // Mô tả danh mục
  image?: {
    url: string; // URL của hình ảnh
    alt?: string; // Alt text cho hình ảnh
  };
  parentId?: string; // ID của danh mục cha (nếu có)
  parentName?: string; // Tên danh mục cha
  level: number; // Cấp độ phân cấp (0: gốc, 1: con, 2: cháu,...)
  featured: boolean; // Có phải danh mục nổi bật không
  childCount?: number; // Số lượng danh mục con
}

// Định nghĩa kiểu dữ liệu cho danh mục dạng cây phân cấp
export interface HierarchicalCategory extends Category {
  children?: HierarchicalCategory[]; // Danh sách các danh mục con
}

// Định nghĩa kiểu dữ liệu cho context
interface CategoryContextType {
  categories: Category[]; // Danh sách tất cả danh mục
  featuredCategories: Category[]; // Danh sách danh mục nổi bật
  hierarchicalCategories: HierarchicalCategory[]; // Danh sách danh mục dạng cây phân cấp
  loading: boolean; // Đang tải dữ liệu
  error: string | null; // Lỗi nếu có
  fetchCategories: () => Promise<void>; // Hàm lấy tất cả danh mục
  fetchHierarchicalCategories: () => Promise<void>; // Hàm lấy danh mục dạng cây
  fetchFeaturedCategories: () => Promise<void>; // Hàm lấy danh mục nổi bật
  getCategoryById: (id: string) => Category | undefined; // Hàm lấy danh mục theo ID
  getCategoryBySlug: (slug: string) => Promise<Category | null>; // Hàm lấy danh mục theo slug
}

// Tạo context
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Hook để sử dụng context
export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

// Cấu hình API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const CATEGORY_API = {
  ALL: `${API_URL}/categories`,
  ACTIVE: `${API_URL}/categories?status=active`,
  FEATURED: `${API_URL}/categories?status=active&featured=true`,
  HIERARCHICAL: `${API_URL}/categories?status=active`,
  ACTIVE_TREE: `${API_URL}/categories/tree?status=active`,
  BY_SLUG: (slug: string) => `${API_URL}/categories/slug/${slug}`
};

// Provider component
export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chuyển đổi dữ liệu từ API sang định dạng frontend
  const transformCategory = (categoryData: any): Category => {
    return {
      id: categoryData._id,
      name: categoryData.name,
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
      description: categoryData.description || '',
      image: categoryData.image ? {
        url: categoryData.image.url || '',
        alt: categoryData.image.alt || categoryData.name
      } : undefined,
      parentId: categoryData.parentId,
      parentName: categoryData.parent?.name,
      level: categoryData.level || 0,
      featured: categoryData.featured || false,
      childCount: categoryData.childrenCount || 0
    };
  };

  // Hàm xử lý đáp ứng chung cho các API
  const handleApiResponse = async (response: Response, errorMessage: string) => {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${errorMessage}:`, errorText);
      
      // Kiểm tra có phải JSON không
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || errorMessage);
      } catch (e) {
        // Nếu không phải JSON, trả về text gốc
        throw new Error(errorMessage);
      }
    }
    
    return await response.json();
  };

  // Hàm lấy tất cả danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      console.log('Đang lấy danh sách danh mục cho người dùng');
      
      const response = await fetch(CATEGORY_API.ALL);
      const data = await handleApiResponse(response, 'Không thể tải danh sách danh mục');
      
      console.log(`Đã lấy ${data.items ? data.items.length : 0} danh mục thành công`);
      
      const categoriesData = data.items || [];
      setCategories(categoriesData.map(transformCategory));
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy danh mục:', error);
      setError(error.message || 'Lỗi khi lấy danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy danh mục nổi bật
  const fetchFeaturedCategories = async () => {
    try {
      setLoading(true);
      
      console.log('Đang lấy danh sách danh mục nổi bật cho người dùng');
      
      const response = await fetch(CATEGORY_API.FEATURED);
      const data = await handleApiResponse(response, 'Không thể tải danh sách danh mục nổi bật');
      
      console.log(`Đã lấy danh mục nổi bật thành công, kiểm tra cấu trúc:`, data);
      
      // Kiểm tra xem data có items không, nếu có thì lấy từ data.items, nếu không thì kiểm tra xem data có phải là array không
      let categoriesData = [];
      if (data && data.items && Array.isArray(data.items)) {
        categoriesData = data.items;
        console.log(`Đã lấy ${categoriesData.length} danh mục nổi bật từ data.items`);
      } else if (Array.isArray(data)) {
        categoriesData = data;
        console.log(`Đã lấy ${categoriesData.length} danh mục nổi bật từ array`);
      } else {
        console.warn('Dữ liệu danh mục nổi bật không phải định dạng mảng hoặc không có thuộc tính items');
      }
      
      setFeaturedCategories(categoriesData.map(transformCategory));
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy danh mục nổi bật:', error);
      setError(error.message || 'Lỗi khi lấy danh sách danh mục nổi bật');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy danh mục dạng cây phân cấp
  const fetchHierarchicalCategories = async () => {
    try {
      setLoading(true);
      
      console.log('Đang lấy cấu trúc phân cấp danh mục cho người dùng');
      
      const response = await fetch(CATEGORY_API.HIERARCHICAL);
      const data = await handleApiResponse(response, 'Không thể tải cấu trúc phân cấp danh mục');
      
      console.log(`Đã lấy cấu trúc phân cấp danh mục thành công`);
      
      // Hàm đệ quy để chuyển đổi cây danh mục
      const transformHierarchical = (category: any): HierarchicalCategory => {
        const transformed = transformCategory(category);
        if (category.children && Array.isArray(category.children) && category.children.length > 0) {
          return {
            ...transformed,
            children: category.children.map(transformHierarchical)
          };
        }
        return transformed;
      };
      
      // Kiểm tra cấu trúc dữ liệu trả về
      let hierarchicalData = [];
      if (data && data.items && Array.isArray(data.items)) {
        hierarchicalData = data.items;
      } else if (Array.isArray(data)) {
        hierarchicalData = data;
      }
      
      setHierarchicalCategories(hierarchicalData.map(transformHierarchical));
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy cấu trúc phân cấp danh mục:', error);
      setError(error.message || 'Lỗi khi lấy cấu trúc phân cấp danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy danh mục theo ID từ cache
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(category => category.id === id);
  };

  // Hàm lấy danh mục theo slug (gọi API)
  const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
    try {
      setLoading(true);
      
      // Kiểm tra xem có trong cache không
      const cachedCategory = categories.find(category => category.slug === slug);
      if (cachedCategory) {
        return cachedCategory;
      }
      
      console.log(`Đang lấy thông tin danh mục với slug: ${slug}`);
      
      const response = await fetch(CATEGORY_API.BY_SLUG(slug));
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Không tìm thấy danh mục với slug ${slug}`);
          return null;
        }
        
        // Sử dụng handleApiResponse cho các lỗi khác
        const errorMessage = `Không thể tải thông tin danh mục với slug ${slug}`;
        await handleApiResponse(response, errorMessage);
      }
      
      const data = await response.json();
      console.log(`Đã lấy thông tin danh mục ${data.name} thành công`);
      
      return transformCategory(data);
    } catch (error: any) {
      console.error(`Chi tiết lỗi khi lấy danh mục theo slug ${slug}:`, error);
      setError(error.message || 'Lỗi khi lấy thông tin danh mục');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải dữ liệu khi component được mount
  useEffect(() => {
    const loadData = async () => {
      // Chỉ load categories khi ở các trang liên quan
      const isUserRelatedPage = !router.pathname.startsWith('/admin') && 
                               !router.pathname.startsWith('/auth');
      
      if (isUserRelatedPage) {
        await Promise.all([
          fetchCategories(),
          fetchFeaturedCategories(),
          fetchHierarchicalCategories()
        ]);
      }
    };

    loadData();
  }, [router.pathname]);

  // Chuẩn bị giá trị cho context
  const value: CategoryContextType = {
    categories,
    featuredCategories,
    hierarchicalCategories,
    loading,
    error,
    fetchCategories,
    fetchHierarchicalCategories,
    fetchFeaturedCategories,
    getCategoryById,
    getCategoryBySlug
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext; 