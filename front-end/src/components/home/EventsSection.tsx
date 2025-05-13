import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ProductCardEvent from '../common/ProductCardEvent'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { getActiveEvents } from '@/services/eventService'; // Import the service

// Cấu trúc dữ liệu sản phẩm trong sự kiện (đã được populate từ backend)
export interface PopulatedEventProduct { // Exported
  productId: string; // ID của sản phẩm gốc
  variantId?: string; // ID của biến thể (nếu có)
  adjustedPrice: number; // Giá sản phẩm trong thời gian Event
  name: string; // Tên sản phẩm (từ Product collection)
  image: string; // URL hình ảnh sản phẩm (từ Product collection)
  originalPrice: number; // Giá gốc của sản phẩm (từ Product collection)
  slug?: string; // slug của sản phẩm (từ Product collection, nếu có)
}

// Cấu trúc dữ liệu sự kiện từ API
export interface EventFromAPI { // Exported
  _id: string;
  title: string;
  description: string;
  slug: string;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  products: PopulatedEventProduct[];
}


export default function EventsSection() {
  // Sử dụng một ref riêng cho mỗi carousel nếu cần, hoặc quản lý scroll chung.
  // Để đơn giản, ta sẽ dùng chung logic scroll nhưng mỗi event sẽ có carousel riêng.
  // Tuy nhiên, việc quản lý ref động cho từng carousel sẽ phức tạp hơn.
  // Một cách tiếp cận là tạo một sub-component cho mỗi event item.

  const [activeEvents, setActiveEvents] = useState<EventFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper component cho từng Event Card để quản lý scroll riêng
  const EventItem: React.FC<{ event: EventFromAPI }> = ({ event }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      // Thêm một khoảng nhỏ (ví dụ 1px) để đảm bảo mũi tên phải ẩn chính xác khi scroll hết cỡ
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scroll = (direction: 'left' | 'right') => {
      if (!scrollContainerRef.current) return;
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (container) {
        // Kiểm tra ngay khi mount và khi event thay đổi (nếu có)
        handleScroll();
        // Cập nhật lại trạng thái mũi tên phải nếu số lượng sản phẩm thay đổi hoặc container resize
        // Đơn giản nhất là kiểm tra khi mount và khi scroll
        if (container.scrollWidth > container.clientWidth) {
            setShowRightArrow(true);
        } else {
            setShowRightArrow(false);
        }
        container.addEventListener('scroll', handleScroll);
        // Thêm ResizeObserver để theo dõi thay đổi kích thước của container
        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(container);

        return () => {
          container.removeEventListener('scroll', handleScroll);
          resizeObserver.unobserve(container);
        };
      }
    }, [event.products]); // Re-check on product changes for this specific event

    const eventProducts = event.products;
    const remainingTime = calculateRemainingTime(event.endDate);

    if (eventProducts.length === 0) return null; // Không hiển thị event nếu không có sản phẩm

    return (
      // Thay đổi container: nền trắng, bo góc lớn hơn, đổ bóng nhẹ, padding và margin dưới
      <div className="bg-white rounded-xl shadow-lg p-6 mb-10"> 
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
          {/* Left side: Title and Description */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{event.title}</h2>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
          </div>

          {/* Right side: Countdown and View All Button */}
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Countdown Timer */}
            <div className="bg-gray-100 px-3 py-2 rounded-lg shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Kết thúc sau:</span>
              <span className="text-sm font-bold text-red-600">{remainingTime}</span>
            </div>
            {/* View All Button */}
            <Link 
              href={`/shop?eventId=${event._id}`} 
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors duration-300 flex items-center shadow-md hover:shadow-lg"
            >
              Xem tất cả
              <IoChevronForward className="w-4 h-4 ml-1.5" />
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
            {eventProducts.map((product) => {
              const discount = product.originalPrice > 0 && product.adjustedPrice < product.originalPrice 
                ? Math.round(((product.originalPrice - product.adjustedPrice) / product.originalPrice) * 100)
                : 0;
              return (
                <div key={product.productId} className="flex-shrink-0 w-[220px]">
                  <ProductCardEvent
                    id={0} 
                    name={product.name}
                    image={product.image}
                    price={product.adjustedPrice}
                    oldPrice={product.originalPrice}
                    discount={discount}
                  />
                </div>
              );
            })}
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
    );
  };
  
  // Tính toán thời gian còn lại của sự kiện (có thể giữ ở ngoài nếu dùng chung)
  const calculateRemainingTime = (endDateString?: string): string => { 
    if (!endDateString) return "N/A";
    const endDate = new Date(endDateString);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Đã kết thúc";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Các hàm handleScroll và scroll đã được chuyển vào EventItem component.
  // Xóa chúng khỏi scope này để tránh lỗi.

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const eventsData = await getActiveEvents();
        if (eventsData && eventsData.length > 0) {
          setActiveEvents(eventsData.filter(event => event.products && event.products.length > 0)); // Chỉ lấy event có sản phẩm
        } else {
          setActiveEvents([]); // No active events
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Không thể tải sự kiện');
        setActiveEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (isLoading) {
    return null; 
  }

  if (error) {
    console.error("Error fetching events:", error);
    return null; 
  }

  if (activeEvents.length === 0) {
    return null; 
  }

  return (
    <section className="py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {activeEvents.map(event => (
          <EventItem key={event._id} event={event} />
        ))}
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
