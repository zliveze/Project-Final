'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiChevronLeft, FiChevronRight, FiCheck, FiArrowRight } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { useUserReview, Review } from '../../contexts/user/UserReviewContext';
import Avatar from '../ui/Avatar';

// Định nghĩa interface cho đánh giá của khách hàng (tương thích với API)
interface CustomerReview {
  _id: string;
  customerName: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  productId: string;
  productName: string;
  productImage: string;
  verified: boolean;
  helpful: number;
  user?: {
    _id: string;
    name: string;
  };
}

// Dữ liệu fallback khi API không khả dụng
const fallbackReviews: CustomerReview[] = [
  {
    _id: "fallback-1",
    customerName: "Nguyễn Thị Hương",
    avatar: "",
    rating: 5,
    date: "2023-03-15",
    content: "Tôi đã sử dụng kem dưỡng ẩm này được 2 tuần và đã thấy sự khác biệt rõ rệt. Da tôi mềm mại hơn và ít khô hơn rất nhiều.",
    productId: "101",
    productName: "Laneige Water Bank Blue Hyaluronic Cream",
    productImage: "",
    verified: true,
    helpful: 42
  },
  {
    _id: "fallback-2",
    customerName: "Trần Minh Đức",
    avatar: "",
    rating: 4.5,
    date: "2023-03-10",
    content: "Sản phẩm dễ sử dụng, không gây kích ứng và làm sạch tốt. Giá cả hợp lý so với chất lượng, sẽ mua lại.",
    productId: "102",
    productName: "Bioderma Sensibio H2O Micellar Water",
    productImage: "",
    verified: true,
    helpful: 35
  },
  {
    _id: "fallback-3",
    customerName: "Phạm Thu Trang",
    avatar: "",
    rating: 5,
    date: "2023-03-05",
    content: "Serum vitamin C này thật sự đáng đồng tiền! Da sáng hơn, các vết thâm mờ đi rõ rệt. Chắc chắn sẽ mua lại!",
    productId: "103",
    productName: "Klairs Freshly Juiced Vitamin C Serum",
    productImage: "",
    verified: true,
    helpful: 27
  },
  {
    _id: "fallback-4",
    customerName: "Lê Văn An",
    avatar: "",
    rating: 4,
    date: "2023-02-28",
    content: "Chất lượng tốt, giao hàng nhanh. Vợ tôi rất hài lòng với sản phẩm này.",
    productId: "104",
    productName: "The Ordinary Niacinamide",
    productImage: "",
    verified: false,
    helpful: 19
  },
  {
    _id: "fallback-5",
    customerName: "Vũ Quỳnh Anh",
    avatar: "",
    rating: 5,
    date: "2023-02-20",
    content: "Son dưỡng tuyệt vời! Mềm mịn và giữ ẩm lâu. Sẽ tiếp tục mua lại!",
    productId: "105",
    productName: "Laneige Lip Sleeping Mask",
    productImage: "",
    verified: true,
    helpful: 31
  },
  {
    _id: "fallback-6",
    customerName: "Hoàng Mai Linh",
    avatar: "",
    rating: 4.5,
    date: "2023-02-15",
    content: "Kem chống nắng này rất tốt, không gây nhờn và bảo vệ da hiệu quả.",
    productId: "106",
    productName: "La Roche Posay Anthelios",
    productImage: "",
    verified: true,
    helpful: 28
  },
  {
    _id: "fallback-7",
    customerName: "Đỗ Thanh Hà",
    avatar: "",
    rating: 4.5,
    date: "2023-02-10",
    content: "Tẩy trang rất nhẹ nhàng, không gây khô căng da. Phù hợp với da nhạy cảm như tôi.",
    productId: "107",
    productName: "Cetaphil Gentle Makeup Remover",
    productImage: "",
    verified: true,
    helpful: 24
  },
  {
    _id: "fallback-8",
    customerName: "Bùi Quang Minh",
    avatar: "",
    rating: 5,
    date: "2023-02-05",
    content: "Mặt nạ giấy này làm da sáng lên ngay sau lần đầu sử dụng. Gói hàng cũng rất đẹp.",
    productId: "108",
    productName: "Innisfree My Real Squeeze Mask",
    productImage: "",
    verified: true,
    helpful: 33
  },
  {
    _id: "fallback-9",
    customerName: "Ngô Thị Lan",
    avatar: "",
    rating: 4,
    date: "2023-01-28",
    content: "Kem dưỡng mắt làm giảm thâm quầng hiệu quả. Texture mịn, thấm nhanh.",
    productId: "109",
    productName: "Olay Regenerist Eye Cream",
    productImage: "",
    verified: true,
    helpful: 18
  },
  {
    _id: "fallback-10",
    customerName: "Phan Văn Thắng",
    avatar: "",
    rating: 4.5,
    date: "2023-01-20",
    content: "Sữa rửa mặt tạo bọt mịn, làm sạch tốt mà không gây khô da. Mùi hương dễ chịu.",
    productId: "110",
    productName: "CeraVe Foaming Facial Cleanser",
    productImage: "",
    verified: false,
    helpful: 22
  },
  {
    _id: "fallback-11",
    customerName: "Tạ Thu Thủy",
    avatar: "",
    rating: 5,
    date: "2023-01-15",
    content: "Essence này thấm rất nhanh và làm da mượt mịn. Đóng gói cẩn thận, giao hàng đúng hẹn.",
    productId: "111",
    productName: "SK-II Facial Treatment Essence",
    productImage: "",
    verified: true,
    helpful: 40
  },
  {
    _id: "fallback-12",
    customerName: "Lý Hoàng Nam",
    avatar: "",
    rating: 4,
    date: "2023-01-10",
    content: "Toner không chứa cồn, dịu nhẹ với da. Chai to, dùng được lâu, giá tốt.",
    productId: "112",
    productName: "Hada Labo Gokujyun Lotion",
    productImage: "",
    verified: true,
    helpful: 26
  }
];

