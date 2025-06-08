import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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

  // Memoize fetch functions để tránh re-render
  const fetchPersonalizedProducts = useCallback(async (limit = 20) => {
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
      setPersonalizedProducts([]);
    } finally {
      setLoadingPersonalized(false);
    }
  }, [isAuthenticated]);

  const fetchSimilarProducts = useCallback(async (productId: string, limit = 20) => {
    setLoadingSimilar(true);
    try {
      // Validate productId before making request
      if (!productId || typeof productId !== 'string') {
        console.warn('Invalid productId provided to fetchSimilarProducts:', productId);
        setSimilarProducts([]);
        return;
      }

      // Sử dụng products controller endpoint thay vì recommendations
      const response = await axios.get<RecommendationResponse>(
        `/products/similar/${productId}?limit=${limit}`
      );

      if (response.data && Array.isArray(response.data.products)) {
        setSimilarProducts(response.data.products);
      } else {
        console.warn('Invalid response format for similar products:', response.data);
        setSimilarProducts([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm tương tự:', error);
      setSimilarProducts([]);

      // Don't show error toast for similar products as it's not critical
      // User can still browse other products
    } finally {
      setLoadingSimilar(false);
    }
  }, []);

  const fetchRecommendedProducts = useCallback(async (limit = 20) => {
    setLoadingRecommended(true);
    try {
      const response = await axios.get<RecommendationResponse>(
        `/products/recommended?limit=${limit}`
      );
      setRecommendedProducts(response.data.products);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm đề xuất:', error);
      setRecommendedProducts([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, []);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    // Fetch recommended products cho tất cả user (không yêu cầu đăng nhập)
    if (recommendedProducts.length === 0 && !loadingRecommended) {
      fetchRecommendedProducts();
    }
  }, [fetchRecommendedProducts, loadingRecommended, recommendedProducts.length]); // Thêm dependencies

  // Fetch personalized products khi user đăng nhập
  useEffect(() => {
    if (isAuthenticated && personalizedProducts.length === 0 && !loadingPersonalized) {
      fetchPersonalizedProducts();
    }
  }, [isAuthenticated, fetchPersonalizedProducts, loadingPersonalized, personalizedProducts.length]); // Thêm dependencies

  // Memoize context value để tránh re-render
  const value = useMemo(() => ({
    personalizedProducts,
    loadingPersonalized,
    similarProducts,
    loadingSimilar,
    recommendedProducts,
    loadingRecommended,
    fetchPersonalizedProducts,
    fetchSimilarProducts,
    fetchRecommendedProducts,
  }), [
    personalizedProducts,
    loadingPersonalized,
    similarProducts,
    loadingSimilar,
    recommendedProducts,
    loadingRecommended,
    fetchPersonalizedProducts,
    fetchSimilarProducts,
    fetchRecommendedProducts,
  ]);

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
