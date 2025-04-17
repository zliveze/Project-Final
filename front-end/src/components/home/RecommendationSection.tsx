import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaStar, FaStarHalfAlt, FaRegHeart, FaHeart } from 'react-icons/fa'
import { FiShoppingCart, FiEye, FiArrowRight } from 'react-icons/fi'
import { motion } from 'framer-motion'

// Cấu trúc dữ liệu sản phẩm theo model Products
interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  currentPrice: number; // Giá hiện tại (có thể thay đổi theo Event/Campaign)
  status: string; // ["active", "out_of_stock", "discontinued"]
  brandId: number;
  categoryIds: number[];
  tags: string[];
  images: {
    url: string;
    alt: string;
    isThumbnail: boolean;
  }[];
  inventory: {
    quantity: number;
    soldCount: number;
  };
  reviews: {
    averageRating: number;
    count: number;
  };
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
  };
  slug: string;
}

// Hàm định dạng số cố định để tránh lỗi hydration
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// Dữ liệu sản phẩm được đề xuất
const recommendedProducts: Product[] = [
  {
    id: 1,
    sku: "LRP-EFFACLAR-SERUM-30ML",
    name: "Serum La Roche-Posay Giảm Mụn B5 Serum",
    description: "Serum giảm mụn, se khít lỗ chân lông và làm dịu da với nồng độ 10% Niacinamide B5",
    price: 999000,
    currentPrice: 822000,
    status: "active",
    brandId: 5,
    categoryIds: [8, 12],
    tags: ["serum", "acne", "pore", "niacinamide"],
    images: [
      {
        url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
        alt: "Serum La Roche-Posay Giảm Mụn B5 Serum",
        isThumbnail: true
      }
    ],
    inventory: {
      quantity: 20,
      soldCount: 234
    },
    reviews: {
      averageRating: 4.7,
      count: 156
    },
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    },
    slug: "serum-la-roche-posay-giam-mun-b5"
  },
  {
    id: 2,
    sku: "LOR-REVITALIFT-HA-30ML",
    name: "Serum L'Oreal Hyaluronic Revitalift Hyaluronic Acid",
    description: "Serum cấp ẩm chuyên sâu với 1.5% Hyaluronic Acid, giúp da căng mọng và giảm nếp nhăn",
    price: 499000,
    currentPrice: 275000,
    status: "active",
    brandId: 1,
    categoryIds: [8, 13],
    tags: ["serum", "hyaluronic acid", "hydration", "anti-aging"],
    images: [
      {
        url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
        alt: "Serum L'Oreal Hyaluronic Revitalift Hyaluronic Acid",
        isThumbnail: true
      }
    ],
    inventory: {
      quantity: 45,
      soldCount: 312
    },
    reviews: {
      averageRating: 4.5,
      count: 203
    },
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    },
    slug: "serum-loreal-hyaluronic-acid"
  },
  {
    id: 3,
    sku: "LOR-BRIGHTMAKER-30ML",
    name: "Serum L'Oreal Sáng Da, Mờ Thâm Bright Maker",
    description: "Serum làm sáng da với 4% Niacinamide và Vitamin C, giúp mờ thâm nám và đều màu da",
    price: 499000,
    currentPrice: 260000,
    status: "active",
    brandId: 1,
    categoryIds: [8, 14],
    tags: ["serum", "brightening", "niacinamide", "vitamin c"],
    images: [
      {
        url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
        alt: "Serum L'Oreal Sáng Da, Mờ Thâm Bright Maker",
        isThumbnail: true
      }
    ],
    inventory: {
      quantity: 32,
      soldCount: 178
    },
    reviews: {
      averageRating: 4.6,
      count: 142
    },
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: true
    },
    slug: "serum-loreal-sang-da-mo-tham"
  },
  {
    id: 4,
    sku: "CRV-MOISTURIZING-CREAM-50ML",
    name: "Kem Dưỡng Ẩm CeraVe Cho Da Khô Và Rất Khô",
    description: "Kem dưỡng ẩm chuyên sâu với 3 Ceramide thiết yếu và Hyaluronic Acid, phục hồi hàng rào bảo vệ da",
    price: 375000,
    currentPrice: 299000,
    status: "active",
    brandId: 3,
    categoryIds: [9, 13],
    tags: ["moisturizer", "ceramide", "dry skin", "sensitive skin"],
    images: [
      {
        url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
        alt: "Kem Dưỡng Ẩm CeraVe Cho Da Khô Và Rất Khô",
        isThumbnail: true
      }
    ],
    inventory: {
      quantity: 56,
      soldCount: 245
    },
    reviews: {
      averageRating: 4.8,
      count: 187
    },
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    },
    slug: "kem-duong-am-cerave-cho-da-kho"
  },
  {
    id: 5,
    sku: "COSRX-SNAIL-ESSENCE-100ML",
    name: "Tinh Chất Ốc Sên COSRX Advanced Snail 96 Mucin",
    description: "Tinh chất dưỡng ẩm và phục hồi da với 96% dịch nhầy ốc sên, làm dịu và phục hồi da tổn thương",
    price: 450000,
    currentPrice: 380000,
    status: "active",
    brandId: 7,
    categoryIds: [8, 13],
    tags: ["essence", "snail mucin", "hydration", "soothing"],
    images: [
      {
        url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
        alt: "Tinh Chất Ốc Sên COSRX Advanced Snail 96 Mucin",
        isThumbnail: true
      }
    ],
    inventory: {
      quantity: 38,
      soldCount: 289
    },
    reviews: {
      averageRating: 4.9,
      count: 231
    },
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true
    },
    slug: "tinh-chat-oc-sen-cosrx-advanced-snail-96-mucin"
  },
  {
    id: 6,
    sku: "KLAIRS-VITAMIN-C-30ML",
    name: "Serum Vitamin C Klairs Freshly Juiced",
    description: "Serum Vitamin C 5% làm sáng da, mờ thâm nám và chống oxy hóa, phù hợp cho da nhạy cảm",
    price: 420000,
    currentPrice: 350000,
    status: "active",
    brandId: 8,
    categoryIds: [8, 14],
    tags: ["serum", "vitamin c", "brightening", "sensitive skin"],
    images: [
      {
        url: "https://media.hcdn.vn/catalog/product/p/r/promotions-auto-sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml_zmJwd76vYd8vtRRY_img_220x220_0dff4c_fit_center.png",
        alt: "Serum Vitamin C Klairs Freshly Juiced",
        isThumbnail: true
      }
    ],
    inventory: {
      quantity: 42,
      soldCount: 176
    },
    reviews: {
      averageRating: 4.4,
      count: 128
    },
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: true
    },
    slug: "serum-vitamin-c-klairs-freshly-juiced"
  }
];

