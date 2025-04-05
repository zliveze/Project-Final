import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiClock, FiChevronRight, FiGift, FiTag, FiPercent } from 'react-icons/fi';

interface PromotionImage {
  url: string;
  alt: string;
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

interface PromotionBase {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: PromotionImage;
  startDate: string;
  endDate: string;
  discount?: Discount;
}

interface Event extends PromotionBase {}
interface Campaign extends PromotionBase {}

interface ProductPromotionsProps {
  events?: Event[];
  campaigns?: Campaign[];
}

const ProductPromotions: React.FC<ProductPromotionsProps> = ({ events = [], campaigns = [] }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'campaigns'>(
    events?.length > 0 ? 'events' : 'campaigns'
  );

  // Kiểm tra nếu không có khuyến mãi nào
  const hasEvents = events?.length > 0;
  const hasCampaigns = campaigns?.length > 0;
  const hasPromotions = hasEvents || hasCampaigns;

  if (!hasPromotions) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <FiGift className="mr-2 text-[#d53f8c]" />
          Khuyến mãi đang áp dụng
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-500 text-sm">Hiện không có khuyến mãi nào đang áp dụng</p>
        </div>
      </div>
    );
  }

  // Kiểm tra xem sự kiện/chiến dịch có đang diễn ra không
  const isActive = (startDate: string, endDate: string) => {
    try {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      return now >= start && now <= end;
    } catch (error) {
      return false; // Xử lý lỗi khi parse date không hợp lệ
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Tính thời gian còn lại
  const getRemainingTime = (endDate: string) => {
    try {
      const now = new Date();
      const end = new Date(endDate);
      const diffTime = end.getTime() - now.getTime();
      
      if (diffTime <= 0) return 'Đã kết thúc';
      
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `Còn ${diffDays} ngày`;
      } else {
        return `Còn ${diffHours} giờ`;
      }
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Hiển thị giảm giá
  const renderDiscount = (discount?: Discount) => {
    if (!discount) return null;
    
    return discount.type === 'percentage' 
      ? `Giảm ${discount.value}%` 
      : `Giảm ${new Intl.NumberFormat('vi-VN').format(discount.value)}đ`;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <FiGift className="mr-2 text-[#d53f8c]" />
        Khuyến mãi đang áp dụng
      </h3>

      <div>
        {/* Tab Navigation */}
        {hasEvents && hasCampaigns && (
          <div className="flex border-b border-gray-200 mb-3">
            <button
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-[#d53f8c] text-[#d53f8c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('events')}
            >
              Sự kiện
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'campaigns'
                  ? 'border-[#d53f8c] text-[#d53f8c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('campaigns')}
            >
              Chiến dịch
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-3">
          {activeTab === 'events' && hasEvents && (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <Link href={`/events/${event.slug}`} className="block">
                    <div className="flex items-start space-x-3">
                      {event.image && (
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                          <Image
                            src={event.image.url}
                            alt={event.image.alt}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-[#306E51]">
                          {event.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {event.description}
                        </p>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <FiCalendar className="mr-1 text-[#306E51]" />
                            <span>
                              {formatDate(event.startDate)} - {formatDate(event.endDate)}
                            </span>
                          </div>
                          {isActive(event.startDate, event.endDate) && (
                            <div className="flex items-center ml-3 text-xs text-gray-500">
                              <FiClock className="mr-1 text-[#306E51]" />
                              <span>{getRemainingTime(event.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {event.discount && (
                        <div className="flex-shrink-0 bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                          {renderDiscount(event.discount)}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'campaigns' && hasCampaigns && (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <Link href={`/campaigns/${campaign.slug}`} className="block">
                    <div className="flex items-start space-x-3">
                      {campaign.image && (
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                          <Image
                            src={campaign.image.url}
                            alt={campaign.image.alt}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-[#306E51]">
                          {campaign.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {campaign.description}
                        </p>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <FiCalendar className="mr-1 text-[#306E51]" />
                            <span>
                              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </span>
                          </div>
                          {isActive(campaign.startDate, campaign.endDate) && (
                            <div className="flex items-center ml-3 text-xs text-gray-500">
                              <FiClock className="mr-1 text-[#306E51]" />
                              <span>{getRemainingTime(campaign.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {campaign.discount && (
                        <div className="flex-shrink-0 bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                          {renderDiscount(campaign.discount)}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 flex items-center">
        <FiGift className="mr-1 text-gray-400" />
        <span>Khuyến mãi được áp dụng tự động khi thanh toán</span>
      </div>
    </div>
  );
};

export default ProductPromotions; 