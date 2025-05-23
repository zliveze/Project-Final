import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiSearch, FiTrendingUp, FiArrowRight, FiZap } from 'react-icons/fi'

interface TopSearch {
  id: string;
  name: string;
  image: string;
  slug: string;
  searchCount: string;
  trending?: boolean;
}

// Loading skeleton component
const TopSearchSkeleton = ({ index }: { index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
    >
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-gray-200 h-6 w-20 rounded-full"></div>
        </div>
        <div className="aspect-square bg-gray-200"></div>
      </div>
      <div className="p-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    </motion.div>
  );
};

const TopSearchCard = ({ product, index }: { product: TopSearch; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

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
      <Link 
        href={`/san-pham/${product.slug}`}
        className="group"
      >
        <motion.div 
          className="relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300"
          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {/* Badge số lượt tìm kiếm */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <FiSearch className="h-3 w-3 mr-1" />
              {product.searchCount}
            </div>
          </div>
          
          {/* Badge trending nếu có */}
          {product.trending && (
            <div className="absolute top-3 left-3 z-10">
              <motion.div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              >
                <FiTrendingUp className="h-3 w-3 mr-1" />
                Trending
              </motion.div>
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
            
            {/* Icon tìm kiếm khi hover */}
            <motion.div 
              className="absolute bottom-2 right-2 w-10 h-10 flex items-center justify-center rounded-full bg-pink-500 text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                scale: isHovered ? 1 : 0.8,
                rotate: isHovered ? 0 : -45
              }}
              transition={{ duration: 0.3 }}
            >
              <FiSearch className="w-5 h-5" />
            </motion.div>
          </div>
          
          {/* Tên sản phẩm */}
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors duration-300">
              {product.name}
            </h3>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default function TopSearchSection() {
  const [searchValue, setSearchValue] = useState('');
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch top searches and popular tags
  useEffect(() => {
    const fetchTopSearchData = async () => {
      try {
        setLoading(true);
        // TODO: Thay thế bằng API calls thực tế
        // const [searchesResponse, tagsResponse] = await Promise.all([
        //   fetch('/api/searches/top?limit=6'),
        //   fetch('/api/searches/popular-tags?limit=10')
        // ]);
        // 
        // const searches = await searchesResponse.json();
        // const tags = await tagsResponse.json();
        // 
        // setTopSearches(searches);
        // setPopularTags(tags);
        
        // Tạm thời set empty để không hiển thị gì
        setTopSearches([]);
        setPopularTags([]);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu tìm kiếm:', err);
        setError('Không thể tải dữ liệu tìm kiếm');
        setTopSearches([]);
        setPopularTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSearchData();
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
  
  const tagVariants = {
    hover: {
      scale: 1.05, 
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      backgroundColor: "#fbcfe8",
      color: "#be185d"
    }
  };

  // Không hiển thị section nếu đang loading
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
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Từ Khóa Tìm Kiếm Hàng Đầu</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Khám phá những từ khóa và sản phẩm được quan tâm nhiều nhất tại Yumin</p>
            
            <motion.div 
              className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4 mx-auto"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, index) => (
              <TopSearchSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Không hiển thị section nếu có lỗi hoặc không có dữ liệu
  if (error || (topSearches.length === 0 && popularTags.length === 0)) {
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
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Từ Khóa Tìm Kiếm Hàng Đầu</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Khám phá những từ khóa và sản phẩm được quan tâm nhiều nhất tại Yumin</p>
          
          {/* Decorative line */}
          <motion.div 
            className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4 mx-auto"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          ></motion.div>
        </motion.div>

        {topSearches.length > 0 && (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {topSearches.map((product, index) => (
              <TopSearchCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        )}
        
        {/* Phần tìm kiếm nhanh nâng cấp */}
        <motion.div 
          className="mt-8 bg-white rounded-xl p-6 shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="md:w-1/3">
                <div className="flex items-center mb-3">
                  <FiZap className="w-6 h-6 text-pink-500 mr-2" />
                  <h3 className="text-xl font-bold text-gray-800">Tìm Kiếm Nhanh</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Khám phá hàng ngàn sản phẩm chỉ với một cú nhấp chuột. Tìm ngay sản phẩm bạn cần!</p>
                
                <motion.div
                  className="hidden md:flex flex-col gap-2 mt-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="font-bold text-pink-600">1</span>
                    </div>
                    <p className="text-sm text-gray-700">Nhập từ khóa tìm kiếm</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="font-bold text-pink-600">2</span>
                    </div>
                    <p className="text-sm text-gray-700">Nhấn nút tìm kiếm</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="font-bold text-pink-600">3</span>
                    </div>
                    <p className="text-sm text-gray-700">Khám phá các sản phẩm phù hợp</p>
                  </div>
                </motion.div>
              </div>
              
              <div className="w-full md:w-2/3">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <input 
                    type="text" 
                    placeholder="Nhập từ khóa tìm kiếm..." 
                    className="w-full py-3 px-4 pr-14 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all text-gray-700"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <motion.button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2.5 rounded-lg hover:shadow-md transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiSearch className="h-5 w-5" />
                  </motion.button>
                </motion.div>
                
                {popularTags.length > 0 && (
                  <motion.div 
                    className="mt-5"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div className="flex items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700 mr-2">Từ khóa phổ biến:</h4>
                      <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.slice(0, 8).map((tag, index) => (
                        <motion.div
                          key={`tag-${index}`}
                          variants={tagVariants}
                          whileHover="hover"
                        >
                          <Link 
                            href={`/tim-kiem?query=${encodeURIComponent(tag)}`}
                            className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-pink-100 hover:text-pink-600 transition-colors"
                          >
                            {tag}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Nút xem tất cả */}
        {(topSearches.length > 0 || popularTags.length > 0) && (
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
                href="/tim-kiem-pho-bien" 
                className="px-6 py-3 bg-white text-pink-600 border border-pink-200 rounded-full font-medium hover:bg-pink-50 hover:shadow-md transition-all shadow-sm flex items-center"
              >
                Xem tất cả từ khóa phổ biến
                <FiArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
} 