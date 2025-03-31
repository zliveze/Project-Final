import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiShoppingCart, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong wishlist
interface WishlistItemProps {
  _id: string;
  variantId?: string;
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
  onRemove: (id: string) => void;
}

const WishlistItem: React.FC<WishlistItemProps> = ({
  _id,
  variantId,
  name,
  slug,
  price,
  currentPrice,
  image,
  brand,
  inStock,
  onRemove
}) => {
  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!inStock) {
      toast.error('Sản phẩm hiện đang hết hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
      return;
    }
    
    // Thêm vào giỏ hàng (sẽ được xử lý bởi context hoặc API call)
    toast.success('Đã thêm sản phẩm vào giỏ hàng', {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center p-4 border-b border-gray-200 gap-4 group hover:bg-gray-50 transition-colors">
      {/* Ảnh sản phẩm */}
      <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-md">
        <Link href={`/products/${slug}`}>
          <div className="w-full h-full relative">
            <Image 
              src={image.url} 
              alt={image.alt} 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badge giảm giá nếu có */}
            {currentPrice < price && (
              <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-medium px-1.5 py-0.5">
                -{Math.round((1 - currentPrice / price) * 100)}%
              </div>
            )}
          </div>
        </Link>
      </div>
      
      {/* Thông tin sản phẩm */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${slug}`} className="block group-hover:text-pink-600 transition-colors">
          <h3 className="text-base font-medium text-gray-800 truncate">{name}</h3>
        </Link>
        <Link href={`/brands/${brand.slug}`} className="text-sm text-gray-500 hover:text-pink-600">
          {brand.name}
        </Link>
        
        {/* Giá */}
        <div className="mt-1 flex items-center">
          <span className="text-pink-600 font-semibold">
            {new Intl.NumberFormat('vi-VN').format(currentPrice)}đ
          </span>
          
          {currentPrice < price && (
            <span className="ml-2 text-gray-400 line-through text-sm">
              {new Intl.NumberFormat('vi-VN').format(price)}đ
            </span>
          )}
        </div>
        
        {/* Trạng thái */}
        <div className="mt-1">
          {inStock ? (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Còn hàng
            </span>
          ) : (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Hết hàng
            </span>
          )}
        </div>
      </div>
      
      {/* Các nút tương tác */}
      <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
        <button 
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`p-2 rounded-full ${
            inStock 
              ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-sm' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Thêm vào giỏ hàng"
        >
          <FiShoppingCart className="w-5 h-5" />
        </button>
        
        <Link 
          href={`/products/${slug}`}
          className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 shadow-sm transition-colors"
          title="Xem chi tiết"
        >
          <FiEye className="w-5 h-5" />
        </Link>
        
        <button 
          onClick={() => onRemove(_id)}
          className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 shadow-sm transition-colors"
          title="Xóa khỏi danh sách yêu thích"
        >
          <FiTrash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default WishlistItem; 