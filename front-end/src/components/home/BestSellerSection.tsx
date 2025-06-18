import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowRight, FiShoppingCart, FiHeart, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { useShopProduct } from '../../contexts/user/shop/ShopProductContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface BestSeller {
  id: string;
  name: string;
  imageUrl: string;
  slug: string;
  soldCount?: number;
  price: number;
  currentPrice: number;
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
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
const BestSellerCard = ({ product }: { product: BestSeller }) => {
  const [imageError, setImageError] = useState(false);

  // Tính phần trăm giảm giá
  const discountPercentage = product.currentPrice < product.price
    ? Math.round(((product.price - product.currentPrice) / product.price) * 100)
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

  return (
    <div className="product-card">
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-colors hover:border-rose-300 hover:shadow-md">

          {/* Compact badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
            {discountPercentage > 0 && (
              <div className="bg-rose-500 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                -{discountPercentage}%
              </div>
            )}
            <div className="bg-gray-700 text-white text-xs font-medium px-2 py-0.5 rounded-md">
              {product.soldCount ? `${product.soldCount} đã bán` : 'Bán chạy'}
            </div>
          </div>

          {/* Compact heart button */}
          <div className="absolute top-2 right-2 z-20">
            <button className="w-7 h-7 bg-white/90 border border-gray-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:border-rose-300">
              <FiHeart className="w-3.5 h-3.5 text-gray-600 hover:text-rose-500" />
            </button>
          </div>

          {/* Hình ảnh sản phẩm */}
          <div className="relative aspect-square p-6 flex items-center justify-center bg-gray-50">
            <div className="relative w-full h-full">
              <Image
                src={imageError ? '/404.png' : product.imageUrl}
                alt={product.name}
                width={250}
                height={250}
                className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                onError={handleImageError}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
              />
            </div>

            {/* Add to cart button */}
            <div className="absolute bottom-4 left-4 right-4">
              <button className="w-full bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-sm font-medium py-3 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <FiShoppingCart className="mr-2 w-4 h-4" />
                Thêm vào giỏ
              </button>
            </div>
          </div>

          {/* Thông tin sản phẩm */}
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-800 line-clamp-2 group-hover:text-rose-600 transition-colors min-h-[44px] leading-snug">
              {product.name}
            </h3>

            {/* Giá và đánh giá */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                {product.currentPrice < product.price ? (
                  <>
                    <span className="text-lg font-semibold text-rose-600">{formatPrice(product.currentPrice)}</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-gray-800">{formatPrice(product.price)}</span>
                )}
              </div>
              {product.reviews && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RatingStars rating={product.reviews.averageRating} />
                  <span className="font-medium text-gray-700">{product.reviews.averageRating}</span>
                  <span>({product.reviews.reviewCount})</span>
                </div>
              )}
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
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchTopProducts } = useShopProduct();

  // Fetch best seller products
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Gọi API thực để lấy top 20 sản phẩm bán chạy
        const topProducts = await fetchTopProducts('all-time', 20);

        // Convert LightProduct to BestSeller format
        const formattedProducts: BestSeller[] = topProducts.map(product => ({
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl || '/404.png',
          slug: product.slug,
          soldCount: product.soldCount,
          price: product.price,
          currentPrice: product.currentPrice,
          reviews: product.reviews
        }));

        setBestSellers(formattedProducts);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm bán chạy:', err);
        setError('Không thể tải sản phẩm bán chạy');
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [fetchTopProducts]);

  // Loading state
  if (loading) {
    return (
      <section className="py-4 relative overflow-hidden">
        <div className="mx-auto px-4 md:px-8 lg:px-12 relative z-10" style={{ maxWidth: 'calc(100vw - 50px)' }}>
          <div className="text-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-80 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {[...Array(10)].map((_, index) => (
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

  // Chia sản phẩm thành 2 nhóm: 10 đầu hiển thị grid, 10 còn lại hiển thị slider
  const firstTenProducts = bestSellers.slice(0, 10);
  const remainingProducts = bestSellers.slice(10);

  return (
    <section className="py-4 relative">
      <div className="mx-auto px-4 md:px-8 lg:px-12 relative z-10" style={{ maxWidth: 'calc(100vw - 50px)' }}>
        <div className="text-center mb-3">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sản Phẩm Bán Chạy</h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Top 20 sản phẩm được yêu thích nhất tại Yumin
          </p>

          {/* Simple divider */}
          <div className="w-12 h-px bg-rose-300 mt-3 mx-auto"></div>
        </div>

        {/* Grid hiển thị 10 sản phẩm đầu (2 hàng x 5 cột) */}
        {firstTenProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {firstTenProducts.map((product) => (
              <BestSellerCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Slider hiển thị 10 sản phẩm còn lại */}
        {remainingProducts.length > 0 && (
          <div className="relative">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={24}
              slidesPerView={2}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{
                clickable: true,
                el: '.swiper-pagination-custom',
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 3,
                },
                768: {
                  slidesPerView: 4,
                },
                1024: {
                  slidesPerView: 6,
                },
              }}
              className="bestseller-swiper"
            >
              {remainingProducts.map((product) => (
                <SwiperSlide key={product.id}>
                  <BestSellerCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 hover:border-rose-300 transition-all">
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 hover:border-rose-300 transition-all">
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Custom Pagination */}
            <div className="swiper-pagination-custom flex justify-center mt-6"></div>
          </div>
        )}

        {/* Compact CTA */}
        <div className="flex justify-center mt-8">
          <Link
            href="/shop?sortBy=soldCount&sortOrder=desc"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-rose-300 hover:text-rose-600 transition-all"
          >
            Xem tất cả sản phẩm bán chạy
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .bestseller-swiper .swiper-pagination-bullet {
          background: #e5e7eb;
          opacity: 1;
          width: 8px;
          height: 8px;
        }
        .bestseller-swiper .swiper-pagination-bullet-active {
          background: #f43f5e;
        }
      `}</style>
    </section>
  );
}
