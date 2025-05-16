import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Định nghĩa kiểu dữ liệu cho hình ảnh đánh giá
export interface ReviewImage {
  url: string;
  alt?: string;
}

// Định nghĩa kiểu dữ liệu cho đánh giá
export interface Review {
  _id: string; // Sử dụng _id làm ID chính
  productId: string;
  variantId?: string;
  productName: string;
  productImage: string;
  rating: number;
  content: string;
  images: ReviewImage[];
  likes: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string; // Nên là string ISO date từ backend, hoặc Date object
  verified: boolean;
  isEdited?: boolean;
  userId?: string; // Thêm userId để có thể dùng nếu cần
}

// Định nghĩa kiểu dữ liệu cho context
export interface UserReviewContextType {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;

  // Phương thức quản lý đánh giá
  fetchMyReviews: (page?: number, limit?: number, status?: string) => Promise<void>;
  fetchProductReviews: (productId: string, status?: string) => Promise<Review[]>;
  createReview: (reviewData: any, onProgress?: (progress: number) => void) => Promise<boolean>;
  updateReview: (reviewId: string, reviewData: any, onProgress?: (progress: number) => void) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  checkCanReview: (productId: string) => Promise<{ canReview: boolean, hasPurchased: boolean, hasReviewed: boolean }>;
  getReviewStats: (productId: string) => Promise<{ average: number, distribution: Record<string, number> }>;
  likeReview: (reviewId: string) => Promise<boolean>;
}

// Tạo context
const UserReviewContext = createContext<UserReviewContextType | undefined>(undefined);

