import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RiFireFill } from 'react-icons/ri'
import { HiClock } from 'react-icons/hi'
import { FiZap, FiArrowRight, FiShoppingCart, FiHeart } from 'react-icons/fi'
import { FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { getActiveEvents } from '@/services/eventService'
import { useGSAP, gsapUtils } from '../../hooks/useGSAP'

// Cấu trúc dữ liệu sản phẩm trong sự kiện (đã được populate từ backend)
export interface PopulatedEventProduct {
  productId: string;
  variantId?: string;
  adjustedPrice: number;
  name: string;
  image: string;
  originalPrice: number;
  slug?: string;
  rating?: number;
  ratingCount?: number;
  soldCount?: number;
  averageRating?: number;
  reviewCount?: number;
  reviews?: object[];
}

// Cấu trúc dữ liệu sự kiện từ API
export interface EventFromAPI {
  _id: string;
  title: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  products: PopulatedEventProduct[];
}

// Component Loading Skeleton - Minimal
const EventSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-8">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-12 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-12 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-200 aspect-square rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component Event Item - Clean & Minimal design
const EventItem: React.FC<{ event: EventFromAPI; index: number }> = ({ event, index }) => {
  const eventRef = useRef<HTMLDivElement>(null);

  const remainingTime = calculateRemainingTime(event.endDate);
  const eventProducts = event.products.slice(0, 10); // Giới hạn 10 sản phẩm

  // Event color themes for variety
  const getEventTheme = (index: number) => {
    const themes = [
      {
        primary: 'from-rose-500 to-pink-500',
        primarySolid: 'bg-rose-500',
        divider: 'bg-rose-300',
        hover: 'hover:from-rose-600 hover:to-pink-600',
        discount: 'bg-rose-500'
      },
      {
        primary: 'from-amber-500 to-orange-500',
        primarySolid: 'bg-amber-500',
        divider: 'bg-amber-300',
        hover: 'hover:from-amber-600 hover:to-orange-600',
        discount: 'bg-amber-500'
      },
      {
        primary: 'from-violet-500 to-purple-500',
        primarySolid: 'bg-violet-500',
        divider: 'bg-violet-300',
        hover: 'hover:from-violet-600 hover:to-purple-600',
        discount: 'bg-violet-500'
      },
      {
        primary: 'from-sky-500 to-blue-500',
        primarySolid: 'bg-sky-500',
        divider: 'bg-sky-300',
        hover: 'hover:from-sky-600 hover:to-blue-600',
        discount: 'bg-sky-500'
      },
      {
        primary: 'from-emerald-500 to-teal-500',
        primarySolid: 'bg-emerald-500',
        divider: 'bg-emerald-300',
        hover: 'hover:from-emerald-600 hover:to-teal-600',
        discount: 'bg-emerald-500'
      },
      {
        primary: 'from-pink-500 to-rose-500',
        primarySolid: 'bg-pink-500',
        divider: 'bg-pink-300',
        hover: 'hover:from-pink-600 hover:to-rose-600',
        discount: 'bg-pink-500'
      }
    ];
    return themes[index % themes.length];
  };

  const theme = getEventTheme(index);

  // GSAP animations - Subtle
  useGSAP(({ gsap }) => {
    if (!eventRef.current) return;

    const tl = gsapUtils.timeline();

    // Set initial states
    gsap.set(eventRef.current, { opacity: 0, y: 30 });
    gsap.set('.event-header', { y: 20, opacity: 0 });
    gsap.set('.event-product-card', { y: 20, opacity: 0 });

    // Animate entrance
    tl.to(eventRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: index * 0.1
    })
    .to('.event-header', {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3")
    .to('.event-product-card', {
      y: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.out"
    }, "-=0.2");

  }, [index]);

  if (eventProducts.length === 0) return null;

  return (
    <div ref={eventRef} className="mb-4">
      
      {/* Event Header - Separate from product container */}
      <div className="event-header pt-12 mb-8">
        <div className="text-center mb-6">
          {/* Event Title - Main focus with enhanced effects */}
          <div className="relative mb-4">
            {/* Background glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${theme.primary} opacity-10 blur-2xl rounded-2xl transform scale-110`}></div>
            
            {/* Main title with gradient text */}
            <h2 className={`event-title float-animation relative text-2xl lg:text-3xl font-bold bg-gradient-to-r ${theme.primary} bg-clip-text text-transparent mb-2 leading-tight tracking-tight hover:scale-105 transition-transform duration-300 cursor-default`}>
              {event.title}
            </h2>
            
            {/* Animated underline */}
            <div className={`relative mx-auto w-24 h-0.5 bg-gradient-to-r ${theme.primary} rounded-full`}>
              <div className={`glow-animation absolute inset-0 bg-gradient-to-r ${theme.primary} rounded-full opacity-75`}></div>
            </div>
          </div>
          
          {/* Event Description */}
          {event.description && (
            <div className="relative">
              <p className="text-gray-600 text-base max-w-3xl mx-auto leading-relaxed hover:text-gray-700 transition-colors duration-200">
                {event.description}
              </p>
            </div>
          )}
          
          {/* Enhanced divider with glow */}
          <div className="mt-6 flex justify-center">
            <div className={`relative w-12 h-px ${theme.divider} mx-auto`}>
              <div className={`absolute inset-0 w-12 h-px bg-gradient-to-r ${theme.primary} opacity-50 blur-sm`}></div>
            </div>
          </div>
        </div>

        {/* Action section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Flash Sale Badge */}
          <div className={`inline-flex items-center gap-1.5 ${theme.primarySolid} text-white px-6 py-3 rounded-full text-sm font-medium min-h-[44px]`}>
            <RiFireFill className="w-4 h-4" />
            FLASH SALE
          </div>

          {/* Countdown Timer */}
          <div className={`bg-gradient-to-r ${theme.primary} text-white px-6 py-3 rounded-lg text-center min-h-[44px] flex items-center`}>
            <div className="flex items-center gap-2">
              <HiClock className="w-4 h-4" />
              <div>
                <span className="text-xs font-medium">KẾT THÚC TRONG: </span>
                <span className="text-sm font-semibold">{remainingTime}</span>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <Link href={`/shop?eventId=${event._id}`}>
            <button className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${theme.primary} text-white rounded-lg font-medium ${theme.hover} transition-all duration-200 shadow-md hover:shadow-lg min-h-[44px]`}>
              <FiZap className="w-4 h-4" />
              <span className="text-sm">MUA NGAY</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Products Container - Sử dụng ProductCardEvent */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300">
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {eventProducts.map((product) => {
              // Tính discount percentage is handled in EventProductCard

              return (
                <div key={product.productId} className="event-product-card">
                  <EventProductCard
                    product={product}
                    remainingTime={remainingTime}
                  />
                </div>
              );
            })}
          </div>

          {/* View More Products */}
          {event.products.length > 10 && (
            <div className="flex justify-center mt-6">
              <Link href={`/shop?eventId=${event._id}`}>
                <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-rose-300 hover:text-rose-600 transition-all">
                  Xem thêm {event.products.length - 10} sản phẩm
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function cho countdown timer
const calculateRemainingTime = (endDateString?: string): string => { 
  if (!endDateString) return "N/A";
  const endDate = new Date(endDateString);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "ĐÃ KẾT THÚC";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Component hiển thị rating với style tối giản - Copy từ RecommendationSection
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

// Interface cho sản phẩm event
interface EventProductCardProps {
  product: PopulatedEventProduct;
  remainingTime: string;
}

// Component sản phẩm event - Style giống RecommendationSection
const EventProductCard = ({ product, remainingTime }: EventProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Tính phần trăm giảm giá
  const discountPercentage = product.originalPrice > 0 && product.adjustedPrice < product.originalPrice 
    ? Math.round(((product.originalPrice - product.adjustedPrice) / product.originalPrice) * 100)
    : 0;

  // Format số lượng đã bán cho hiển thị
  const formatSoldCount = (soldCount: number | string): string => {
    // Nếu là string, parse thành number
    const count = typeof soldCount === 'string' ? parseInt(soldCount.toString()) : soldCount;
    
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k đã bán`;
    }
    return `${count} đã bán`;
  };

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

  // GSAP hover animations - Copy từ RecommendationSection
  useGSAP(() => {
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
      className="event-product-card transform-gpu"
    >
      <Link href={`/product/${product.slug || product.productId}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-colors duration-300 hover:border-rose-300">

          {/* Event badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
            {discountPercentage > 0 && (
              <div className="bg-rose-500 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                -{discountPercentage}%
              </div>
            )}
            {/* Flash Sale badge */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
              <RiFireFill className="w-3 h-3" />
              FLASH SALE
            </div>
            {/* Remaining time */}
            <div className="bg-gray-700 text-white text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
              <HiClock className="w-3 h-3" />
              {remainingTime}
            </div>
            {/* Sold count với fallback */}
            <div className="bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded-md">
              {product.soldCount ? formatSoldCount(product.soldCount) : '0 đã bán'}
            </div>
          </div>

          {/* Heart button */}
          <div className="absolute top-2 right-2 z-20">
            <button className="heart-btn w-7 h-7 bg-white/90 border border-gray-200 rounded-lg flex items-center justify-center opacity-0 translate-y-1 transition-all hover:bg-rose-50 hover:border-rose-300">
              <FiHeart className="w-3.5 h-3.5 text-gray-600 hover:text-rose-500" />
            </button>
          </div>

          {/* Hình ảnh sản phẩm */}
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

            {/* Add to cart button */}
            <div className="absolute bottom-3 left-3 right-3">
              <button className="add-to-cart-btn w-full bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-medium py-2 rounded-lg flex items-center justify-center transition-all opacity-0 translate-y-1">
                <FiShoppingCart className="mr-1.5 w-3 h-3" />
                Thêm vào giỏ
              </button>
            </div>
          </div>

          {/* Thông tin sản phẩm */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-rose-600 transition-colors duration-300 min-h-[36px] leading-snug">
              {product.name}
            </h3>

            {/* Giá và đánh giá */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-rose-600">{formatPrice(product.adjustedPrice)}</span>
                {product.originalPrice > product.adjustedPrice && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
              {/* Chỉ hiển thị rating nếu có dữ liệu */}
              {(product.averageRating || product.reviewCount) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <RatingStars rating={product.averageRating || 0} />
                  <span className="font-medium text-gray-700">
                    {product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span>({product.reviewCount || 0})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function EventsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeEvents, setActiveEvents] = useState<EventFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GSAP animations - Subtle
  useGSAP(({ gsap }) => {
    if (!sectionRef.current || isLoading) return;

    const tl = gsapUtils.timeline();

    // Set initial states
    gsap.set('.events-section', { opacity: 0 });

    // Animate entrance
    tl.to('.events-section', {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    });

  }, [isLoading, activeEvents]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const eventsData = await getActiveEvents();
        if (eventsData && eventsData.length > 0) {
          // Sử dụng dữ liệu thật từ API thay vì demo data
          console.log('Events API products with real data:', eventsData[0]?.products?.slice(0, 3));
          
          setActiveEvents(eventsData.filter(event => event.products && event.products.length > 0));
        } else {
          setActiveEvents([]);
        }
        setError(null);
      } catch (err: unknown) {
        // Nếu API thất bại, không hiển thị event nào
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        console.error('Error fetching events:', errorMessage);
        setActiveEvents([]);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-8">
            {[...Array(2)].map((_, index) => (
              <EventSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state or no events
  if (error) {
    console.error("Error fetching events:", error);
    return null; 
  }

  if (activeEvents.length === 0) {
    return null; 
  }

  return (
    <section className="py-10 events-section" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Events List - Each event with its own header */}
        <div className="space-y-8">
          {activeEvents.map((event, index) => (
            <EventItem key={event._id} event={event} index={index} />
          ))}
        </div>
        
      </div>
      
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Enhanced title effects */
        .event-title {
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
        }

        .event-title::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          50% { left: -100%; }
          100% { left: 100%; }
        }

        /* Glow animation */
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .glow-animation {
          animation: glow 2s ease-in-out infinite;
        }

        /* Floating animation for title */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