// Component loading skeleton
const ReviewCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 h-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>

      {/* Product info skeleton */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component hiển thị đánh giá sao tối giản
const RatingStars: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'sm' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} className={`text-amber-400 ${starSize}`} />
      ))}
      {hasHalfStar && <FaStarHalfAlt className={`text-amber-400 ${starSize}`} />}
      {[...Array(emptyStars)].map((_, i) => (
        <FiStar key={`empty-${i}`} className={`text-gray-300 ${starSize}`} />
      ))}
    </div>
  );
};

// Component hiển thị card đánh giá tối giản
const ReviewCard: React.FC<{ review: CustomerReview }> = ({ review }) => {
  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-xl p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {/* Header với avatar và thông tin */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={review.customerName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {review.customerName}
            </h4>
            {review.verified && (
              <div className="flex-shrink-0">
                <FiCheck className="w-4 h-4 text-emerald-500" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RatingStars rating={review.rating} size="sm" />
            <span className="text-xs text-gray-500">
              {new Date(review.date).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      {/* Nội dung đánh giá */}
      <div className="flex-1 mb-4">
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
          {review.content}
        </p>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="pt-4 border-t border-gray-100">
        <Link 
          href={`/product/${review.productId}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={review.productImage || '/404.png'}
              alt={review.productName}
              className="rounded-lg object-cover"
              fill
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/404.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Sản phẩm</p>
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-pink-500 transition-colors">
              {review.productName}
            </p>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

const CustomerReviewsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);

  // Sử dụng UserReviewContext
  const { fetchFeaturedReviews, loading, error } = useUserReview();
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);

  // Hàm chuyển đổi từ Review API sang CustomerReview interface
  const convertReviewToCustomerReview = (review: Review): CustomerReview => {
    return {
      _id: review._id,
      customerName: review.user?.name || 'Khách hàng ẩn danh',
      avatar: '',
      rating: review.rating,
      date: review.createdAt,
      content: review.content,
      productId: review.productId,
      productName: review.productName,
      productImage: review.productImage,
      verified: review.verified,
      helpful: review.likes || 0,
      user: review.user
    };
  };

  // Lấy đánh giá nổi bật khi component mount
  useEffect(() => {
    const loadFeaturedReviews = async () => {
      try {
        const reviews = await fetchFeaturedReviews(12); // Tăng lên 12 để có đủ data cho animation
        const convertedReviews = reviews.map(convertReviewToCustomerReview);
        setCustomerReviews(convertedReviews);
      } catch (error) {
        console.error('Lỗi khi tải đánh giá nổi bật:', error);
        setCustomerReviews(fallbackReviews);
      }
    };

    loadFeaturedReviews();
  }, [fetchFeaturedReviews]);

  // Xử lý navigation
  const showPrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 6 : Math.max(0, customerReviews.length - 6)
    );
  };

  const showNext = () => {
    setActiveIndex((prevIndex) =>
      prevIndex + 6 < customerReviews.length ? prevIndex + 6 : 0
    );
  };

  // Auto slide với animation mượt mà
  useEffect(() => {
    if (customerReviews.length <= 6) return;
    
    const timer = setInterval(() => {
      showNext();
    }, 8000); // Tăng thời gian để người dùng có thể đọc hết

    return () => clearInterval(timer);
  }, [customerReviews.length]);

  // Tính toán reviews hiển thị - 6 reviews
  const getVisibleReviews = () => {
    if (customerReviews.length === 0) return [];
    
    const reviewsToShow = 6;
    const visible = [];
    
    for (let i = 0; i < reviewsToShow; i++) {
      const index = (activeIndex + i) % customerReviews.length;
      visible.push(customerReviews[index]);
    }
    
    return visible;
  };

  const visibleReviews = getVisibleReviews();

  return (
    <section className="py-20 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gray-50" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Trải nghiệm thực tế từ hơn 10,000+ khách hàng tin tưởng
            </p>
          </motion.div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && customerReviews.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">Đang sử dụng dữ liệu mẫu</p>
          </div>
        )}

        {/* Reviews container */}
        {!loading && customerReviews.length > 0 && (
          <div className="relative">
            {/* Navigation buttons */}
            {customerReviews.length > 6 && (
              <>
                <button
                  onClick={showPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 hover:shadow-lg transition-all duration-300 -ml-6"
                  aria-label="Previous reviews"
                >
                  <FiChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={showNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 hover:shadow-lg transition-all duration-300 -mr-6"
                  aria-label="Next reviews"
                >
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Reviews grid */}
            <div 
              ref={reviewsContainerRef}
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {visibleReviews.map((review, index) => (
                    <motion.div
                      key={`${review._id}-${activeIndex}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <ReviewCard review={review} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Indicators */}
            {customerReviews.length > 6 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: Math.ceil(customerReviews.length / 6) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index * 6)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      Math.floor(activeIndex / 6) === index 
                        ? 'bg-pink-500 w-8' 
                        : 'bg-gray-300 hover:bg-pink-300 w-2'
                    }`}
                    aria-label={`Go to review group ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerReviewsSection;