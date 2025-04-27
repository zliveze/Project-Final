import React, { useEffect, useState } from 'react';
import { FiTag, FiGift, FiTruck, FiPercent, FiCalendar } from 'react-icons/fi';
import { useEvents, Event } from '@/contexts/EventsContext';
import { useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { useRouter } from 'next/router';
import axios from 'axios';

// Định nghĩa kiểu dữ liệu cho sự kiện hiển thị
interface DisplayPromotion {
  id: string;
  title: string;
  description: string;
  code?: string;
  icon: 'tag' | 'truck' | 'gift' | 'percent';
  type: 'event' | 'campaign';
  name?: string; // Thêm trường name để lưu tên đầy đủ (không bị cắt)
}

// Định nghĩa interface cho Campaign từ API
interface ApiCampaign {
  _id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  products: Array<{
    productId: string;
    productName?: string;
    originalPrice?: number;
    adjustedPrice: number;
    image?: string;
  }>;
}

// Cache cho promotions để tránh nhiều lần gọi API
let promotionsCache: DisplayPromotion[] | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL = 600000; // Tăng lên 10 phút cache

// Không sử dụng dữ liệu mẫu nữa

// Biến để theo dõi trạng thái đang tải
let isLoadingPromotions = false;

const ShopBanner = () => {
  const eventsContext = useEvents();
  const { } = useShopProduct(); // Giữ context hook nhưng không sử dụng products
  const [currentPromotions, setCurrentPromotions] = useState<DisplayPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Thêm API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    // Kiểm tra cache trước khi tải dữ liệu mới
    if (promotionsCache) {
      setCurrentPromotions(promotionsCache);
      setLoading(false);
    }

    // Hàm tải dữ liệu thực tế
    const loadPromotions = async () => {
      // Tránh gọi API nếu đã có cache hoặc đang tải
      if ((promotionsCache && (Date.now() - lastCacheTimestamp < CACHE_TTL)) || isLoadingPromotions) {
        setLoading(false);
        return;
      }

      // Đánh dấu đang tải
      isLoadingPromotions = true;
      setLoading(true);

      try {
        // Tải song song cả events và campaigns
        const [eventsData, campaignsData] = await Promise.allSettled([
          // Lấy events
          eventsContext && typeof eventsContext.fetchActiveEvents === 'function'
            ? eventsContext.fetchActiveEvents()
            : Promise.resolve([]),
          // Lấy campaigns
          axios.get(`${API_URL}/campaigns/active`).then(res => res.data).catch(() => [])
        ]);

        // Xử lý kết quả events
        let displayEvents: DisplayPromotion[] = [];
        if (eventsData.status === 'fulfilled' && Array.isArray(eventsData.value)) {
          displayEvents = eventsData.value.map(event => ({
            id: event._id,
            title: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
            name: event.title,
            description: event.products.length > 0
              ? `Cho ${event.products.length} sản phẩm`
              : event.description || 'Sự kiện đặc biệt',
            code: event.tags && event.tags.length > 0 ? event.tags[0].toUpperCase() : undefined,
            icon: getIconForEvent(event),
            type: 'event'
          }));
        }

        // Xử lý kết quả campaigns
        let displayCampaigns: DisplayPromotion[] = [];
        if (campaignsData.status === 'fulfilled' && Array.isArray(campaignsData.value)) {
          displayCampaigns = campaignsData.value.map((campaign: ApiCampaign) => ({
            id: campaign._id,
            title: campaign.title.length > 20 ? campaign.title.substring(0, 20) + '...' : campaign.title,
            name: campaign.title,
            description: campaign.products.length > 0
              ? `Cho ${campaign.products.length} sản phẩm`
              : campaign.description || 'Khuyến mãi đặc biệt',
            icon: 'percent',
            type: 'campaign'
          }));
        }

        // Kết hợp và lấy tối đa 3 promotions
        const allPromotions = [...displayEvents, ...displayCampaigns];
        const promotionsToDisplay = allPromotions.length > 0
          ? allPromotions.slice(0, 3)
          : [];

        // Cập nhật state và cache
        setCurrentPromotions(promotionsToDisplay);
        promotionsCache = promotionsToDisplay;
        lastCacheTimestamp = Date.now();
      } catch (err) {
        // Xử lý lỗi nhưng không hiển thị dữ liệu mẫu
        console.error('Lỗi khi tải dữ liệu khuyến mãi:', err);
        // Nếu không có cache, hiển thị mảng rỗng
        if (!promotionsCache) {
          setCurrentPromotions([]);
        }
      } finally {
        setLoading(false);
        isLoadingPromotions = false;
      }
    };

    // Gọi hàm tải dữ liệu sau khi render
    setTimeout(loadPromotions, 100);
  }, [eventsContext, API_URL]);

  // Hàm hỗ trợ để xác định icon dựa trên event
  const getIconForEvent = (event: Event): 'tag' | 'gift' | 'truck' | 'percent' => {
    const title = event.title.toLowerCase();

    if (title.includes('gift') || title.includes('quà') || title.includes('tặng')) {
      return 'gift';
    } else if (title.includes('ship') || title.includes('vận chuyển') || title.includes('giao hàng')) {
      return 'truck';
    } else {
      return 'tag'; // Default
    }
  };

  // Xử lý khi click vào promotion
  const handlePromotionClick = (promotion: DisplayPromotion) => {
    // Kiểm tra ID hợp lệ (MongoDB ObjectId phải là chuỗi 24 ký tự hex)
    const isValidMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    if (!promotion.id || !isValidMongoId(promotion.id)) {
      console.error('ID không hợp lệ:', promotion.id);
      return;
    }

    if (promotion.type === 'event') {
      // Xây dựng URL chỉ với eventId, không thêm các tham số khác
      const url = new URL('/shop', window.location.origin);

      // Chỉ thêm eventId vào URL nếu là ID MongoDB hợp lệ
      url.searchParams.append('eventId', promotion.id);
      console.log(`Chuyển hướng đến sự kiện: ${url.toString()}`);
      router.push(url.toString());
    } else if (promotion.type === 'campaign') {
      // Xây dựng URL chỉ với campaignId, không thêm các tham số khác
      const url = new URL('/shop', window.location.origin);

      // Chỉ thêm campaignId vào URL nếu là ID MongoDB hợp lệ
      url.searchParams.append('campaignId', promotion.id);
      console.log(`Chuyển hướng đến chiến dịch: ${url.toString()}`);
      router.push(url.toString());
    }
  };

  // Lọc promotions theo loại
  const eventPromotions = currentPromotions.filter(promo => promo.type === 'event');
  const campaignPromotions = currentPromotions.filter(promo => promo.type === 'campaign');

  // State để theo dõi tab đang active
  const [activeTab, setActiveTab] = useState<'events' | 'campaigns'>('events');

  // Tạo skeleton loading cho mỗi tab
  const renderSkeletonLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array(3).fill(null).map((_, index) => (
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
      ))}
    </div>
  );

  // Render promotion card
  const renderPromotionCard = (promotion: DisplayPromotion) => (
    <div
      key={`${promotion.type}-${promotion.id}`}
      className="bg-white rounded-lg shadow-sm p-4 flex items-center relative group hover:shadow-md transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-full bg-[#fdf2f8] flex items-center justify-center mr-4">
        {promotion.icon === 'tag' && <FiTag className="w-6 h-6 text-[#d53f8c]" />}
        {promotion.icon === 'truck' && <FiTruck className="w-6 h-6 text-[#d53f8c]" />}
        {promotion.icon === 'gift' && <FiGift className="w-6 h-6 text-[#d53f8c]" />}
        {promotion.icon === 'percent' && <FiPercent className="w-6 h-6 text-[#d53f8c]" />}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm md:text-base">{promotion.title}</h3>
        <p className="text-gray-600 text-xs md:text-sm">{promotion.description}</p>
      </div>
      {promotion.code && (
        <div className="ml-2">
          <span className="bg-[#fdf2f8] text-[#d53f8c] text-xs font-medium px-2 py-1 rounded">
            {promotion.code}
          </span>
        </div>
      )}
      <div
        onClick={() => handlePromotionClick(promotion)}
        className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg cursor-pointer"
      >
        <span className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white text-sm font-medium px-4 py-2 rounded shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-300">
          Xem ngay
        </span>
      </div>
    </div>
  );

  // Render tab content
  const renderTabContent = (promotions: DisplayPromotion[]) => {
    if (loading) {
      return renderSkeletonLoading();
    }

    if (promotions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Không có {activeTab === 'events' ? 'sự kiện' : 'chiến dịch'} nào đang diễn ra
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promotions.map(promotion => renderPromotionCard(promotion))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Tiêu đề */}
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-1 h-5 bg-[#d53f8c] rounded mr-2"></span>
          Khuyến mãi & Sự kiện
        </h2>

        {/* Tab Interface */}
        <div className="mb-4">
          <div className="flex space-x-2 rounded-xl bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('events')}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                ${activeTab === 'events'
                  ? 'bg-[#fdf2f8] text-[#d53f8c] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <FiCalendar className="w-4 h-4" />
                <span>Sự kiện ({eventPromotions.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                ${activeTab === 'campaigns'
                  ? 'bg-[#fdf2f8] text-[#d53f8c] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <FiPercent className="w-4 h-4" />
                <span>Chiến dịch ({campaignPromotions.length})</span>
              </div>
            </button>
          </div>

          <div className="mt-2">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              {activeTab === 'events'
                ? renderTabContent(eventPromotions)
                : renderTabContent(campaignPromotions)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopBanner;