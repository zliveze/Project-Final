'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { useUserReview, Review } from '../../contexts/user/UserReviewContext';
import Avatar from '../ui/Avatar';

// Định nghĩa interface cho đánh giá của khách hàng
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

// Minimal skeleton loader
const ReviewCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  );
};

// Minimal rating stars
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} className="text-yellow-400 w-3 h-3" />
      ))}
      {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 w-3 h-3" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FiStar key={`empty-${i}`} className="text-gray-300 w-3 h-3" />
      ))}
    </div>
  );
};

// Minimal review card
const ReviewCard: React.FC<{ review: CustomerReview }> = ({ review }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-lg p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Avatar name={review.customerName} size="sm" />
          {review.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-1.5 h-1.5 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {review.customerName}
            </h4>
            <span className="text-xs text-gray-500">
              {review.rating}
            </span>
          </div>
          <RatingStars rating={review.rating} />
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 text-sm leading-relaxed mb-3 line-clamp-3">
        &ldquo;{review.content}&rdquo;
      </p>

      {/* Product info */}
      <Link 
        href={`/product/${review.productId}`}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors"
      >
        <div className="relative w-6 h-6 flex-shrink-0">
          <Image
            src={imageError ? '/404.png' : (review.productImage || '/404.png')}
            alt={review.productName}
            className="rounded object-cover"
            fill
            onError={handleImageError}
          />
        </div>
        <span className="truncate">{review.productName}</span>
      </Link>
    </div>
  );
};

const CustomerReviewsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { fetchFeaturedReviews, loading, error } = useUserReview();
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);

  // Hàm chuyển đổi từ Review API sang CustomerReview interface
  const convertReviewToCustomerReview = (review: Review): CustomerReview => {
    return {
      _id: review._id,
      customerName: review.user?.name || 'Khách hàng',
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

  // Load reviews
  useEffect(() => {
    const loadFeaturedReviews = async () => {
      try {
        const reviews = await fetchFeaturedReviews(9);
        const convertedReviews = reviews.map(convertReviewToCustomerReview);
        setCustomerReviews(convertedReviews);
      } catch (error) {
        console.error('Lỗi khi tải đánh giá:', error);
        setCustomerReviews([]);
      }
    };

    loadFeaturedReviews();
  }, [fetchFeaturedReviews]);

  // Navigation
  const showPrev = useCallback(() => {
    if (customerReviews.length <= 6) return;
    const newIndex = activeIndex > 0 ? activeIndex - 6 : Math.max(0, customerReviews.length - 6);
    setActiveIndex(newIndex);
  }, [activeIndex, customerReviews.length]);

  const showNext = useCallback(() => {
    if (customerReviews.length <= 6) return;
    const newIndex = activeIndex + 6 < customerReviews.length ? activeIndex + 6 : 0;
    setActiveIndex(newIndex);
  }, [activeIndex, customerReviews.length]);

  // Auto slide
  useEffect(() => {
    if (customerReviews.length <= 6) return;
    
    const timer = setInterval(() => {
      showNext();
    }, 8000);

    return () => clearInterval(timer);
  }, [customerReviews.length, activeIndex, showNext]);

  // Get visible reviews
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

  if (error && customerReviews.length === 0) {
    return null;
  }

  if (!loading && customerReviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Minimal header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đánh giá khách hàng
          </h2>
          <p className="text-gray-600">
            Từ hơn 10,000+ khách hàng tin tưởng
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm hover:shadow-md transition-all -ml-4"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={showNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm hover:shadow-md transition-all -mr-4"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Reviews grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleReviews.map((review, index) => (
                <ReviewCard
                  key={`${review._id}-${activeIndex}-${index}`}
                  review={review}
                />
              ))}
            </div>

            {/* Indicators */}
            {customerReviews.length > 6 && (
              <div className="flex justify-center mt-6 gap-1">
                {Array.from({ length: Math.ceil(customerReviews.length / 6) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index * 6)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      Math.floor(activeIndex / 6) === index 
                        ? 'bg-gray-600' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default CustomerReviewsSection;
