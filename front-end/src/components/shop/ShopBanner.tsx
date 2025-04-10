import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiTag, FiGift, FiTruck } from 'react-icons/fi';
import { useEvents, Event } from '@/contexts/EventsContext';

// Định nghĩa kiểu dữ liệu cho sự kiện hiển thị
interface DisplayEvent {
  id: string;
  title: string;
  description: string;
  code?: string;
  icon: 'tag' | 'truck' | 'gift';
}

const ShopBanner = () => {
  const { fetchActiveEvents } = useEvents();
  const [currentEvents, setCurrentEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const activeEvents = await fetchActiveEvents();
        
        // Lọc các sự kiện có product
        const eventsWithProducts = activeEvents.filter(event => event.products && event.products.length > 0);
        
        if (eventsWithProducts.length > 0) {
          // Chuyển đổi các sự kiện thành DisplayEvent cho banner
          const displayEvents: DisplayEvent[] = eventsWithProducts.slice(0, 3).map(event => ({
            id: event._id,
            title: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
            description: `Cho ${event.products.length} sản phẩm`,
            code: event.tags && event.tags.length > 0 ? event.tags[0].toUpperCase() : undefined,
            icon: getIconForEvent(event)
          }));
          
          setCurrentEvents(displayEvents);
        } else {
          // Fallback nếu không có sự kiện
          setCurrentEvents([
            { id: 'event1', title: 'Giảm 20%', description: 'Cho đơn hàng từ 500K', code: 'SALE20', icon: 'tag' },
            { id: 'event2', title: 'Freeship', description: 'Cho đơn hàng từ 300K', code: 'FREESHIP', icon: 'truck' },
            { id: 'event3', title: 'Quà tặng', description: 'Khi mua 2 sản phẩm', code: 'GIFT', icon: 'gift' }
          ]);
        }
      } catch (err) {
        console.error('Lỗi khi tải sự kiện:', err);
        // Fallback khi có lỗi
        setCurrentEvents([
          { id: 'event1', title: 'Giảm 20%', description: 'Cho đơn hàng từ 500K', code: 'SALE20', icon: 'tag' },
          { id: 'event2', title: 'Freeship', description: 'Cho đơn hàng từ 300K', code: 'FREESHIP', icon: 'truck' },
          { id: 'event3', title: 'Quà tặng', description: 'Khi mua 2 sản phẩm', code: 'GIFT', icon: 'gift' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [fetchActiveEvents]);

  // Hàm hỗ trợ để xác định icon dựa trên event
  const getIconForEvent = (event: Event): 'tag' | 'gift' | 'truck' => {
    const title = event.title.toLowerCase();
    
    if (title.includes('gift') || title.includes('quà') || title.includes('tặng')) {
      return 'gift';
    } else if (title.includes('ship') || title.includes('vận chuyển') || title.includes('giao hàng')) {
      return 'truck';
    } else {
      return 'tag'; // Default
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#fdf2f8] to-[#f5f3ff] py-4">
      <div className="container mx-auto px-4">
        {/* Tiêu đề */}
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-1 h-5 bg-[#d53f8c] rounded mr-2"></span>
          Sự kiện đang diễn ra
        </h2>
        
        {/* Danh sách sự kiện */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            // Hiển thị skeleton loading
            Array(3).fill(null).map((_, index) => (
              <div key={`loading-${index}`} className="bg-white rounded-lg shadow-sm p-4 flex items-center animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="ml-2">
                  <div className="bg-gray-200 w-14 h-5 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            currentEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-white rounded-lg shadow-sm p-4 flex items-center relative group"
              >
                <div className="w-12 h-12 rounded-full bg-[#fdf2f8] flex items-center justify-center mr-4">
                  {event.icon === 'tag' && <FiTag className="w-6 h-6 text-[#d53f8c]" />}
                  {event.icon === 'truck' && <FiTruck className="w-6 h-6 text-[#d53f8c]" />}
                  {event.icon === 'gift' && <FiGift className="w-6 h-6 text-[#d53f8c]" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm md:text-base">{event.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm">{event.description}</p>
                </div>
                {event.code && (
                  <div className="ml-2">
                    <span className="bg-[#fdf2f8] text-[#d53f8c] text-xs font-medium px-2 py-1 rounded">
                      {event.code}
                    </span>
                  </div>
                )}
                <Link 
                  href={`/shop?eventId=${event.id}`} 
                  className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"
                >
                  <span className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white text-sm font-medium px-4 py-2 rounded shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    Xem ngay
                  </span>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopBanner; 