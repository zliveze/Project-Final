import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Định nghĩa kiểu dữ liệu cho brand phía người dùng
export interface Brand {
  id: string; // ID của thương hiệu (MongoDB _id)
  name: string; // Tên thương hiệu
  slug: string; // Slug URL
  description?: string; // Mô tả thương hiệu
  logo?: {
    url: string; // URL của logo
    alt?: string; // Alt text cho logo
  };
  featured: boolean; // Có phải thương hiệu nổi bật không
}

// Định nghĩa kiểu dữ liệu cho context
interface BrandContextType {
  brands: Brand[]; // Danh sách tất cả thương hiệu
  featuredBrands: Brand[]; // Danh sách thương hiệu nổi bật
  loading: boolean; // Đang tải dữ liệu
  error: string | null; // Lỗi nếu có
  fetchBrands: () => Promise<void>; // Hàm lấy tất cả thương hiệu
  fetchFeaturedBrands: () => Promise<void>; // Hàm lấy thương hiệu nổi bật
}

// Tạo context
const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Hook để sử dụng context
export const useBrands = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};

// Cấu hình API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const BRAND_API = {
  ALL: `${API_URL}/brands`,
  ACTIVE: `${API_URL}/brands/active`,
  FEATURED: `${API_URL}/brands/featured`
};

// Provider component
export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chuyển đổi dữ liệu từ API sang định dạng frontend
  const transformBrand = (brandData: any): Brand => {
    return {
      id: brandData._id || brandData.id,
      name: brandData.name,
      slug: brandData.slug || brandData.name.toLowerCase().replace(/\s+/g, '-'),
      description: brandData.description || '',
      logo: brandData.logo ? {
        url: brandData.logo.url || '',
        alt: brandData.logo.alt || brandData.name
      } : undefined,
      featured: brandData.featured || false
    };
  };

  // Hàm lấy tất cả thương hiệu
  const fetchBrands = async () => {
    try {
      setLoading(true);
      
      console.log('Đang lấy danh sách thương hiệu cho người dùng');
      
      const response = await fetch(BRAND_API.ACTIVE);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi khi lấy danh sách thương hiệu:', errorText);
        throw new Error('Không thể tải danh sách thương hiệu');
      }
      
      const data = await response.json();
      console.log(`Đã lấy ${data.length} thương hiệu thành công`);
      
      setBrands(Array.isArray(data) ? data.map(transformBrand) : []);
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy thương hiệu:', error);
      setError(error.message || 'Lỗi khi lấy danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy thương hiệu nổi bật
  const fetchFeaturedBrands = async () => {
    try {
      setLoading(true);
      
      console.log('Đang lấy danh sách thương hiệu nổi bật cho người dùng');
      
      const response = await fetch(BRAND_API.FEATURED);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi khi lấy danh sách thương hiệu nổi bật:', errorText);
        throw new Error('Không thể tải danh sách thương hiệu nổi bật');
      }
      
      const data = await response.json();
      console.log(`Đã lấy ${data.length} thương hiệu nổi bật thành công`);
      
      setFeaturedBrands(Array.isArray(data) ? data.map(transformBrand) : []);
      setError(null);
    } catch (error: any) {
      console.error('Chi tiết lỗi khi lấy thương hiệu nổi bật:', error);
      setError(error.message || 'Lỗi khi lấy danh sách thương hiệu nổi bật');
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải dữ liệu khi component được mount hoặc route thay đổi
  useEffect(() => {
    const loadData = async () => {
      // Chỉ load brands khi ở các trang liên quan
      const isUserRelatedPage = !router.pathname.startsWith('/admin') && 
                               !router.pathname.startsWith('/auth');
      
      if (isUserRelatedPage) {
        await Promise.all([
          fetchBrands(),
          fetchFeaturedBrands()
        ]);
      }
    };

    loadData();
  }, [router.pathname]);

  // Chuẩn bị giá trị cho context
  const value: BrandContextType = {
    brands,
    featuredBrands,
    loading,
    error,
    fetchBrands,
    fetchFeaturedBrands
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

export default BrandContext;
