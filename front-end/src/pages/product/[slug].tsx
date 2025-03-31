import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { FiArrowLeft } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import ProductSEO from '@/components/product/ProductSEO';
import ProductImages from '@/components/product/ProductImages';
import ProductInfo from '@/components/product/ProductInfo';
import ProductDescription from '@/components/product/ProductDescription';
import ProductReviews from '@/components/product/ProductReviews';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import ProductInventory from '@/components/product/ProductInventory';
import ProductCategories from '@/components/product/ProductCategories';
import ProductPromotions from '@/components/product/ProductPromotions';
import DefaultLayout from '@/layout/DefaultLayout'; 
// Mô phỏng dữ liệu sản phẩm
const mockProduct = {
  _id: '1',
  sku: 'YM-SK-001',
  name: 'Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium',
  slug: 'kem-duong-am-chong-lao-hoa-yumin-premium',
  description: {
    short: 'Kem dưỡng ẩm cao cấp với công thức độc quyền giúp ngăn ngừa lão hóa, cung cấp độ ẩm sâu và làm sáng da.',
    full: `<p>Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium là sản phẩm cao cấp được nghiên cứu và phát triển bởi các chuyên gia hàng đầu trong lĩnh vực chăm sóc da.</p>
    <p>Với công thức độc quyền kết hợp Retinol, Hyaluronic Acid và Vitamin C, sản phẩm không chỉ cung cấp độ ẩm sâu mà còn giúp ngăn ngừa các dấu hiệu lão hóa, kích thích tái tạo tế bào và làm sáng da.</p>
    <p>Kết cấu nhẹ, thẩm thấu nhanh không gây nhờn rít, phù hợp với mọi loại da, đặc biệt là da khô và da lão hóa.</p>
    <h3>Công dụng chính:</h3>
    <ul>
      <li>Cung cấp độ ẩm sâu, ngăn ngừa tình trạng khô ráp</li>
      <li>Làm mờ nếp nhăn, tăng đàn hồi cho da</li>
      <li>Cải thiện tông màu da, làm sáng da</li>
      <li>Bảo vệ da khỏi tác hại của môi trường</li>
      <li>Kích thích tái tạo tế bào, phục hồi da hư tổn</li>
    </ul>`
  },
  seo: {
    metaTitle: 'Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium | Yumin Cosmetics',
    metaDescription: 'Kem dưỡng ẩm cao cấp với công thức độc quyền giúp ngăn ngừa lão hóa, cung cấp độ ẩm sâu và làm sáng da.',
    keywords: ['kem dưỡng ẩm', 'chống lão hóa', 'yumin', 'retinol', 'hyaluronic acid']
  },
  price: 850000,
  currentPrice: 680000,
  status: 'active',
  brandId: 'brand1',
  brand: {
    _id: 'brand1',
    name: 'Yumin Cosmetics',
    slug: 'yumin-cosmetics',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'Yumin Cosmetics Logo'
    }
  },
  categoryIds: ['cat1', 'cat2'],
  tags: ['chống lão hóa', 'dưỡng ẩm', 'làm sáng da'],
  
  cosmetic_info: {
    skinType: ['Da khô', 'Da thường', 'Da hỗn hợp'],
    concerns: ['Lão hóa', 'Khô da', 'Nếp nhăn'],
    ingredients: ['Retinol', 'Hyaluronic Acid', 'Vitamin C', 'Vitamin E', 'Ceramide', 'Peptide', 'Niacinamide'],
    volume: {
      value: 50,
      unit: 'ml'
    },
    usage: 'Sau khi rửa mặt và sử dụng toner, lấy một lượng vừa đủ kem và thoa đều lên mặt và cổ. Massage nhẹ nhàng theo chuyển động tròn để kem thẩm thấu. Sử dụng hai lần mỗi ngày, sáng và tối.',
    madeIn: 'Hàn Quốc',
    expiry: {
      shelf: 36,
      afterOpening: 12
    }
  },
  
  variants: [
    {
      variantId: 'v1',
      sku: 'YM-SK-001-50',
      options: {
        size: '50ml'
      },
      price: 680000,
      images: []
    },
    {
      variantId: 'v2',
      sku: 'YM-SK-001-100',
      options: {
        size: '100ml'
      },
      price: 1200000,
      images: []
    },
    {
      variantId: 'v3',
      sku: 'YM-SK-001-MINI',
      options: {
        size: '15ml (Mini)'
      },
      price: 250000,
      images: []
    }
  ],
  
  images: [
    {
      url: 'https://via.placeholder.com/600x600?text=Product+Image+1',
      alt: 'Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium - Hình 1',
      isPrimary: true
    },
    {
      url: 'https://via.placeholder.com/600x600?text=Product+Image+2',
      alt: 'Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium - Hình 2'
    },
    {
      url: 'https://via.placeholder.com/600x600?text=Product+Image+3',
      alt: 'Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium - Hình 3'
    },
    {
      url: 'https://via.placeholder.com/600x600?text=Product+Image+4',
      alt: 'Kem Dưỡng Ẩm Chống Lão Hóa Yumin Premium - Hình 4'
    }
  ],
  
  inventory: [
    {
      branchId: 'branch1',
      quantity: 150,
      lowStockThreshold: 20
    },
    {
      branchId: 'branch2',
      quantity: 35,
      lowStockThreshold: 30
    },
    {
      branchId: 'branch3',
      quantity: 0,
      lowStockThreshold: 10
    }
  ],
  
  reviews: {
    averageRating: 4.7,
    reviewCount: 128
  },
  
  flags: {
    isBestSeller: true,
    isNew: false,
    isOnSale: true,
    hasGifts: true
  },
  
  gifts: [
    {
      giftId: 'gift1',
      name: 'Mặt nạ dưỡng ẩm Yumin',
      description: 'Mặt nạ dưỡng ẩm cao cấp 25ml',
      image: {
        url: 'https://via.placeholder.com/100x100?text=Gift',
        alt: 'Mặt nạ dưỡng ẩm Yumin'
      },
      quantity: 1,
      value: 50000,
      type: 'sample',
      conditions: {
        minPurchaseAmount: 500000,
        minQuantity: 1,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        limitedQuantity: 1000
      },
      status: 'active'
    },
    {
      giftId: 'gift2',
      name: 'Voucher giảm giá 10%',
      description: 'Áp dụng cho lần mua hàng tiếp theo',
      image: {
        url: 'https://via.placeholder.com/100x100?text=Voucher',
        alt: 'Voucher giảm giá 10%'
      },
      quantity: 1,
      value: 100000,
      type: 'voucher',
      conditions: {
        minPurchaseAmount: 500000,
        minQuantity: 1,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        limitedQuantity: 500
      },
      status: 'active'
    }
  ],
  
  relatedProducts: ['2', '3', '4', '5'],
  relatedEvents: ['event1', 'event2'],
  relatedCampaigns: ['campaign1'],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-03-15T00:00:00Z'
};

