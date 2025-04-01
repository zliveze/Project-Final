import React, { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade, Parallax } from 'swiper/modules'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useBanner } from '../../contexts'
import type { Banner } from '../../contexts/BannerContext'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import 'swiper/css/parallax'

// Dữ liệu banner dự phòng nếu API không có sẵn
const fallbackBanners: Banner[] = [
  {
    _id: 'valentine-2024',
    title: 'Valentine - Chạm tim deal ngọt ngào',
    campaignId: 'valentine-2024',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg1.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile2.png?v=608',
    alt: 'Ưu đãi đặc biệt cho những món quà tình yêu',
    href: '/shop?campaign=valentine-2024',
    active: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'tet-2024',
    title: 'Tết rộn ràng - Sale cực khủng',
    campaignId: 'tet-2024',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg2.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile1.png?v=608',
    alt: 'Tỏa sáng đón năm mới với ưu đãi hấp dẫn',
    href: '/shop?campaign=tet-2024',
    active: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'new-year-2024',
    title: 'Năm mới - Deal hời',
    campaignId: 'new-year-2024',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg3.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile3.png?v=608',
    alt: 'Làm mới diện mạo với bộ sưu tập đầu năm',
    href: '/shop?campaign=new-year-2024',
    active: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Định nghĩa các giá trị cố định cho animation
const decorativeElements = [
  { type: 'heart', left: "15%", top: "20%", delay: "0.5s", duration: "18s", size: "16px" },
  { type: 'heart', left: "30%", top: "50%", delay: "1.2s", duration: "22s", size: "20px" },
  { type: 'heart', left: "45%", top: "15%", delay: "2.1s", duration: "20s", size: "14px" },
  { type: 'heart', left: "60%", top: "40%", delay: "1.5s", duration: "19s", size: "18px" },
  { type: 'heart', left: "75%", top: "30%", delay: "0.8s", duration: "21s", size: "22px" },
  { type: 'heart', left: "90%", top: "60%", delay: "1.7s", duration: "23s", size: "16px" },
  { type: 'circle', left: "20%", top: "30%", delay: "0.5s", size: "80px", color: "rgba(255,182,193,0.3)" },
  { type: 'circle', left: "40%", top: "60%", delay: "1.2s", size: "60px", color: "rgba(255,220,220,0.2)" },
  { type: 'circle', left: "60%", top: "40%", delay: "1.8s", size: "100px", color: "rgba(255,192,203,0.15)" },
  { type: 'circle', left: "80%", top: "70%", delay: "0.9s", size: "70px", color: "rgba(255,105,180,0.1)" },
  { type: 'dot', left: "25%", top: "25%", delay: "0.3s", size: "6px", color: "rgba(219,112,147,0.6)" },
  { type: 'dot', left: "35%", top: "65%", delay: "1.0s", size: "8px", color: "rgba(255,105,180,0.5)" },
  { type: 'dot', left: "65%", top: "35%", delay: "1.5s", size: "5px", color: "rgba(255,20,147,0.4)" },
  { type: 'dot', left: "85%", top: "15%", delay: "0.7s", size: "7px", color: "rgba(219,112,147,0.5)" }
];

export default function Herobanners() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const swiperRef = useRef(null)
  const { banners, loading, error, fetchActiveBanners } = useBanner()

  // Fetch banners khi component được mount
  useEffect(() => {
    fetchActiveBanners()
  }, [fetchActiveBanners])

  // Chỉ render các hiệu ứng animation ở phía client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleBannerClick = (href: string, campaignId: string) => {
    event?.preventDefault()
    localStorage.setItem('currentCampaign', campaignId)
    router.push(href)
  }

  // Cấu hình animation cho các phần tử văn bản
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.1 * index, 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }),
  }

  // Tạo subtitle cho banner nếu không có
  const getSubtitle = (banner: Banner) => {
    // Nếu banner có alt text, sử dụng nó như là subtitle
    if (banner.alt) return banner.alt;
    
    // Nếu không, tạo subtitle theo campaignId
    if (banner.campaignId?.includes('valentine')) {
      return 'Ưu đãi đặc biệt cho những món quà tình yêu';
    } else if (banner.campaignId?.includes('tet') || banner.campaignId?.includes('lunar-new-year')) {
      return 'Tỏa sáng đón năm mới với ưu đãi hấp dẫn';
    } else if (banner.campaignId?.includes('new-year')) {
      return 'Làm mới diện mạo với bộ sưu tập đầu năm';
    }
    
    return 'Khám phá ngay bộ sưu tập mới nhất của chúng tôi';
  }

  // Tạo nội dung button cho banner
  const getButtonText = (banner: Banner) => {
    if (banner.campaignId?.includes('sale') || banner.campaignId?.includes('deal')) {
      return 'Mua ngay';
    } else if (banner.campaignId?.includes('collection')) {
      return 'Xem bộ sưu tập';
    }
    
    return 'Khám phá ngay';
  }

  // Hiển thị placeholder hoặc thông báo lỗi nếu cần
  if (loading) {
    return (
      <div className="banner-wrapper relative overflow-hidden bg-gradient-to-b from-pink-50 to-white py-1 md:py-6">
        <div className="container mx-auto px-4 h-[320px] md:h-[500px] flex items-center justify-center">
          <div className="animate-pulse w-full h-full rounded-lg bg-gray-200"></div>
        </div>
      </div>
    )
  }
  
  // Ghi log lỗi nhưng không hiển thị thông báo lỗi 
  if (error) {
    console.error('Lỗi khi tải banner:', error)
  }

  // Sử dụng banners từ API, không dùng banner dự phòng
  const bannersList = banners && banners.length > 0 ? banners : [];

  // Nếu không có banner nào, không hiển thị phần banner
  if (bannersList.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="banner-wrapper relative overflow-hidden bg-gradient-to-b from-pink-50 to-white py-1 md:py-6">
      {/* Decorative elements - chỉ hiển thị trên desktop và chỉ ở phía client */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating elements */}
          {decorativeElements.map((elem, i) => (
            <div 
              key={i} 
              className={`decorative-element decorative-${elem.type}`}
              style={{
                left: elem.left,
                top: elem.top,
                animationDelay: elem.delay,
                animationDuration: elem.duration || "4s",
                width: elem.size,
                height: elem.size,
                background: elem.type === 'circle' || elem.type === 'dot' ? elem.color : 'transparent'
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-0 md:px-4 relative">
        <style jsx global>{`
          .banner-wrapper {
            perspective: 1000px;
          }
          
          /* Decorative elements animations */
          .decorative-element {
            position: absolute;
            opacity: 0;
            z-index: 1;
          }
          
          .decorative-heart {
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF69B4' opacity='0.4'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E") no-repeat center/contain;
            animation: floatHeart linear infinite;
          }

          .decorative-circle {
            border-radius: 50%;
            animation: glowPulse 4s ease-in-out infinite;
          }
          
          .decorative-dot {
            border-radius: 50%;
            animation: floatDot 5s ease-in-out infinite;
          }

          @keyframes floatHeart {
            0% {
              transform: translateY(100vh) scale(0.5) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(-100px) scale(1.2) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes glowPulse {
            0%, 100% {
              transform: scale(0.8);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.4;
            }
          }
          
          @keyframes floatDot {
            0% {
              transform: translate(0, 0);
              opacity: 0;
            }
            25% {
              opacity: 1;
            }
            50% {
              transform: translate(10px, -10px);
            }
            75% {
              transform: translate(-10px, 10px);
              opacity: 1;
            }
            100% {
              transform: translate(0, 0);
              opacity: 0;
            }
          }

          /* Enhanced Swiper styles */
          .hero-swiper {
            border-radius: 0;
            transform-style: preserve-3d;
            animation: slideIn 0.8s ease-out;
          }
          
          .swiper-slide-content {
            position: absolute;
            z-index: 10;
            left: 0;
            bottom: 0;
            width: 100%;
            padding: 2rem;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
          }
          
          @media (min-width: 768px) {
            .swiper-slide-content {
              bottom: 10%;
              left: 10%;
              width: 50%;
              padding: 0;
              background: none;
            }
          }

          @keyframes slideIn {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @media (min-width: 768px) {
            .hero-swiper {
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 8px 24px rgba(0,0,0,0.08);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .hero-swiper:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 28px rgba(0,0,0,0.12);
            }
          }

          /* Pagination styles - optimized */
          .hero-swiper .swiper-pagination {
            bottom: 20px !important;
          }

          .hero-swiper .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            margin: 0 6px;
            background: white;
            opacity: 0.6;
            transition: all 0.3s ease;
          }

          .hero-swiper .swiper-pagination-bullet-active {
            opacity: 1;
            background: #FF1493;
            transform: scale(1.3);
          }

          /* Navigation buttons - optimized */
          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            color: white;
            background: rgba(0,0,0,0.15);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
          }

          .hero-swiper .swiper-button-next:hover,
          .hero-swiper .swiper-button-prev:hover {
            background: rgba(255,20,147,0.7);
            transform: scale(1.1);
          }

          .hero-swiper .swiper-button-next:after,
          .hero-swiper .swiper-button-prev:after {
            font-size: 18px;
            font-weight: bold;
          }
          
          /* Banner button styles */
          .banner-btn {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            z-index: 1;
          }
          
          .banner-btn:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: all 0.6s ease;
            z-index: -1;
          }
          
          .banner-btn:hover:before {
            left: 100%;
          }
          
          .banner-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(255,20,147,0.15);
          }
        `}</style>

        {bannersList.length > 0 ? (
          <Swiper
            spaceBetween={0}
            centeredSlides={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            parallax={true}
            navigation={true}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            modules={[Autoplay, Pagination, Navigation, EffectFade, Parallax]}
            className="hero-swiper"
            ref={swiperRef}
          >
            {bannersList.map((banner: Banner, index: number) => (
              <SwiperSlide key={banner._id} className="relative">
                {/* Desktop Image */}
                <div className="hidden md:block w-full h-[500px] relative">
                  <Image
                    src={banner.desktopImage}
                    alt={banner.alt || banner.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={index === 0}
                    data-swiper-parallax="-300"
                    quality={90}
                  />
                </div>
                
                {/* Mobile Image */}
                <div className="block md:hidden w-full h-[320px] relative">
                  <Image
                    src={banner.mobileImage}
                    alt={banner.alt || banner.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={index === 0}
                    data-swiper-parallax="-200"
                    quality={85}
                  />
                </div>
                
                {/* Content với animation */}
                <div className="swiper-slide-content">
                  {activeIndex === index && (
                    <>
                      <motion.h2 
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={textVariants}
                        className="text-2xl md:text-4xl font-bold mb-2 md:mb-4"
                      >
                        {banner.title}
                      </motion.h2>
                      
                      <motion.p 
                        custom={2}
                        initial="hidden"
                        animate="visible"
                        variants={textVariants}
                        className="text-sm md:text-lg mb-4 md:mb-6 max-w-md opacity-90"
                      >
                        {getSubtitle(banner)}
                      </motion.p>
                      
                      <motion.div
                        custom={3}
                        initial="hidden"
                        animate="visible"
                        variants={textVariants}
                      >
                        <button 
                          onClick={() => handleBannerClick(banner.href || '/shop', banner.campaignId || '')}
                          className="banner-btn bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-medium text-sm md:text-base"
                        >
                          {getButtonText(banner)}
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="w-full h-[320px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Không có banner nào để hiển thị</p>
          </div>
        )}
      </div>
    </div>
  )
}
