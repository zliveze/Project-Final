import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { FaFacebook, FaInstagram, FaYoutube, FaGlobe } from 'react-icons/fa'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'

// Cấu trúc dữ liệu thương hiệu theo model Brands
interface Brand {
  id: number;
  name: string;
  description: string;
  logo: {
    url: string;
    alt: string;
  };
  origin: string;
  website: string;
  featured: boolean;
  status: string; // ["active", "inactive"]
  socialMedia: {
    facebook: string;
    instagram: string;
    youtube: string;
  };
  slug: string;
}

// Dữ liệu thương hiệu
const brands: Brand[] = [
  {
    id: 1,
    name: "L'Oréal Paris",
    description: "Thương hiệu mỹ phẩm hàng đầu thế giới với các sản phẩm chăm sóc da, trang điểm và chăm sóc tóc",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/L%27Or%C3%A9al_logo.svg/1200px-L%27Or%C3%A9al_logo.svg.png",
      alt: "L'Oréal Paris Logo"
    },
    origin: "Pháp",
    website: "https://www.loreal-paris.com.vn/",
    featured: true,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/LOrealParisVietnam",
      instagram: "https://www.instagram.com/lorealparis",
      youtube: "https://www.youtube.com/user/LOrealParisVietnam"
    },
    slug: "loreal-paris"
  },
  {
    id: 2,
    name: "Maybelline",
    description: "Thương hiệu mỹ phẩm bình dân nổi tiếng với các sản phẩm trang điểm chất lượng cao",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Maybelline_Logo.svg/2560px-Maybelline_Logo.svg.png",
      alt: "Maybelline Logo"
    },
    origin: "Mỹ",
    website: "https://www.maybelline.com.vn/",
    featured: true,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/maybellinevietnam",
      instagram: "https://www.instagram.com/maybelline",
      youtube: "https://www.youtube.com/user/maybelline"
    },
    slug: "maybelline"
  },
  {
    id: 3,
    name: "Estée Lauder",
    description: "Thương hiệu mỹ phẩm cao cấp chuyên về các sản phẩm chăm sóc da và nước hoa",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Est%C3%A9e_Lauder_logo.svg/2560px-Est%C3%A9e_Lauder_logo.svg.png",
      alt: "Estée Lauder Logo"
    },
    origin: "Mỹ",
    website: "https://www.esteelauder.com/",
    featured: true,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/esteelauder",
      instagram: "https://www.instagram.com/esteelauder",
      youtube: "https://www.youtube.com/user/esteelauder"
    },
    slug: "estee-lauder"
  },
  {
    id: 4,
    name: "MAC Cosmetics",
    description: "Thương hiệu trang điểm chuyên nghiệp được ưa chuộng bởi các chuyên gia makeup",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/MAC_Cosmetics_logo.svg/2560px-MAC_Cosmetics_logo.svg.png",
      alt: "MAC Cosmetics Logo"
    },
    origin: "Canada",
    website: "https://www.maccosmetics.com/",
    featured: true,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/MACcosmetics",
      instagram: "https://www.instagram.com/maccosmetics",
      youtube: "https://www.youtube.com/user/MACcosmetics"
    },
    slug: "mac-cosmetics"
  },
  {
    id: 5,
    name: "Lancôme",
    description: "Thương hiệu mỹ phẩm cao cấp của Pháp với các sản phẩm chăm sóc da và nước hoa sang trọng",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Lanc%C3%B4me_logo.svg/2560px-Lanc%C3%B4me_logo.svg.png",
      alt: "Lancôme Logo"
    },
    origin: "Pháp",
    website: "https://www.lancome.com/",
    featured: true,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/lancome",
      instagram: "https://www.instagram.com/lancomeofficial",
      youtube: "https://www.youtube.com/user/lancome"
    },
    slug: "lancome"
  },
  {
    id: 6,
    name: "Innisfree",
    description: "Thương hiệu mỹ phẩm thiên nhiên từ Hàn Quốc với các thành phần từ đảo Jeju",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Innisfree_logo.svg/2560px-Innisfree_logo.svg.png",
      alt: "Innisfree Logo"
    },
    origin: "Hàn Quốc",
    website: "https://www.innisfree.com/vn/vi/",
    featured: true,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/innisfreevietnam",
      instagram: "https://www.instagram.com/innisfreeofficial",
      youtube: "https://www.youtube.com/user/innisfreeofficial"
    },
    slug: "innisfree"
  },
  {
    id: 7,
    name: "The Ordinary",
    description: "Thương hiệu mỹ phẩm nổi tiếng với các sản phẩm đơn thành phần hiệu quả và giá cả phải chăng",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/The_Ordinary_logo.svg/2560px-The_Ordinary_logo.svg.png",
      alt: "The Ordinary Logo"
    },
    origin: "Canada",
    website: "https://theordinary.com/",
    featured: false,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/deciem",
      instagram: "https://www.instagram.com/theordinary",
      youtube: "https://www.youtube.com/channel/UC_joVNRgT4CguLrsDnbIfhw"
    },
    slug: "the-ordinary"
  },
  {
    id: 8,
    name: "Laneige",
    description: "Thương hiệu mỹ phẩm Hàn Quốc chuyên về các sản phẩm dưỡng ẩm và chăm sóc da",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Laneige_logo.svg/2560px-Laneige_logo.svg.png",
      alt: "Laneige Logo"
    },
    origin: "Hàn Quốc",
    website: "https://www.laneige.com/",
    featured: false,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/laneige.global",
      instagram: "https://www.instagram.com/laneige_us",
      youtube: "https://www.youtube.com/user/laneigeglobal"
    },
    slug: "laneige"
  },
  {
    id: 9,
    name: "COSRX",
    description: "Thương hiệu mỹ phẩm Hàn Quốc chuyên về các sản phẩm chăm sóc da cho da mụn và nhạy cảm",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/COSRX_logo.svg/2560px-COSRX_logo.svg.png",
      alt: "COSRX Logo"
    },
    origin: "Hàn Quốc",
    website: "https://www.cosrx.com/",
    featured: false,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/cosrx",
      instagram: "https://www.instagram.com/cosrx",
      youtube: "https://www.youtube.com/channel/UCnTE8-9R4f3u4OMA1Kv_zFQ"
    },
    slug: "cosrx"
  },
  {
    id: 10,
    name: "Kiehl's",
    description: "Thương hiệu mỹ phẩm lâu đời của Mỹ với các sản phẩm chăm sóc da từ thành phần tự nhiên",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Kiehl%27s_logo.svg/2560px-Kiehl%27s_logo.svg.png",
      alt: "Kiehl's Logo"
    },
    origin: "Mỹ",
    website: "https://www.kiehls.com/",
    featured: false,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/kiehls",
      instagram: "https://www.instagram.com/kiehls",
      youtube: "https://www.youtube.com/user/kiehls"
    },
    slug: "kiehls"
  },
  {
    id: 11,
    name: "Clinique",
    description: "Thương hiệu mỹ phẩm cao cấp chuyên về các sản phẩm không gây dị ứng và được kiểm nghiệm bởi bác sĩ da liễu",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Clinique_logo.svg/2560px-Clinique_logo.svg.png",
      alt: "Clinique Logo"
    },
    origin: "Mỹ",
    website: "https://www.clinique.com/",
    featured: false,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/clinique",
      instagram: "https://www.instagram.com/clinique",
      youtube: "https://www.youtube.com/user/clinique"
    },
    slug: "clinique"
  },
  {
    id: 12,
    name: "Neutrogena",
    description: "Thương hiệu mỹ phẩm được khuyên dùng bởi các bác sĩ da liễu với các sản phẩm chăm sóc da lành tính",
    logo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Neutrogena_logo.svg/2560px-Neutrogena_logo.svg.png",
      alt: "Neutrogena Logo"
    },
    origin: "Mỹ",
    website: "https://www.neutrogena.com/",
    featured: false,
    status: "active",
    socialMedia: {
      facebook: "https://www.facebook.com/neutrogena",
      instagram: "https://www.instagram.com/neutrogena",
      youtube: "https://www.youtube.com/user/neutrogena"
    },
    slug: "neutrogena"
  }
];

// Lọc các thương hiệu nổi bật
const featuredBrands = brands.filter(brand => brand.featured && brand.status === "active");
// Lọc tất cả các thương hiệu đang hoạt động
const activeBrands = brands.filter(brand => brand.status === "active");

export default function BrandSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const { clientWidth } = scrollContainerRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
    
    scrollContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Tự động cuộn
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.1; // Tốc độ cuộn (pixel/ms)

    const autoScroll = (timestamp: number) => {
      if (!scrollContainer) return;
      
      if (!isPaused) {
        if (lastTimestamp) {
          const delta = timestamp - lastTimestamp;
          scrollContainer.scrollLeft += speed * delta;
          
          // Nếu đã cuộn đến cuối, quay lại đầu
          if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
            scrollContainer.scrollLeft = 0;
          }
        }
        
        lastTimestamp = timestamp;
      } else {
        lastTimestamp = 0;
      }
      
      animationFrameId = requestAnimationFrame(autoScroll);
    };
    
    animationFrameId = requestAnimationFrame(autoScroll);
    
    // Dừng cuộn khi hover
    scrollContainer.addEventListener('mouseenter', () => setIsPaused(true));
    scrollContainer.addEventListener('mouseleave', () => setIsPaused(false));
    scrollContainer.addEventListener('touchstart', () => setIsPaused(true));
    scrollContainer.addEventListener('touchend', () => setIsPaused(false));
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener('mouseenter', () => setIsPaused(true));
      scrollContainer.removeEventListener('mouseleave', () => setIsPaused(false));
      scrollContainer.removeEventListener('touchstart', () => setIsPaused(true));
      scrollContainer.removeEventListener('touchend', () => setIsPaused(false));
    };
  }, [isPaused]);

  // Theo dõi sự kiện cuộn
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Tạo mảng thương hiệu lặp lại để tạo hiệu ứng vô hạn
  const repeatedBrands = [...activeBrands, ...activeBrands];

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thương Hiệu Nổi Bật</h2>
          <p className="text-gray-600 text-center max-w-2xl">Khám phá các thương hiệu mỹ phẩm hàng đầu với sản phẩm chất lượng và uy tín trên toàn thế giới</p>
        </div>
        
        {/* Thương hiệu nổi bật */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          {featuredBrands.map((brand) => (
            <div key={brand.id} className="bg-white rounded-xl p-4 flex flex-col items-center justify-between h-full shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-full h-24 relative flex items-center justify-center mb-3">
                <a href={`/brands/${brand.slug}`} className="block w-full h-full flex items-center justify-center">
                  <Image 
                    src={brand.logo.url} 
                    alt={brand.logo.alt}
                    width={120}
                    height={60}
                    className="object-contain max-h-full transition-transform group-hover:scale-105"
                  />
                </a>
              </div>
              
              <div className="text-center w-full">
                <a href={`/brands/${brand.slug}`} className="block">
                  <h3 className="font-medium text-gray-800 mb-1">{brand.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{brand.origin}</p>
                </a>
                
                <div className="flex justify-center gap-2 mt-2">
                  {brand.socialMedia.facebook && (
                    <a href={brand.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                      <FaFacebook size={16} />
                    </a>
                  )}
                  {brand.socialMedia.instagram && (
                    <a href={brand.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600">
                      <FaInstagram size={16} />
                    </a>
                  )}
                  {brand.website && (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-600">
                      <FaGlobe size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Tất cả thương hiệu - Băng chuyền tự động */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Tất Cả Thương Hiệu</h3>
            <a href="/brands" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center">
              Xem tất cả
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          <div className="relative overflow-hidden">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar auto-scroll-container"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {repeatedBrands.map((brand, index) => (
                <div key={`${brand.id}-${index}`} className="flex-shrink-0 w-[180px]">
                  <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col items-center">
                    <a href={`/brands/${brand.slug}`} className="block w-full">
                      <div className="w-full h-16 flex items-center justify-center mb-3">
                        <Image 
                          src={brand.logo.url} 
                          alt={brand.logo.alt}
                          width={100}
                          height={50}
                          className="object-contain max-h-full"
                        />
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-sm text-gray-800 mb-1">{brand.name}</h4>
                        <p className="text-xs text-gray-500">{brand.origin}</p>
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .auto-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </section>
  )
}
