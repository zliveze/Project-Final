import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowRight, FiShoppingCart, FiHeart } from 'react-icons/fi'
import { FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { useGSAP, gsapUtils } from '../../hooks/useGSAP'

interface BestSeller {
  id: string;
  name: string;
  image: string;
  slug: string;
  soldCount: string;
  price: number;
  discountedPrice?: number;
  rating: number;
  ratingCount: number;
}

// Component hiển thị rating với style tối giản
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

// Component sản phẩm bán chạy - Clean & Minimal design
const BestSellerCard = ({ product, index }: { product: BestSeller; index: number }) => {
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

  // GSAP hover animations - Subtle và minimal
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
            <div className="bg-gray-700 text-white text-xs font-medium px-2 py-0.5 rounded-md">
              {product.soldCount}
            </div>
          </div>

          {/* Compact heart button */}
          <div className="absolute top-2 right-2 z-20">
            <button className="heart-btn w-7 h-7 bg-white/90 border border-gray-200 rounded-lg flex items-center justify-center opacity-0 translate-y-1 transition-all hover:bg-rose-50 hover:border-rose-300">
              <FiHeart className="w-3.5 h-3.5 text-gray-600 hover:text-rose-500" />
            </button>
          </div>

          {/* Hình ảnh sản phẩm - Minimal styling */}
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

          {/* Thông tin sản phẩm - Compact */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-rose-600 transition-colors duration-300 min-h-[36px] leading-snug">
              {product.name}
            </h3>

            {/* Giá và đánh giá - Compact */}
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

// Loading skeleton - Minimal
const BestSellerSkeleton = () => {
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

export default function BestSellerSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GSAP animations - Subtle và minimal
  useGSAP(({ gsap }) => {
    if (!sectionRef.current || loading) return;

    const tl = gsapUtils.timeline();

    // Set initial states
    gsap.set('.bestseller-section', { opacity: 0 });
    gsap.set('.bestseller-header', { y: 20, opacity: 0 });
    gsap.set('.product-card', { y: 30, opacity: 0 });
    gsap.set('.view-all-button', { y: 15, opacity: 0 });

    // Animate entrance - Subtle
    tl.to('.bestseller-section', {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    })
    .to('.bestseller-header', {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
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

  }, [loading, bestSellers]);

  // Fetch best seller products
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        // TODO: Thay thế bằng API call thực tế
        // const response = await fetch('/api/products/best-sellers?limit=6');
        // const data = await response.json();
        // setBestSellers(data);

        // Demo data
        setBestSellers([
          {
            id: '1',
            name: 'Serum Vitamin C Brightening',
            image: '/404.png',
            slug: 'serum-vitamin-c-brightening',
            soldCount: '1.2k đã bán',
            price: 850000,
            discountedPrice: 650000,
            rating: 4.8,
            ratingCount: 245
          },
          {
            id: '2',
            name: 'Moisturizer Hyaluronic Acid',
            image: '/404.png',
            slug: 'moisturizer-hyaluronic-acid',
            soldCount: '956 đã bán',
            price: 720000,
            rating: 4.7,
            ratingCount: 189
          },
          {
            id: '3',
            name: 'Cleanser Gentle Foam',
            image: '/404.png',
            slug: 'cleanser-gentle-foam',
            soldCount: '2.1k đã bán',
            price: 420000,
            discountedPrice: 320000,
            rating: 4.9,
            ratingCount: 567
          },
          {
            id: '4',
            name: 'Sunscreen SPF 50+',
            image: '/404.png',
            slug: 'sunscreen-spf-50',
            soldCount: '1.8k đã bán',
            price: 380000,
            rating: 4.6,
            ratingCount: 324
          },
          {
            id: '5',
            name: 'Face Mask Hydrating',
            image: '/404.png',
            slug: 'face-mask-hydrating',
            soldCount: '745 đã bán',
            price: 250000,
            discountedPrice: 190000,
            rating: 4.5,
            ratingCount: 156
          },
          {
            id: '6',
            name: 'Eye Cream Anti-aging',
            image: '/404.png',
            slug: 'eye-cream-anti-aging',
            soldCount: '892 đã bán',
            price: 680000,
            rating: 4.7,
            ratingCount: 201
          }
        ]);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm bán chạy:', err);
        setError('Không thể tải sản phẩm bán chạy');
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // Loading state
  if (loading) {
    return (
      <section className="py-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-80 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <BestSellerSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error/empty state
  if (error || bestSellers.length === 0) {
    return null;
  }

  return (
    <section className="py-10 relative overflow-hidden bestseller-section" ref={sectionRef}>
      {/* No additional background - inherits from main layout */}
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="bestseller-header text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Sản Phẩm Bán Chạy</h2>
          <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
            Những sản phẩm được yêu thích nhất tại Yumin
          </p>

          {/* Simple divider */}
          <div className="w-12 h-px bg-rose-300 mt-6 mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {bestSellers.map((product, index) => (
            <BestSellerCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* Compact CTA */}
        <div className="flex justify-center mt-8">
          <div className="view-all-button">
            <Link
              href="/ban-chay"
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
}