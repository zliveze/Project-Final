import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'

// Cấu trúc dữ liệu danh mục theo model Categories
interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  parentId?: number; // Danh mục cha (nếu có)
  level: number; // Cấp độ của danh mục
  image: {
    url: string;
    alt: string;
  };
  status: string; // ["active", "inactive"]
  featured: boolean;
  order: number; // Thứ tự hiển thị
  backgroundColor?: string; // Màu nền (thêm vào để giữ tính năng hiện tại)
  icon?: string; // Icon (thêm vào để giữ tính năng hiện tại)
}

// Dữ liệu danh mục
const categories: Category[] = [
  {
    id: 1,
    name: "Trang Điểm Môi",
    description: "Các sản phẩm trang điểm cho môi: son, son dưỡng, son bóng,...",
    slug: "trang-diem-moi",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Trang Điểm Môi"
    },
    status: "active",
    featured: true,
    order: 1,
    backgroundColor: "from-pink-200 to-pink-100",
    icon: "💄"
  },
  {
    id: 2,
    name: "Mặt Nạ",
    description: "Các loại mặt nạ dưỡng da: mặt nạ giấy, mặt nạ đất sét, mặt nạ ngủ,...",
    slug: "mat-na",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Mặt Nạ"
    },
    status: "active",
    featured: true,
    order: 2,
    backgroundColor: "from-green-200 to-green-100",
    icon: "🧖‍♀️"
  },
  {
    id: 3,
    name: "Trang Điểm Mặt",
    description: "Các sản phẩm trang điểm cho mặt: kem nền, phấn phủ, che khuyết điểm,...",
    slug: "trang-diem-mat",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Trang Điểm Mặt"
    },
    status: "active",
    featured: true,
    order: 3,
    backgroundColor: "from-orange-200 to-orange-100",
    icon: "🧴"
  },
  {
    id: 4,
    name: "Sữa Rửa Mặt",
    description: "Các loại sữa rửa mặt cho các loại da khác nhau",
    slug: "sua-rua-mat",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Sữa Rửa Mặt"
    },
    status: "active",
    featured: true,
    order: 4,
    backgroundColor: "from-blue-200 to-blue-100",
    icon: "🫧"
  },
  {
    id: 5,
    name: "Trang Điểm Mắt",
    description: "Các sản phẩm trang điểm cho mắt: mascara, phấn mắt, kẻ mắt,...",
    slug: "trang-diem-mat",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Trang Điểm Mắt"
    },
    status: "active",
    featured: true,
    order: 5,
    backgroundColor: "from-purple-200 to-purple-100",
    icon: "👁️"
  },
  {
    id: 6,
    name: "Kem Chống Nắng",
    description: "Các loại kem chống nắng cho da mặt và toàn thân",
    slug: "kem-chong-nang",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Kem Chống Nắng"
    },
    status: "active",
    featured: true,
    order: 6,
    backgroundColor: "from-yellow-200 to-yellow-100",
    icon: "☀️"
  },
  {
    id: 7,
    name: "Nước Tẩy Trang",
    description: "Các loại nước tẩy trang cho các loại da khác nhau",
    slug: "nuoc-tay-trang",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Nước Tẩy Trang"
    },
    status: "active",
    featured: true,
    order: 7,
    backgroundColor: "from-indigo-200 to-indigo-100",
    icon: "💦"
  },
  {
    id: 8,
    name: "Serum & Tinh Chất",
    description: "Các loại serum và tinh chất đặc trị cho da",
    slug: "serum-tinh-chat",
    level: 1,
    image: {
      url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
      alt: "Serum & Tinh Chất"
    },
    status: "active",
    featured: true,
    order: 8,
    backgroundColor: "from-rose-200 to-rose-100",
    icon: "💧"
  }
];

// Lọc các danh mục nổi bật và đang hoạt động
const featuredCategories = categories.filter(category => category.featured && category.status === "active");
// Sắp xếp theo thứ tự hiển thị
const sortedCategories = [...featuredCategories].sort((a, b) => a.order - b.order);

export default function CategorySection() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
          {sortedCategories.map((category) => (
            <motion.div 
              key={category.id}
              variants={itemVariants}
              whileHover="hover"
            >
              <Link 
                href={`/categories/${category.slug}`}
                className="block h-full"
              >
                <div className={`bg-gradient-to-br ${category.backgroundColor} rounded-xl p-5 flex flex-col items-center text-center h-full relative overflow-hidden group transition-all duration-300`}>
                  {/* Shine effect overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="absolute -inset-full top-0 block h-full w-1/2 transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
                  </div>
                  
                  <motion.div 
                    className="w-20 h-20 flex items-center justify-center mb-4 text-4xl relative"
                    variants={iconVariants}
                  >
                    <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full filter blur-md"></div>
                    <span className="relative z-10">{category.icon}</span>
                  </motion.div>
                  
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
