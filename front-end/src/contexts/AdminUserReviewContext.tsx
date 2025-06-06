import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { useAdminAuth } from './AdminAuthContext';

// Định nghĩa kiểu dữ liệu cho hình ảnh đánh giá
export interface ReviewImage {
  url: string;
  alt?: string;
}

// Định nghĩa kiểu dữ liệu cho đánh giá
export interface Review {
  reviewId: string;
  userId: string;
  productId: string;
  variantId?: string;
  productName: string;
  productImage: string;
  rating: number;
  content: string;
  images: ReviewImage[];
  likes: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  verified: boolean;
  isEdited?: boolean;
}

// Định nghĩa kiểu dữ liệu cho context
export interface AdminUserReviewContextType {
  reviews: Review[];
  userReviews: Review[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  newReviewsCount: number;

  // Phương thức quản lý đánh giá
  fetchReviews: (page?: number, limit?: number, status?: string, userId?: string) => Promise<void>;
  fetchUserReviews: (userId: string) => Promise<void>;
  approveReview: (reviewId: string) => Promise<boolean>;
  rejectReview: (reviewId: string) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  getReviewStats: () => Promise<Record<string, number>>;
  resetNewReviewsCount: () => void;
  updatePendingReviewsCount: () => Promise<void>;
}

// Tạo context
const AdminUserReviewContext = createContext<AdminUserReviewContextType | undefined>(undefined);

// Provider component
export const AdminUserReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken } = useAdminAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [, setSocket] = useState<Socket | null>(null);
  const [newReviewsCount, setNewReviewsCount] = useState<number>(0);
  const [currentlyViewedUserForReviewsId, setCurrentlyViewedUserForReviewsId] = useState<string | null>(null);

  // Cấu hình Axios với Auth token
  const api = useCallback(() => {
    const token = localStorage.getItem('adminToken');

    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
  }, []);

  // Lấy thống kê đánh giá
  const getReviewStats = useCallback(async (): Promise<Record<string, number>> => {
    try {
      // Thử endpoint chính
      try {
        const response = await api().get('/admin/reviews/stats');
        if (response.data) {
          return response.data;
        }
      } catch (err) {
        console.warn('Không thể lấy thống kê từ endpoint chính, thử endpoint thay thế:', err);
      }

      // Thử endpoint thay thế nếu endpoint chính không hoạt động
      try {
        const altResponse = await api().get('/admin/reviews?status=pending&limit=1');
        if (altResponse.data && typeof altResponse.data.totalItems === 'number') {
          return {
            total: altResponse.data.totalItems || 0,
            pending: altResponse.data.totalItems || 0,
            approved: 0,
            rejected: 0
          };
        }
      } catch (err) {
        console.error('Không thể lấy thống kê từ endpoint thay thế:', err);
      }

      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    } catch (error) {
      console.error('Lỗi khi lấy thống kê đánh giá:', error);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }, [api]);

  // Lấy danh sách đánh giá
  const fetchReviews = useCallback(async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    userId?: string
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

      if (userId) {
        params.append('userId', userId);
      }

      const response = await api().get(`/admin/reviews?${params.toString()}`);

      if (response.data) {
        setReviews(response.data.reviews || []);
        setTotalItems(response.data.totalItems || 0);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(response.data.currentPage || 1);

        // Luôn cập nhật số lượng đánh giá đang chờ duyệt, không quan tâm đang xem trang nào
        try {
          const stats = await getReviewStats();
          if (stats && typeof stats.pending === 'number') {
            setNewReviewsCount(stats.pending);
          }
        } catch (error) {
          console.error('Lỗi khi cập nhật số lượng đánh giá đang chờ duyệt:', error);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
      setError('Không thể lấy danh sách đánh giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [api, getReviewStats]);

  // Lấy đánh giá của một người dùng cụ thể
  const fetchUserReviews = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentlyViewedUserForReviewsId(userId); // Cập nhật userId đang xem

      const response = await api().get(`/admin/reviews/user/${userId}`);

      if (response.data) {
        setUserReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Lỗi khi lấy đánh giá của người dùng:', error);
      setError('Không thể lấy đánh giá của người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [api]); // Thêm api vào dependencies nếu chưa có, nhưng không thêm currentlyViewedUserForReviewsId để tránh vòng lặp

  // Cập nhật số lượng đánh giá đang chờ duyệt
  const updatePendingReviewsCount = useCallback(async () => {
    try {
      const stats = await getReviewStats();
      if (stats && typeof stats.pending === 'number') {
        setNewReviewsCount(stats.pending);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng đánh giá đang chờ duyệt:', error);
    }
  }, [getReviewStats]);

  // Khởi tạo và cập nhật số lượng đánh giá đang chờ duyệt khi component mount
  useEffect(() => {
    if (accessToken) {
      // Cập nhật số lượng đánh giá đang chờ duyệt khi component mount
      const fetchPendingCount = async () => {
        try {
          const stats = await getReviewStats();
          if (stats && typeof stats.pending === 'number') {
            setNewReviewsCount(stats.pending);
          }
        } catch (error) {
          console.error('Lỗi khi cập nhật số lượng đánh giá đang chờ duyệt:', error);
        }
      };

      fetchPendingCount();
    }
  }, [accessToken, getReviewStats]);

  // Khởi tạo WebSocket connection
  useEffect(() => {
    if (accessToken) {
      // URL của WebSocket server, thường là URL gốc của backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const wsUrl = apiUrl.replace(/\/api$/, ''); // Loại bỏ '/api' ở cuối URL nếu có

      console.log('AdminUserReviewContext: Connecting to WebSocket at', wsUrl);

      const newSocket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        query: {
          role: 'admin'
        }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('AdminUserReviewContext: WebSocket connected', newSocket.id);
        // Tham gia vào phòng admin
        newSocket.emit('joinUserRoom', { userId: 'admin-room' });
      });

      // Lắng nghe sự kiện có đánh giá mới được tạo
      newSocket.on('newReviewCreated', (data: Record<string, unknown>) => {
        console.log('AdminUserReviewContext: Received newReviewCreated event', data);

        // Tăng số lượng đánh giá mới
        setNewReviewsCount(prev => prev + 1);

        // Hiển thị thông báo
        toast.success('Có đánh giá mới cần phê duyệt!', {
          position: "bottom-right",
          duration: 5000
        });

        // Cập nhật danh sách đánh giá nếu đang ở trang đánh giá
        // Luôn fetch trang đầu tiên của các đánh giá đang chờ để đảm bảo review mới nhất được hiển thị
        fetchReviews(1, undefined, 'pending');

        // Nếu đánh giá mới thuộc về người dùng đang được xem, làm mới danh sách đánh giá của họ
        if (data.userId && typeof data.userId === 'string' && data.userId === currentlyViewedUserForReviewsId) {
          fetchUserReviews(data.userId);
        }
      });

      // Lắng nghe sự kiện cập nhật trạng thái đánh giá
      newSocket.on('reviewStatusUpdated', (data: Record<string, unknown>) => {
        console.log('AdminUserReviewContext: Received reviewStatusUpdated event', data);
        if (data.status && typeof data.status === 'string' &&
            ['pending', 'approved', 'rejected'].includes(data.status) &&
            data.reviewId && typeof data.reviewId === 'string') {
          let affectedUserId: string | undefined = undefined;

          // Cập nhật trạng thái đánh giá trong danh sách reviews chung
          setReviews(prevReviews => {
            const updatedReviews = prevReviews.map(review => {
              if (review.reviewId === data.reviewId) {
                affectedUserId = review.userId; // Lấy userId từ review bị ảnh hưởng
                return { ...review, status: data.status as 'pending' | 'approved' | 'rejected' };
              }
              return review;
            });
            return updatedReviews;
          });

          // Cập nhật trạng thái đánh giá trong danh sách userReviews (nếu user đó đang được xem)
          setUserReviews(prevUserReviews => {
            const updatedUserReviews = prevUserReviews.map(review => {
              if (review.reviewId === data.reviewId) {
                affectedUserId = review.userId; // Đảm bảo affectedUserId được set
                return { ...review, status: data.status as 'pending' | 'approved' | 'rejected' };
              }
              return review;
            });
            // Chỉ cập nhật nếu reviewId có trong danh sách userReviews hiện tại
            if (prevUserReviews.some(r => r.reviewId === data.reviewId)) {
              return updatedUserReviews;
            }
            return prevUserReviews;
          });

          // Fetch lại danh sách chung để cập nhật phân trang và bộ lọc
          fetchReviews(currentPage, undefined, reviews.find(r => r.reviewId === data.reviewId)?.status || undefined);


          // Nếu review được cập nhật thuộc về user đang xem, fetch lại review của user đó
          if (affectedUserId && affectedUserId === currentlyViewedUserForReviewsId) {
            fetchUserReviews(affectedUserId);
          }
        }
      });

      // Lắng nghe sự kiện xóa đánh giá
      newSocket.on('reviewDeleted', (data: Record<string, unknown>) => {
        console.log('AdminUserReviewContext: Received reviewDeleted event', data);
        if (data.reviewId && typeof data.reviewId === 'string') {
          let deletedReviewUserId: string | undefined = undefined;

          // Tìm userId của review sắp bị xóa từ danh sách reviews hiện tại
          const reviewToDelete = reviews.find(review => review.reviewId === data.reviewId);
          if (reviewToDelete) {
            deletedReviewUserId = reviewToDelete.userId;
          }

          // Cập nhật danh sách reviews chung
          setReviews(prevReviews =>
            prevReviews.filter(review => review.reviewId !== data.reviewId)
          );

          // Cập nhật danh sách userReviews (nếu user đó đang được xem)
          setUserReviews(prevUserReviews =>
            prevUserReviews.filter(review => review.reviewId !== data.reviewId)
          );

          // Fetch lại danh sách chung để cập nhật phân trang
          fetchReviews(currentPage);

          // Nếu review bị xóa thuộc về user đang xem, fetch lại review của user đó
          if (deletedReviewUserId && deletedReviewUserId === currentlyViewedUserForReviewsId) {
            fetchUserReviews(deletedReviewUserId);
          }
        }
      });

      newSocket.on('disconnect', () => {
        console.log('AdminUserReviewContext: WebSocket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('AdminUserReviewContext: WebSocket connection error', error);
      });

      // Cleanup khi component unmount
      return () => {
        console.log('AdminUserReviewContext: Cleaning up WebSocket connection');
        newSocket.off('newReviewCreated');
        newSocket.off('reviewStatusUpdated');
        newSocket.off('reviewDeleted');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.close();
        setSocket(null);
      };
    }
  }, [accessToken, api, fetchUserReviews, currentlyViewedUserForReviewsId, fetchReviews, currentPage, reviews]);

  // Phê duyệt đánh giá
  const approveReview = useCallback(async (reviewId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await api().patch(`/admin/reviews/${reviewId}/status`, {
        status: 'approved'
      });

      if (response.data) {
        // Cập nhật danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review.reviewId === reviewId
              ? { ...review, status: 'approved' }
              : review
          )
        );

        // Cập nhật danh sách đánh giá của người dùng
        setUserReviews(prevReviews =>
          prevReviews.map(review =>
            review.reviewId === reviewId
              ? { ...review, status: 'approved' }
              : review
          )
        );

        // Cập nhật số lượng đánh giá đang chờ duyệt
        updatePendingReviewsCount();

        toast.success('Đã phê duyệt đánh giá thành công');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi phê duyệt đánh giá:', error);
      toast.error('Không thể phê duyệt đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, updatePendingReviewsCount]);

  // Từ chối đánh giá
  const rejectReview = useCallback(async (reviewId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await api().patch(`/admin/reviews/${reviewId}/status`, {
        status: 'rejected'
      });

      if (response.data) {
        // Cập nhật danh sách đánh giá
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review.reviewId === reviewId
              ? { ...review, status: 'rejected' }
              : review
          )
        );

        // Cập nhật danh sách đánh giá của người dùng
        setUserReviews(prevReviews =>
          prevReviews.map(review =>
            review.reviewId === reviewId
              ? { ...review, status: 'rejected' }
              : review
          )
        );

        // Cập nhật số lượng đánh giá đang chờ duyệt
        updatePendingReviewsCount();

        toast.success('Đã từ chối đánh giá thành công');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi từ chối đánh giá:', error);
      toast.error('Không thể từ chối đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, updatePendingReviewsCount]);

  // Xóa đánh giá
  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    try {
      setLoading(true);

      await api().delete(`/admin/reviews/${reviewId}`);

      // Cập nhật danh sách đánh giá
      setReviews(prevReviews =>
        prevReviews.filter(review => review.reviewId !== reviewId)
      );

      // Cập nhật danh sách đánh giá của người dùng
      setUserReviews(prevReviews =>
        prevReviews.filter(review => review.reviewId !== reviewId)
      );

      // Cập nhật số lượng đánh giá đang chờ duyệt
      updatePendingReviewsCount();

      toast.success('Đã xóa đánh giá thành công');
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa đánh giá:', error);
      toast.error('Không thể xóa đánh giá. Vui lòng thử lại sau.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, updatePendingReviewsCount]);



  // Phương thức reset số lượng đánh giá mới - chỉ sử dụng khi cần thiết
  // Ví dụ: khi tất cả đánh giá đã được duyệt hoặc từ chối
  const resetNewReviewsCount = useCallback(() => {
    setNewReviewsCount(0);
  }, []);

  // Context value
  const value: AdminUserReviewContextType = {
    reviews,
    userReviews,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    newReviewsCount,
    fetchReviews,
    fetchUserReviews,
    approveReview,
    rejectReview,
    deleteReview,
    getReviewStats,
    resetNewReviewsCount,
    updatePendingReviewsCount,
  };

  return (
    <AdminUserReviewContext.Provider value={value}>
      {children}
    </AdminUserReviewContext.Provider>
  );
};

// Hook để sử dụng context
export const useAdminUserReview = (): AdminUserReviewContextType => {
  const context = useContext(AdminUserReviewContext);
  if (context === undefined) {
    throw new Error('useAdminUserReview must be used within an AdminUserReviewProvider');
  }
  return context;
};
