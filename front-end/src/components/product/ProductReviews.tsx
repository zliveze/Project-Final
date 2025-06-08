import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
// FiClock removed as it's unused
import { FiThumbsUp, FiChevronDown, FiChevronUp, FiUser, FiLoader, FiEdit, FiTrash2, FiX, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

import ReviewForm from './ReviewForm';
import { useUserReview, Review as ReviewType, ReviewReply } from '@/contexts/user/UserReviewContext';
import { useAuth } from '@/contexts/AuthContext';

// Cập nhật interface LikeButtonProps, loại bỏ handleLikeReview
interface LikeButtonProps {
  review: ReviewType;
  isPendingByCurrentUser: boolean;
  currentUserId?: string;
}

// Custom hook để quản lý trạng thái like
const useLikeState = (review: ReviewType, toggleLikeAction: (reviewId: string, isLiked: boolean) => Promise<boolean>) => {
  // Tạo tham chiếu đến review để theo dõi thay đổi
  const reviewRef = React.useRef(review);
  
  // Lưu trạng thái ban đầu từ prop
  const [isLiked, setIsLiked] = useState(review.isLiked || false);
  const [likesCount, setLikesCount] = useState(review.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Lưu reviewId để nhận biết khi review thay đổi hoàn toàn
  const [reviewId, setReviewId] = useState(review._id);

  // Khi reviewId thay đổi, đặt lại trạng thái hoàn toàn
  useEffect(() => {
    if (reviewId !== review._id) {
      setReviewId(review._id);
      setIsLiked(review.isLiked || false);
      setLikesCount(review.likes || 0);
    }
  }, [review._id, reviewId, review.isLiked, review.likes]);

  // Cập nhật khi trạng thái isLiked hoặc likes từ server thay đổi
  useEffect(() => {
    // So sánh với giá trị trước đó để tránh vòng lặp vô hạn
    if (reviewRef.current.isLiked !== review.isLiked || 
        reviewRef.current.likes !== review.likes) {
      reviewRef.current = review; // Cập nhật ref
      
      if (!isLoading) { // Chỉ cập nhật nếu không đang xử lý
        setIsLiked(review.isLiked || false);
        setLikesCount(review.likes || 0);
      }
    }
  }, [review, isLoading]);

  const toggleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Lưu trạng thái trước khi thay đổi
    const currentIsLiked = isLiked;
    const currentLikesCount = likesCount;
    
    // Cập nhật UI ngay lập tức
    const newIsLiked = !currentIsLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      // Gọi API để cập nhật server
      const success = await toggleLikeAction(review._id, currentIsLiked);
      
      if (!success) {
        // Khôi phục trạng thái nếu không thành công
        setIsLiked(currentIsLiked);
        setLikesCount(currentLikesCount);
      }
    } catch (error) {
      console.error('Lỗi khi thực hiện like/unlike:', error);
      // Khôi phục trạng thái ban đầu nếu có lỗi
      setIsLiked(currentIsLiked);
      setLikesCount(currentLikesCount);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    likesCount,
    isLoading,
    toggleLike
  };
};

// Component riêng cho nút Like
const LikeButton: React.FC<LikeButtonProps> = ({
  review,
  isPendingByCurrentUser,
  currentUserId
}) => {
  const { toggleLikeReview } = useUserReview();
  const { isLiked, likesCount, isLoading, toggleLike } = useLikeState(review, toggleLikeReview);

  // Xác định các class dựa trên trạng thái
  const buttonClass = isPendingByCurrentUser || isLoading
    ? 'text-gray-400 cursor-not-allowed'
    : isLiked
      ? 'text-[#d53f8c] font-medium bg-pink-50 px-2 py-1 rounded-md border border-pink-200'
      : 'text-gray-500 hover:text-[#d53f8c] px-2 py-1 rounded-md';

  const iconClass = `mr-1 transition-all duration-200 ${isLiked ? 'fill-[#d53f8c] scale-110' : 'scale-100'}`;

  return (
    <button
      onClick={toggleLike}
      className={`flex items-center text-sm ${buttonClass}`}
      disabled={(isPendingByCurrentUser && review.user?._id === currentUserId) || isLoading}
      title={isLiked ? "Bỏ thích đánh giá này" : "Thích đánh giá này"}
    >
      <FiThumbsUp
        className={iconClass}
        style={{ color: isLiked ? '#d53f8c' : 'inherit' }}
      />
      <span>Hữu ích ({likesCount})</span>
    </button>
  );
};

interface ReviewImage {
  url: string;
  alt?: string;
}

// ReviewReply interface removed as it's unused

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
}) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const {
    reviews: contextProductReviews,
    fetchProductReviews,
    getReviewStats,
    checkCanReview,
    deleteReview: deleteReviewFromContext,
    loading: contextLoading,
  } = useUserReview();

  const [componentLoading, setComponentLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewType | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);

  // State cho modal hiển thị ảnh
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState<ReviewImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [userPendingReviews, setUserPendingReviews] = useState<ReviewType[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);

  const [reviewStats, setReviewStats] = useState({
    average: 0,
    distribution: {} as Record<string, number>,
    total: 0,
  });
  const [canReviewState, setCanReviewState] = useState({
    canReview: false,
    hasPurchased: false,
    hasReviewed: false,
  });

  const currentUserId = currentUser?._id;
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('accessToken'));
    }
  }, [isAuthenticated]);

  // Tự động refresh đánh giá mỗi 30 giây để cập nhật trạng thái
  useEffect(() => {
    if (productId) {
      const interval = setInterval(() => {
        fetchProductReviews(productId, 'approved');
      }, 30000); // 30 giây

      return () => clearInterval(interval);
    }
  }, [productId, fetchProductReviews]);

  const эффективныйApiUrl = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('localhost:3001')
                        ? process.env.NEXT_PUBLIC_API_URL
                        : 'https://backendyumin.vercel.app/api';

  const localApiClient = useCallback(() => {
    return axios.create({
      baseURL: эффективныйApiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorageToken ? `Bearer ${localStorageToken}` : ''
      }
    });
  }, [localStorageToken, эффективныйApiUrl]); // Added эффективныйApiUrl to dependencies

  // Define a more specific type for incoming review data
  interface IncomingReviewData {
    _id?: string;
    reviewId?: string;
    productId?: string;
    variantId?: string;
    productName?: string;
    productImage?: string;
    rating?: number;
    content?: string;
    images?: ReviewImage[];
    likes?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    verified?: boolean;
    isEdited?: boolean;
    isLiked?: boolean;
    likedBy?: string[];
    user?: { _id: string; name: string };
    replies?: unknown[];
  }

  const mapReviewData = useCallback((review: IncomingReviewData): ReviewType => {
    const validStatus = (s?: string): "pending" | "approved" | "rejected" => {
      if (s === 'pending' || s === 'approved' || s === 'rejected') {
        return s;
      }
      return 'pending';
    };
    return {
      _id: review._id || review.reviewId || '',
      reviewId: review.reviewId || review._id || '',
      productId: review.productId || productId,
      variantId: review.variantId,
      productName: review.productName || '',
      productImage: review.productImage || '',
      rating: review.rating || 0,
      content: review.content || '',
      images: review.images || [],
      likes: review.likes || 0,
      status: validStatus(review.status),
      createdAt: review.createdAt || new Date().toISOString(),
      updatedAt: review.updatedAt,
      verified: review.verified || false,
      isEdited: review.isEdited || false,
      isLiked: review.isLiked || false,
      likedBy: review.likedBy || [],
      user: review.user && review.user.name ? { _id: review.user._id, name: review.user.name } : { _id: '', name: 'Người dùng ẩn danh' },
      replies: review.replies as ReviewReply[] | undefined, // Cast to ReviewReply[] to align with ReviewType
    };
  }, [productId]);


  useEffect(() => {
    const loadInitialData = async () => {
      if (!productId) return;
      setComponentLoading(true);
      try {
        await fetchProductReviews(productId, 'approved');

        if (isAuthenticated && currentUserId && localStorageToken) {
          try {
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '50');
            // Lấy cả đánh giá đang chờ duyệt và đánh giá bị từ chối
            // Không cần lọc theo status, sẽ lấy tất cả đánh giá của người dùng

            const myPendingReviewsResponse = await localApiClient().get<{ reviews: ReviewType[], totalItems: number }>(
              `/reviews/user/me?${params.toString()}`
            );

            if (myPendingReviewsResponse.data && Array.isArray(myPendingReviewsResponse.data.reviews)) {
              const pendingForThisProduct = myPendingReviewsResponse.data.reviews
                .filter((review: ReviewType) => review.productId === productId)
                .map(mapReviewData);
              setUserPendingReviews(pendingForThisProduct);
            } else {
              setUserPendingReviews([]);
            }
          } catch (e) {
            console.error("Error fetching user's pending reviews:", e);
            setUserPendingReviews([]);
          }
        } else {
          setUserPendingReviews([]);
        }

        const stats = await getReviewStats(productId);
        setReviewStats({
          average: stats.average || 0,
          distribution: stats.distribution || {},
          total: Object.values(stats.distribution || {}).reduce((sum: number, count: number) => sum + count, 0)
        });

        if (isAuthenticated) {
          const canReviewData = await checkCanReview(productId);
          setCanReviewState(canReviewData);
        } else {
          setCanReviewState({ canReview: false, hasPurchased: false, hasReviewed: false });
        }

      } catch (error: unknown) {
        console.error('Lỗi khi tải dữ liệu đánh giá ban đầu:', error);
      } finally {
        setComponentLoading(false);
      }
    };

    loadInitialData();
  }, [productId, isAuthenticated, currentUserId, fetchProductReviews, getReviewStats, checkCanReview, localApiClient, mapReviewData, localStorageToken]);

  // Lắng nghe sự thay đổi từ contextProductReviews (đã bao gồm cập nhật từ WebSocket)
  // để cập nhật lại userPendingReviews và reviews cho chính xác.
  useEffect(() => {
    if (Array.isArray(contextProductReviews)) {
      // Cập nhật state reviews từ contextProductReviews
      setReviews(contextProductReviews.map(mapReviewData));

      // Cập nhật userPendingReviews nếu người dùng đã đăng nhập
      if (currentUserId) {
        setUserPendingReviews(prevPendingReviews => {
          // Tạo một Map để theo dõi các đánh giá hiện có theo ID
          const reviewMap = new Map();

          // Thêm tất cả đánh giá hiện có vào Map
          prevPendingReviews.forEach(review => {
            reviewMap.set(review._id, review);
          });

          // Cập nhật Map với đánh giá từ context
          contextProductReviews.forEach(reviewFromContext => {
            if (reviewFromContext.user?._id === currentUserId) {
              // Nếu đánh giá đã tồn tại trong Map, cập nhật trạng thái của nó
              if (reviewMap.has(reviewFromContext._id)) {
                const existingReview = reviewMap.get(reviewFromContext._id);
                reviewMap.set(reviewFromContext._id, {
                  ...existingReview,
                  status: reviewFromContext.status,
                  isLiked: reviewFromContext.isLiked
                });
              }
              // Nếu đánh giá chưa tồn tại trong Map, thêm nó vào
              else {
                reviewMap.set(reviewFromContext._id, reviewFromContext);
              }
            }
          });

          // Chuyển đổi Map thành mảng
          return Array.from(reviewMap.values());
        });
      }
    }
  }, [contextProductReviews, currentUserId, mapReviewData]);


  const displayedReviews = useMemo(() => {
    // Bắt đầu với dữ liệu từ context
    let combined = Array.isArray(contextProductReviews) ? [...contextProductReviews.map(mapReviewData)] : [];

    const reviewsMap = new Map<string, ReviewType>();
    combined.forEach(review => {
      if(review._id) reviewsMap.set(review._id, review);
    });

    // Thêm đánh giá đang chờ duyệt của người dùng
    userPendingReviews.forEach(pendingReview => {
      if (pendingReview.user?._id === currentUserId && pendingReview._id) {
        reviewsMap.set(pendingReview._id, pendingReview);
      } else if (!reviewsMap.has(pendingReview._id) && pendingReview._id) {
        reviewsMap.set(pendingReview._id, pendingReview);
      }
    });

    // Ưu tiên cao nhất cho state local reviews (chứa các cập nhật mới nhất từ người dùng)
    if (reviews.length > 0) {
      reviews.forEach(review => {
        if (review._id) {
          // Ghi đè hoàn toàn review từ context với dữ liệu từ state local
          reviewsMap.set(review._id, { ...review });
        }
      });
    }

    // Chuyển Map thành mảng
    combined = Array.from(reviewsMap.values());

    // Sắp xếp đánh giá
    if (currentUserId) {
      combined.sort((a, b) => {
        const aIsCurrentUser = a.user?._id === currentUserId;
        const bIsCurrentUser = b.user?._id === currentUserId;

        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;

        if (aIsCurrentUser && bIsCurrentUser) {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return combined;
  }, [contextProductReviews, userPendingReviews, currentUserId, mapReviewData, reviews]);


  // Lọc đánh giá theo rating và hiển thị đánh giá đã được phê duyệt hoặc đánh giá của người dùng hiện tại
  const filteredReviews = displayedReviews.filter((review) => {
    // Lọc theo rating nếu có
    const matchesRating = !filterRating || review.rating === filterRating;

    // Hiển thị đánh giá đã được phê duyệt hoặc đánh giá của người dùng hiện tại (bất kể trạng thái)
    const shouldShow =
      review.status === 'approved' ||
      (currentUserId && review.user?._id === currentUserId);

    return matchesRating && shouldShow;
  });

  const ratingCounts = [5, 4, 3, 2, 1].map((ratingStar) => {
    const count = reviewStats.distribution[ratingStar.toString()] || 0;
    const percentage = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
    return { rating: ratingStar, count, percentage };
  });

  const allReviewImages = filteredReviews
    .flatMap((review) => review.images || [])
    .filter(image => image && image.url);

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleEditReview = (review: ReviewType) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      const success = await deleteReviewFromContext(reviewId);
      if (success) {
        setUserPendingReviews(prev => prev.filter(r => r._id !== reviewId));

        const stats = await getReviewStats(productId);
         setReviewStats({
            average: stats.average || 0,
            distribution: stats.distribution || {},
            total: Object.values(stats.distribution || {}).reduce((sum: number, count: number) => sum + count, 0)
          });
        if (isAuthenticated) {
            const canReviewData = await checkCanReview(productId);
            setCanReviewState(canReviewData);
        }
      }
    }
  };

  const renderUserAvatar = (user?: ReviewType['user']) => {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        {user && user.name ? (
          <span className="text-gray-600 font-medium">
            {user.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <FiUser className="text-gray-600" />
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'Không xác định';
    }
  };

  // Hàm xử lý cho modal hiển thị ảnh
  const openImageModal = (images: ReviewImage[], initialIndex: number = 0) => {
    setCurrentImages(images);
    setCurrentImageIndex(initialIndex);
    setIsImageModalOpen(true);
    // Ngăn scroll khi mở modal
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    // Cho phép scroll lại khi đóng modal
    document.body.style.overflow = 'unset';
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentImages.length);
  }, [currentImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? currentImages.length - 1 : prevIndex - 1
    );
  }, [currentImages.length]);

  // Xử lý phím bấm cho modal hình ảnh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;

      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, currentImages.length, nextImage, prevImage, closeImageModal]); // Added nextImage, prevImage, closeImageModal to dependencies

  const userReviewForThisProduct = useMemo(() => displayedReviews.find(r => r.user?._id === currentUserId), [displayedReviews, currentUserId]);
  // Người dùng có thể chỉnh sửa đánh giá của họ bất kể trạng thái là gì
  const canEditThisReview = userReviewForThisProduct !== undefined;

  const writeButtonText = userReviewForThisProduct ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá';
  const canDisplayWriteButton = isAuthenticated && (canReviewState.canReview || (canReviewState.hasReviewed && userReviewForThisProduct));

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

            {isAuthenticated ? (
              <div>
                {canDisplayWriteButton ? (
                  <button
                    onClick={() => {
                      if (userReviewForThisProduct && canEditThisReview) {
                        handleEditReview(userReviewForThisProduct);
                      } else {
                        setEditingReview(null);
                        setShowReviewForm(true);
                      }
                    }}
                    className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white rounded-lg hover:from-[#b83280] hover:to-[#6b46c1] transition-colors"
                  >
                    {writeButtonText}
                  </button>
                ) : !canReviewState.hasPurchased && !userReviewForThisProduct ? (
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    <span className="italic">Bạn cần mua sản phẩm này để có thể đánh giá.</span>
                  </div>
                ) : canReviewState.hasReviewed && !userReviewForThisProduct?.status?.includes('pending') && !userReviewForThisProduct ? (
                   <div className="mt-4 text-xs text-gray-500 text-center">
                    <span className="italic">Bạn đã đánh giá sản phẩm này.</span>
                  </div>
                ) : null}
                 {userReviewForThisProduct && userReviewForThisProduct.status === 'pending' && (
                    <div className="mt-2 text-xs text-orange-600 text-center italic">
                        Đánh giá của bạn đang chờ phê duyệt.
                    </div>
                )}
                {userReviewForThisProduct && userReviewForThisProduct.status === 'rejected' && (
                    <div className="mt-2 text-xs text-red-600 text-center italic">
                        Đánh giá của bạn đã bị từ chối. Bạn có thể chỉnh sửa và gửi lại.
                    </div>
                )}
              </div>
            ) : (
              <div className="mt-6 text-sm text-gray-600 text-center">
                Vui lòng <Link href="/auth/login" className="text-[#d53f8c] hover:underline">đăng nhập</Link> để đánh giá.
              </div>
            )}
          </div>

        <div className="md:col-span-2">
          {allReviewImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Hình ảnh từ khách hàng</h3>
              <div className="flex flex-wrap gap-3">
                {(showAllImages ? allReviewImages : allReviewImages.slice(0, 6)).map((image, index) => (
                  <div
                    key={index}
                    className="relative h-24 w-24 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                    onClick={() => openImageModal(allReviewImages, index)}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || 'Hình ảnh đánh giá'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {!showAllImages && allReviewImages.length > 6 && (
                  <div
                    onClick={() => setShowAllImages(true)}
                    className="h-24 w-24 flex items-center justify-center bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200 cursor-pointer shadow-sm"
                  >
                    <span className="text-lg font-medium">+{allReviewImages.length - 6}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {showReviewForm && (
            <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
              <ReviewForm
                productId={productId}
                reviewId={editingReview ? editingReview._id : null}
                onCancel={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                }}
                onSubmitSuccess={async () => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                  setComponentLoading(true);

                  await fetchProductReviews(productId, 'approved');

                  if (isAuthenticated && currentUserId && localStorageToken) {
                    try {
                      const params = new URLSearchParams();
                      params.append('page', '1');
                      params.append('limit', '50');
                      // Lấy tất cả đánh giá của người dùng, bao gồm cả đánh giá bị từ chối
                      const myPendingReviewsResponse = await localApiClient().get<{ reviews: ReviewType[] }>(
                        `/reviews/user/me?${params.toString()}`
                      );
                      if (myPendingReviewsResponse.data && Array.isArray(myPendingReviewsResponse.data.reviews)) {
                        const pendingForThisProduct = myPendingReviewsResponse.data.reviews
                          .filter((r: ReviewType) => r.productId === productId)
                          .map(mapReviewData);
                        setUserPendingReviews(pendingForThisProduct);
                      } else {
                        setUserPendingReviews([]);
                      }
                    } catch (e: unknown) {
                        console.error("Error fetching user's pending reviews post-submit:", e);
                        setUserPendingReviews([]);
                    }
                  } else {
                    setUserPendingReviews([]);
                  }

                  if(isAuthenticated){
                    const canReviewData = await checkCanReview(productId);
                    setCanReviewState(canReviewData);
                  } else {
                     setCanReviewState({ canReview: false, hasPurchased: false, hasReviewed: false });
                  }

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

          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => {
                if (!review || !review._id) return null;

                const isExpanded = expandedReviews.includes(review._id);
                const hasLongContent = review.content && review.content.length > 250;
                const isCurrentUserReview = review.user?._id === currentUserId;
                const isPendingByCurrentUser = isCurrentUserReview && review.status === 'pending';

                return (
                  <div
                    key={review._id}
                    className={`border-b border-gray-200 pb-6 last:border-b-0
                                ${isPendingByCurrentUser ? 'opacity-70 bg-yellow-50 p-4 rounded-lg shadow-sm' : ''}
                                ${isCurrentUserReview && review.status === 'rejected' ? 'opacity-70 bg-red-50 p-4 rounded-lg shadow-sm' : ''}`}
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
                           {review.status === 'pending' && isCurrentUserReview && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                Chờ duyệt
                              </span>
                            )}
                            {review.status === 'rejected' && isCurrentUserReview && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Bị từ chối
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-3 pl-14 ${
                      isPendingByCurrentUser || (isCurrentUserReview && review.status === 'rejected')
                        ? 'text-gray-600'
                        : 'text-gray-700'
                    }`}>
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
                          <div
                            key={index}
                            className="relative h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden group cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openImageModal(review.images, index)}
                          >
                            <Image
                              src={image.url}
                              alt={image.alt || `Ảnh đánh giá ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pl-14 flex items-center space-x-4">
                      {/* Không cần truyền handleLikeReview nữa */}
                      <LikeButton
                        review={review}
                        isPendingByCurrentUser={isPendingByCurrentUser}
                        currentUserId={currentUserId}
                      />

                      {isCurrentUserReview && (
                        <>
                          <button
                            onClick={() => handleEditReview(review)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <FiEdit className="mr-1" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="flex items-center text-sm text-red-600 hover:text-red-800 hover:underline"
                          >
                            <FiTrash2 className="mr-1" /> Xóa
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Modal hiển thị ảnh đầy đủ */}
      {isImageModalOpen && currentImages.length > 0 && (
        <div className={`fixed inset-0 z-[1000] overflow-y-auto opacity-100 transition-opacity duration-300`}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeImageModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* Trick để căn giữa modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header với nút đóng */}
              <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Hình ảnh {currentImageIndex + 1} / {currentImages.length}
                </h3>
                <button
                  onClick={closeImageModal}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 p-1"
                >
                  <span className="sr-only">Đóng</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Ảnh hiện tại */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-center">
                  <div className="relative w-full max-h-[60vh] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImages[currentImageIndex]?.url}
                      alt={currentImages[currentImageIndex]?.alt || `Ảnh ${currentImageIndex + 1}`}
                      className="max-w-full max-h-[60vh] object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex overflow-x-auto space-x-2 py-2">
                  {currentImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                        index === currentImageIndex ? 'border-pink-500' : 'border-transparent'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.alt || `Ảnh ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Điều hướng */}
              <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:justify-between border-t border-gray-200">
                <div className="flex items-center">
                  <button
                    onClick={prevImage}
                    className="mr-2 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    <FiArrowLeft className="mr-2" /> Trước
                  </button>
                  <button
                    onClick={nextImage}
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Sau <FiArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