// Mô phỏng dữ liệu đánh giá
const mockReviews = [
  {
    _id: 'review1',
    productId: '1',
    userId: 'user1',
    orderId: 'order1',
    rating: 5,
    content: 'Sản phẩm tuyệt vời! Tôi đã sử dụng được 2 tuần và thấy da mình cải thiện rõ rệt. Kem thẩm thấu nhanh, không gây nhờn rít và mùi hương rất dễ chịu. Đặc biệt là các nếp nhăn nhỏ ở đuôi mắt đã mờ đi đáng kể. Chắc chắn sẽ mua lại!',
    images: [
      {
        url: 'https://via.placeholder.com/300x300?text=Review+Image+1',
        alt: 'Hình ảnh đánh giá 1'
      },
      {
        url: 'https://via.placeholder.com/300x300?text=Review+Image+2',
        alt: 'Hình ảnh đánh giá 2'
      }
    ],
    likes: 12,
    verified: true,
    status: 'approved',
    reply: [
      {
        userId: 'admin1',
        content: 'Cảm ơn bạn đã tin tưởng và sử dụng sản phẩm của Yumin. Chúng tôi rất vui khi sản phẩm mang lại hiệu quả tốt cho bạn!',
        createdAt: '2023-03-10T10:30:00Z'
      }
    ],
    createdAt: '2023-03-05T14:22:00Z',
    updatedAt: '2023-03-10T10:30:00Z',
    user: {
      name: 'Nguyễn Thị Anh',
      avatar: 'https://via.placeholder.com/150?text=User'
    }
  },
  {
    _id: 'review2',
    productId: '1',
    userId: 'user2',
    orderId: 'order2',
    rating: 4,
    content: 'Kem dưỡng chất lượng tốt, thẩm thấu nhanh và không gây bít lỗ chân lông. Sau 1 tháng sử dụng, da mình đã mềm mịn và ẩm hơn nhiều. Chỉ tiếc là giá hơi cao một chút.',
    images: [],
    likes: 5,
    verified: true,
    status: 'approved',
    reply: [],
    createdAt: '2023-02-20T09:15:00Z',
    updatedAt: '2023-02-20T09:15:00Z',
    user: {
      name: 'Trần Văn Bình',
      avatar: ''
    }
  },
  {
    _id: 'review3',
    productId: '1',
    userId: 'user3',
    orderId: 'order3',
    rating: 5,
    content: 'Đây là lần thứ 3 mình mua sản phẩm này rồi. Thực sự rất hài lòng với hiệu quả mà nó mang lại. Da mình từ khô và có dấu hiệu lão hóa giờ đã cải thiện rõ rệt. Sẽ tiếp tục ủng hộ!',
    images: [
      {
        url: 'https://via.placeholder.com/300x300?text=Review+Image+3',
        alt: 'Hình ảnh đánh giá 3'
      }
    ],
    likes: 8,
    verified: true,
    status: 'approved',
    reply: [],
    createdAt: '2023-01-15T16:40:00Z',
    updatedAt: '2023-01-15T16:40:00Z',
    user: {
      name: 'Lê Thị Hương',
      avatar: 'https://via.placeholder.com/150?text=User3'
    }
  }
];

