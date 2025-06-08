import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  fetchFeaturedReviews: (limit?: number) => Promise<Review[]>;
  createReview: (reviewData: FormData, onProgress?: (progress: number) => void) => Promise<boolean>;
  updateReview: (reviewId: string, reviewData: FormData | Partial<Review>, onProgress?: (progress: number) => void) => Promise<boolean>;
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

  const { isAuthenticated, user } = useAuth();

  // Tạo instance axios với cấu hình chung
  const api = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'https://backendyumin.vercel.app/api';

    return axios.create({
      baseURL: apiUrl,
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
      setError(err.response?.data?.message || 'Không thể lấy danh sách đánh giá. Vui lòng thử lại sau.');
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

      // Lấy đánh giá đã được phê duyệt từ API
      const response = await api().get(`/reviews/product/${productId}?status=${status}`);
      let productApiReviews: Review[] = [];

      if (response.data && Array.isArray(response.data)) {
        productApiReviews = response.data;

        // Nếu người dùng đã đăng nhập, lấy thêm đánh giá của họ (bao gồm cả đánh giá bị từ chối)
        if (isAuthenticated && user?._id) {
          try {
            // Lấy danh sách đánh giá đã thích
            const likedResponse = await api().get('/reviews/liked');
            const likedIds = new Set(
              likedResponse.data && Array.isArray(likedResponse.data)
                ? likedResponse.data.map((likedItem: { reviewId?: string; _id?: string } | string) =>
                    typeof likedItem === 'string' ? likedItem : (likedItem.reviewId || likedItem._id || ''))
                : []
            );

            // Lấy tất cả đánh giá của người dùng hiện tại cho sản phẩm này
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '50');
            // Không lọc theo status để lấy tất cả đánh giá của người dùng

            const userReviewsResponse = await api().get(`/reviews/user/me?${params.toString()}`);
            if (userReviewsResponse.data && userReviewsResponse.data.reviews && Array.isArray(userReviewsResponse.data.reviews)) {
              const userReviews = userReviewsResponse.data.reviews.filter(
                (review: Review) => review.productId === productId
              );

              // Kết hợp đánh giá đã phê duyệt và đánh giá của người dùng
              const reviewMap = new Map<string, Review>();

              // Thêm đánh giá đã phê duyệt vào Map
              productApiReviews.forEach(review => {
                reviewMap.set(review._id, {
                  ...review,
                  isLiked: likedIds.has(review._id)
                });
              });

              // Thêm đánh giá của người dùng vào Map (sẽ ghi đè nếu đã có)
              userReviews.forEach((review: Review) => {
                reviewMap.set(review._id, {
                  ...review,
                  isLiked: likedIds.has(review._id)
                });
              });

              // Chuyển Map thành mảng
              productApiReviews = Array.from(reviewMap.values());
            } else {
              // Nếu không có đánh giá của người dùng, chỉ cập nhật trạng thái isLiked
              productApiReviews = productApiReviews.map((review: Review) => ({
                ...review,
                isLiked: likedIds.has(review._id)
              }));
            }
          } catch (error) {
            console.error('Lỗi khi lấy đánh giá của người dùng trong fetchProductReviews:', error);
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi khi lấy đánh giá sản phẩm:', error);
      setError(err.response?.data?.message || 'Không thể lấy đánh giá sản phẩm.');
      setReviews([]);
      setTotalItems(0);
      setTotalPages(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, user?._id]);

  // Lấy đánh giá nổi bật cho trang chủ
  const fetchFeaturedReviews = useCallback(async (limit: number = 10): Promise<Review[]> => {
    try {
      setError(null);

      // Lấy đánh giá đã được phê duyệt với rating cao (4-5 sao)
      const params = new URLSearchParams();
      params.append('status', 'approved');
      params.append('limit', limit.toString());
      params.append('page', '1');

      const response = await api().get(`/reviews?${params.toString()}`);

      if (response.data && response.data.reviews && Array.isArray(response.data.reviews)) {
        // Lọc chỉ lấy đánh giá có rating >= 4 và có nội dung
        const featuredReviews = response.data.reviews
          .filter((review: Review) => review.rating >= 4 && review.content && review.content.trim().length > 0)
          .map((review: Review) => ({
            ...review,
            isLiked: false // Không cần trạng thái like cho trang chủ
          }));

        return featuredReviews;
      }

      return [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi khi lấy đánh giá nổi bật:', error);
      setError(err.response?.data?.message || 'Không thể lấy đánh giá nổi bật.');
      return [];
    }
  }, [api]);

  // Tạo đánh giá mới
  const createReview = useCallback(async (reviewData: FormData, onProgress?: (progress: number) => void): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
      return false;
    }

    try {
      setLoading(true);

      // Gọi trực tiếp đến backend thay vì qua Next.js API routes
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api'}/reviews`;

      // Sử dụng axios để có thể theo dõi tiến trình upload
      const response = await axios.post(backendUrl, reviewData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success('Đã gửi đánh giá thành công');
        return true;
      } else {
        throw new Error(response.data?.message || 'Không thể tạo đánh giá');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Lỗi khi tạo đánh giá:', error);
      toast.error(err.response?.data?.message || err.message || 'Không thể tạo đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cập nhật đánh giá
  const updateReview = useCallback(async (reviewId: string, reviewData: FormData | Partial<Review>, onProgress?: (progress: number) => void): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);

      // Kiểm tra xem reviewData có phải là FormData không
      const isFormData = reviewData instanceof FormData;
      let response;

      if (isFormData) {
        // Nếu là FormData, sử dụng axios với cấu hình upload và progress
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api'}/reviews/${reviewId}`;

        response = await axios.patch(backendUrl, reviewData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        });
      } else {
        // Nếu không phải FormData, sử dụng api() thông thường
        response = await api().patch(`/reviews/${reviewId}`, reviewData);
      }

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi khi cập nhật đánh giá:', error);
      toast.error(err.response?.data?.message || 'Không thể cập nhật đánh giá. Vui lòng thử lại sau.');
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

      // Gọi trực tiếp đến backend API
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api'}/reviews/${reviewId}`;
      const response = await axios.delete(backendUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      // if (response.data) { // axios.delete thường không có response.data nếu thành công với status 200 hoặc 204
      if (response.status === 200 || response.status === 204) { // Kiểm tra status code
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi khi xóa đánh giá:', error);
      toast.error(err.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      console.error('Lỗi khi kiểm tra khả năng đánh giá:', error);

      // Kiểm tra nếu lỗi là 404 (endpoint không tồn tại)
      if (err.response && err.response.status === 404) {
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
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      console.error('Lỗi khi lấy thống kê đánh giá:', error);

      // Kiểm tra nếu lỗi là 404 (endpoint không tồn tại)
      if (err.response && err.response.status === 404) {
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

    // Kiểm tra reviewId hợp lệ
    if (!reviewId || reviewId.trim() === '') {
      toast.error('ID đánh giá không hợp lệ');
      return false;
    }

    // Lưu lại trạng thái hiện tại trước khi gọi API để phục vụ cho việc khôi phục nếu gặp lỗi
    const currentIsLiked = isLiked;

    try {
      console.log(`Đang toggle like cho review ID: ${reviewId}, trạng thái hiện tại: ${isLiked}`);
      
      // Cập nhật UI trước để người dùng nhận được phản hồi ngay lập tức
      // Đảo ngược trạng thái isLiked từ false -> true hoặc true -> false
      const newClientIsLiked = !currentIsLiked;

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                likes: currentIsLiked ? Math.max(0, review.likes - 1) : review.likes + 1,
                isLiked: newClientIsLiked
              }
            : review
        )
      );

      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      console.log(`Gọi API: POST /reviews/${reviewId}/toggle-like với token: ${token.substring(0, 10)}...`);

      // Gọi API toggle-like
      const response = await api().post(`/reviews/${reviewId}/toggle-like`);

      console.log('Phản hồi từ API toggle-like:', response.data);

      if (response.data) {
        // Trạng thái isLiked trong response.data là trạng thái MỚI từ server
        const serverIsLiked = response.data.isLiked;

        // Cập nhật lại chính xác dữ liệu từ phản hồi của server
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId
              ? {
                  ...review,
                  likes: response.data.likes, // Sử dụng chính xác số lượt thích từ server
                  isLiked: serverIsLiked // Sử dụng trạng thái isLiked từ server
                }
              : review
          )
        );



        toast.success(serverIsLiked ? 'Đã thích đánh giá' : 'Đã bỏ thích đánh giá');
        return true;
      }

      // Nếu không có response.data, khôi phục trạng thái ban đầu
      console.warn('API trả về thành công nhưng không có dữ liệu');
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                likes: currentIsLiked ? review.likes + 1 : Math.max(0, review.likes - 1),
                isLiked: currentIsLiked
              }
            : review
        )
      );

      return false;
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: { message?: string };
          headers?: unknown
        };
        request?: unknown;
        message?: string
      };
      console.error('Lỗi khi toggle thích/bỏ thích đánh giá:', error);

      // Log chi tiết hơn về lỗi
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);
      } else if (err.request) {
        console.error('Request được gửi nhưng không nhận được phản hồi:', err.request);
      } else {
        console.error('Lỗi trong quá trình thiết lập request:', err.message);
      }

      // Khôi phục trạng thái ban đầu khi gặp lỗi
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                likes: currentIsLiked ? review.likes + 1 : Math.max(0, review.likes - 1),
                isLiked: currentIsLiked
              }
            : review
        )
      );

      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';

      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            break;
          case 404:
            errorMessage = 'Không tìm thấy đánh giá này.';
            break;
          case 500:
            errorMessage = 'Lỗi server. Vui lòng thử lại sau hoặc liên hệ admin.';
            break;
          default:
            errorMessage = err.response.data?.message || `Lỗi ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Không thể kết nối tới server. Kiểm tra kết nối mạng.';
      }

      toast.error(errorMessage);
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
    fetchFeaturedReviews,
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
