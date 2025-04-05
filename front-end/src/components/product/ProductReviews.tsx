import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiThumbsUp, FiChevronDown, FiChevronUp, FiUser } from 'react-icons/fi';
import ReviewForm from './ReviewForm';

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
  status: string;
  reply?: ReviewReply[];
  createdAt: string;
  updatedAt?: string;
  user: ReviewUser;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  reviews = [],
  averageRating = 0,
  reviewCount = 0,
  isAuthenticated = false,
  hasPurchased = false,
  hasReviewed = false,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);

  // Đảm bảo reviews là một mảng
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  // Lọc đánh giá theo số sao
  const filteredReviews = filterRating
    ? safeReviews.filter((review) => review.rating === filterRating)
    : safeReviews;

  // Đếm số lượng đánh giá theo số sao
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => {
    const count = safeReviews.filter((review) => review.rating === rating).length;
    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { rating, count, percentage };
  });

  // Lấy tất cả hình ảnh từ đánh giá
  const allReviewImages = safeReviews
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

  // Xử lý thích đánh giá
  const handleLikeReview = (reviewId: string) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thích đánh giá');
      return;
    }
    // Xử lý thích đánh giá ở đây (sẽ được kết nối API)
  };

  // Render avatar cho user
  const renderUserAvatar = (user: ReviewUser) => {
    if (user.avatar) {
      return (
        <div className="relative h-10 w-10 rounded-full overflow-hidden">
          <Image
            src={user.avatar}
            alt={user.name}
            fill
            className="object-cover"
          />
        </div>
      );
    }
    
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Tổng quan đánh giá */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-gray-800">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center my-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-gray-600">{reviewCount} đánh giá</div>
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
          {isAuthenticated && hasPurchased && !hasReviewed ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-6 w-full py-2 px-4 bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white rounded-lg hover:from-[#b83280] hover:to-[#6b46c1] transition-colors"
            >
              Viết đánh giá
            </button>
          ) : isAuthenticated && !hasPurchased ? (
            <div className="mt-6 text-sm text-gray-600 text-center">
              Bạn cần mua sản phẩm này để có thể đánh giá
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-6 text-sm text-gray-600 text-center">
              Vui lòng <Link href="/auth/login" className="text-[#d53f8c] hover:underline">đăng nhập</Link> để đánh giá
            </div>
          ) : null}
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
            <div className="mb-8">
              <ReviewForm
                productId={productId}
                onCancel={() => setShowReviewForm(false)}
                onSubmitSuccess={() => {
                  setShowReviewForm(false);
                  // Refresh đánh giá sau khi gửi thành công
                  window.location.reload();
                }}
              />
            </div>
          )}

          {/* Danh sách đánh giá */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => {
                if (!review) return null;
                
                const isExpanded = expandedReviews.includes(review._id);
                const hasLongContent = review.content && review.content.length > 300;

                return (
                  <div key={review._id} className="border-b border-gray-200 pb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        {renderUserAvatar(review.user)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-800">{review.user.name}</h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {review.verified && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              Đã mua hàng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className={`text-gray-700 ${hasLongContent && !isExpanded ? 'line-clamp-3' : ''}`}>
                        {review.content}
                      </div>
                      {hasLongContent && (
                        <button
                          onClick={() => toggleExpandReview(review._id)}
                          className="mt-1 text-sm text-[#d53f8c] hover:underline flex items-center"
                        >
                          {isExpanded ? (
                            <>
                              <span>Thu gọn</span>
                              <FiChevronUp className="ml-1" />
                            </>
                          ) : (
                            <>
                              <span>Xem thêm</span>
                              <FiChevronDown className="ml-1" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Hình ảnh đánh giá */}
                    {review.images && review.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.images.map((image, index) => (
                          <div key={index} className="relative h-20 w-20 rounded-md overflow-hidden">
                            <Image
                              src={image.url}
                              alt={image.alt || 'Hình ảnh đánh giá'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Nút thích và phản hồi */}
                    <div className="mt-3 flex items-center space-x-4">
                      <button
                        onClick={() => handleLikeReview(review._id)}
                        className="flex items-center text-sm text-gray-500 hover:text-[#d53f8c]"
                      >
                        <FiThumbsUp className="mr-1" />
                        <span>Hữu ích ({review.likes})</span>
                      </button>
                    </div>

                    {/* Phản hồi từ shop */}
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
    </div>
  );
};

export default ProductReviews; 