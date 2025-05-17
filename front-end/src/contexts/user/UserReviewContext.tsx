import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
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
  createReview: (reviewData: FormData, onProgress?: (progress: number) => void) => Promise<boolean>;
  updateReview: (reviewId: string, reviewData: any, onProgress?: (progress: number) => void) => Promise<boolean>;
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
  const [socket, setSocket] = useState<Socket | null>(null);

  const { isAuthenticated, user } = useAuth();

  // Khởi tạo và quản lý WebSocket connection
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      // URL của WebSocket server, thường là URL gốc của backend API
      const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const newSocket = io(WS_URL, {
        transports: ['websocket'], // Ưu tiên WebSocket
        // query: { userId: user._id } // Có thể gửi userId qua query nếu backend hỗ trợ auto-join room
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('UserReviewContext: WebSocket connected', newSocket.id);
        // Gửi sự kiện để tham gia vào phòng (room) của user cụ thể
        newSocket.emit('joinUserRoom', { userId: user._id });
      });

      // Lắng nghe sự kiện cập nhật trạng thái đánh giá từ server
      newSocket.on('reviewStatusUpdated', (updatedReviewFromServer: Review) => {
        console.log('UserReviewContext: Received reviewStatusUpdated event:', updatedReviewFromServer);

        // Xác định loại thông báo dựa trên trạng thái mới
        let toastMessage = `Trạng thái đánh giá của bạn cho sản phẩm "${updatedReviewFromServer.productName || 'Sản phẩm'}" đã được cập nhật.`;
        let toastType: 'success' | 'error' | 'default' = 'default';

        if (updatedReviewFromServer.status === 'approved') {
          toastMessage = `Đánh giá của bạn cho sản phẩm "${updatedReviewFromServer.productName || 'Sản phẩm'}" đã được phê duyệt.`;
          toastType = 'success';
        } else if (updatedReviewFromServer.status === 'rejected') {
          toastMessage = `Đánh giá của bạn cho sản phẩm "${updatedReviewFromServer.productName || 'Sản phẩm'}" đã bị từ chối.`;
          toastType = 'error';
        }

        // Hiển thị thông báo phù hợp với trạng thái
        if (toastType === 'success') {
          toast.success(toastMessage);
        } else if (toastType === 'error') {
          toast.error(toastMessage);
        } else {
          toast(toastMessage);
        }

        // Cập nhật danh sách đánh giá
        setReviews(prevReviews => {
          // Cập nhật đánh giá trong danh sách, bao gồm cả đánh giá bị từ chối
          return prevReviews.map(currentClientReview => {
            if (currentClientReview._id === updatedReviewFromServer._id) {
              // Cập nhật đánh giá với dữ liệu từ server,
              // nhưng giữ lại trạng thái 'isLiked' từ client nếu server không cung cấp
              return {
                ...currentClientReview, // Bắt đầu với trạng thái client hiện tại
                ...updatedReviewFromServer, // Ghi đè với cập nhật từ server
                isLiked: updatedReviewFromServer.isLiked !== undefined
                  ? updatedReviewFromServer.isLiked
                  : currentClientReview.isLiked,
              };
            }
            return currentClientReview;
          });
        });

        // Thông báo cho các component khác về sự thay đổi trạng thái đánh giá
        // Điều này giúp các component như ReviewForm có thể cập nhật UI của chúng
        if (socket) {
          socket.emit('client-review-status-changed', {
            reviewId: updatedReviewFromServer._id,
            status: updatedReviewFromServer.status
          });
        }
      });

      // Lắng nghe sự kiện đánh giá bị xóa (ví dụ: do admin xóa)
      newSocket.on('reviewDeleted', (data: { reviewId: string }) => {
        console.log('UserReviewContext: Received reviewDeleted event:', data);
        if (data.reviewId) {
          setReviews(prevReviews => prevReviews.filter(review => review._id !== data.reviewId));
          toast('Một đánh giá đã được quản trị viên xóa.', {
            duration: 4000,
            icon: 'ℹ️'
          });
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('UserReviewContext: WebSocket disconnected', reason);
      });

      newSocket.on('connect_error', (err) => {
        console.error('UserReviewContext: WebSocket connection error:', err.message, (err as any).data);
      });

      // Cleanup khi component unmount hoặc user thay đổi
      return () => {
        console.log('UserReviewContext: Cleaning up WebSocket connection');
        newSocket.off('connect');
        newSocket.off('reviewStatusUpdated');
        newSocket.off('reviewDeleted');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.close();
        setSocket(null);
      };
    } else {
      // Nếu không authenticated, đóng socket nếu đang mở
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id]); // Chỉ chạy lại khi trạng thái đăng nhập hoặc user thay đổi

  // Tạo instance axios với cấu hình chung
  const api = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:3001/api';

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
                ? likedResponse.data.map((likedItem: any) => likedItem.reviewId || likedItem._id || likedItem)
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
  const createReview = useCallback(async (reviewData: FormData, onProgress?: (progress: number) => void): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
      return false;
    }

    try {
      setLoading(true);

      // Gọi trực tiếp đến backend thay vì qua Next.js API routes
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/reviews`;

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
    } catch (error: any) {
      console.error('Lỗi khi tạo đánh giá:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể tạo đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cập nhật đánh giá
  const updateReview = useCallback(async (reviewId: string, reviewData: any, onProgress?: (progress: number) => void): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);

      // Kiểm tra xem reviewData có phải là FormData không
      const isFormData = reviewData instanceof FormData;
      let response;

      if (isFormData) {
        // Nếu là FormData, sử dụng axios với cấu hình upload và progress
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/reviews/${reviewId}`;

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

      // Gọi trực tiếp đến backend API
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/reviews/${reviewId}`;
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
