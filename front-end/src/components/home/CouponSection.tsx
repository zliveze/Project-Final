import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCopy, FiCheck, FiFilter, FiTag, FiPercent, FiDollarSign, FiGift } from 'react-icons/fi';
import { RiScissorsFill } from 'react-icons/ri';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface cho Coupon
interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue: number;
  endDate: string;
  startDate: string;
  isActive?: boolean;
  usageLimit?: number;
  usedCount?: number;
}

// API URL từ environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';

// Định nghĩa các loại filter
const COUPON_FILTERS = {
  ALL: 'all',
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  NO_MINIMUM: 'no_minimum'
};

const CouponSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState(COUPON_FILTERS.ALL);
  
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch public active vouchers
  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/vouchers/public-active`); 
        if (!response.ok) {
          throw new Error(`Lỗi API: ${response.statusText}`);
        }
        const data: Coupon[] = await response.json();
        
        const now = new Date();
        const validCoupons = data.filter(coupon => {
          const endDate = new Date(coupon.endDate);
          const startDate = new Date(coupon.startDate);
          return coupon.isActive !== false &&
                 endDate >= now && 
                 startDate <= now &&
                 (coupon.usageLimit === undefined || coupon.usedCount === undefined || coupon.usedCount < coupon.usageLimit);
        });

        setAllCoupons(validCoupons);
        setFilteredCoupons(validCoupons.length > 0 ? [...validCoupons, ...validCoupons] : []);
      } catch (err: unknown) {
        console.error("Lỗi khi tải mã giảm giá:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Không thể tải danh sách mã giảm giá.');
        }
        setAllCoupons([]);
        setFilteredCoupons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, []);
  
  // Xử lý sao chép mã giảm giá
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        toast.success(`Đã sao chép mã "${code}"`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          theme: "light",
          style: { 
            background: '#fef7ff', 
            color: '#a21caf', 
            borderLeft: '3px solid #c026d3',
            borderRadius: '8px',
            fontSize: '14px'
          }
        });
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch(() => {
        toast.error('Không thể sao chép mã', {
          position: "bottom-right",
          autoClose: 2000,
          theme: "light"
        });
      });
  };

  // Xử lý lọc coupon
  useEffect(() => {
    if (isLoading) return;

    const baseCoupons = [...allCoupons];
    let filteredLogic = baseCoupons;
    
    if (activeFilter === COUPON_FILTERS.PERCENTAGE) {
      filteredLogic = baseCoupons.filter(coupon => coupon.discountType === 'percentage');
    } else if (activeFilter === COUPON_FILTERS.FIXED) {
      filteredLogic = baseCoupons.filter(coupon => coupon.discountType === 'fixed');
    } else if (activeFilter === COUPON_FILTERS.NO_MINIMUM) {
      filteredLogic = baseCoupons.filter(coupon => coupon.minimumOrderValue === 0);
    }
    
    setFilteredCoupons(filteredLogic.length > 0 ? [...filteredLogic, ...filteredLogic] : []);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [activeFilter, allCoupons, isLoading]);

  // Tự động cuộn
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || filteredCoupons.length === 0) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.08; 

    const autoScroll = (timestamp: number) => {
      if (!scrollContainer) return;
      
      if (!isPaused) {
        if (lastTimestamp) {
          const delta = timestamp - lastTimestamp;
          scrollContainer.scrollLeft += speed * delta;
          
          if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
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
    
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);
    const handleTouchStart = () => setIsPaused(true);
    const handleTouchEnd = () => setIsPaused(false);
    
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    scrollContainer.addEventListener('touchstart', handleTouchStart);
    scrollContainer.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPaused, filteredCoupons]);

  // Format giá trị giảm giá
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else {
      return `${new Intl.NumberFormat('vi-VN').format(coupon.discountValue)}đ`;
    }
  };

  // Get filter icon
  const getFilterIcon = (filter: string) => {
    switch(filter) {
      case COUPON_FILTERS.PERCENTAGE:
        return <FiPercent className="w-3 h-3" />;
      case COUPON_FILTERS.FIXED:
        return <FiDollarSign className="w-3 h-3" />;
      case COUPON_FILTERS.NO_MINIMUM:
        return <FiGift className="w-3 h-3" />;
      default:
        return <FiTag className="w-3 h-3" />;
    }
  };

  // Coupon themes
  const getCouponTheme = (index: number) => {
    const themes = [
      { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
      { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200' },
      { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200' },
      { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
      { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
    ];
    return themes[index % themes.length];
  };

  return (
    <section className="relative overflow-hidden">
      {/* Subtle background consistent with main theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-50/20 via-pink-50/15 to-rose-50/20 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-3 relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm font-medium text-rose-600 mb-3 shadow-sm border border-rose-200/50">
            <FiTag className="w-3 h-3" />
            <span>Mã giảm giá</span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            🎉 Ưu Đãi Tuyệt Vời
          </h2>
          
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Sao chép ngay để tiết kiệm cho đơn hàng của bạn
          </p>
        </div>

        {/* Filter Buttons (trái) và View All Button (phải) - Khoảng cách gọn hơn */}
        {!isLoading && !error && allCoupons.length > 0 && (
          <div className="flex items-center justify-between mb-5 gap-4">
            {/* Filter Buttons bên trái */}
            <div className="flex gap-1.5">
              {[
                { key: COUPON_FILTERS.ALL, label: 'Tất cả' },
                { key: COUPON_FILTERS.PERCENTAGE, label: 'Giảm %' },
                { key: COUPON_FILTERS.FIXED, label: 'Giảm tiền' },
                { key: COUPON_FILTERS.NO_MINIMUM, label: 'Miễn phí ship' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === filter.key
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {getFilterIcon(filter.key)}
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
            
            {/* View All Button bên phải */}
            <Link href="/coupons">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500 text-white rounded-lg font-medium text-xs hover:bg-rose-600 transition-all whitespace-nowrap">
                <FiTag className="w-3 h-3" />
                <span>Xem tất cả</span>
              </div>
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-200 border-t-rose-500"></div>
            <span className="ml-3 text-gray-600 text-sm">Đang tải ưu đãi...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-8">
            <FiFilter className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        )}
        
        {/* Empty States */}
        {!isLoading && !error && filteredCoupons.length === 0 && allCoupons.length > 0 && (
          <div className="text-center py-8">
            <FiFilter className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Không tìm thấy mã phù hợp</p>
          </div>
        )}

        {!isLoading && !error && allCoupons.length === 0 && (
          <div className="text-center py-8">
            <FiGift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Chưa có ưu đãi nào</p>
          </div>
        )}

        {/* Coupons Scroll ngang */}
        {!isLoading && !error && filteredCoupons.length > 0 && (
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto hide-scrollbar pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex space-x-3 px-1">
              {filteredCoupons.map((coupon, index) => {
                const theme = getCouponTheme(index);
                return (
                  <div 
                    key={`${coupon._id}-${index}`}
                    className="flex-shrink-0 w-[180px]"
                  >
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 h-full group hover:shadow-md transition-all duration-300">
                      {/* Header */}
                      <div className={`${theme.bg} p-3 text-white relative`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium opacity-90">
                            {coupon.discountType === 'percentage' ? 'Giảm %' : 'Giảm tiền'}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-bold mb-1">
                            {formatDiscount(coupon)}
                          </div>
                          <div className="text-xs opacity-90">
                            {coupon.minimumOrderValue > 0 
                              ? `Từ ${new Intl.NumberFormat('vi-VN').format(coupon.minimumOrderValue)}đ`
                              : 'Không giới hạn'
                            }
                          </div>
                        </div>
                        
                        {/* Cut */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-1">
                          <RiScissorsFill className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <p className="text-gray-700 text-xs mb-3 line-clamp-2 h-8">
                          {coupon.description}
                        </p>
                        
                        {/* Coupon code */}
                        <div className={`${theme.light} ${theme.border} border rounded-lg p-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Mã giảm giá</p>
                              <p className="font-mono font-bold text-xs text-gray-800 truncate">
                                {coupon.code}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className={`ml-2 p-1.5 rounded-lg text-xs transition-all ${
                                copiedCode === coupon.code
                                  ? 'bg-green-500 text-white'
                                  : `${theme.bg} text-white hover:opacity-90`
                              }`}
                            >
                              {copiedCode === coupon.code ? (
                                <FiCheck className="w-3 h-3" />
                              ) : (
                                <FiCopy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
        toastClassName="!rounded-lg !text-sm"
      />
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default CouponSection;
