import React, { useState } from 'react';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiShare2, FiAward, FiGift, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ProductVariants, { Variant } from './ProductVariants'; // Variant is already imported
import Link from 'next/link';
import Image from 'next/image';
import { checkAuth } from '@/utils/auth';

interface Gift {
  giftId: string;
  name: string;
  description: string;
  image: {
    url: string;
    alt: string;
  };
  quantity: number;
  value: number;
  type: string;
  conditions: {
    minPurchaseAmount: number;
    minQuantity: number;
    startDate: string;
    endDate: string;
    limitedQuantity: number;
  };
  status: string;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface ProductInfoProps {
  _id: string;
  name: string;
  sku: string;
  description: {
    short: string;
  };
  price: number;
  currentPrice: number;
  status: string;
  brand: Brand;
  cosmetic_info: {
    skinType: string[];
    concerns: string[];
    ingredients: string[];
    volume: {
      value: number;
      unit: string;
    };
    madeIn: string;
  };
  variants: Variant[];
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  gifts: Gift[];
  reviews: {
    averageRating: number;
    reviewCount: number;
  };
  // Add props for selected variant state management
  selectedVariant: Variant | null;
  onSelectVariant: (variant: Variant | null) => void; 
}

// Re-export Variant type for use in [slug].tsx
export type { Variant }; 

const ProductInfo: React.FC<ProductInfoProps> = ({
  _id,
  name,
  sku,
  description,
  price,
  currentPrice,
  status,
  brand,
  cosmetic_info,
  variants,
  flags,
  gifts,
  reviews,
  // Destructure the new props
  selectedVariant, 
  onSelectVariant, 
}) => {
  const [quantity, setQuantity] = useState(1);
  // Remove local state for selectedVariant, use the prop instead
  // const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
  //   variants.length > 0 ? variants[0] : null
  // ); 
  const [showGifts, setShowGifts] = useState(false);

  const inStock = status === 'active';
  const discount = price > currentPrice ? Math.round(((price - currentPrice) / price) * 100) : 0;

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    setQuantity(value);
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!inStock) {
      toast.error('Sản phẩm hiện đang hết hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
      return;
    }
    
    // Kiểm tra đăng nhập trước khi thực hiện
    const isLoggedIn = checkAuth(
      undefined, 
      true, 
      'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'
    );
    
    if (!isLoggedIn) {
      return;
    }
    
    try {
      // Định nghĩa API_URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Lấy token từ cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      // Chuẩn bị data để gửi lên server
      const cartItem = {
        productId: _id,
        quantity: quantity,
        variantId: selectedVariant?.variantId || null
      };
      
      // Gọi API để thêm vào giỏ hàng
      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cartItem)
      });
      
      if (response.ok) {
        // Thêm thành công
        toast.success('Đã thêm sản phẩm vào giỏ hàng', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
          style: { backgroundColor: '#fdf2f8', color: '#d53f8c', borderLeft: '4px solid #d53f8c' }
        });
        
        // Cập nhật số lượng trong giỏ hàng (nếu đang sử dụng context hoặc state toàn cục)
        // Dispatch một event để header cập nhật số lượng trong giỏ hàng
        const event = new CustomEvent('cart:updated');
        window.dispatchEvent(event);
      } else {
        // Xử lý lỗi
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể thêm vào giỏ hàng', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
          style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Đã xảy ra lỗi khi thêm vào giỏ hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
    }
  };

  // Xử lý thêm vào danh sách yêu thích
  const handleAddToWishlist = async () => {
    // Kiểm tra đăng nhập trước khi thực hiện
    const isLoggedIn = checkAuth(
      undefined, 
      true, 
      'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích'
    );
    
    if (!isLoggedIn) {
      return;
    }
    
    try {
      // Định nghĩa API_URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Lấy token từ cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      // Gọi API để thêm vào danh sách yêu thích
      const response = await fetch(`${API_URL}/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: _id })
      });
      
      if (response.ok) {
        // Thêm thành công
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
          style: { backgroundColor: '#fdf2f8', color: '#d53f8c', borderLeft: '4px solid #d53f8c' }
        });
        
        // Dispatch một event để cập nhật UI nếu cần
        const event = new CustomEvent('wishlist:updated');
        window.dispatchEvent(event);
      } else {
        // Kiểm tra xem sản phẩm đã có trong wishlist chưa
        const errorData = await response.json();
        
        if (response.status === 409) {
          // Sản phẩm đã tồn tại trong wishlist
          toast.info('Sản phẩm đã có trong danh sách yêu thích của bạn', {
            position: "bottom-right",
            autoClose: 3000,
            theme: "light",
            style: { backgroundColor: '#e3f2fd', color: '#0d47a1', borderLeft: '4px solid #0d47a1' }
          });
        } else {
          // Lỗi khác
          toast.error(errorData.message || 'Không thể thêm vào danh sách yêu thích', {
            position: "bottom-right",
            autoClose: 3000,
            theme: "light",
            style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
          });
        }
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Đã xảy ra lỗi khi thêm vào danh sách yêu thích', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
    }
  };

  // Xử lý chia sẻ sản phẩm
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: name,
        text: description.short,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép đường dẫn sản phẩm', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#d53f8c', borderLeft: '4px solid #d53f8c' }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Thương hiệu */}
      <div className="flex items-center">
        <Link href={`/brands/${brand.slug}`} className="text-[#d53f8c] text-sm font-medium hover:underline">
          {brand.name}
        </Link>
        {flags.isBestSeller && (
          <div className="ml-3 flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
            <FiAward className="mr-1" />
            <span>Bán chạy nhất</span>
          </div>
        )}
        {flags.isNew && (
          <div className="ml-3 flex items-center text-blue-500 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
            <span>Mới</span>
          </div>
        )}
      </div>

      {/* Tên sản phẩm */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{name}</h1>

      {/* Mô tả ngắn */}
      <p className="text-gray-600 leading-relaxed">{description.short}</p>

      {/* Đánh giá */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-4 h-4 ${i < Math.floor(reviews.averageRating) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
          <span className="ml-2 text-gray-600 text-sm">{reviews.averageRating.toFixed(1)}</span>
        </div>
        <span className="text-gray-400">|</span>
        <Link href="#reviews" className="text-sm text-gray-600 hover:text-[#d53f8c] hover:underline">
          {reviews.reviewCount} đánh giá
        </Link>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-600">SKU: {sku}</span>
      </div>

      {/* Giá */}
      <div className="flex items-end space-x-3 mt-2">
        <span className="text-2xl md:text-3xl font-bold text-[#d53f8c]">
          {currentPrice.toLocaleString('vi-VN')}đ
        </span>
        {discount > 0 && (
          <>
            <span className="text-lg text-gray-400 line-through">
              {price.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
              -{discount}%
            </span>
          </>
        )}
      </div>

      {/* Biến thể sản phẩm */}
      {variants.length > 0 && (
        <div className="pt-4">
          <ProductVariants
            variants={variants}
            selectedVariant={selectedVariant} // Pass down the prop
            onSelectVariant={onSelectVariant} // Pass down the handler prop
          />
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start">
            <span className="text-gray-600 text-sm min-w-[100px]">Loại da:</span>
            <div className="flex flex-wrap gap-1">
              {cosmetic_info.skinType.map((type, index) => (
                <span key={index} className="text-sm text-gray-800 bg-white px-2 py-1 rounded-full border border-gray-200">
                  {type}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-gray-600 text-sm min-w-[100px]">Vấn đề da:</span>
            <div className="flex flex-wrap gap-1">
              {cosmetic_info.concerns.map((concern, index) => (
                <span key={index} className="text-sm text-gray-800 bg-white px-2 py-1 rounded-full border border-gray-200">
                  {concern}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-gray-600 text-sm min-w-[100px]">Dung tích:</span>
          <span className="text-gray-800 text-sm">
            {cosmetic_info.volume.value} {cosmetic_info.volume.unit}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-600 text-sm min-w-[100px]">Xuất xứ:</span>
          <span className="text-gray-800 text-sm">{cosmetic_info.madeIn}</span>
        </div>
      </div>

      {/* Quà tặng */}
      {flags.hasGifts && gifts.length > 0 && (
        <div className="border border-[#fdf2f8] rounded-lg p-4 bg-[#fdf2f8] bg-opacity-20">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowGifts(!showGifts)}
          >
            <div className="flex items-center text-[#d53f8c] font-medium">
              <FiGift className="mr-2" />
              <span>Quà tặng kèm khi mua sản phẩm</span>
            </div>
            <span className="text-[#d53f8c]">{showGifts ? '−' : '+'}</span>
          </div>
          
          {showGifts && (
            <div className="mt-3 space-y-2">
              {gifts.map((gift) => (
                <div key={gift.giftId} className="flex items-center space-x-3 bg-white p-2 rounded-md">
                  <div className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-md overflow-hidden border border-gray-200">
                    <Image 
                      src={gift.image.url}
                      alt={gift.image.alt}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{gift.name}</div>
                    <div className="text-xs text-gray-500 leading-tight">{gift.description}</div>
                  </div>
                  <div className="text-xs font-medium text-[#d53f8c]">
                    {gift.value.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 pt-1">
                * Áp dụng cho đơn hàng từ {gifts[0].conditions.minPurchaseAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>
          )}
        </div>
      )}

      {/* Số lượng và nút mua hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-2">
        {/* Số lượng */}
        <div className="flex items-center h-12 border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-[#d53f8c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiMinus />
          </button>
          <div className="flex-1 h-full flex items-center justify-center text-gray-800 font-medium">
            {quantity}
          </div>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-[#d53f8c]"
          >
            <FiPlus />
          </button>
        </div>

        {/* Button thêm vào giỏ hàng */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`lg:col-span-2 h-12 rounded-md font-medium text-white 
            ${inStock 
              ? 'bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1]' 
              : 'bg-gray-300 cursor-not-allowed'
            } transition-colors duration-300 flex items-center justify-center space-x-2`}
        >
          <FiShoppingCart className="w-4 h-4" />
          <span>{inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}</span>
        </button>

        {/* Button yêu thích */}
        <button
          onClick={handleAddToWishlist}
          className="h-12 border border-gray-300 rounded-md font-medium text-gray-700 hover:text-[#d53f8c] hover:border-[#d53f8c] transition-colors duration-300 flex items-center justify-center"
        >
          <FiHeart className="w-4 h-4" />
        </button>
      </div>

      {/* Nút chia sẻ */}
      <button
        onClick={handleShare}
        className="text-gray-600 hover:text-[#d53f8c] flex items-center text-sm font-medium"
      >
        <FiShare2 className="mr-1" />
        <span>Chia sẻ sản phẩm</span>
      </button>
    </div>
  );
};

export default ProductInfo;
