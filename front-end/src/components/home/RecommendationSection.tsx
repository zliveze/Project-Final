import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useRecommendation } from '@/contexts/user/RecommendationContext';
import RecommendedProducts from '@/components/common/RecommendedProducts';

export default function RecommendationSection() {
  const { isAuthenticated } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section className="py-12 mb-10 bg-gradient-to-b from-white to-pink-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-32 left-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            {isAuthenticated ? "Sản Phẩm Đề Xuất Cho Bạn" : "Sản Phẩm Nổi Bật"}
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            {isAuthenticated 
              ? "Dựa trên lịch sử mua sắm và sở thích của bạn"
              : "Những sản phẩm được yêu thích nhất tại Yumin"
            }
          </p>

          {/* Decorative line */}
          <motion.div
            className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4 mx-auto"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          ></motion.div>
        </motion.div>

        {/* Hiển thị sản phẩm gợi ý cá nhân hóa nếu đã đăng nhập, ngược lại hiển thị sản phẩm nổi bật */}
        <RecommendedProducts 
          type={isAuthenticated ? "personalized" : "recommended"}
          limit={12}
          title=""
          hideIfEmpty={false}
          seeMoreLink="/shop"
          seeMoreText="Xem thêm sản phẩm"
        />

        {/* Thêm phần tagline và suggestion */}
        <motion.div
          className="mt-12 rounded-xl overflow-hidden shadow-lg bg-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -5, boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Khám phá thêm sản phẩm</h3>
                <p className="text-pink-100 text-sm md:text-base">
                  Tìm hiểu các sản phẩm phù hợp với làn da của bạn
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-white text-pink-600 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 group"
              >
                <span>Đến cửa hàng</span>
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}