// Hiển thị đánh giá sao
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} className="text-yellow-400 text-sm" />
      ))}
      {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FaStar key={`empty-${i}`} className="text-gray-300 text-sm" />
      ))}
      <span className="text-xs text-gray-500 ml-1">({rating})</span>
    </div>
  );
};

// Component hiển thị mỗi sản phẩm
const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Tính phần trăm giảm giá
  const discountPercentage = Math.round(((product.price - product.currentPrice) / product.price) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        whileHover={{
          y: -8,
          boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)'
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative">
            {/* Thumbnail */}
            <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              <motion.div
                animate={{ scale: isHovered ? 1.08 : 1 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full flex items-center justify-center p-3"
              >
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt}
                  width={220}
                  height={220}
                  className="object-contain w-full h-full"
                />
              </motion.div>

              {/* Action buttons on hover */}
              <motion.div
                className="absolute bottom-3 inset-x-0 flex justify-center space-x-2 px-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  y: isHovered ? 0 : 20
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-pink-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiEye className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-md text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiShoppingCart className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </div>

            {/* Favorite button */}
            <motion.button
              className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isFavorite ? (
                <FaHeart className="w-4 h-4 text-pink-500" />
              ) : (
                <FaRegHeart className="w-4 h-4 text-gray-400" />
              )}
            </motion.button>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.flags.isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium rounded-md"
                >
                  Mới
                </motion.div>
              )}
              {product.flags.isBestSeller && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-md"
                >
                  Bán chạy
                </motion.div>
              )}
              {product.flags.isOnSale && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-medium rounded-md flex items-center"
                >
                  -{discountPercentage}%
                </motion.div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-pink-600 transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="my-2">
              <RatingStars rating={product.reviews.averageRating} />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-base font-bold text-pink-600">{formatPrice(product.currentPrice)}</span>
              {product.flags.isOnSale && (
                <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Sold count with progress bar */}
            <div className="mt-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-500">Đã bán {product.inventory.soldCount}</span>
                {product.inventory.quantity < 10 && (
                  <span className="text-red-500 font-medium">Còn {product.inventory.quantity}</span>
                )}
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, product.inventory.soldCount / 5)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                ></motion.div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default function RecommendationSection() {
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
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Sản Phẩm Đề Xuất Cho Bạn</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">Dựa trên lịch sử mua sắm và sở thích của bạn</p>

          {/* Decorative line */}
          <motion.div
            className="h-0.5 w-20 bg-gradient-to-r from-pink-300 to-purple-300 mt-4 mx-auto"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          ></motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {recommendedProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </motion.div>

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
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <motion.h3
                  className="text-2xl md:text-3xl font-bold text-white mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  Khám Phá Thêm Sản Phẩm Phù Hợp Với Bạn
                </motion.h3>
                <motion.p
                  className="text-pink-100 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Chúng tôi phân tích lịch sử mua sắm và sở thích của bạn để gợi ý những sản phẩm phù hợp nhất, giúp bạn tìm được sản phẩm ưng ý một cách nhanh chóng.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    href="/recommendations"
                    className="inline-block px-6 py-3 bg-white text-pink-600 hover:bg-pink-50 rounded-full font-medium transition-colors shadow-md hover:shadow-lg flex items-center"
                  >
                    Xem thêm sản phẩm đề xuất
                    <FiArrowRight className="ml-2" />
                  </Link>
                </motion.div>
              </div>

              <div className="md:w-1/2">
                <div className="grid grid-cols-2 gap-4">
                  {recommendedProducts.slice(0, 4).map((product, index) => (
                    <motion.div
                      key={`mini-${product.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt}
                          width={48}
                          height={48}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-medium text-white line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-pink-100">{formatPrice(product.currentPrice)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}