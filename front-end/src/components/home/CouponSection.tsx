import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCopy, FiCheck, FiFilter } from 'react-icons/fi';
import { RiScissorsFill } from 'react-icons/ri';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

// Cấu trúc dữ liệu voucher đơn giản hóa
interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue: number;
  endDate: string;
}

// Dữ liệu mẫu voucher (10 mã giảm giá)
const coupons: Coupon[] = [
  {
    _id: 'coupon1',
    code: 'WELCOME20',
    description: 'Giảm 20% đơn đầu tiên',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrderValue: 300000,
    endDate: '2023-12-31T23:59:59Z'
  },
  {
    _id: 'coupon2',
    code: 'FREESHIP',
    description: 'Miễn phí vận chuyển',
    discountType: 'fixed',
    discountValue: 40000,
    minimumOrderValue: 500000,
    endDate: '2023-06-30T23:59:59Z'
  },
  {
    _id: 'coupon3',
    code: 'SKINCARE15',
    description: 'Giảm 15% sản phẩm skincare',
    discountType: 'percentage',
    discountValue: 15,
    minimumOrderValue: 200000,
    endDate: '2023-07-15T23:59:59Z'
  },
  {
    _id: 'coupon4',
    code: 'FLASH30',
    description: 'Giảm 30% Flash Sale',
    discountType: 'percentage',
    discountValue: 30,
    minimumOrderValue: 1000000,
    endDate: '2023-03-20T23:59:59Z'
  },
  {
    _id: 'coupon5',
    code: 'MAKEUP10',
    description: 'Giảm 10% sản phẩm makeup',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderValue: 150000,
    endDate: '2023-08-31T23:59:59Z'
  },
  {
    _id: 'coupon6',
    code: 'NEWUSER50K',
    description: 'Giảm 50K người dùng mới',
    discountType: 'fixed',
    discountValue: 50000,
    minimumOrderValue: 200000,
    endDate: '2023-12-31T23:59:59Z'
  },
  {
    _id: 'coupon7',
    code: 'BIRTHDAY15',
    description: 'Giảm 15% sinh nhật',
    discountType: 'percentage',
    discountValue: 15,
    minimumOrderValue: 0,
    endDate: '2023-12-31T23:59:59Z'
  },
  {
    _id: 'coupon8',
    code: 'SUMMER25',
    description: 'Giảm 25% mùa hè',
    discountType: 'percentage',
    discountValue: 25,
    minimumOrderValue: 400000,
    endDate: '2023-08-31T23:59:59Z'
  },
  {
    _id: 'coupon9',
    code: 'APP15',
    description: 'Giảm 15% đặt qua app',
    discountType: 'percentage',
    discountValue: 15,
    minimumOrderValue: 250000,
    endDate: '2023-12-31T23:59:59Z'
  },
  {
    _id: 'coupon10',
    code: 'WEEKEND10',
    description: 'Giảm 10% cuối tuần',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderValue: 200000,
    endDate: '2023-12-31T23:59:59Z'
  }
];

// Tạo mảng coupon lặp lại để tạo hiệu ứng vô hạn
const repeatedCoupons = [...coupons, ...coupons];

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
  const [filteredCoupons, setFilteredCoupons] = useState(repeatedCoupons);
  
  // Xử lý sao chép mã giảm giá
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        
        // Hiển thị toast thông báo thành công
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
        // Hiển thị toast thông báo lỗi
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
    let filtered = [...coupons, ...coupons];
    
    if (activeFilter === COUPON_FILTERS.PERCENTAGE) {
      filtered = filtered.filter(coupon => coupon.discountType === 'percentage');
    } else if (activeFilter === COUPON_FILTERS.FIXED) {
      filtered = filtered.filter(coupon => coupon.discountType === 'fixed');
    } else if (activeFilter === COUPON_FILTERS.NO_MINIMUM) {
      filtered = filtered.filter(coupon => coupon.minimumOrderValue === 0);
    }
    
    setFilteredCoupons(filtered);
    
    // Reset vị trí cuộn khi đổi filter
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [activeFilter]);

  // Tự động cuộn
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.1; // Tốc độ cuộn (pixel/ms)

    const autoScroll = (timestamp: number) => {
      if (!scrollContainer) return;
      
      if (!isPaused) {
        if (lastTimestamp) {
          const delta = timestamp - lastTimestamp;
          scrollContainer.scrollLeft += speed * delta;
          
          // Nếu đã cuộn đến cuối, quay lại đầu
          if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
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
    
    // Dừng cuộn khi hover
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
  }, [isPaused]);

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
      {/* Background decorations */}
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
          
          {/* Filter buttons */}
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
        </div>
        
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
                  {/* Coupon edge design - top */}
                  <div className="absolute left-0 top-0 w-full flex justify-between z-10 -mt-2">
                    <div className="w-3 h-3 bg-gray-100 rounded-full -ml-1.5"></div>
                    <div className="w-3 h-3 bg-gray-100 rounded-full -mr-1.5"></div>
                  </div>
                  
                  {/* Phần đầu coupon */}
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
                    
                    {/* Scissors icon for coupon design */}
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white text-pink-500 rounded-full p-1">
                      <RiScissorsFill className="w-4 h-4" />
                    </div>
                  </div>
                  
                  {/* Dotted line separator */}
                  <div className="border-dashed border-t border-gray-200 relative">
                  </div>
                  
                  {/* Coupon edge design - bottom */}
                  <div className="absolute left-0 bottom-0 w-full flex justify-between z-10 -mb-1.5">
                    <div className="w-3 h-3 bg-gray-100 rounded-full -ml-1.5"></div>
                    <div className="w-3 h-3 bg-gray-100 rounded-full -mr-1.5"></div>
                  </div>
                  
                  {/* Phần thân coupon */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="text-gray-700 text-sm font-medium line-clamp-2 min-h-[40px]">
                      {coupon.description}
                    </p>
                    
                    {/* Mã giảm giá và nút sao chép */}
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
      </div>
      
      {/* React Toastify Container */}
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
