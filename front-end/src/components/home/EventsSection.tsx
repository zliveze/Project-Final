import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ProductCardEvent from '../common/ProductCardEvent'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'

// Cấu trúc dữ liệu sản phẩm theo model Products
interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  currentPrice?: number; // Giá hiện tại (có thể thay đổi theo Event/Campaign)
  brandId: number; // Thương hiệu mỹ phẩm
  slug: string;
  status: string; // ["active", "out_of_stock", "discontinued"]
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
  };
}

// Cấu trúc dữ liệu sự kiện theo model Events
interface Event {
  id: number;
  title: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  products: EventProduct[];
}

// Cấu trúc dữ liệu sản phẩm trong sự kiện theo model Events
interface EventProduct {
  productId: number;
  variantId?: number;
  adjustedPrice: number; // Giá sản phẩm trong thời gian Event
  remainingTime?: string; // Thời gian còn lại của sự kiện
}

// Dữ liệu sự kiện hiện tại
const currentEvent: Event = {
  id: 1,
  title: "Flash Deals",
  description: "Ưu đãi giảm giá sốc trong thời gian giới hạn",
  slug: "flash-deals",
  startDate: "2023-03-15T00:00:00Z",
  endDate: "2023-03-20T23:59:59Z",
  products: [
    {
      productId: 1,
      adjustedPrice: 336000,
      remainingTime: "15:03"
    },
    {
      productId: 2,
      adjustedPrice: 208000,
      remainingTime: "15:03"
    },
    {
      productId: 3,
      adjustedPrice: 260000,
      remainingTime: "15:03"
    },
    {
      productId: 4,
      adjustedPrice: 336000,
      remainingTime: "15:03"
    },
    {
      productId: 5,
      adjustedPrice: 287000,
      remainingTime: "15:03"
    },
    {
      productId: 6,
      adjustedPrice: 336000,
      remainingTime: "15:03"
    }
  ]
}

// Dữ liệu sản phẩm
const products: Product[] = [
  {
    id: 1,
    name: "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu",
    image: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
    price: 475000,
    currentPrice: 336000,
    brandId: 1,
    slug: "sua-rua-mat-cerave",
    status: "active",
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    }
  },
  {
    id: 2,
    name: "Nước Hoa Hồng Klairs Không Mùi Cho Da Nhạy Cảm 180ml",
    image: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
    price: 435000,
    currentPrice: 208000,
    brandId: 2,
    slug: "nuoc-hoa-hong-klairs",
    status: "active",
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: true
    }
  },
  {
    id: 3,
    name: "Serum L'Oreal Sáng Da, Mờ Thâm Bright Maker",
    image: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
    price: 499000,
    currentPrice: 260000,
    brandId: 3,
    slug: "serum-loreal-sang-da-mo-tham",
    status: "active",
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    }
  },
  {
    id: 4,
    name: "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu",
    image: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
    price: 475000,
    currentPrice: 336000,
    brandId: 1,
    slug: "sua-rua-mat-cerave-2",
    status: "active",
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: true
    }
  },
  {
    id: 5,
    name: "Sữa Rửa Mặt Cetaphil Gentle Skin Cleanser",
    image: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
    price: 445000,
    currentPrice: 287000,
    brandId: 4,
    slug: "sua-rua-mat-cetaphil",
    status: "active",
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    }
  },
  {
    id: 6,
    name: "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu",
    image: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
    price: 475000,
    currentPrice: 336000,
    brandId: 1,
    slug: "sua-rua-mat-cerave-3",
    status: "active",
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: true
    }
  }
];

// Kết hợp dữ liệu sản phẩm và sự kiện để hiển thị
const getEventProducts = () => {
  return currentEvent.products.map(eventProduct => {
    const product = products.find(p => p.id === eventProduct.productId);
    if (!product) return null;
    
    const discount = Math.round(((product.price - eventProduct.adjustedPrice) / product.price) * 100);
    
    return {
      ...product,
      adjustedPrice: eventProduct.adjustedPrice,
      discount,
      remainingTime: eventProduct.remainingTime
    };
  }).filter(Boolean);
};

export default function EventsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Tính toán thời gian còn lại của sự kiện
  const calculateRemainingTime = () => {
    const endDate = new Date(currentEvent.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Đã kết thúc";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

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

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const eventProducts = getEventProducts();
  const remainingTime = calculateRemainingTime();

  return (
    <section className="py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{currentEvent.title}</h2>
              </div>
              <p className="text-sm text-gray-600 ml-11">{currentEvent.description}</p>
            </div>
            
            <div className="mt-3 sm:mt-0 flex items-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Kết thúc sau:</span>
                <span className="text-sm font-bold text-red-600">{remainingTime}</span>
              </div>
              <Link 
                href={`/shop?eventId=${currentEvent.id}`} 
                className="ml-3 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-medium hover:shadow-md transition-all duration-300 flex items-center"
              >
                Xem tất cả
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Products Carousel */}
          <div className="relative">
            {showLeftArrow && (
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
              >
                <IoChevronBack className="w-6 h-6 text-gray-600" />
              </button>
            )}
            
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {eventProducts.map((product: any) => (
                <div key={product.id} className="flex-shrink-0 w-[220px]">
                  <ProductCardEvent 
                    id={product.id}
                    name={product.name}
                    image={product.image}
                    price={product.adjustedPrice}
                    oldPrice={product.price}
                    discount={product.discount}
                    remainingTime={product.remainingTime}
                  />
                </div>
              ))}
            </div>
            
            {showRightArrow && (
              <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
              >
                <IoChevronForward className="w-6 h-6 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
