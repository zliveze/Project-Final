import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingBag } from 'react-icons/fi';

const EmptyCart: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center mb-6">
        <FiShoppingBag className="w-16 h-16 text-pink-500 opacity-50" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Giỏ hàng của bạn đang trống</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi và tìm thấy những gì phù hợp với bạn.
      </p>
      
      <Link href="/shop">
        <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition-opacity font-medium">
          Tiếp tục mua sắm
        </button>
      </Link>
      
      {/* Gợi ý sản phẩm phổ biến */}
      <div className="mt-12 w-full max-w-4xl">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Sản phẩm phổ biến</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-pink-600 font-medium text-sm mt-1">
                    {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dữ liệu mẫu cho sản phẩm phổ biến
const popularProducts = [
  {
    id: 1,
    name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400',
    slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
    price: 405000,
    image: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
  },
  {
    id: 2,
    name: 'Serum Vitamin C Klairs Freshly Juiced Vitamin Drop',
    slug: 'serum-vitamin-c-klairs-freshly-juiced-vitamin-drop',
    price: 320000,
    image: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
  },
  {
    id: 3,
    name: 'Nước Tẩy Trang Bioderma Sensibio H2O',
    slug: 'nuoc-tay-trang-bioderma-sensibio-h2o',
    price: 350000,
    image: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
  },
  {
    id: 4,
    name: 'Kem Dưỡng Ẩm CeraVe Moisturizing Cream',
    slug: 'kem-duong-am-cerave-moisturizing-cream',
    price: 315000,
    image: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
  },
];

export default EmptyCart; 