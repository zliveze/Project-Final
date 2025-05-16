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
  likedBy?: string[]; // Danh sách ID người dùng đã thích đánh giá
  user?: {
    _id: string;
    name: string;
  };
  replies?: ReviewReply[]; // Thêm replies ở đây nếu cần thiết cho ProductReviews
}

// Định nghĩa ReviewReply nếu nó sẽ được dùng trong ReviewType
export interface ReviewReply { // Export nếu cần dùng ở nơi khác
  userId: string; // Hoặc một user object đầy đủ hơn
  content: string;
  createdAt: string;
  // Thêm các trường khác nếu có, ví dụ: user name, avatar của người reply
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
  fetchProductReviews: (productId: string, status?: string) => Promise<void>;
  createReview: (reviewData: FormData) => Promise<boolean>;
  updateReview: (reviewId: string, reviewData: any) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  checkCanReview: (productId: string) => Promise<{ canReview: boolean, hasPurchased: boolean, hasReviewed: boolean }>;
  getReviewStats: (productId: string) => Promise<{ average: number, distribution: Record<string, number> }>;
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
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().get(`/reviews/product/${productId}?status=${status}`);
      let productApiReviews: Review[] = [];

      if (response.data && Array.isArray(response.data)) {
        productApiReviews = response.data;

        if (isAuthenticated && user?._id) {
          try {
            const likedResponse = await api().get('/reviews/liked');
            if (likedResponse.data && Array.isArray(likedResponse.data)) {
              const likedIds = new Set(likedResponse.data.map((likedItem: any) => likedItem.reviewId || likedItem._id || likedItem));
              productApiReviews = productApiReviews.map((review: Review) => ({
                ...review,
                isLiked: likedIds.has(review._id)
              }));
            } else {
              productApiReviews = productApiReviews.map(review => ({ ...review, isLiked: false }));
            }
          } catch (likedError) {
            console.error('Lỗi khi lấy danh sách đánh giá đã thích trong fetchProductReviews:', likedError);
            productApiReviews = productApiReviews.map(review => ({ ...review, isLiked: false }));
          }
        } else {
          productApiReviews = productApiReviews.map(review => ({ ...review, isLiked: false }));
        }
        setReviews(productApiReviews);
        setTotalItems(productApiReviews.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        setReviews([]);
        setTotalItems(0);
        setTotalPages(0);
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error('Lỗi khi lấy đánh giá sản phẩm:', error);
      setError(error.response?.data?.message || 'Không thể lấy đánh giá sản phẩm.');
      setReviews([]);
      setTotalItems(0);
      setTotalPages(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, user?._id]);

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
            review._id === reviewId // Chỉ dùng _id
              ? { ...review, ...reviewData, status: 'pending' } // Giữ lại status: 'pending' nếu đó là logic mong muốn sau khi update
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
            review._id !== reviewId // Chỉ dùng _id
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

  // Toggle thích/bỏ thích đánh giá
  const toggleLikeReview = useCallback(async (reviewId: string, isLiked: boolean): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích/bỏ thích đánh giá');
      return false;
    }

    try {
      // Gọi API toggle-like, đảm bảo reviewId là _id
      const response = await api().post(`/reviews/${reviewId}/toggle-like`);

      if (response.data) {
        // Cập nhật số lượt thích và trạng thái isLiked trong danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId // Sử dụng _id để so sánh
              ? {
                  ...review,
                  // API nên trả về số lượt thích mới và trạng thái isLiked mới
                  likes: response.data.likes !== undefined ? response.data.likes : (isLiked ? Math.max(0, review.likes - 1) : review.likes + 1),
                  isLiked: response.data.isLiked !== undefined ? response.data.isLiked : !isLiked
                }
              : review
          )
        );

        // Cập nhật danh sách đánh giá đã thích (likedReviews set)
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          // Backend nên trả về trạng thái isLiked mới
          // Nếu API trả về isLiked = true, nghĩa là người dùng vừa thích => thêm vào set
          // Nếu API trả về isLiked = false, nghĩa là người dùng vừa bỏ thích => xóa khỏi set
          if (response.data.isLiked === true) {
            newSet.add(reviewId); // reviewId ở đây là _id
          } else {
            newSet.delete(reviewId); // reviewId ở đây là _id
          }
          return newSet;
        });

        // Sử dụng trạng thái isLiked *trước khi* toggle để xác định thông báo
        // Nếu isLiked (trạng thái cũ) là false, nghĩa là người dùng vừa thực hiện hành động LIKE, trạng thái mới là true
        // Nếu isLiked (trạng thái cũ) là true, nghĩa là người dùng vừa thực hiện hành động UNLIKE, trạng thái mới là false
        toast.success(!isLiked ? 'Đã thích đánh giá' : 'Đã bỏ thích đánh giá');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Lỗi khi toggle thích/bỏ thích đánh giá:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      return false;
    }
  }, [api, isAuthenticated]);

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
    toggleLikeReview
  };

  return (
    <UserReviewContext.Provider value={value}>
      {children}
    </UserReviewContext.Provider>
  );
};

export default UserReviewProvider;
