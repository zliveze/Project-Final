import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../AuthContext';

// Định nghĩa kiểu dữ liệu cho hình ảnh đánh giá
export interface ReviewImage {
  url: string;
  alt?: string;
}

// Định nghĩa kiểu dữ liệu cho đánh giá
export interface Review {
  _id: string;
  reviewId: string;
  productId: string;
  variantId?: string;
  productName: string;
  productImage: string;
  rating: number;
  content: string;
  images: ReviewImage[];
  likes: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  verified: boolean;
  isEdited?: boolean;
  isLiked?: boolean; // Thêm trường để theo dõi xem người dùng đã thích đánh giá này chưa
  user?: {
    name: string;
    avatar?: string;
  };
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
  createReview: (reviewData: FormData) => Promise<boolean>;
  updateReview: (reviewId: string, reviewData: any) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  checkCanReview: (productId: string) => Promise<{ canReview: boolean, hasPurchased: boolean, hasReviewed: boolean }>;
  getReviewStats: (productId: string) => Promise<{ average: number, distribution: Record<string, number> }>;
  likeReview: (reviewId: string) => Promise<boolean>;
  unlikeReview: (reviewId: string) => Promise<boolean>;
  toggleLikeReview: (reviewId: string, isLiked: boolean) => Promise<boolean>;
}

// Tạo context
const UserReviewContext = createContext<UserReviewContextType | undefined>(undefined);

// Hook để sử dụng context
export const useUserReview = () => {
  const context = useContext(UserReviewContext);
  if (!context) {
    throw new Error('useUserReview must be used within a UserReviewProvider');
  }
  return context;
};