// Mô phỏng dữ liệu sản phẩm gợi ý
const mockRecommendedProducts = [
  {
    _id: '2',
    name: 'Serum Vitamin C Yumin',
    slug: 'serum-vitamin-c-yumin',
    price: 550000,
    currentPrice: 550000,
    image: {
      url: 'https://via.placeholder.com/300x300?text=Serum',
      alt: 'Serum Vitamin C Yumin'
    },
    brand: {
      name: 'Yumin Cosmetics',
      slug: 'yumin-cosmetics'
    },
    inStock: true,
    isNew: true,
    rating: 4.8,
    reviewCount: 95
  },
  {
    _id: '3',
    name: 'Sữa Rửa Mặt Dịu Nhẹ Yumin',
    slug: 'sua-rua-mat-diu-nhe-yumin',
    price: 320000,
    currentPrice: 280000,
    image: {
      url: 'https://via.placeholder.com/300x300?text=Cleanser',
      alt: 'Sữa Rửa Mặt Dịu Nhẹ Yumin'
    },
    brand: {
      name: 'Yumin Cosmetics',
      slug: 'yumin-cosmetics'
    },
    inStock: true,
    isNew: false,
    rating: 4.6,
    reviewCount: 120
  },
  {
    _id: '4',
    name: 'Mặt Nạ Dưỡng Ẩm Yumin',
    slug: 'mat-na-duong-am-yumin',
    price: 45000,
    currentPrice: 45000,
    image: {
      url: 'https://via.placeholder.com/300x300?text=Mask',
      alt: 'Mặt Nạ Dưỡng Ẩm Yumin'
    },
    brand: {
      name: 'Yumin Cosmetics',
      slug: 'yumin-cosmetics'
    },
    inStock: true,
    isNew: false,
    rating: 4.5,
    reviewCount: 210
  },
  {
    _id: '5',
    name: 'Kem Chống Nắng Yumin SPF50+',
    slug: 'kem-chong-nang-yumin-spf50',
    price: 420000,
    currentPrice: 380000,
    image: {
      url: 'https://via.placeholder.com/300x300?text=Sunscreen',
      alt: 'Kem Chống Nắng Yumin SPF50+'
    },
    brand: {
      name: 'Yumin Cosmetics',
      slug: 'yumin-cosmetics'
    },
    inStock: false,
    isNew: false,
    rating: 4.9,
    reviewCount: 150
  }
];

// Mô phỏng dữ liệu chi nhánh
const mockBranches = [
  {
    _id: 'branch1',
    name: 'Yumin Quận 1',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    phone: '028 1234 5678'
  },
  {
    _id: 'branch2',
    name: 'Yumin Quận 3',
    address: '456 Võ Văn Tần, Quận 3, TP.HCM',
    phone: '028 8765 4321'
  },
  {
    _id: 'branch3',
    name: 'Yumin Quận 7',
    address: '789 Nguyễn Thị Thập, Quận 7, TP.HCM',
    phone: '028 2468 1357'
  }
];

// Mô phỏng dữ liệu danh mục
const mockCategories = [
  {
    _id: 'cat1',
    name: 'Chăm sóc da',
    slug: 'cham-soc-da'
  },
  {
    _id: 'cat2',
    name: 'Chống lão hóa',
    slug: 'chong-lao-hoa'
  }
];

// Mô phỏng dữ liệu sự kiện
const mockEvents = [
  {
    _id: 'event1',
    name: 'Mùa hè rực rỡ',
    slug: 'mua-he-ruc-ro',
    description: 'Giảm giá 20% cho tất cả sản phẩm chống nắng và dưỡng ẩm',
    image: {
      url: 'https://via.placeholder.com/300x200?text=Summer+Event',
      alt: 'Sự kiện mùa hè'
    },
    startDate: '2023-06-01T00:00:00Z',
    endDate: '2023-08-31T23:59:59Z',
    discount: {
      type: 'percentage' as 'percentage' | 'fixed',
      value: 20
    }
  }
];

