import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
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
  name?: string;
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

// Optimized cache với Map
const promotionsCache = new Map<string, { timestamp: number; data: DisplayPromotion[] }>();
const CACHE_TTL = 300000; // 5 phút cache

// Singleton pattern cho loading state
class LoadingManager {
  private static instance: LoadingManager;
  private isLoading = false;

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  getLoading(): boolean {
    return this.isLoading;
  }
}

const loadingManager = LoadingManager.getInstance();

// Memoized PromotionCard component
const PromotionCard = memo<{
  promotion: DisplayPromotion;
  onPromotionClick: (promotion: DisplayPromotion) => void;
}>(({ promotion, onPromotionClick }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 flex items-center relative group hover:shadow-md transition-all duration-300">
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
      onClick={() => onPromotionClick(promotion)}
      className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg cursor-pointer"
    >
      <span className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white text-sm font-medium px-4 py-2 rounded shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-300">
        Xem ngay
      </span>
    </div>
  </div>
));

PromotionCard.displayName = 'PromotionCard';

// Memoized SkeletonCard component
const SkeletonCard = memo(() => (
  <div className="bg-white rounded-lg shadow-sm p-4 flex items-center animate-pulse">
    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="ml-2">
      <div className="bg-gray-200 w-14 h-5 rounded"></div>
    </div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

const ShopBanner = () => {
  const eventsContext = useEvents();
  const { } = useShopProduct(); // Giữ context hook nhưng không sử dụng products
  const [currentPromotions, setCurrentPromotions] = useState<DisplayPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'campaigns'>('events');
  const router = useRouter();

  // API URL với memoization
  const API_URL = useMemo(() => 
    process.env.NEXT_PUBLIC_API_URL || 'http://backendyumin.vercel.app/api', []
  );

  // Memoized hàm xác định icon
  const getIconForEvent = useCallback((event: Event): 'tag' | 'gift' | 'truck' | 'percent' => {
    const title = event.title.toLowerCase();

    if (title.includes('gift') || title.includes('quà') || title.includes('tặng')) {
      return 'gift';
    } else if (title.includes('ship') || title.includes('vận chuyển') || title.includes('giao hàng')) {
      return 'truck';
    } else {
      return 'tag';
    }
  }, []);

  // Memoized hàm kiểm tra ID hợp lệ
  const isValidMongoId = useCallback((id: string) => /^[0-9a-fA-F]{24}$/.test(id), []);

  // Optimized data loading function
  const loadPromotions = useCallback(async () => {
    // Kiểm tra cache trước
    const cached = promotionsCache.get('promotions');
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      setCurrentPromotions(cached.data);
      setLoading(false);
      return;
    }

    // Kiểm tra loading state để tránh duplicate calls
    if (loadingManager.getLoading()) {
      return;
    }

    loadingManager.setLoading(true);
    setLoading(true);

    try {
      // Load events và campaigns song song với timeout
      const [eventsResult, campaignsResult] = await Promise.allSettled([
        Promise.race([
          eventsContext && typeof eventsContext.fetchActiveEvents === 'function'
            ? eventsContext.fetchActiveEvents()
            : Promise.resolve([]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Events timeout')), 5000))
        ]),
        Promise.race([
          axios.get(`${API_URL}/campaigns/active`).then(res => res.data).catch(() => []),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Campaigns timeout')), 5000))
        ])
      ]);

      // Xử lý events
      let displayEvents: DisplayPromotion[] = [];
      if (eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value)) {
        displayEvents = eventsResult.value.map(event => ({
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

      // Xử lý campaigns
      let displayCampaigns: DisplayPromotion[] = [];
      if (campaignsResult.status === 'fulfilled' && Array.isArray(campaignsResult.value)) {
        displayCampaigns = campaignsResult.value.map((campaign: ApiCampaign) => ({
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

      const allPromotions = [...displayEvents, ...displayCampaigns];
      const promotionsToDisplay = allPromotions.slice(0, 3);

      // Cache kết quả
      promotionsCache.set('promotions', {
        timestamp: Date.now(),
        data: promotionsToDisplay
      });

      // Giới hạn cache size
      if (promotionsCache.size > 10) {
        const firstKey = promotionsCache.keys().next().value;
        if (firstKey) {
          promotionsCache.delete(firstKey);
        }
      }

      setCurrentPromotions(promotionsToDisplay);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu khuyến mãi:', err);
      if (!promotionsCache.has('promotions')) {
        setCurrentPromotions([]);
      }
    } finally {
      setLoading(false);
      loadingManager.setLoading(false);
    }
  }, [eventsContext, API_URL, getIconForEvent]);

  // Optimized promotion click handler
  const handlePromotionClick = useCallback((promotion: DisplayPromotion) => {
    if (!promotion.id || !isValidMongoId(promotion.id)) {
      console.error('ID không hợp lệ:', promotion.id);
      return;
    }

    const url = new URL('/shop', window.location.origin);
    
    if (promotion.type === 'event') {
      url.searchParams.append('eventId', promotion.id);
    } else if (promotion.type === 'campaign') {
      url.searchParams.append('campaignId', promotion.id);
    }
    
    router.push(url.toString());
  }, [router, isValidMongoId]);

  // Load promotions on mount và khi dependencies thay đổi
  useEffect(() => {
    const timer = setTimeout(loadPromotions, 100);
    return () => clearTimeout(timer);
  }, [loadPromotions]);

  // Memoized filtered promotions
  const { eventPromotions, campaignPromotions } = useMemo(() => ({
    eventPromotions: currentPromotions.filter(promo => promo.type === 'event'),
    campaignPromotions: currentPromotions.filter(promo => promo.type === 'campaign')
  }), [currentPromotions]);

  // Memoized skeleton loading
  const renderSkeletonLoading = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array(3).fill(null).map((_, index) => (
        <SkeletonCard key={`loading-${index}`} />
      ))}
    </div>
  ), []);

  // Memoized tab content renderer
  const renderTabContent = useCallback((promotions: DisplayPromotion[]) => {
    if (loading) {
      return renderSkeletonLoading;
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
        {promotions.map(promotion => (
          <PromotionCard
            key={`${promotion.type}-${promotion.id}`}
            promotion={promotion}
            onPromotionClick={handlePromotionClick}
          />
        ))}
      </div>
    );
  }, [loading, activeTab, renderSkeletonLoading, handlePromotionClick]);

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

export default memo(ShopBanner);