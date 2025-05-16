import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiThumbsUp, FiChevronDown, FiChevronUp, FiUser, FiLoader, FiEdit, FiTrash2, FiClock } from 'react-icons/fi';
import ReviewForm from './ReviewForm';
import { useUserReview, Review as UserReviewContextReviewType } from '@/contexts/user/UserReviewContext'; // Import Review type from context
import { useAuth } from '@/contexts/AuthContext';

interface ReviewImage {
  url: string;
  alt?: string;
}

interface ReviewReply {
  userId: string;
  content: string;
  createdAt: string;
}

interface ReviewUser {
  name: string;
  avatar?: string;
}

interface Review {
  _id: string;
  productId: string;
  variantId?: string;
  userId: string;
  orderId?: string;
  rating: number;
  content: string;
  images?: ReviewImage[];
  likes: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | string;
  reply?: ReviewReply[];
  createdAt: string;
  updatedAt?: string;
  user: ReviewUser;
  reviewId?: string;
  isEdited?: boolean;
  isLiked?: boolean; // Thêm trường để theo dõi xem người dùng đã thích đánh giá này chưa
}

interface ProductReviewsProps {
  productId: string;
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
  isAuthenticated?: boolean;
  hasPurchased?: boolean;
  hasReviewed?: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  reviews: initialReviews = [],
  averageRating: initialAverageRating = 0,
  reviewCount: initialReviewCount = 0,
  isAuthenticated: initialIsAuthenticated = false, // This prop might be redundant if we always use context's isAuthenticated
  hasPurchased: initialHasPurchased = false,
  hasReviewed: initialHasReviewed = false,
}) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const {
    fetchProductReviews,
    getReviewStats,
    checkCanReview,
    toggleLikeReview,
    deleteReview: deleteReviewFromContext,
    updateReview: updateReviewFromContext,
    loading: contextLoading // Renamed to avoid conflict
    // api: apiClient // apiClient is not exposed by UserReviewContext
  } = useUserReview();

  const [componentLoading, setComponentLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);

  const [productReviews, setProductReviews] = useState<Review[]>(initialReviews);
  const [reviewStats, setReviewStats] = useState({
    average: initialAverageRating,
    distribution: {} as Record<string, number>,
    total: initialReviewCount
  });
  const [canReviewState, setCanReviewState] = useState({
    canReview: false,
    hasPurchased: initialHasPurchased,
    hasReviewed: initialHasReviewed,
  });

  const currentUserId = currentUser?._id;
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);

  useEffect(() => {
    // Client-side only: get token from localStorage
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('accessToken'));
    }
  }, [isAuthenticated]); // Re-check token when authentication state changes

  // Local API client as it's not exposed from UserReviewContext
  const эффективныйApiUrl = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001')
                        ? process.env.NEXT_PUBLIC_API_URL
                        : 'http://localhost:3001/api';

  const localApiClient = useCallback(() => {
    return axios.create({
      baseURL: эффективныйApiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorageToken ? `Bearer ${localStorageToken}` : ''
      }
    });
  }, [localStorageToken]);

  const mapReviewData = useCallback((review: UserReviewContextReviewType | Review | any): Review => { // Added any for flexibility from API
    return {
      ...review,
      _id: review._id || review.reviewId || '',
      userId: review.userId, // <<<<<<< EXPLICITLY MAP userId
      productId: review.productId || productId,
      status: review.status as Review['status'],
      images: review.images || [],
      user: (review as Review).user || { name: 'Người dùng ẩn danh' },
      likes: review.likes || 0,
      verified: review.verified || false,
      createdAt: review.createdAt || new Date().toISOString(),
      isEdited: review.isEdited || false,
      isLiked: review.isLiked || false, // Thêm trường isLiked
    };
  }, [productId]);


  // Tải đánh giá sản phẩm khi component được mount
  useEffect(() => {
    const loadReviewData = async () => {
      if (!productId) return;
      setComponentLoading(true);
      try {
        // 1. Lấy đánh giá đã duyệt của sản phẩm
        const approvedReviewsResult = await fetchProductReviews(productId, 'approved');
        let combinedReviews: Review[] = (Array.isArray(approvedReviewsResult) ? approvedReviewsResult : []).map(mapReviewData);

        // 2. Nếu người dùng đã đăng nhập VÀ có token, lấy review pending của họ cho sản phẩm này
        if (isAuthenticated && currentUserId && localStorageToken) {
          try {
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '50'); // Lấy đủ nhiều
            params.append('status', 'pending');

            const myPendingReviewsResponse = await localApiClient().get<{ reviews: UserReviewContextReviewType[], totalItems: number }>(
              `/reviews/user/me?${params.toString()}`
            );

            if (myPendingReviewsResponse.data && Array.isArray(myPendingReviewsResponse.data.reviews)) {
              const userPendingReviewsForThisProduct = myPendingReviewsResponse.data.reviews
                .filter((review: UserReviewContextReviewType) => review.productId === productId) // Ensure review.productId exists on UserReviewContextReviewType
                .map(mapReviewData);

              // Gộp và loại bỏ trùng lặp: ưu tiên bản pending của user
              const reviewsMap = new Map<string, Review>();
              combinedReviews.forEach(review => {
                if(review._id) reviewsMap.set(review._id, review);
              });

              userPendingReviewsForThisProduct.forEach(pendingReview => {
                if (pendingReview.userId === currentUserId && pendingReview._id) {
                  reviewsMap.set(pendingReview._id, pendingReview);
                }
              });
              combinedReviews = Array.from(reviewsMap.values());
            }
          } catch (e) {
            console.error("Error fetching user's pending reviews:", e);
          }
        }

        // 3. Sắp xếp: review của user hiện tại lên đầu, sau đó theo thời gian mới nhất
        if (currentUserId) {
          combinedReviews.sort((a, b) => {
            const aIsCurrentUser = a.userId === currentUserId;
            const bIsCurrentUser = b.userId === currentUserId;

            if (aIsCurrentUser && !bIsCurrentUser) return -1;
            if (!aIsCurrentUser && bIsCurrentUser) return 1;

            if (aIsCurrentUser && bIsCurrentUser) {
              if (a.status === 'pending' && b.status !== 'pending') return -1;
              if (a.status !== 'pending' && b.status === 'pending') return 1;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        } else {
          combinedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        setProductReviews(combinedReviews);

        // 4. Lấy thống kê đánh giá
        const stats = await getReviewStats(productId);
        setReviewStats({
          average: stats.average || 0,
          distribution: stats.distribution || {},
          total: Object.values(stats.distribution || {}).reduce((sum: number, count: number) => sum + count, 0)
        });

        // 5. Kiểm tra khả năng đánh giá
        if (isAuthenticated) {
          const canReviewData = await checkCanReview(productId);
          setCanReviewState(canReviewData);
        }

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu đánh giá:', error);
      } finally {
        setComponentLoading(false);
      }
    };

    loadReviewData();
  }, [productId, isAuthenticated, currentUserId, fetchProductReviews, getReviewStats, checkCanReview, localApiClient, mapReviewData, setCanReviewState, localStorageToken]); // Added localStorageToken to dependencies

  const safeProductReviews = Array.isArray(productReviews) ? productReviews : [];

  // Lọc đánh giá theo số sao
  const filteredReviews = filterRating
    ? safeProductReviews.filter((review) => review.rating === filterRating)
    : safeProductReviews;

  // Đếm số lượng đánh giá theo số sao (sử dụng reviewStats.distribution)
  const ratingCounts = [5, 4, 3, 2, 1].map((ratingStar) => {
    const count = reviewStats.distribution[ratingStar.toString()] || 0;
    const percentage = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
    return { rating: ratingStar, count, percentage };
  });

  // Lấy tất cả hình ảnh từ đánh giá
  const allReviewImages = filteredReviews // Changed from safeReviews to filteredReviews to reflect current view
    .flatMap((review) => review.images || [])
    .filter(image => image && image.url);

  // Xử lý mở rộng/thu gọn đánh giá
  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  // Xử lý toggle thích/bỏ thích đánh giá
  const handleLikeReview = async (reviewId: string, isLiked: boolean) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích đánh giá');
      return;
    }

    try {
      // Cập nhật UI ngay lập tức (optimistic update)
      setProductReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                likes: isLiked ? Math.max(0, review.likes - 1) : review.likes + 1,
                isLiked: !isLiked
              }
            : review
        )
      );

      // Gọi API để cập nhật trên server
      const success = await toggleLikeReview(reviewId, isLiked);

      if (!success) {
        // Nếu thất bại, hoàn tác thay đổi UI
        setProductReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId
              ? {
                  ...review,
                  likes: isLiked ? review.likes + 1 : Math.max(0, review.likes - 1),
                  isLiked: isLiked
                }
              : review
          )
        );
        toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi thích/bỏ thích đánh giá:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');

      // Hoàn tác thay đổi UI nếu có lỗi
      setProductReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                likes: isLiked ? review.likes + 1 : Math.max(0, review.likes - 1),
                isLiked: isLiked
              }
            : review
        )
      );
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    // TODO: Add a confirmation dialog
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      const success = await deleteReviewFromContext(reviewId);
      if (success) {
        setProductReviews(prev => prev.filter(r => r._id !== reviewId));
        // Optionally, re-fetch stats or update locally
        const stats = await getReviewStats(productId);
         setReviewStats({
            average: stats.average || 0,
            distribution: stats.distribution || {},
            total: Object.values(stats.distribution || {}).reduce((sum: number, count: number) => sum + count, 0)
          });
      }
    }
  };

  // Render avatar cho user
  const renderUserAvatar = (user?: ReviewUser) => {
    // Kiểm tra nếu user không tồn tại hoặc undefined
    if (!user) {
      return (
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <FiUser className="text-gray-600" />
        </div>
      );
    }

    // Kiểm tra nếu user có avatar
    if (user.avatar) {
      return (
        <div className="relative h-10 w-10 rounded-full overflow-hidden">
          <Image
            src={user.avatar}
            alt={user.name || 'User'}
            fill
            className="object-cover"
          />
        </div>
      );
    }

    // Trường hợp user không có avatar
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-600 font-medium">
          {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
        </span>
      </div>
    );
  };

  // Format date to local date string
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      return 'Không xác định';
    }
  };

  return (
    <div className="mt-16" id="reviews">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Đánh giá từ khách hàng</h2>

      {componentLoading || contextLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FiLoader className="h-8 w-8 text-pink-500 animate-spin mb-4" />
          <p className="text-gray-500">Đang tải đánh giá...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tổng quan đánh giá */}
          <div className="bg-gray-50 p-6 rounded-lg self-start">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-gray-800">{reviewStats.average.toFixed(1)}</div>
              <div className="flex justify-center my-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(reviewStats.average) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-600">{reviewStats.total} đánh giá</div>
            </div>

            {/* Phân bố đánh giá */}
            <div className="space-y-2">
              {ratingCounts.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center">
                  <button
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={`flex items-center space-x-2 ${
                      filterRating === rating ? 'font-medium text-[#d53f8c]' : 'text-gray-600'
                    }`}
                  >
                    <span>{rating}</span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  <div className="flex-1 mx-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right">{count}</span>
                </div>
              ))}
            </div>

            {/* Nút viết đánh giá */}
            {isAuthenticated ? (
              <div>
                {/* Nút Viết/Sửa đánh giá */}
                {canReviewState.canReview || (currentUserId && canReviewState.hasReviewed && productReviews.some(r => r.userId === currentUserId && r.status !== 'pending')) ? (
                  <button
                    onClick={() => {
                      const existingReview = productReviews.find(r => r.userId === currentUserId);
                      if (existingReview && canReviewState.hasReviewed) {
                        handleEditReview(existingReview);
                      } else {
                        setEditingReview(null); // Ensure not in edit mode for new review
                        setShowReviewForm(true);
                      }
                    }}
                    className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white rounded-lg hover:from-[#b83280] hover:to-[#6b46c1] transition-colors"
                  >
                    {canReviewState.hasReviewed && productReviews.some(r => r.userId === currentUserId) ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
                  </button>
                ) : !isAuthenticated ? (
                  <div className="mt-6 text-sm text-gray-600 text-center">
                    Vui lòng <Link href="/auth/login" className="text-[#d53f8c] hover:underline">đăng nhập</Link> để đánh giá
                  </div>
                ) : !canReviewState.hasPurchased ? (
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    <span className="italic">Bạn cần mua sản phẩm này để có thể đánh giá.</span>
                  </div>
                ) : canReviewState.hasReviewed && !productReviews.some(r => r.userId === currentUserId && r.status === 'pending') ? (
                   <div className="mt-4 text-xs text-gray-500 text-center">
                    <span className="italic">Bạn đã đánh giá sản phẩm này.</span>
                  </div>
                ) : null}
                 {productReviews.find(r => r.userId === currentUserId && r.status === 'pending') && (
                    <div className="mt-2 text-xs text-orange-600 text-center italic">
                        Đánh giá của bạn đang chờ phê duyệt.
                    </div>
                )}
              </div>
            ) : ( // Fallback if not authenticated
              <div className="mt-6 text-sm text-gray-600 text-center">
                Vui lòng <Link href="/auth/login" className="text-[#d53f8c] hover:underline">đăng nhập</Link> để đánh giá
              </div>
            )}
          </div>

        {/* Danh sách đánh giá */}
        <div className="md:col-span-2">
          {/* Hình ảnh từ đánh giá */}
          {allReviewImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Hình ảnh từ khách hàng</h3>
              <div className="flex flex-wrap gap-2">
                {(showAllImages ? allReviewImages : allReviewImages.slice(0, 6)).map((image, index) => (
                  <div key={index} className="relative h-20 w-20 rounded-md overflow-hidden">
                    <Image
                      src={image.url}
                      alt={image.alt || 'Hình ảnh đánh giá'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {!showAllImages && allReviewImages.length > 6 && (
                  <button
                    onClick={() => setShowAllImages(true)}
                    className="h-20 w-20 flex items-center justify-center bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200"
                  >
                    +{allReviewImages.length - 6}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form đánh giá */}
          {showReviewForm && (
            <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
              <ReviewForm
                productId={productId}
                // initialData={editingReview} // Prop removed as it might not be supported by ReviewForm
                // isEditing={!!editingReview} // Prop removed as it might not be supported by ReviewForm
                onCancel={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                }}
                onSubmitSuccess={async () => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                  setComponentLoading(true);

                  const approvedReviewsResult = await fetchProductReviews(productId, 'approved');
                  let freshCombinedReviews: Review[] = (Array.isArray(approvedReviewsResult) ? approvedReviewsResult : []).map(mapReviewData);

                  if (isAuthenticated && currentUserId) {
                    try {
                      const params = new URLSearchParams();
                      params.append('page', '1');
                      params.append('limit', '50');
                      params.append('status', 'pending');
                      const myPendingReviewsResponse = await localApiClient().get<{ reviews: UserReviewContextReviewType[] }>(
                        `/reviews/user/me?${params.toString()}`
                      );
                      if (myPendingReviewsResponse.data && Array.isArray(myPendingReviewsResponse.data.reviews)) {
                        const userPendingReviewsForThisProduct = myPendingReviewsResponse.data.reviews
                          .filter((r: any) => r.productId === productId)
                          .map(mapReviewData);

                        const reviewsMap = new Map<string, Review>();
                        freshCombinedReviews.forEach(r => {
                           if(r._id) reviewsMap.set(r._id, r);
                        });
                        userPendingReviewsForThisProduct.forEach(pr => {
                          if (pr.userId === currentUserId && pr._id) reviewsMap.set(pr._id, pr);
                        });
                        freshCombinedReviews = Array.from(reviewsMap.values());
                      }
                    } catch (e) { console.error("Error fetching user's pending reviews post-submit:", e); }
                  }

                  if (currentUserId) {
                    freshCombinedReviews.sort((a, b) => {
                      const aIsCurrentUser = a.userId === currentUserId;
                      const bIsCurrentUser = b.userId === currentUserId;
                      if (aIsCurrentUser && !bIsCurrentUser) return -1;
                      if (!aIsCurrentUser && bIsCurrentUser) return 1;
                      if (aIsCurrentUser && bIsCurrentUser) {
                        if (a.status === 'pending' && b.status !== 'pending') return -1;
                        if (a.status !== 'pending' && b.status === 'pending') return 1;
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                  } else {
                    freshCombinedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  }
                  setProductReviews(freshCombinedReviews);

                  const canReviewData = await checkCanReview(productId);
                  setCanReviewState(canReviewData);
                  const stats = await getReviewStats(productId);
                  setReviewStats({
                    average: stats.average || 0,
                    distribution: stats.distribution || {},
                    total: Object.values(stats.distribution || {}).reduce((sum: number, count: number) => sum + count, 0)
                  });
                  setComponentLoading(false);
                }}
              />
            </div>
          )}

          {/* Danh sách đánh giá */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => {
                if (!review || !review._id) return null; // Ensure review and review._id exist

                const isExpanded = expandedReviews.includes(review._id);
                const hasLongContent = review.content && review.content.length > 250; // Shorter for demo
                const isCurrentUserReview = review.userId === currentUserId;
                const isPendingByCurrentUser = isCurrentUserReview && review.status === 'pending';

                return (
                  <div
                    key={review._id}
                    className={`border-b border-gray-200 pb-6 last:border-b-0
                                ${isPendingByCurrentUser ? 'opacity-70 bg-yellow-50 p-4 rounded-lg shadow-sm' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        {renderUserAvatar(review.user)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-800">{review.user?.name || 'Người dùng ẩn danh'}</h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                            {review.isEdited && <span className="italic text-xs ml-1">(đã sửa)</span>}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {review.verified && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Đã mua hàng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-3 pl-14 ${isPendingByCurrentUser ? 'text-gray-600' : 'text-gray-700'}`}>
                      <div className={`${hasLongContent && !isExpanded ? 'line-clamp-4' : ''}`}>
                        {review.content}
                      </div>
                      {hasLongContent && (
                        <button
                          onClick={() => toggleExpandReview(review._id)}
                          className="mt-1 text-sm text-[#d53f8c] hover:underline flex items-center"
                        >
                          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                          {isExpanded ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
                        </button>
                      )}
                    </div>

                    {review.images && review.images.length > 0 && (
                      <div className="mt-3 pl-14 flex flex-wrap gap-2">
                        {review.images.map((image, index) => (
                          <div key={index} className="relative h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden group">
                            <Image src={image.url} alt={image.alt || `Ảnh đánh giá ${index + 1}`} fill className="object-cover" />
                             {/* TODO: Add image zoom on click */}
                          </div>
                        ))}
                      </div>
                    )}

                    {isPendingByCurrentUser && (
                      <p className="pl-14 text-sm text-yellow-700 italic mt-2 font-medium">Đang chờ phê duyệt</p>
                    )}

                    <div className="mt-3 pl-14 flex items-center space-x-4">
                      <button
                        onClick={() => handleLikeReview(review._id, review.isLiked || false)}
                        className={`flex items-center text-sm ${
                          isPendingByCurrentUser
                            ? 'text-gray-400 cursor-not-allowed'
                            : review.isLiked
                              ? 'text-[#d53f8c]'
                              : 'text-gray-500 hover:text-[#d53f8c]'
                        }`}
                        disabled={isPendingByCurrentUser}
                      >
                        <FiThumbsUp className={`mr-1 ${review.isLiked ? 'fill-current' : ''}`} />
                        <span>Hữu ích ({review.likes || 0})</span>
                      </button>

                      {isCurrentUserReview && (
                        <>
                          {review.status !== 'pending' && ( // Chỉ cho sửa review đã approved/rejected (nếu logic cho phép)
                            <button
                              onClick={() => handleEditReview(review)}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FiEdit className="mr-1" /> Sửa
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="flex items-center text-sm text-red-600 hover:text-red-800 hover:underline"
                          >
                            <FiTrash2 className="mr-1" /> Xóa
                          </button>
                        </>
                      )}
                    </div>

                    {review.reply && review.reply.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-[#d53f8c]">
                        {review.reply.map((reply, index) => (
                          <div key={index} className="mb-2">
                            <div className="flex items-center">
                              <span className="font-medium text-[#d53f8c]">Phản hồi từ Shop</span>
                              <span className="ml-2 text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-700">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-2">Chưa có đánh giá nào</div>
              <p className="text-sm text-gray-600">
                Hãy là người đầu tiên đánh giá sản phẩm này
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default ProductReviews;
