import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart, FiStar, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Định nghĩa kiểu dữ liệu cho sản phẩm gợi ý
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  image: {
    url: string;
    alt: string;
  };
  brand: {
    name: string;
    slug: string;
  };
  inStock: boolean;
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
}

interface RecommendedProductsProps {
  products: Product[];
  onAddToWishlist: (product: Product) => void;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ products, onAddToWishlist }) => {
  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      toast.error('Sản phẩm hiện đang hết hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
      return;
    }
    
    toast.success('Đã thêm sản phẩm vào giỏ hàng', {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Có thể bạn cũng thích</h2>
        <Link 
          href="/shop" 
          className="flex items-center text-pink-600 hover:underline text-sm font-medium group transition-all duration-200"
        >
          <span>Xem thêm</span>
          <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
          >
            {/* Ảnh sản phẩm */}
            <div className="relative h-52 overflow-hidden">
              <Link href={`/products/${product.slug}`}>
                <Image
                  src={product.image.url}
                  alt={product.image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              
              {/* Badge cho sản phẩm mới */}
              {product.isNew && (
                <div className="absolute top-3 left-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Mới
                </div>
              )}
              
              {/* Badge cho sản phẩm hết hàng */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                    Hết hàng
                  </span>
                </div>
              )}
              
              {/* Các nút tương tác */}
              <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => onAddToWishlist(product)}
                  className="p-2 rounded-full bg-white text-gray-600 hover:text-pink-600 shadow-md transition-colors hover:scale-110 duration-200"
                  title="Thêm vào danh sách yêu thích"
                >
                  <FiHeart className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className={`p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110 ${
                    product.inStock
                      ? 'bg-white text-gray-600 hover:text-pink-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Thêm vào giỏ hàng"
                >
                  <FiShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Thông tin sản phẩm */}
            <div className="p-4">
              {/* Thương hiệu */}
              <Link 
                href={`/brands/${product.brand.slug}`}
                className="text-xs text-pink-600 font-medium hover:underline"
              >
                {product.brand.name}
              </Link>
              
              {/* Tên sản phẩm */}
              <Link href={`/products/${product.slug}`}>
                <h3 className="mt-1 text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors duration-200">
                  {product.name}
                </h3>
              </Link>
              
              {/* Đánh giá */}
              {product.rating && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center text-pink-400">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-gray-500">
                    ({product.reviewCount})
                  </span>
                </div>
              )}
              
              {/* Giá */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-end gap-1">
                  <span className="text-sm font-bold text-pink-600">
                    {product.currentPrice.toLocaleString('vi-VN')}đ
                  </span>
                  
                  {product.price > product.currentPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {product.price.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>
                
                {product.price > product.currentPrice && (
                  <span className="text-xs font-medium text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full">
                    -{Math.round(((product.price - product.currentPrice) / product.price) * 100)}%
                  </span>
                )}
              </div>
              
              {/* Nút mua hàng (hiển thị khi hover) */}
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                    product.inStock
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProducts; 