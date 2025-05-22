import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../../lib/axios';
import { useAuth } from '../AuthContext';

// Định nghĩa kiểu dữ liệu sản phẩm
export interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  currentPrice?: number;
  imageUrl?: string;
  brandId?: string;
  brandName?: string;
  status: string;
  flags?: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  soldCount?: number;
  // Hỗ trợ định dạng cũ
  image?: {
    url: string;
    alt: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
  brand?: {
    name: string;
    slug: string;
  };
  isNew?: boolean;
}

// Định nghĩa kiểu dữ liệu response API
interface RecommendationResponse {
  products: RecommendedProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Context interface
interface RecommendationContextProps {
  personalizedProducts: RecommendedProduct[];
  loadingPersonalized: boolean;
  similarProducts: RecommendedProduct[];
  loadingSimilar: boolean;
  recommendedProducts: RecommendedProduct[];
  loadingRecommended: boolean;
  fetchPersonalizedProducts: (limit?: number) => Promise<void>;
  fetchSimilarProducts: (productId: string, limit?: number) => Promise<void>;
  fetchRecommendedProducts: (limit?: number) => Promise<void>;
}

// Tạo Context
const RecommendationContext = createContext<RecommendationContextProps | undefined>(undefined);

// Props cho Provider
interface RecommendationProviderProps {
  children: ReactNode;
}

// Provider Component
export const RecommendationProvider = ({ children }: RecommendationProviderProps) => {
  const { isAuthenticated } = useAuth();
  const [personalizedProducts, setPersonalizedProducts] = useState<RecommendedProduct[]>([]);
  const [loadingPersonalized, setLoadingPersonalized] = useState<boolean>(false);
  const [similarProducts, setSimilarProducts] = useState<RecommendedProduct[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState<boolean>(false);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState<boolean>(false);

  // Lấy sản phẩm gợi ý cá nhân hóa (yêu cầu đăng nhập)
  const fetchPersonalizedProducts = async (limit = 8) => {
    if (!isAuthenticated) {
      return;
    }

    setLoadingPersonalized(true);
    try {
      const response = await axios.get<RecommendationResponse>(
        `/products/personalized?limit=${limit}`
      );
      setPersonalizedProducts(response.data.products);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm gợi ý cá nhân hóa:', error);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  // Lấy sản phẩm tương tự dựa trên sản phẩm hiện tại
  const fetchSimilarProducts = async (productId: string, limit = 8) => {
    setLoadingSimilar(true);
    try {
      // Sửa API endpoint từ /products/similar sang /recommendations/similar
      const response = await axios.get<{ products: RecommendedProduct[] }>( // Cập nhật kiểu response mong đợi
        `/recommendations/similar/${productId}?limit=${limit}`
      );
      // Backend đã được sửa để trả về { products: [] }
      setSimilarProducts(response.data.products);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm tương tự:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Lấy sản phẩm được đề xuất (không yêu cầu đăng nhập, dựa trên sản phẩm mới/phổ biến)
  const fetchRecommendedProducts = async (limit = 8) => {
    setLoadingRecommended(true);
    try {
      const response = await axios.get<RecommendationResponse>(
        `/products/recommended?limit=${limit}`
      );
      setRecommendedProducts(response.data.products);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm đề xuất:', error);
    } finally {
      setLoadingRecommended(false);
    }
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchRecommendedProducts();
    if (isAuthenticated) {
      fetchPersonalizedProducts();
    }
  }, [isAuthenticated]);

  const value = {
    personalizedProducts,
    loadingPersonalized,
    similarProducts,
    loadingSimilar,
    recommendedProducts,
    loadingRecommended,
    fetchPersonalizedProducts,
    fetchSimilarProducts,
    fetchRecommendedProducts,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
};

// Hook để sử dụng context
export const useRecommendation = () => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendation phải được sử dụng trong RecommendationProvider');
  }
  return context;
};
