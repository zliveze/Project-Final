import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiArrowRight, FiShoppingCart } from 'react-icons/fi'
import { FaStar, FaStarHalfAlt, FaFireAlt } from 'react-icons/fa'

interface BestSeller {
  id: string;
  name: string;
  image: string;
  slug: string;
  soldCount: string;
  price: number;
  discountedPrice?: number;
  rating: number;
  ratingCount: number;
}

// Component hiển thị rating
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} className="text-yellow-400 w-3 h-3" />
      ))}
      {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 w-3 h-3" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FaStar key={`empty-${i}`} className="text-gray-300 w-3 h-3" />
      ))}
    </div>
  );
};

// Component hiển thị sản phẩm bán chạy
const BestSellerCard = ({ product, index }: { product: BestSeller; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Tính phần trăm giảm giá
  const discountPercentage = product.discountedPrice 
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) 
    : 0;
  
  // Format giá
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/product/${product.slug}`} className="group">
        <motion.div 
          className="relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300"
          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {/* Badge số lượng đã bán và Best Seller */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <FaFireAlt className="mr-1 h-3 w-3" />
              {product.soldCount}
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Best Seller
            </div>
          </div>
          
          {/* Badge giảm giá */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold w-10 h-10 flex items-center justify-center rounded-full">
                -{discountPercentage}%
              </div>
            </div>
          )}
          
          {/* Hiệu ứng overlay khi hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
          
          {/* Hình ảnh sản phẩm */}
          <div className="relative aspect-square p-4 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
            <motion.div 
              className="relative w-full h-full"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.5 }}
            >
              <Image 
                src={imageError ? '/404.png' : product.image} 
                alt={product.name}
                width={200}
                height={200}
                className="object-contain w-full h-full"
                onError={handleImageError}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
              />
            </motion.div>
            
            {/* Nút thêm vào giỏ hàng khi hover */}
            <motion.div 
              className="absolute bottom-0 left-0 w-full p-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center transition-all">
                <FiShoppingCart className="mr-1" />
                Thêm vào giỏ
              </button>
            </motion.div>
          </div>
          
          {/* Thông tin sản phẩm */}
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors duration-300 min-h-[40px]">
              {product.name}
            </h3>
            
            {/* Giá và đánh giá */}
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {product.discountedPrice ? (
                    <>
                      <span className="text-sm font-bold text-pink-600">{formatPrice(product.discountedPrice)}</span>
                      <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-pink-600">{formatPrice(product.price)}</span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-1 font-medium text-gray-700">{product.rating}</span>
                  <RatingStars rating={product.rating} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

// Loading skeleton component
const BestSellerSkeleton = ({ index }: { index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="aspect-square bg-gray-200 animate-pulse"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default function BestSellerSection() {
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch best seller products
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        // TODO: Thay thế bằng API call thực tế
        // const response = await fetch('/api/products/best-sellers?limit=6');
        // const data = await response.json();
        // setBestSellers(data);
        
        // Tạm thời set empty để không hiển thị gì
        setBestSellers([]);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm bán chạy:', err);
        setError('Không thể tải sản phẩm bán chạy');
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

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

  // Không hiển thị section nếu đang loading hoặc không có dữ liệu
  if (loading) {
    return (
      <section className="py-10 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Sản Phẩm Bán Chạy</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Những sản phẩm được khách hàng ưa chuộng và đánh giá cao nhất tại Yumin</p>
            
            <motion.div 
              className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4 mx-auto"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <BestSellerSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Không hiển thị section nếu có lỗi hoặc không có sản phẩm
  if (error || bestSellers.length === 0) {
    return null;
  }

  return (
    <section className="py-10 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Sản Phẩm Bán Chạy</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Những sản phẩm được khách hàng ưa chuộng và đánh giá cao nhất tại Yumin</p>
          
          <motion.div 
            className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4 mx-auto"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          ></motion.div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {bestSellers.map((product, index) => (
            <BestSellerCard key={product.id} product={product} index={index} />
          ))}
        </motion.div>
        
        {/* Banner quảng cáo */}
        <motion.div 
          className="mt-10 rounded-xl overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-600">
            <div className="flex flex-col md:flex-row items-center">
              <div className="p-8 md:w-2/3">
                <motion.h3 
                  className="text-2xl md:text-3xl font-bold text-white mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Hot Deal Của Tháng
                </motion.h3>
                <motion.p 
                  className="text-pink-100 mb-6 text-base"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Giảm đến 50% cho các sản phẩm bán chạy, thêm quà tặng hấp dẫn khi mua combo
                </motion.p>
                <motion.button 
                  className="bg-white text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-300 flex items-center shadow-md hover:shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Khám phá ngay
                  <FiArrowRight className="ml-2" />
                </motion.button>
              </div>
              <div className="md:w-1/3 p-4 md:p-0 flex justify-center">
                <motion.div 
                  className="relative h-40 md:h-48 w-40 md:w-48"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0, -5, 0],
                    transition: {
                      duration: 5, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }
                  }}
                >
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-400 rounded-full opacity-30 blur-2xl"></div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-pink-400 rounded-full opacity-30 blur-2xl"></div>
                  <div className="relative h-full w-full flex items-center justify-center">
                    <Image 
                      src="/404.png" 
                      alt="Best seller product" 
                      width={160} 
                      height={160}
                      className="object-contain drop-shadow-lg"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Nút xem tất cả */}
        <div className="flex justify-center mt-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/ban-chay" 
              className="px-6 py-3 bg-white text-pink-600 border border-pink-200 rounded-full font-medium hover:bg-pink-50 hover:shadow-md transition-all shadow-sm flex items-center"
            >
              Xem tất cả sản phẩm bán chạy
              <FiArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 