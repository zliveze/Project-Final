import React, { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade, Parallax } from 'swiper/modules'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useGSAP, animations, gsapUtils } from '../../hooks/useGSAP'
import { useBanner } from '../../contexts'
import type { Banner } from '../../contexts/BannerContext'
import { FiArrowRight, FiStar } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import 'swiper/css/parallax'

export default function Herobanners() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const swiperRef = useRef(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const { banners, loading, error, fetchActiveBanners } = useBanner()

  // Track mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      const x = (clientX / innerWidth - 0.5) * 2
      const y = (clientY / innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // GSAP Timeline for banner animations - Enhanced with parallax
  useGSAP(({ gsap }) => {
    if (!bannerRef.current || loading) return

    const tl = gsapUtils.timeline()
    
    // Initial setup with more dramatic entrance
    gsap.set(".banner-wrapper", { opacity: 0, scale: 1.05 })
    gsap.set(".hero-swiper", { opacity: 0, y: 30, rotationX: 2 })
    gsap.set(".floating-elements", { opacity: 0, scale: 0.8 })
    
    // Main entrance animation - More cinematic
    tl.to(".banner-wrapper", {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "power3.out"
    })
    .to(".hero-swiper", {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1,
      ease: "power3.out"
    }, "-=0.4")
    .to(".floating-elements", {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.6")

  }, [loading, isClient, banners])

  // Enhanced content animation for each slide
  useGSAP(({ gsap }) => {
    const slideContent = document.querySelectorAll('.swiper-slide-content')
    
    slideContent.forEach((content, index) => {
      if (index === activeIndex) {
        const tl = gsapUtils.timeline()
        const title = content.querySelector('h2')
        const subtitle = content.querySelector('p')
        const button = content.querySelector('button')
        const decorativeElements = content.querySelectorAll('.decorative-element')
        
        // Set initial states
        gsap.set([title, subtitle, button], { y: 30, opacity: 0 })
        gsap.set(decorativeElements, { scale: 0, opacity: 0 })
        
        // Animate entrance with stagger
        tl.to(title, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        })
        .to(subtitle, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.5")
        .to(decorativeElements, {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)"
        }, "-=0.6")
        .to(button, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.4")
      }
    })
  }, [activeIndex])

  // Parallax effect for floating elements
  useGSAP(({ gsap }) => {
    const floatingElements = document.querySelectorAll('.floating-element')
    
    floatingElements.forEach((element, index) => {
      const speed = 0.5 + (index * 0.2)
      gsap.to(element, {
        x: mousePosition.x * speed * 10,
        y: mousePosition.y * speed * 10,
        duration: 2,
        ease: "power2.out"
      })
    })
  }, [mousePosition])

  // Fetch banners khi component được mount
  useEffect(() => {
    fetchActiveBanners()
  }, [fetchActiveBanners])

  // Chỉ render các hiệu ứng animation ở phía client
  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // Enhanced subtitle generation
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

  // Enhanced button text
  const getButtonText = (banner: Banner) => {
    if (banner.campaignId?.includes('sale') || banner.campaignId?.includes('deal')) {
      return 'Mua ngay - Ưu đãi hot';
    } else if (banner.campaignId?.includes('collection')) {
      return 'Khám phá bộ sưu tập';
    }
    
    return 'Khám phá ngay';
  }

  // Enhanced loading state
  if (loading) {
    return (
      <div className="banner-wrapper relative overflow-hidden py-4 md:py-8">
        {/* Floating elements while loading */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-element absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-rose-300/20 to-pink-300/20 rounded-full blur-xl animate-pulse"></div>
          <div className="floating-element absolute top-40 left-20 w-12 h-12 bg-gradient-to-r from-purple-300/20 to-violet-300/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 h-[300px] md:h-[450px] flex items-center justify-center">
          <div className="animate-pulse w-full h-full rounded-3xl bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
            {/* Loading shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="text-center z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mx-auto mb-4 animate-spin shadow-lg"></div>
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
    <div className="banner-wrapper relative overflow-hidden py-4 md:py-8" ref={bannerRef}>
      {/* Enhanced Floating Decorative Elements */}
      <div className="floating-elements absolute inset-0 pointer-events-none z-10">
        <div className="floating-element absolute top-16 right-16 w-20 h-20 bg-gradient-to-r from-rose-400/15 to-pink-400/15 rounded-full blur-2xl"></div>
        <div className="floating-element absolute top-32 left-16 w-16 h-16 bg-gradient-to-r from-purple-400/15 to-violet-400/15 rounded-full blur-xl"></div>
        <div className="floating-element absolute bottom-32 right-1/4 w-24 h-24 bg-gradient-to-r from-amber-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
        
        {/* Sparkle elements */}
        <div className="floating-element absolute top-24 left-1/3">
          <HiSparkles className="w-6 h-6 text-rose-400/40 animate-pulse" />
        </div>
        <div className="floating-element absolute bottom-24 right-1/3">
          <FiStar className="w-4 h-4 text-pink-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        <style jsx global>{`
          .banner-wrapper {
            will-change: opacity, transform;
          }
          
          .hero-swiper {
            border-radius: 0;
            transform-style: preserve-3d;
            will-change: transform, opacity;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
          }

          .hero-swiper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%);
            pointer-events: none;
            z-index: 10;
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
              text-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            
            .hero-swiper {
              border-radius: 24px;
              overflow: hidden;
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .hero-swiper:hover {
              transform: translateY(-4px) scale(1.01);
              box-shadow: 0 32px 80px rgba(0,0,0,0.12);
            }
          }

          /* Enhanced Pagination with glassmorphism */
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
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 4px;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.2);
          }

          .hero-swiper .swiper-pagination-bullet-active {
            opacity: 1;
            background: linear-gradient(45deg, #ff6b9d, #c44569);
            width: 32px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
          }

          /* Premium Navigation Buttons */
          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            color: white;
            background: rgba(255,255,255,0.1);
            width: 44px;
            height: 44px;
            border-radius: 50%;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.2);
            z-index: 20;
          }

          .hero-swiper .swiper-button-next:hover,
          .hero-swiper .swiper-button-prev:hover {
            background: linear-gradient(45deg, rgba(255, 107, 157, 0.9), rgba(196, 69, 105, 0.9));
            transform: scale(1.1);
            box-shadow: 0 8px 24px rgba(255, 107, 157, 0.3);
          }

          .hero-swiper .swiper-button-next:after,
          .hero-swiper .swiper-button-prev:after {
            font-size: 16px;
            font-weight: 700;
          }
          
          /* Premium Button with enhanced effects */
          .banner-btn {
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            background: linear-gradient(45deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85)) !important;
            color: #2D2D2D !important;
            border: 1px solid rgba(255,255,255,0.8);
            backdrop-filter: blur(12px);
            font-weight: 600;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 20px rgba(255,255,255,0.2);
          }

          .banner-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: left 0.5s;
          }

          .banner-btn:hover::before {
            left: 100%;
          }
          
          .banner-btn:hover {
            background: linear-gradient(45deg, #ff6b9d, #c44569) !important;
            color: white !important;
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 12px 32px rgba(255, 107, 157, 0.4);
            border-color: rgba(255, 107, 157, 0.8);
          }

          /* Enhanced decorative elements */
          .decorative-element {
            position: absolute;
            pointer-events: none;
          }

          .floating-element {
            animation: float 8s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(2deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
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
          parallax={true}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          modules={[Autoplay, Pagination, Navigation, EffectFade, Parallax]}
          className="hero-swiper"
          ref={swiperRef}
        >
          {banners.map((banner: Banner, index: number) => (
            <SwiperSlide key={banner._id} className="relative">
              {/* Desktop Image with parallax */}
              <div className="hidden md:block w-full h-[450px] relative" data-swiper-parallax="30%">
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
              
              {/* Mobile Image with parallax */}
              <div className="block md:hidden w-full h-[350px] relative" data-swiper-parallax="20%">
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
              
              {/* Enhanced Content với decorative elements */}
              <div className="swiper-slide-content" data-swiper-parallax="-100">
                {/* Decorative elements */}
                <div className="decorative-element absolute -top-4 -left-4 w-8 h-8 border-2 border-white/30 rounded-full"></div>
                <div className="decorative-element absolute -bottom-4 -right-4 w-6 h-6 bg-white/20 rounded-full blur-sm"></div>
                
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 tracking-wide leading-tight">
                  {banner.title}
                </h2>
                
                <p className="text-sm md:text-lg mb-6 md:mb-8 max-w-lg opacity-95 font-light leading-relaxed">
                  {getSubtitle(banner)}
                </p>
                
                <button 
                  onClick={() => handleBannerClick(banner.href || '/shop', banner.campaignId || '')}
                  className="banner-btn group px-6 py-3 md:px-8 md:py-4 rounded-full font-medium text-sm md:text-base inline-flex items-center gap-2 transform-gpu"
                >
                  <span className="relative z-10">{getButtonText(banner)}</span>
                  <FiArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}
