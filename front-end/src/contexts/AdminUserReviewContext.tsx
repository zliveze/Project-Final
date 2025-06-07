import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
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
  const [newReviewsCount, setNewReviewsCount] = useState<number>(0);
  const [currentlyViewedUserForReviewsId, setCurrentlyViewedUserForReviewsId] = useState<string | null>(null);

  // Cấu hình Axios với Auth token
  const api = useCallback(() => {
    const token = localStorage.getItem('adminToken');

    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api',
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

  // Khởi tạo và cập nhật số lượng đánh giá đang chờ duyệt khi component mount và sử dụng polling
  useEffect(() => {
    if (accessToken) {
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

      fetchPendingCount(); // Lấy lần đầu

      // Thiết lập polling để cập nhật 30 giây một lần
      const intervalId = setInterval(fetchPendingCount, 30000); // 30 giây

      // Cleanup khi component unmount
      return () => clearInterval(intervalId);
    }
  }, [accessToken, getReviewStats]);

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
