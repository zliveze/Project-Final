import React from 'react';
import Link from 'next/link';
import { FiTag, FiGift, FiTruck, FiClock } from 'react-icons/fi';

// Dữ liệu mẫu cho các sự kiện đang diễn ra
const currentEvents = [
  { id: 'event1', title: 'Giảm 20%', description: 'Cho đơn hàng từ 500K', code: 'SALE20', icon: 'tag' },
  { id: 'event2', title: 'Freeship', description: 'Cho đơn hàng từ 300K', code: 'FREESHIP', icon: 'truck' },
  { id: 'event3', title: 'Quà tặng', description: 'Khi mua 2 sản phẩm', code: 'GIFT', icon: 'gift' }
];

const ShopBanner = () => {
  return (
    <div className="bg-gradient-to-b from-[#fdf2f8] to-[#f5f3ff] py-4">
      <div className="container mx-auto px-4">
        {/* Tiêu đề */}
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-1 h-5 bg-[#d53f8c] rounded mr-2"></span>
          Sự kiện đang diễn ra
        </h2>
        
        {/* Danh sách sự kiện */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {currentEvents.map(event => (
            <div 
              key={event.id} 
              className="bg-white rounded-lg shadow-sm p-4 flex items-center"
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
              <div className="ml-2">
                <span className="bg-[#fdf2f8] text-[#d53f8c] text-xs font-medium px-2 py-1 rounded">
                  {event.code}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Thông báo Flash Sale */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#fdf2f8] flex items-center justify-center mr-3">
              <FiClock className="w-5 h-5 text-[#d53f8c]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm md:text-base">Flash Sale - Kết thúc trong</h3>
              <div className="flex items-center mt-1">
                <div className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white text-xs md:text-sm font-bold w-8 h-8 flex items-center justify-center rounded">12</div>
                <span className="mx-1 text-gray-500">:</span>
                <div className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white text-xs md:text-sm font-bold w-8 h-8 flex items-center justify-center rounded">45</div>
                <span className="mx-1 text-gray-500">:</span>
                <div className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white text-xs md:text-sm font-bold w-8 h-8 flex items-center justify-center rounded">30</div>
              </div>
            </div>
            <Link href="/shop?promotion=flash-sale" className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1] text-white text-xs md:text-sm px-3 py-2 rounded transition-colors">
              Xem ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopBanner; 