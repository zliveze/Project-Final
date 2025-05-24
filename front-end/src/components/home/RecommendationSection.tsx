import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiShoppingCart, FiHeart } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRecommendation, RecommendedProduct as ContextRecommendedProduct } from '@/contexts/user/RecommendationContext';
import { useGSAP, gsapUtils } from '@/hooks/useGSAP';

interface LocalRecommendedProduct {
  id: string;
  name: string;
  image: string;
  slug: string;
  soldCount?: string;
  price: number;
  discountedPrice?: number;
  rating: number;
  ratingCount: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

// Component hiển thị rating với style tối giản - Copy từ BestSellerSection
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} className="text-amber-400 w-3 h-3" />
      ))}
      {hasHalfStar && <FaStarHalfAlt className="text-amber-400 w-3 h-3" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FaStar key={`empty-${i}`} className="text-gray-300 w-3 h-3" />
      ))}
    </div>
  );
};

// Component sản phẩm gợi ý - Copy chính xác từ BestSellerSection
const RecommendedProductCard = ({ product, index }: { product: LocalRecommendedProduct; index: number }) => {
  const [imageError, setImageError] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Tính phần trăm giảm giá
  const discountPercentage = product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  // Format giá
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // GSAP hover animations - Copy chính xác từ BestSellerSection
  useGSAP(({ gsap }) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const image = card.querySelector('.product-image');
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    const heartBtn = card.querySelector('.heart-btn');

    const handleMouseEnter = () => {
      const tl = gsapUtils.timeline();

      tl.to(card, {
        y: -4,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        duration: 0.3,
        ease: "power2.out"
      })
      .to(image, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      }, "-=0.3")
      .to([addToCartBtn, heartBtn], {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out"
      }, "-=0.1");
    };

    const handleMouseLeave = () => {
      const tl = gsapUtils.timeline();

      tl.to(card, {
        y: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        duration: 0.3,
        ease: "power2.out"
      })
      .to(image, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      }, "-=0.3")
      .to([addToCartBtn, heartBtn], {
        opacity: 0,
        y: 8,
        duration: 0.2,
        ease: "power2.out"
      }, "-=0.2");
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="product-card transform-gpu"
    >
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-colors duration-300 hover:border-rose-300">

          {/* Compact badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
            {discountPercentage > 0 && (
              <div className="bg-rose-500 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                -{discountPercentage}%
              </div>
            )}
            {product.soldCount && (
              <div className="bg-gray-700 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                {product.soldCount}
              </div>
            )}
            {product.isNew && (
              <div className="bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                Mới
              </div>
            )}
          </div>

          {/* Compact heart button */}
          <div className="absolute top-2 right-2 z-20">
            <button className="heart-btn w-7 h-7 bg-white/90 border border-gray-200 rounded-lg flex items-center justify-center opacity-0 translate-y-1 transition-all hover:bg-rose-50 hover:border-rose-300">
              <FiHeart className="w-3.5 h-3.5 text-gray-600 hover:text-rose-500" />
            </button>
          </div>

          {/* Hình ảnh sản phẩm - Copy chính xác */}
          <div className="relative aspect-square p-4 flex items-center justify-center bg-gray-50">
            <div className="relative w-full h-full">
              <Image
                src={imageError ? '/404.png' : product.image}
                alt={product.name}
                width={200}
                height={200}
                className="product-image object-contain w-full h-full"
                onError={handleImageError}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
              />
            </div>

            {/* Compact add to cart button */}
            <div className="absolute bottom-3 left-3 right-3">
              <button className="add-to-cart-btn w-full bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-medium py-2 rounded-lg flex items-center justify-center transition-all opacity-0 translate-y-1">
                <FiShoppingCart className="mr-1.5 w-3 h-3" />
                Thêm vào giỏ
              </button>
            </div>
          </div>

          {/* Thông tin sản phẩm - Copy chính xác */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-rose-600 transition-colors duration-300 min-h-[36px] leading-snug">
              {product.name}
            </h3>

            {/* Giá và đánh giá - Copy chính xác */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                {product.discountedPrice ? (
                  <>
                    <span className="text-base font-semibold text-rose-600">{formatPrice(product.discountedPrice)}</span>
                    <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                  </>
                ) : (
                  <span className="text-base font-semibold text-gray-800">{formatPrice(product.price)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <RatingStars rating={product.rating} />
                <span className="font-medium text-gray-700">{product.rating}</span>
                <span>({product.ratingCount})</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Loading skeleton - Copy từ BestSellerSection
const RecommendedProductSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="aspect-square bg-gray-200 animate-pulse"></div>
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const RecommendationSection = () => {
  const { isAuthenticated } = useAuth();
  const { 
    recommendedProducts, 
    personalizedProducts, 
    loadingRecommended, 
    loadingPersonalized,
    fetchRecommendedProducts,
    fetchPersonalizedProducts 
  } = useRecommendation();
  const sectionRef = React.useRef<HTMLDivElement>(null);

  // Memoize dữ liệu và trạng thái loading
  const products = useMemo(() => {
    return isAuthenticated ? personalizedProducts : recommendedProducts;
  }, [isAuthenticated, personalizedProducts, recommendedProducts]);

  const loading = useMemo(() => {
    return isAuthenticated ? loadingPersonalized : loadingRecommended;
  }, [isAuthenticated, loadingPersonalized, loadingRecommended]);

  // Memoize convertedProducts để tránh re-render liên tục
  const convertedProducts: LocalRecommendedProduct[] = useMemo(() => {
    return products.map(product => ({
      id: product._id,
      name: product.name,
      image: product.imageUrl || product.image?.url || '/404.png',
      slug: product.slug,
      soldCount: product.soldCount ? `${product.soldCount} đã bán` : undefined,
      price: product.price,
      discountedPrice: product.currentPrice && product.currentPrice < product.price ? product.currentPrice : undefined,
      rating: product.reviews?.averageRating || 0,
      ratingCount: product.reviews?.reviewCount || 0,
      isNew: product.flags?.isNew || product.isNew || false,
      isBestseller: product.flags?.isBestSeller || false
    }));
  }, [products]);

  // GSAP animations - chỉ chạy khi có data và không loading
  useGSAP(({ gsap }) => {
    if (!sectionRef.current || loading || convertedProducts.length === 0) return;

    const tl = gsapUtils.timeline();

    // Set initial states - Enhanced với các elements mới
    gsap.set('.recommendation-section', { opacity: 0 });
    gsap.set('.recommendation-header', { y: 20, opacity: 0 });
    gsap.set('.enhanced-title', { y: 20, opacity: 0 });
    gsap.set('.enhanced-description', { y: 15, opacity: 0 });
    gsap.set('.enhanced-decorative', { y: 10, opacity: 0, scale: 0.8 });
    gsap.set('.product-card', { y: 30, opacity: 0 });
    gsap.set('.view-all-button', { y: 15, opacity: 0 });

    // Animate entrance - Enhanced sequence
    tl.to('.recommendation-section', {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    })
    .to('.recommendation-header', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.3")
    .to('.enhanced-title', {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: "power3.out"
    }, "-=0.4")
    .to('.enhanced-description', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.3")
    .to('.enhanced-decorative', {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.7)"
    }, "-=0.2")
    .to('.product-card', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.1")
    .to('.view-all-button', {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.1");

  }, [loading, convertedProducts.length]); // Chỉ depend vào length thay vì toàn bộ array

  // Fetch products chỉ khi cần thiết và chưa có dữ liệu
  useEffect(() => {
    if (isAuthenticated) {
      // Chỉ fetch nếu chưa có personalized products và không đang loading
      if (personalizedProducts.length === 0 && !loadingPersonalized) {
        fetchPersonalizedProducts(20);
      }
    } else {
      // Chỉ fetch nếu chưa có recommended products và không đang loading
      if (recommendedProducts.length === 0 && !loadingRecommended) {
        fetchRecommendedProducts(20);
      }
    }
  }, [isAuthenticated, personalizedProducts.length, recommendedProducts.length, loadingPersonalized, loadingRecommended, fetchPersonalizedProducts, fetchRecommendedProducts]);

  // Loading state - Copy từ BestSellerSection
  if (loading) {
    return (
      <section className="py-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-80 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(20)].map((_, index) => (
              <RecommendedProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error/empty state
  if (convertedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-10 relative overflow-hidden recommendation-section" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Enhanced Header - Style giống CategorySection */}
        <div className="recommendation-header text-center mb-12">
          {/* Enhanced title với gradient và typography */}
          <div className="enhanced-title mb-6">
            <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-stone-800 via-rose-600 to-stone-800 bg-clip-text mb-4 tracking-tight leading-tight">
              {isAuthenticated ? 'Gợi Ý Dành Riêng Cho Bạn' : 'Sản Phẩm Gợi Ý'}
              <span className="block text-2xl font-medium text-stone-600 mt-2">
                {isAuthenticated ? 'Được Chọn Lọc Theo Sở Thích' : 'Xu Hướng Hiện Tại'}
              </span>
            </h2>
          </div>
          
          {/* Enhanced description */}
          <div className="enhanced-description relative">
            <p className="text-lg text-stone-700 max-w-3xl mx-auto leading-relaxed font-medium">
              {isAuthenticated 
                ? (
                  <>
                    Những sản phẩm mỹ phẩm được 
                    <span className="text-rose-600 font-semibold"> chọn lọc đặc biệt dựa trên sở thích</span> và 
                    lịch sử mua sắm của bạn
                  </>
                ) 
                : (
                  <>
                    Khám phá những sản phẩm mỹ phẩm 
                    <span className="text-rose-600 font-semibold"> hot trend và được yêu thích nhất</span> hiện tại
                  </>
                )}
            </p>
          </div>

          {/* Enhanced decorative elements */}
          <div className="enhanced-decorative flex justify-center items-center gap-4 mt-8">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-stone-300 to-rose-300"></div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full shadow-sm"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full"></div>
              <div className="w-1 h-1 bg-stone-200 rounded-full"></div>
            </div>
            <div className="h-px w-20 bg-gradient-to-r from-rose-300 via-stone-300 to-transparent"></div>
          </div>
        </div>

        {/* Products Grid - 5 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {convertedProducts.map((product, index) => (
            <RecommendedProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* CTA - Copy từ BestSellerSection */}
        <div className="flex justify-center mt-8">
          <div className="view-all-button">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-rose-300 hover:text-rose-600 transition-all"
            >
              Xem tất cả
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendationSection;