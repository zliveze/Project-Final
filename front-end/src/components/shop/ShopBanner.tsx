import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiTag, FiGift, FiTruck, FiPercent } from 'react-icons/fi';
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

// Fallback promotions khi có lỗi hoặc đang tải
const fallbackPromotions: DisplayPromotion[] = [
  { id: 'event1', title: 'Giảm 20%', name: 'Giảm 20%', description: 'Cho đơn hàng từ 500K', code: 'SALE20', icon: 'tag', type: 'event' },
  { id: 'event2', title: 'Freeship', name: 'Freeship', description: 'Cho đơn hàng từ 300K', code: 'FREESHIP', icon: 'truck', type: 'event' },
  { id: 'event3', title: 'Quà tặng', name: 'Quà tặng', description: 'Khi mua 2 sản phẩm', code: 'GIFT', icon: 'gift', type: 'event' }
];

// Biến để theo dõi trạng thái đang tải
let isLoadingPromotions = false;

const ShopBanner = () => {
  const eventsContext = useEvents();
  const { products } = useShopProduct();
  const [currentPromotions, setCurrentPromotions] = useState<DisplayPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Thêm API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    // Hiển thị fallback promotions ngay lập tức để tránh màn hình trống
    if (!promotionsCache) {
      setCurrentPromotions(fallbackPromotions);
    } else {
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
          : fallbackPromotions;

        // Cập nhật state và cache
        setCurrentPromotions(promotionsToDisplay);
        promotionsCache = promotionsToDisplay;
        lastCacheTimestamp = Date.now();
      } catch (err) {
        // Sử dụng fallback nếu có lỗi và chưa có cache
        if (!promotionsCache) {
          setCurrentPromotions(fallbackPromotions);
          promotionsCache = fallbackPromotions;
          lastCacheTimestamp = Date.now();
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
    if (promotion.type === 'event') {
      // Xây dựng URL với eventName và eventId nếu có
      const eventName = promotion.name || promotion.title;
      const url = new URL('/shop', window.location.origin);
      url.searchParams.append('eventName', eventName);

      if (promotion.id && promotion.id !== 'undefined') {
        url.searchParams.append('eventId', promotion.id);
      }

      console.log(`Chuyển hướng đến: ${url.toString()}`);
      router.push(url.toString());
    } else if (promotion.type === 'campaign') {
      // Sử dụng tên campaign và thêm timestamp
      const campaignName = promotion.name || promotion.title;
      const url = new URL('/shop', window.location.origin);
      url.searchParams.append('campaignName', campaignName);

      // Thêm campaignId vào URL nếu có
      if (promotion.id && promotion.id !== 'undefined') {
        url.searchParams.append('campaignId', promotion.id);
        console.log(`Đang thêm campaignId ${promotion.id} vào URL`);
      }

      console.log(`Chuyển hướng đến campaign: ${url.toString()}`);
      router.push(url.toString());
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

        {/* Danh sách sự kiện và chiến dịch */}
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
            currentPromotions.map(promotion => (
              <div
                key={`${promotion.type}-${promotion.id}`}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center relative group"
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopBanner;