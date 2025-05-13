import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCopy, FiCheck, FiFilter } from 'react-icons/fi';
import { RiScissorsFill } from 'react-icons/ri';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

// Interface cho Coupon, khớp với dữ liệu từ Voucher schema của backend
interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed'; // Đảm bảo kiểu dữ liệu khớp
  discountValue: number;
  minimumOrderValue: number;
  endDate: string; // Backend sẽ trả về Date dưới dạng string ISO
  startDate: string;
  isActive?: boolean; // Thêm isActive để có thể lọc
  usageLimit?: number;
  usedCount?: number;
}

// API URL từ environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]); // State để lưu tất cả coupon từ API
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]); // State cho coupon đã lọc và lặp lại
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch public active vouchers
  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Giả định endpoint là /vouchers/public-active để lấy các voucher công khai, đang hoạt động
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
        // Lặp lại mảng đã lọc để tạo hiệu ứng cuộn vô hạn, chỉ khi có coupons
        setFilteredCoupons(validCoupons.length > 0 ? [...validCoupons, ...validCoupons] : []);
      } catch (err: any) {
        console.error("Lỗi khi tải mã giảm giá:", err);
        setError(err.message || 'Không thể tải danh sách mã giảm giá.');
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
        toast.success(`Đã sao chép mã "${code}" vào clipboard`, {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
        });
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch(error => {
        toast.error('Không thể sao chép mã. Vui lòng thử lại.', {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light"
        });
      });
  };

  // Xử lý lọc coupon
  useEffect(() => {
    if (isLoading) return;

    let baseCoupons = [...allCoupons];
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
    if (!scrollContainer || filteredCoupons.length === 0) return; // Không cuộn nếu không có item

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.1; 

    const autoScroll = (timestamp: number) => {
      if (!scrollContainer) return;
      
      if (!isPaused) {
        if (lastTimestamp) {
          const delta = timestamp - lastTimestamp;
          scrollContainer.scrollLeft += speed * delta;
          
          if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) { // Cuộn đến giữa (vì mảng lặp lại)
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

  // Animation variants
  const couponVariants = {
    hover: {
      y: -5,
      boxShadow: '0 12px 20px rgba(219, 39, 119, 0.1)',
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="relative py-8 bg-gradient-to-r from-pink-50 to-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-50">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-20 right-1/3 w-40 h-40 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 right-1/4 w-36 h-36 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Mã Giảm Giá</h2>
            <p className="text-sm text-gray-600">Sử dụng mã để nhận ưu đãi đặc biệt khi mua sắm</p>
          </div>
          
          {!isLoading && !error && allCoupons.length > 0 && (
            <div className="flex space-x-2 mt-3 md:mt-0 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <button 
                onClick={() => setActiveFilter(COUPON_FILTERS.ALL)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === COUPON_FILTERS.ALL 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                }`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveFilter(COUPON_FILTERS.PERCENTAGE)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === COUPON_FILTERS.PERCENTAGE 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                }`}
              >
                Giảm %
              </button>
              <button 
                onClick={() => setActiveFilter(COUPON_FILTERS.FIXED)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === COUPON_FILTERS.FIXED 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                }`}
              >
                Giảm tiền
              </button>
              <button 
                onClick={() => setActiveFilter(COUPON_FILTERS.NO_MINIMUM)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === COUPON_FILTERS.NO_MINIMUM 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                }`}
              >
                Không tối thiểu
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
            <p className="ml-3 text-gray-600">Đang tải mã giảm giá...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-10 px-4">
            <div className="mx-auto w-16 h-16 text-red-400 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <FiFilter size={30} />
            </div>
            <p className="text-red-500 font-medium">Không thể tải mã giảm giá</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button 
              onClick={() => { 
                // Gọi lại fetchCoupons để thử lại
                // Cần đảm bảo fetchCoupons được định nghĩa hoặc có thể truy cập ở đây
                // Hoặc đơn giản là reload trang
                window.location.reload(); 
              }}
              className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 text-sm"
            >
              Thử lại
            </button>
          </div>
        )}
        
        {!isLoading && !error && filteredCoupons.length === 0 && allCoupons.length > 0 && (
           <div className="text-center py-10 text-gray-500">
            <FiFilter size={30} className="mx-auto mb-2 text-gray-400" />
            Không tìm thấy mã giảm giá phù hợp với bộ lọc hiện tại.
          </div>
        )}

        {!isLoading && !error && allCoupons.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <FiFilter size={30} className="mx-auto mb-2 text-gray-400" />
            Hiện chưa có mã giảm giá nào. Vui lòng quay lại sau!
          </div>
        )}

        {!isLoading && !error && filteredCoupons.length > 0 && (
          <>
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto hide-scrollbar auto-scroll-container pt-2 pb-4"
            >
              <div className="flex space-x-3">
                {filteredCoupons.map((coupon, index) => (
                  <motion.div 
                    key={`${coupon._id}-${index}`}
                    className="flex-shrink-0 w-[240px]"
                    variants={couponVariants}
                    whileHover="hover"
                  >
                    <div className="bg-white rounded-lg overflow-hidden h-full flex flex-col relative shadow-sm">
                      <div className="absolute left-0 top-0 w-full flex justify-between z-10 -mt-2">
                        <div className="w-3 h-3 bg-gray-100 rounded-full -ml-1.5"></div>
                        <div className="w-3 h-3 bg-gray-100 rounded-full -mr-1.5"></div>
                      </div>
                      <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-3 text-white relative">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold">
                            {formatDiscount(coupon)}
                          </h3>
                          <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                            {coupon.minimumOrderValue > 0 
                              ? `Đơn ≥ ${new Intl.NumberFormat('vi-VN').format(coupon.minimumOrderValue)}đ`
                              : 'Không giới hạn'
                            }
                          </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white text-pink-500 rounded-full p-1">
                          <RiScissorsFill className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="border-dashed border-t border-gray-200 relative"></div>
                      <div className="absolute left-0 bottom-0 w-full flex justify-between z-10 -mb-1.5">
                        <div className="w-3 h-3 bg-gray-100 rounded-full -ml-1.5"></div>
                        <div className="w-3 h-3 bg-gray-100 rounded-full -mr-1.5"></div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <p className="text-gray-700 text-sm font-medium line-clamp-2 min-h-[40px]">
                          {coupon.description}
                        </p>
                        <div className="flex items-center mt-3">
                          <div className="flex-1 bg-gray-50 rounded px-3 py-2 mr-2 border border-dashed border-pink-200">
                            <span className="font-mono font-bold text-pink-600 text-sm tracking-wider">{coupon.code}</span>
                          </div>
                          <motion.button
                            onClick={() => handleCopyCode(coupon.code)}
                            className={`p-2 rounded-full ${
                              copiedCode === coupon.code 
                                ? 'bg-green-500 text-white' 
                                : 'bg-pink-500 hover:bg-pink-600 text-white'
                            }`}
                            whileTap={{ scale: 0.9 }}
                            initial={{ scale: 1 }}
                            animate={copiedCode === coupon.code ? { 
                              scale: [1, 1.2, 1],
                              transition: { duration: 0.3 }
                            } : {}}
                          >
                            {copiedCode === coupon.code ? (
                              <FiCheck className="w-4 h-4" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Link 
                href="/coupons" 
                className="inline-block text-center px-6 py-2.5 bg-white hover:bg-pink-50 text-pink-600 rounded-full font-medium text-sm border border-pink-200 shadow-sm hover:shadow transition-all"
              >
                Xem tất cả mã giảm giá
              </Link>
            </div>
          </>
        )}
      </div>
      
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .auto-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
};

export default CouponSection;
