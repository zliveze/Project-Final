import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiStar, FiChevronLeft, FiChevronRight, FiUser, FiCheck, FiMessageCircle } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaQuoteLeft } from 'react-icons/fa';

// Định nghĩa interface cho đánh giá của khách hàng
interface CustomerReview {
  id: number;
  customerName: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  productId: number;
  productName: string;
  productImage: string;
  verified: boolean;
  helpful: number;
}

// Danh sách các đánh giá khách hàng mẫu
const customerReviews: CustomerReview[] = [
  {
    id: 1,
    customerName: "Nguyễn Thị Hương",
    avatar: "",
    rating: 5,
    date: "2023-03-15",
    content: "Tôi đã sử dụng kem dưỡng ẩm này được 2 tuần và đã thấy sự khác biệt rõ rệt. Da tôi mềm mại hơn và ít khô hơn rất nhiều. Cảm ơn Yumin vì đã giới thiệu sản phẩm tuyệt vời này!",
    productId: 101,
    productName: "Laneige Water Bank Blue Hyaluronic Cream",
    productImage: "",
    verified: true,
    helpful: 42
  },
  {
    id: 2,
    customerName: "Trần Minh Đức",
    avatar: "",
    rating: 4.5,
    date: "2023-03-10",
    content: "Mua nước tẩy trang này cho vợ và cô ấy rất thích. Sản phẩm dễ sử dụng, không gây kích ứng và làm sạch tốt. Giá cả hợp lý so với chất lượng, sẽ mua lại.",
    productId: 102,
    productName: "Bioderma Sensibio H2O Micellar Water",
    productImage: "",
    verified: true,
    helpful: 35
  },
  {
    id: 3,
    customerName: "Phạm Thu Trang",
    avatar: "",
    rating: 5,
    date: "2023-03-05",
    content: "Serum vitamin C này thật sự đáng đồng tiền! Tôi đã dùng được 1 tháng và thấy da sáng hơn, các vết thâm mờ đi rõ rệt. Kết cấu sản phẩm rất dễ thẩm thấu và không gây nhờn. Chắc chắn sẽ mua lại!",
    productId: 103,
    productName: "Klairs Freshly Juiced Vitamin C Serum",
    productImage: "",
    verified: true,
    helpful: 27
  },
  {
    id: 4,
    customerName: "Lê Thanh Hà",
    avatar: "",
    rating: 4,
    date: "2023-02-28",
    content: "Mặt nạ ngủ này thật sự giúp da tôi được phục hồi qua đêm. Mỗi khi thức dậy, da mặt tôi căng mọng và rạng rỡ hơn. Mùi hương dễ chịu, thư giãn. Tuy nhiên, có thể hơi dính một chút nếu bạn có da dầu.",
    productId: 104,
    productName: "Laneige Cica Sleeping Mask",
    productImage: "",
    verified: true,
    helpful: 19
  },
  {
    id: 5,
    customerName: "Vũ Quỳnh Anh",
    avatar: "",
    rating: 5,
    date: "2023-02-20",
    content: "Son dưỡng này là cứu tinh cho môi khô của tôi trong mùa đông. Nó dưỡng ẩm tốt, không có cảm giác bết dính và giữ ẩm lâu. Mình đặc biệt thích mùi hương nhẹ nhàng của nó. Sẽ tiếp tục mua lại!",
    productId: 105,
    productName: "Laneige Lip Sleeping Mask",
    productImage: "",
    verified: true,
    helpful: 31
  }
];

// Component hiển thị đánh giá sao
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} className="text-yellow-400 mr-1" />
      ))}
      {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 mr-1" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FiStar key={`empty-${i}`} className="text-gray-300 mr-1" />
      ))}
    </div>
  );
};

