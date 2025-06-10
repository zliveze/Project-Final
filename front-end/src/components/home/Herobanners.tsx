import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useBanner } from '../../contexts'
import type { Banner } from '../../contexts/BannerContext'
import { FiArrowRight } from 'react-icons/fi'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

export default function Herobanners() {
  const router = useRouter()
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const { banners, loading, error, fetchActiveBanners } = useBanner()

  // Fetch banners khi component được mount
  useEffect(() => {
    fetchActiveBanners()
  }, [fetchActiveBanners])

  // Handle image error
  const handleImageError = (bannerId: string) => {
    setImageErrors(prev => new Set(prev).add(bannerId))
  }

  // Check if image has error
  const isImageError = (bannerId: string) => {
    return imageErrors.has(bannerId)
  }

  const handleBannerClick = (href: string, campaignId: string) => {
    event?.preventDefault()
    localStorage.setItem('currentCampaign', campaignId)
    router.replace(href)
  }

  // Lấy subtitle cho banner
  const getSubtitle = (banner: Banner) => {
    if (banner.alt) return banner.alt;
    
    if (banner.campaignId?.includes('valentine')) {
      return '✨ Ưu đãi đặc biệt cho những món quà tình yêu';
    } else if (banner.campaignId?.includes('tet') || banner.campaignId?.includes('lunar-new-year')) {
      return '🌟 Tỏa sáng đón năm mới với ưu đãi hấp dẫn';
    } else if (banner.campaignId?.includes('new-year')) {
      return '💫 Làm mới diện mạo với bộ sưu tập đầu năm';
    }
    
    return '🌸 Khám phá ngay bộ sưu tập mới nhất của chúng tôi';
  }

  // Lấy text cho button
  const getButtonText = (banner: Banner) => {
    if (banner.campaignId?.includes('sale') || banner.campaignId?.includes('deal')) {
      return 'Mua ngay - Ưu đãi hot';
    } else if (banner.campaignId?.includes('collection')) {
      return 'Khám phá bộ sưu tập';
    }
    
    return 'Khám phá ngay';
  }

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className="banner-wrapper relative overflow-hidden py-4 md:py-8">
        <div className="container mx-auto px-4 h-[300px] md:h-[450px] flex items-center justify-center">
          <div className="animate-pulse w-full h-full rounded-3xl bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mx-auto mb-4 animate-spin"></div>
              <div className="h-4 bg-white/50 rounded-full w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-white/30 rounded-full w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Ghi log lỗi nhưng không hiển thị section nếu có lỗi
  if (error) {
    console.error('Lỗi khi tải banner:', error)
    return null;
  }

  // Nếu không có banner nào, không hiển thị section
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="banner-wrapper relative overflow-hidden py-4 md:py-8">
      <div className="mx-auto px-4 md:px-8 lg:px-12 relative" style={{ maxWidth: 'calc(100vw - 50px)' }}>
        <style jsx global>{`
          .hero-swiper {
            border-radius: 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
          }
          
          .swiper-slide-content {
            position: absolute;
            z-index: 15;
            left: 0;
            bottom: 0;
            width: 100%;
            padding: 2rem;
            color: white;
            background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.3), transparent);
          }
          
          @media (min-width: 768px) {
            .swiper-slide-content {
              bottom: 10%;
              left: 8%;
              width: 50%;
              padding: 0;
              background: none;
              text-shadow: 0 2px 8px rgba(0,0,0,0.4);
            }
            
            .hero-swiper {
              border-radius: 24px;
              overflow: hidden;
              transition: all 0.3s ease;
            }
          }

          .hero-swiper .swiper-pagination {
            bottom: 24px !important;
            z-index: 20;
          }

          .hero-swiper .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            margin: 0 6px;
            background: rgba(255,255,255,0.6);
            opacity: 0.7;
            border-radius: 4px;
          }

          .hero-swiper .swiper-pagination-bullet-active {
            opacity: 1;
            background: #ff6b9d;
            width: 24px;
            border-radius: 4px;
          }

          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            color: white;
            background: rgba(255,255,255,0.2);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: all 0.3s ease;
          }

          .hero-swiper .swiper-button-next:hover,
          .hero-swiper .swiper-button-prev:hover {
            background: rgba(255, 107, 157, 0.8);
          }

          .hero-swiper .swiper-button-next:after,
          .hero-swiper .swiper-button-prev:after {
            font-size: 16px;
            font-weight: 700;
          }
          
          .banner-btn {
            transition: all 0.3s ease;
            background: rgba(255,255,255,0.9) !important;
            color: #2D2D2D !important;
            border: 1px solid rgba(255,255,255,0.8);
            font-weight: 600;
          }
          
          .banner-btn:hover {
            background: #ff6b9d !important;
            color: white !important;
            transform: translateY(-2px);
          }
        `}</style>

        <Swiper
          spaceBetween={0}
          centeredSlides={true}
          autoplay={{
            delay: 7000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          navigation={true}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          className="hero-swiper"
        >
          {banners.map((banner: Banner, index: number) => (
            <SwiperSlide key={banner._id} className="relative">
              {/* Desktop Image */}
              <div className="hidden md:block w-full h-[450px] relative">
                <Image
                  src={isImageError(`${banner._id}-desktop`) ? '/404.png' : banner.desktopImage}
                  alt={banner.alt || banner.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={index === 0}
                  quality={95}
                  onError={() => handleImageError(`${banner._id}-desktop`)}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
                />
              </div>
              
              {/* Mobile Image */}
              <div className="block md:hidden w-full h-[350px] relative">
                <Image
                  src={isImageError(`${banner._id}-mobile`) ? '/404.png' : banner.mobileImage}
                  alt={banner.alt || banner.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={index === 0}
                  quality={90}
                  onError={() => handleImageError(`${banner._id}-mobile`)}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
                />
              </div>
              
              {/* Content */}
              <div className="swiper-slide-content">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 tracking-wide leading-tight">
                  {banner.title}
                </h2>
                
                <p className="text-sm md:text-lg mb-6 md:mb-8 max-w-lg opacity-95 font-light leading-relaxed">
                  {getSubtitle(banner)}
                </p>
                
                <button 
                  onClick={() => handleBannerClick(banner.href || '/shop', banner.campaignId || '')}
                  className="banner-btn px-6 py-3 md:px-8 md:py-4 rounded-full font-medium text-sm md:text-base inline-flex items-center gap-2"
                >
                  <span>{getButtonText(banner)}</span>
                  <FiArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}
