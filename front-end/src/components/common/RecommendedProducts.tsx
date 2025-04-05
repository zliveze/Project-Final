import React, { useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart, FiStar, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { ProductContext } from '@/contexts';

// Định nghĩa kiểu dữ liệu cho sản phẩm gợi ý
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  image?: {
    url: string;
    alt: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
  brand?: {
    name: string;
    slug: string;
  };
  brandId?: string;
  status?: string;
  isNew?: boolean;
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
}

interface RecommendedProductsProps {
  products: Product[];
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ products }) => {
  const productContext = useContext(ProductContext);
  
  // Sử dụng các hàm từ context hoặc tạo hàm placeholder nếu context không tồn tại
  const addToCart = productContext?.addToCart || ((productId: string, quantity: number) => {
    console.warn('ProductContext không được tìm thấy. Không thể thêm vào giỏ hàng.');
    toast.error('Chức năng thêm vào giỏ hàng tạm thời không khả dụng', {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light"
    });
    return Promise.resolve(false);
  });
  
  const addToWishlist = productContext?.addToWishlist || ((productId: string) => {
    console.warn('ProductContext không được tìm thấy. Không thể thêm vào danh sách yêu thích.');
    toast.error('Chức năng thêm vào danh sách yêu thích tạm thời không khả dụng', {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light"
    });
    return Promise.resolve(false);
  });
  
  // Lấy ảnh đại diện cho sản phẩm
  const getProductImage = (product: Product) => {
    if (product.image && product.image.url) {
      return {
        url: product.image.url,
        alt: product.image.alt || product.name
      };
    }
    
    // Tìm ảnh primary nếu có
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      if (primaryImage) {
        return {
          url: primaryImage.url,
          alt: primaryImage.alt || product.name
        };
      }
      
      // Nếu không có ảnh primary, lấy ảnh đầu tiên
      return {
        url: product.images[0].url,
        alt: product.images[0].alt || product.name
      };
    }
    
    // Ảnh mặc định nếu không có ảnh
    return {
      url: 'https://via.placeholder.com/300x300?text=No+Image',
      alt: 'Không có ảnh'
    };
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
        {products.map((product) => {
          const inStock = product.status === 'active';
          const imageData = getProductImage(product);
          const rating = product.reviews?.averageRating || 0;
          const reviewCount = product.reviews?.reviewCount || 0;
          
          return (
            <div 
              key={product._id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
            >
              {/* Ảnh sản phẩm */}
              <div className="relative h-52 overflow-hidden">
                <Link href={`/product/${product.slug}`}>
                  <Image
                    src={imageData.url}
                    alt={imageData.alt}
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
                {!inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                      Hết hàng
                    </span>
                  </div>
                )}
                
                {/* Các nút tương tác */}
                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => addToWishlist(product._id)}
                    className="p-2 rounded-full bg-white text-gray-600 hover:text-pink-600 shadow-md transition-colors hover:scale-110 duration-200"
                    title="Thêm vào danh sách yêu thích"
                  >
                    <FiHeart className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => addToCart(product._id, 1)}
                    disabled={!inStock}
                    className={`p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110 ${
                      inStock
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
                {product.brand && (
                  <Link 
                    href={`/brands/${product.brand.slug}`}
                    className="text-xs text-pink-600 font-medium hover:underline"
                  >
                    {product.brand.name}
                  </Link>
                )}
                
                {/* Tên sản phẩm */}
                <Link href={`/product/${product.slug}`}>
                  <h3 className="mt-1 text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors duration-200">
                    {product.name}
                  </h3>
                </Link>
                
                {/* Đánh giá */}
                {rating > 0 && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center text-pink-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs text-gray-500">
                      ({reviewCount})
                    </span>
                  </div>
                )}
                
                {/* Giá */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-end gap-1">
                    <span className="text-sm font-bold text-pink-600">
                      {product.currentPrice?.toLocaleString('vi-VN') || product.price?.toLocaleString('vi-VN')}đ
                    </span>
                    
                    {product.price > (product.currentPrice || 0) && product.currentPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                  
                  {product.price > (product.currentPrice || 0) && product.currentPrice && (
                    <span className="text-xs font-medium text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full">
                      -{Math.round(((product.price - product.currentPrice) / product.price) * 100)}%
                    </span>
                  )}
                </div>
                
                {/* Nút mua hàng (hiển thị khi hover) */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => addToCart(product._id, 1)}
                    disabled={!inStock}
                    className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      inStock
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProducts; 