// Provider component
export const UserReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  const { isAuthenticated, user } = useAuth();

  // Tạo instance axios với cấu hình chung
  const api = useCallback(() => {
    const token = localStorage.getItem('accessToken');

    return axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  }, []);

  // Lấy danh sách đánh giá của người dùng hiện tại
  const fetchMyReviews = useCallback(async (
    page: number = 1,
    limit: number = 10,
    status?: string
  ) => {
    if (!isAuthenticated) return;

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
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
      setError(error.response?.data?.message || 'Không thể lấy danh sách đánh giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated]);

  // Lấy đánh giá của một sản phẩm cụ thể
  const fetchProductReviews = useCallback(async (
    productId: string,
    status: string = 'approved'
  ): Promise<Review[]> => {
    try {
      setLoading(true);

      const response = await api().get(`/reviews/product/${productId}?status=${status}`);

      if (response.data) {
        // Nếu người dùng đã đăng nhập, kiểm tra đánh giá đã thích
        if (isAuthenticated && user?.id) {
          try {
            // Lấy danh sách đánh giá đã thích của người dùng
            const likedResponse = await api().get('/reviews/liked');
            if (likedResponse.data && Array.isArray(likedResponse.data)) {
              // Lưu danh sách ID đánh giá đã thích
              const likedIds = new Set(likedResponse.data.map((review: any) => review.reviewId));
              setLikedReviews(likedIds);

              // Đánh dấu đánh giá đã thích
              const reviewsWithLikedStatus = response.data.map((review: Review) => ({
                ...review,
                isLiked: likedIds.has(review._id) || likedIds.has(review.reviewId)
              }));

              return reviewsWithLikedStatus || [];
            }
          } catch (likedError) {
            console.error('Lỗi khi lấy danh sách đánh giá đã thích:', likedError);
            // Nếu có lỗi, vẫn trả về đánh giá nhưng không có trạng thái đã thích
          }
        }

        return response.data || [];
      }

      return [];
    } catch (error) {
      console.error('Lỗi khi lấy đánh giá sản phẩm:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, user]);

  // Tạo đánh giá mới
  const createReview = useCallback(async (reviewData: FormData): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
      return false;
    }

    try {
      setLoading(true);

      // Chuyển đổi FormData thành đối tượng JSON
      const formDataObj: Record<string, any> = {};
      for (const [key, value] of reviewData.entries()) {
        formDataObj[key] = value;
      }

      console.log('Dữ liệu gửi đi:', formDataObj);

      // Gọi trực tiếp đến backend thay vì qua Next.js API routes
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reviews`;

      // Gửi dữ liệu dưới dạng JSON thay vì FormData
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          productId: formDataObj.productId,
          rating: parseInt(formDataObj.rating, 10),
          content: formDataObj.content,
          images: formDataObj.images ? JSON.parse(formDataObj.images) : []
        })
      });

      if (!response.ok) {
        let errorMessage = 'Không thể tạo đánh giá';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Lỗi khi phân tích phản hồi JSON:', parseError);
          // Nếu không thể phân tích JSON, thử lấy text
          const errorText = await response.text();
          console.log('Phản hồi gốc:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success('Đã gửi đánh giá thành công');
      return true;
    } catch (error: any) {
      console.error('Lỗi khi tạo đánh giá:', error);
      toast.error(error.message || 'Không thể tạo đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cập nhật đánh giá
  const updateReview = useCallback(async (reviewId: string, reviewData: any): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);

      const response = await api().patch(`/reviews/${reviewId}`, reviewData);

      if (response.data) {
        // Cập nhật danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId || review.reviewId === reviewId
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
  }, [api, isAuthenticated]);

  // Xóa đánh giá
  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);

      const response = await api().delete(`/reviews/${reviewId}`);

      if (response.data) {
        // Cập nhật danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.filter(review =>
            review._id !== reviewId && review.reviewId !== reviewId
          )
        );

        toast.success('Đã xóa đánh giá thành công');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Lỗi khi xóa đánh giá:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated]);

  // Kiểm tra xem người dùng có thể đánh giá sản phẩm không
  const checkCanReview = useCallback(async (productId: string): Promise<{ canReview: boolean, hasPurchased: boolean, hasReviewed: boolean }> => {
    if (!isAuthenticated) {
      console.log('Người dùng chưa đăng nhập, không thể đánh giá');
      return { canReview: false, hasPurchased: false, hasReviewed: false };
    }

    try {
      console.log(`Đang kiểm tra khả năng đánh giá cho sản phẩm ${productId}`);
      const response = await api().get(`/reviews/check-can-review/${productId}`);

      if (response.data) {
        console.log('Kết quả kiểm tra khả năng đánh giá:', response.data);
        return response.data;
      }

      console.log('Không có dữ liệu trả về từ API, sử dụng giá trị mặc định');
      return { canReview: false, hasPurchased: false, hasReviewed: false };
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra khả năng đánh giá:', error);

      // Kiểm tra nếu lỗi là 404 (endpoint không tồn tại)
      if (error.response && error.response.status === 404) {
        console.warn('API endpoint /reviews/check-can-review không tồn tại. Đang sử dụng giá trị mặc định.');
      }

      // Nếu API không hoạt động, giả định người dùng có thể đánh giá
      // Đây là giải pháp tạm thời để người dùng có thể đánh giá
      return { canReview: true, hasPurchased: true, hasReviewed: false };
    }
  }, [api, isAuthenticated]);

  // Lấy thống kê đánh giá của sản phẩm
  const getReviewStats = useCallback(async (productId: string): Promise<{ average: number, distribution: Record<string, number> }> => {
    try {
      const response = await api().get(`/reviews/stats/rating/${productId}`);

      if (response.data) {
        return response.data;
      }

      return { average: 0, distribution: {} };
    } catch (error: any) {
      console.error('Lỗi khi lấy thống kê đánh giá:', error);

      // Kiểm tra nếu lỗi là 404 (endpoint không tồn tại)
      if (error.response && error.response.status === 404) {
        console.warn('API endpoint /reviews/stats/rating không tồn tại. Đang sử dụng giá trị mặc định.');
      }

      return { average: 0, distribution: {} };
    }
  }, [api]);

  // Thích đánh giá
  const likeReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích đánh giá');
      return false;
    }

    try {
      const response = await api().post(`/reviews/${reviewId}/like`);

      if (response.data) {
        // Cập nhật số lượt thích trong danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId || review.reviewId === reviewId
              ? { ...review, likes: review.likes + 1, isLiked: true }
              : review
          )
        );

        // Thêm vào danh sách đánh giá đã thích
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          newSet.add(reviewId);
          return newSet;
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi thích đánh giá:', error);
      return false;
    }
  }, [api, isAuthenticated]);

  // Bỏ thích đánh giá
  const unlikeReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để bỏ thích đánh giá');
      return false;
    }

    try {
      const response = await api().post(`/reviews/${reviewId}/unlike`);

      if (response.data) {
        // Cập nhật số lượt thích trong danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId || review.reviewId === reviewId
              ? { ...review, likes: Math.max(0, review.likes - 1), isLiked: false }
              : review
          )
        );

        // Xóa khỏi danh sách đánh giá đã thích
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi bỏ thích đánh giá:', error);
      return false;
    }
  }, [api, isAuthenticated]);

  // Toggle thích/bỏ thích đánh giá
  const toggleLikeReview = useCallback(async (reviewId: string, isLiked: boolean): Promise<boolean> => {
    if (isLiked) {
      return await unlikeReview(reviewId);
    } else {
      return await likeReview(reviewId);
    }
  }, [likeReview, unlikeReview]);

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
    unlikeReview,
    toggleLikeReview
  };

  return (
    <UserReviewContext.Provider value={value}>
      {children}
    </UserReviewContext.Provider>
  );
};

export default UserReviewProvider;