// Component hiển thị card đánh giá
const ReviewCard: React.FC<{ review: CustomerReview; isActive: boolean }> = ({ review, isActive }) => {
  return (
    <motion.div
      className={`bg-white rounded-xl p-6 shadow-lg ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'} h-full flex flex-col relative overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: isActive ? 1.03 : 1, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
    >
      {/* Dấu quote */}
      <FaQuoteLeft className="absolute top-6 right-6 text-pink-100 text-4xl opacity-50" />

      {/* Người đánh giá */}
      <div className="flex items-center mb-4">
        <div className="relative w-14 h-14 mr-4">
          <Image
            src={review.avatar}
            alt={review.customerName}
            className="rounded-full border-2 border-pink-300 object-cover"
            fill
            onError={(e) => {
              // Fallback khi ảnh không tồn tại
              e.currentTarget.src = '/images/default-avatar.png';
            }}
          />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 flex items-center">
            {review.customerName}
            {review.verified && (
              <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full flex items-center">
                <FiCheck className="mr-1" />
                Đã xác minh
              </span>
            )}
          </h4>
          <div className="flex items-center text-sm text-gray-500">
            <RatingStars rating={review.rating} />
            <span className="ml-2">{new Date(review.date).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Nội dung đánh giá */}
      <div className="mb-4 text-gray-700 italic flex-grow">
        "{review.content}"
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex items-center p-3 bg-gray-50 rounded-lg mt-2">
        <div className="relative w-12 h-12 mr-3">
          <Image
            src={review.productImage}
            alt={review.productName}
            className="rounded-md object-cover"
            fill
            onError={(e) => {
              // Fallback khi ảnh không tồn tại
              e.currentTarget.src = '/404.png';
            }}
          />
        </div>
        <div>
          <p className="text-xs text-gray-500">Đánh giá cho</p>
          <Link href={`/product/${review.productId}`}>
            <span className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
              {review.productName}
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <div className="flex items-center text-gray-500">
          <FiMessageCircle className="mr-1" />
          <span>{review.helpful} người thấy hữu ích</span>
        </div>
        <button className="text-pink-500 hover:text-pink-700 font-medium">
          Hữu ích
        </button>
      </div>
    </motion.div>
  );
};

const CustomerReviewsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);

  // Xử lý navigation
  const showPrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : customerReviews.length - 1
    );
  };

  const showNext = () => {
    setActiveIndex((prevIndex) =>
      prevIndex < customerReviews.length - 1 ? prevIndex + 1 : 0
    );
  };

  // Xử lý auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDragging) {
        showNext();
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isDragging, activeIndex]);

  // Xử lý sự kiện drag
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dragDistance = e.clientX - dragStartX;

      if (Math.abs(dragDistance) > 100) {
        if (dragDistance > 0) {
          showPrev();
        } else {
          showNext();
        }
        setIsDragging(false);
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            Khách Hàng Nói Gì Về Chúng Tôi
          </motion.h2>
          <motion.p
            className="text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Hơn 10.000 khách hàng hài lòng chia sẻ trải nghiệm của họ về sản phẩm và dịch vụ của Yumin Cosmetics
          </motion.p>
        </div>

        {/* Reviews cards container */}
        <div
          className="relative"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* Navigation buttons */}
          <button
            onClick={showPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-lg text-pink-500 hover:text-pink-700 transition-colors focus:outline-none"
            aria-label="Previous review"
          >
            <FiChevronLeft className="text-xl" />
          </button>

          <button
            onClick={showNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-lg text-pink-500 hover:text-pink-700 transition-colors focus:outline-none"
            aria-label="Next review"
          >
            <FiChevronRight className="text-xl" />
          </button>

          {/* Reviews slider */}
          <div
            ref={reviewsContainerRef}
            className="py-8 px-10 overflow-visible relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-500 ease-in-out">
              {customerReviews.map((review, index) => {
                // Calculate relative position based on activeIndex
                const position = (index - activeIndex + customerReviews.length) % customerReviews.length;
                const isActive = position === 0;
                const isVisible = position <= 2 && position >= 0;

                if (!isVisible && window.innerWidth >= 768) return null;

                return (
                  <div key={review.id} style={{ order: position }}>
                    <ReviewCard review={review} isActive={isActive} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center mt-8">
          {customerReviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 mx-1 rounded-full transition-all duration-300 ${
                activeIndex === index ? 'bg-pink-500 w-6' : 'bg-gray-300'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link
            href="/reviews"
            className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          >
            Xem tất cả đánh giá
          </Link>
          <p className="text-sm text-gray-500 mt-2">Hơn 2,500+ đánh giá từ khách hàng thực</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomerReviewsSection;