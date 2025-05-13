import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
// Comment out or remove unused social media icons if not present in API data
// import { FaFacebook, FaInstagram, FaYoutube, FaGlobe } from 'react-icons/fa'; 
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useBrands, Brand } from '@/contexts/user/brands/BrandContext';

export default function BrandSection() {
  const { 
    brands: activeBrands, 
    featuredBrands, 
    loading, 
    error 
  } = useBrands();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { clientWidth } = scrollContainerRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    // Ensure activeBrands is not null or undefined before checking its length
    if (!scrollContainer || !activeBrands || activeBrands.length === 0) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.05; 

    const autoScroll = (timestamp: number) => {
      if (!scrollContainer) return;
      if (!isPaused) {
        if (lastTimestamp) {
          const delta = timestamp - lastTimestamp;
          scrollContainer.scrollLeft += speed * delta;
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

    const pauseScroll = () => setIsPaused(true);
    const resumeScroll = () => setIsPaused(false);

    scrollContainer.addEventListener('mouseenter', pauseScroll);
    scrollContainer.addEventListener('mouseleave', resumeScroll);
    scrollContainer.addEventListener('touchstart', pauseScroll, { passive: true });
    scrollContainer.addEventListener('touchend', resumeScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener('mouseenter', pauseScroll);
      scrollContainer.removeEventListener('mouseleave', resumeScroll);
      scrollContainer.removeEventListener('touchstart', pauseScroll);
      scrollContainer.removeEventListener('touchend', resumeScroll);
    };
  }, [isPaused, activeBrands]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      handleScroll(); 
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [activeBrands]); 

  // Ensure activeBrands is not null or undefined before spreading
  const repeatedBrands = activeBrands && activeBrands.length > 0 ? [...activeBrands, ...activeBrands] : [];

  if (loading) {
    return (
      <section className="py-10 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <p className="text-gray-600">Đang tải danh sách thương hiệu...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <p className="text-red-600">Lỗi: {error}</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4">
        {featuredBrands && featuredBrands.length > 0 && (
          <>
            <div className="flex flex-col items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Thương Hiệu Nổi Bật</h2>
              <p className="text-gray-600 text-center max-w-2xl">Khám phá các thương hiệu mỹ phẩm hàng đầu với sản phẩm chất lượng và uy tín trên toàn thế giới</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
              {featuredBrands.map((brand: Brand) => (
                <div key={brand.id} className="bg-white rounded-xl p-4 flex flex-col items-center justify-between h-full shadow-sm hover:shadow-md transition-shadow group">
                  <div className="w-full h-24 relative flex items-center justify-center mb-3">
                    <a href={`/brands/${brand.slug}`} className="block w-full h-full flex items-center justify-center">
                      {brand.logo?.url ? (
                        <Image 
                          src={brand.logo.url} 
                          alt={brand.logo.alt || brand.name}
                          width={120}
                          height={60}
                          className="object-contain max-h-full transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                          No Logo
                        </div>
                      )}
                    </a>
                  </div>
                  
                  <div className="text-center w-full">
                    <a href={`/brands/${brand.slug}`} className="block">
                      <h3 className="font-medium text-gray-800 mb-1 truncate" title={brand.name}>{brand.name}</h3>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {activeBrands && activeBrands.length > 0 && (
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
              {showLeftArrow && activeBrands && activeBrands.length > 5 && ( 
                <button 
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  aria-label="Scroll left"
                >
                  <IoChevronBack size={24} className="text-gray-700" />
                </button>
              )}
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar auto-scroll-container"
              >
                {repeatedBrands.map((brand: Brand, index: number) => ( 
                  <div key={`${brand.id}-${index}`} className="flex-shrink-0 w-[180px]">
                    <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col items-center">
                      <a href={`/brands/${brand.slug}`} className="block w-full">
                        <div className="w-full h-16 flex items-center justify-center mb-3">
                          {brand.logo?.url ? (
                            <Image 
                              src={brand.logo.url} 
                              alt={brand.logo.alt || brand.name}
                              width={100}
                              height={50}
                              className="object-contain max-h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                              No Logo
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h4 className="font-medium text-sm text-gray-800 mb-1 truncate" title={brand.name}>{brand.name}</h4>
                        </div>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {showRightArrow && activeBrands && activeBrands.length > 5 && ( 
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  aria-label="Scroll right"
                >
                  <IoChevronForward size={24} className="text-gray-700" />
                </button>
              )}
            </div>
          </div>
        )}

        {(!featuredBrands || featuredBrands.length === 0) && (!activeBrands || activeBrands.length === 0) && !loading && (
           <div className="text-center py-10">
             <p className="text-gray-600">Hiện chưa có thương hiệu nào.</p>
           </div>
        )}
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .auto-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