// Mô phỏng dữ liệu chiến dịch
const mockCampaigns = [
  {
    _id: 'campaign1',
    name: 'Chào mừng thành viên mới',
    slug: 'chao-mung-thanh-vien-moi',
    description: 'Giảm 50.000đ cho đơn hàng đầu tiên',
    image: {
      url: 'https://via.placeholder.com/300x200?text=Welcome+Campaign',
      alt: 'Chiến dịch chào mừng'
    },
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    discount: {
      type: 'fixed' as 'percentage' | 'fixed',
      value: 50000
    }
  }
];

interface ProductPageProps {
  product: typeof mockProduct;
  reviews: typeof mockReviews;
  recommendedProducts: typeof mockRecommendedProducts;
  branches: typeof mockBranches;
  categories: typeof mockCategories;
  events: typeof mockEvents;
  campaigns: typeof mockCampaigns;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}

const ProductPage: React.FC<ProductPageProps> = ({
  product,
  reviews,
  recommendedProducts,
  branches,
  categories,
  events,
  campaigns,
  isAuthenticated,
  hasPurchased,
  hasReviewed,
}) => {
  const router = useRouter();
  
  // Xử lý thêm vào danh sách yêu thích
  const handleAddToWishlist = (product: any) => {
    // Xử lý thêm vào danh sách yêu thích
  };

  return (
    <DefaultLayout>
      {/* SEO */}
      <ProductSEO 
        seo={product.seo} 
        product={product} 
        categories={categories}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Nút quay lại */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-[#d53f8c] transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Thông tin sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-6 shadow-sm">
          {/* Ảnh sản phẩm */}
          <div className="space-y-6">
            <ProductImages images={product.images} productName={product.name} />
            
            {/* Thông tin nhanh về sản phẩm (đã di chuyển) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Thông tin nhanh:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loại da:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.cosmetic_info.skinType.map((type, index) => (
                      <span key={index} className="px-2 py-1 bg-[#fdf2f8] text-[#d53f8c] text-xs rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dung tích:</p>
                  <p className="text-sm font-medium">
                    {product.cosmetic_info.volume.value} {product.cosmetic_info.volume.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Xuất xứ:</p>
                  <p className="text-sm font-medium">{product.cosmetic_info.madeIn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hạn sử dụng:</p>
                  <p className="text-sm font-medium">
                    {product.cosmetic_info.expiry.shelf} tháng
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin chi tiết */}
          <div className="space-y-8">
            <ProductInfo
              _id={product._id}
              name={product.name}
              sku={product.sku}
              description={{ short: product.description.short }}
              price={product.price}
              currentPrice={product.currentPrice}
              status={product.status}
              brand={product.brand}
              cosmetic_info={product.cosmetic_info}
              variants={product.variants}
              flags={product.flags}
              gifts={product.gifts}
              reviews={product.reviews}
            />
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Tồn kho theo chi nhánh */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductInventory 
              inventory={product.inventory} 
              branches={branches} 
            />
          </div>
          
          {/* Khuyến mãi đang áp dụng */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductPromotions 
              events={events} 
              campaigns={campaigns} 
            />
          </div>
          
          {/* Danh mục và tags */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductCategories 
              categories={categories} 
              tags={product.tags} 
            />
          </div>
        </div>

        {/* Mô tả sản phẩm */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <ProductDescription
            fullDescription={product.description.full}
            cosmeticInfo={product.cosmetic_info}
          />
        </div>

        {/* Đánh giá sản phẩm */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <ProductReviews
            productId={product._id}
            reviews={reviews}
            averageRating={product.reviews.averageRating}
            reviewCount={product.reviews.reviewCount}
            isAuthenticated={isAuthenticated}
            hasPurchased={hasPurchased}
            hasReviewed={hasReviewed}
          />
        </div>

        {/* Sản phẩm gợi ý */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <RecommendedProducts
            products={recommendedProducts}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>
      </main>

      <ToastContainer />
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Trong thực tế, bạn sẽ lấy dữ liệu từ API dựa trên slug
  const { slug } = context.params || {};

  // Mô phỏng việc lấy dữ liệu từ API
  // Trong thực tế, bạn sẽ gọi API để lấy dữ liệu sản phẩm, đánh giá và sản phẩm gợi ý
  
  return {
    props: {
      product: mockProduct,
      reviews: mockReviews,
      recommendedProducts: mockRecommendedProducts,
      branches: mockBranches,
      categories: mockCategories,
      events: mockEvents,
      campaigns: mockCampaigns,
      isAuthenticated: true, // Mô phỏng người dùng đã đăng nhập
      hasPurchased: true, // Mô phỏng người dùng đã mua sản phẩm
      hasReviewed: false, // Mô phỏng người dùng chưa đánh giá
    },
  };
};

export default ProductPage; 