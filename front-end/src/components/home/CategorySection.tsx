import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLoader } from 'react-icons/fi';
import axiosInstance from '../../lib/axios'; // Sửa đường dẫn import

// Cấu trúc dữ liệu danh mục theo API response
interface Category {
  _id: string; // Thay đổi từ id: number
  name: string;
  description: string;
  slug: string;
  parentId?: string; // Thay đổi từ number
  level: number;
  image?: { // Image có thể không tồn tại
    url: string;
    alt: string;
    publicId?: string;
  };
  status: 'active' | 'inactive'; // Kiểu cụ thể hơn
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  childrenCount?: number;
}

// Interface cho API response (nếu API trả về dạng object có items)
interface CategoriesApiResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Mảng màu nền ngẫu nhiên để thay thế backgroundColor
const backgroundGradients = [
  "from-pink-200 to-pink-100",
  "from-green-200 to-green-100",
  "from-orange-200 to-orange-100",
  "from-blue-200 to-blue-100",
  "from-purple-200 to-purple-100",
  "from-yellow-200 to-yellow-100",
  "from-indigo-200 to-indigo-100",
  "from-rose-200 to-rose-100",
  "from-teal-200 to-teal-100",
  "from-cyan-200 to-cyan-100",
];

// Mảng icon ngẫu nhiên để thay thế icon
const categoryIcons = ["💄", "🧖‍♀️", "🧴", "🫧", "👁️", "☀️", "💦", "💧", "🌿", "✨"];


export default function CategorySection() {
  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<CategoriesApiResponse>('/categories', {
          params: {
            status: 'active',
            featured: true,
            level: 1,
            limit: 8,
            sort: 'order,asc', // Sắp xếp theo order tăng dần
          },
        });
        if (response.data && response.data.items) {
          setCategories(response.data.items);
        } else {
          setCategories([]); // Nếu không có items, đặt là mảng rỗng
          // console.warn("API did not return items for categories.");
        }
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
        setError("Không thể tải danh mục. Vui lòng thử lại sau.");
        setCategories([]); // Đặt là mảng rỗng khi có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 15
      } 
    },
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: "0 10px 25px -10px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    }
  };
  
  // Hiệu ứng hover cho icon
  const iconVariants = {
    hover: {
      scale: 1.15,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        rotate: {
          repeat: 0,
          duration: 0.5
        }
      }
    }
  };
  
  // Hiệu ứng hover cho text xem sản phẩm
  const textButtonVariants = {
    hover: {
      x: 3,
      transition: {
        repeat: Infinity,
        repeatType: "mirror" as "mirror" | "reverse" | "loop" | undefined,
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-pink-50 relative overflow-hidden">
      {/* Background decorative elements */}
      {isClient && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-pink-100 rounded-full opacity-40 mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-20 -right-40 w-96 h-96 bg-purple-100 rounded-full opacity-30 mix-blend-multiply filter blur-3xl"></div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <motion.h2 
            className="text-3xl font-bold text-gray-800 mb-3"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Danh Mục Sản Phẩm
          </motion.h2>
          <motion.p 
            className="text-gray-600 text-center max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Khám phá các danh mục sản phẩm mỹ phẩm đa dạng của chúng tôi, được thiết kế cho mọi nhu cầu làm đẹp
          </motion.p>
          
          {/* Decorative line */}
          <motion.div 
            className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          ></motion.div>
        </div>
        
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {loading && (
            // Hiển thị skeleton loader hoặc thông báo loading
            Array.from({ length: 8 }).map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                className="bg-gray-200 rounded-xl p-5 h-64 animate-pulse flex flex-col items-center justify-center"
                variants={itemVariants}
              >
                <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full mx-auto mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6 mx-auto mb-3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mt-auto"></div>
              </motion.div>
            ))
          )}

          {!loading && error && (
            <div className="col-span-full text-center text-red-500 py-10">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">
              <p>Không có danh mục nào để hiển thị.</p>
            </div>
          )}

          {!loading && !error && categories.map((category, index) => (
            <motion.div 
              key={category._id}
              variants={itemVariants}
              whileHover="hover"
            >
              <Link 
                href={`/shop?categoryId=${category._id}`}
                className="block h-full"
              >
                <div className={`bg-gradient-to-br ${backgroundGradients[index % backgroundGradients.length]} rounded-xl p-5 flex flex-col items-center text-center h-full relative overflow-hidden group transition-all duration-300`}>
                  {/* Shine effect overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="absolute -inset-full top-0 block h-full w-1/2 transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
                  </div>
                  
                  {category.image && category.image.url ? (
                    <motion.div 
                      className="w-20 h-20 flex items-center justify-center mb-4 relative"
                      variants={iconVariants}
                    >
                       <Image
                        src={category.image.url}
                        alt={category.image.alt || category.name}
                        width={80}
                        height={80}
                        className="object-contain rounded-full"
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="w-20 h-20 flex items-center justify-center mb-4 text-4xl relative"
                      variants={iconVariants}
                    >
                      <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full filter blur-md"></div>
                      <span className="relative z-10">{categoryIcons[index % categoryIcons.length]}</span>
                    </motion.div>
                  )}
                  
                  <div className="mt-2 flex-grow">
                    <h3 className="font-medium text-base md:text-lg text-gray-800 mb-2">{category.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mb-3">{category.description}</p>
                  </div>
                  
                  <motion.div 
                    className="mt-auto text-sm font-medium text-pink-600 flex items-center group-hover:text-pink-700"
                    variants={textButtonVariants}
                  >
                    Xem sản phẩm
                    <FiArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="flex justify-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/categories" 
              className="px-6 py-3 bg-white text-pink-600 border border-pink-200 rounded-full font-medium hover:bg-pink-50 hover:shadow-md transition-all shadow-sm"
            >
              Xem tất cả danh mục
            </Link>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          100% {
            transform: translateX(100%) skew(-12deg);
          }
        }
        
        .animate-shine {
          animation: shine 1.5s ease;
        }
      `}</style>
    </section>
  )
}