// Provider component
export const UserReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Get isAuthenticated to re-fetch token on auth change
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    // Client-side only: get token from localStorage
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('accessToken'));
    }
  }, [isAuthenticated]); // Re-check token when authentication state changes


  // Cấu hình Axios với Auth token
  const эффективныйApiUrl = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001') 
                        ? process.env.NEXT_PUBLIC_API_URL 
                        : 'http://localhost:3001/api';

  const api = useCallback(() => {
    return axios.create({
      baseURL: эффективныйApiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorageToken ? `Bearer ${localStorageToken}` : ''
      }
    });
  }, [localStorageToken]);

  // Lấy danh sách đánh giá của người dùng hiện tại
  const fetchMyReviews = useCallback(async (
    page: number = 1,
    limit: number = 10,
    status?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Xây dựng query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (status && status !== 'all') {
        params.append('status', status);
      }

      const response = await api().get(`/reviews/user/me?${params.toString()}`);

      if (response.data) {
        setReviews(response.data.reviews || []);
        setTotalItems(response.data.totalItems || 0);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(response.data.currentPage || 1);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
      setError('Không thể lấy danh sách đánh giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Lấy đánh giá của một sản phẩm cụ thể
  const fetchProductReviews = useCallback(async (
    productId: string,
    status: string = 'approved'
  ): Promise<Review[]> => {
    try {
      setLoading(true);

      const response = await api().get(`/reviews/product/${productId}?status=${status}`);

      if (response.data) {
        return response.data || [];
      }

      return [];
    } catch (error) {
      console.error('Lỗi khi lấy đánh giá sản phẩm:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Tạo đánh giá mới
  const createReview = useCallback(async (reviewData: any, onProgress?: (progress: number) => void): Promise<boolean> => {
    try {
      setLoading(true);

      // Tạo config với onUploadProgress để theo dõi tiến trình upload
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': localStorageToken ? `Bearer ${localStorageToken}` : ''
        },
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      };

      const response = await axios.post(
        `${эффективныйApiUrl}/reviews`,
        reviewData,
        config
      );

      if (response.data) {
        toast.success('Đã gửi đánh giá thành công');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Lỗi khi tạo đánh giá:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [localStorageToken]); // Use localStorageToken

  // Cập nhật đánh giá
  const updateReview = useCallback(async (reviewId: string, reviewData: any, onProgress?: (progress: number) => void): Promise<boolean> => {
    try {
      setLoading(true);

      // Kiểm tra xem reviewData có phải là FormData không
      const isFormData = reviewData instanceof FormData;

      let response;

      if (isFormData) {
        // Nếu là FormData, sử dụng cấu hình upload với progress
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': localStorageToken ? `Bearer ${localStorageToken}` : ''
          },
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        };

        response = await axios.patch(
          `${эффективныйApiUrl}/reviews/${reviewId}`,
          reviewData,
          config
        );
      } else {
        // Nếu không phải FormData, sử dụng api() thông thường
        response = await api().patch(`/reviews/${reviewId}`, reviewData);
      }

      if (response.data) {
        // Cập nhật danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId // Use _id for comparison
              ? { ...review, ...reviewData, status: 'pending' }
              : review
          )
        );

        toast.success('Đã cập nhật đánh giá thành công');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Lỗi khi cập nhật đánh giá:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, localStorageToken]); // Use localStorageToken

  // Xóa đánh giá
  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    try {
      setLoading(true);

      await api().delete(`/reviews/${reviewId}`);

      // Cập nhật danh sách đánh giá
      setReviews(prevReviews =>
        prevReviews.filter(review => review._id !== reviewId) // Use _id for comparison
      );

      toast.success('Đã xóa đánh giá thành công');
      return true;
    } catch (error: any) {
      console.error('Lỗi khi xóa đánh giá:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Kiểm tra xem người dùng có thể đánh giá sản phẩm không
  const checkCanReview = useCallback(async (productId: string): Promise<{ canReview: boolean, hasPurchased: boolean, hasReviewed: boolean }> => {
    try {
      const response = await api().get(`/reviews/check-can-review/${productId}`);

      if (response.data) {
        return response.data;
      }

      return { canReview: false, hasPurchased: false, hasReviewed: false };
    } catch (error) {
      console.error('Lỗi khi kiểm tra khả năng đánh giá:', error);
      return { canReview: false, hasPurchased: false, hasReviewed: false };
    }
  }, [api]);

  // Lấy thống kê đánh giá của sản phẩm
  const getReviewStats = useCallback(async (productId: string): Promise<{ average: number, distribution: Record<string, number> }> => {
    try {
      const response = await api().get(`/reviews/stats/rating/${productId}`);

      if (response.data) {
        return response.data;
      }

      return { average: 0, distribution: {} };
    } catch (error) {
      console.error('Lỗi khi lấy thống kê đánh giá:', error);
      return { average: 0, distribution: {} };
    }
  }, [api]);

  // Thích một đánh giá
  const likeReview = useCallback(async (reviewId: string): Promise<boolean> => {
    console.log('[UserReviewContext] Attempting to like review with ID:', reviewId); // Log reviewId
    if (!reviewId) {
      console.error('[UserReviewContext] likeReview called with undefined or null reviewId');
      return false;
    }
    try {
      const response = await api().post(`/reviews/${reviewId}/like`);

      if (response.data) {
        const updatedReviewFromApi = response.data; // Backend trả về review đã cập nhật
        // Cập nhật số lượt thích trong danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId // So sánh bằng _id
              ? { ...review, likes: updatedReviewFromApi.likes } // Cập nhật likes từ response
              : review
          )
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi thích đánh giá:', error);
      return false;
    }
  }, [api]);

  // Context value
  const value: UserReviewContextType = {
    reviews,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    fetchMyReviews,
    fetchProductReviews,
    createReview,
    updateReview,
    deleteReview,
    checkCanReview,
    getReviewStats,
    likeReview,
  };

  return (
    <UserReviewContext.Provider value={value}>
      {children}
    </UserReviewContext.Provider>
  );
};

// Hook để sử dụng context
export const useUserReview = (): UserReviewContextType => {
  const context = useContext(UserReviewContext);
  if (context === undefined) {
    throw new Error('useUserReview must be used within a UserReviewProvider');
  }
  return context;
};
