import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

interface CartItemProps {
  _id: string; // Keep _id if CartPage still passes variantId as _id
  productId: string;
  variantId: string; // Make variantId required
  name: string;
  slug: string;
  image: {
    url: string;
    alt: string;
  };
  brand: {
    name: string;
    slug: string;
  };
  price: number;
  originalPrice?: number;
  quantity: number;
  selectedOptions?: {
    color?: string;
    size?: string;
  };
  inStock: boolean;
  maxQuantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  _id, // Keep _id if needed, but variantId is the primary identifier now
  productId,
  variantId, // Destructure variantId
  name,
  slug,
  image,
  brand,
  price,
  originalPrice,
  quantity,
  selectedOptions,
  inStock,
  maxQuantity,
  onUpdateQuantity,
  onRemove
}) => {
  // Xử lý tăng số lượng - Pass variantId
  const handleIncreaseQuantity = () => {
    if (quantity < maxQuantity) {
      onUpdateQuantity(variantId, quantity + 1); // Use variantId
    }
  };

  // Xử lý giảm số lượng - Pass variantId
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(variantId, quantity - 1); // Use variantId
    }
  };

  // Tính tổng giá của sản phẩm
  const itemTotal = price * quantity;

  // Tính số tiền tiết kiệm nếu có giá gốc
  const savedAmount = originalPrice ? (originalPrice - price) * quantity : 0;
  const discountPercentage = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className={`flex flex-col md:flex-row py-4 border-b border-gray-200 ${!inStock ? 'opacity-70' : ''}`}>
      {/* Ảnh sản phẩm */}
      <div className="md:w-24 md:h-24 w-full h-32 relative mb-3 md:mb-0 flex-shrink-0">
        <Link href={`/products/${slug}`}>
          <div className="relative w-full h-full">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover rounded-md"
            />
          </div>
        </Link>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="md:ml-4 flex-grow">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-grow">
            <Link href={`/brands/${brand.slug}`} className="text-xs text-gray-500 hover:text-pink-600">
              {brand.name}
            </Link>
            
            <Link href={`/products/${slug}`}>
              <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-pink-600 transition-colors">
                {name}
              </h3>
            </Link>
            
            {/* Hiển thị tùy chọn đã chọn */}
            {selectedOptions && (
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedOptions.color && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    Màu: {selectedOptions.color}
                  </span>
                )}
                {selectedOptions.size && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    Kích thước: {selectedOptions.size}
                  </span>
                )}
              </div>
            )}
            
            {/* Trạng thái tồn kho */}
            {!inStock && (
              <div className="mt-1">
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  Hết hàng
                </span>
              </div>
            )}
          </div>
          
          {/* Giá và số lượng - hiển thị trên mobile */}
          <div className="mt-2 md:hidden">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1 || !inStock}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    quantity <= 1 || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
                  }`}
                >
                  <FiMinus size={14} />
                </button>
                <span className="mx-2 w-8 text-center text-sm">{quantity}</span>
                <button
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= maxQuantity || !inStock}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    quantity >= maxQuantity || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
                  }`}
                >
                  <FiPlus size={14} />
                </button>
              </div>
              <button
                onClick={() => onRemove(variantId)} // Use variantId
                className="ml-4 p-2 text-gray-400 hover:text-pink-600 transition-colors"
                title="Xóa sản phẩm"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Giá và số lượng - hiển thị trên desktop */}
      <div className="hidden md:flex items-center space-x-4 ml-4">
        {/* Số lượng */}
        <div className="flex items-center">
          <button
            onClick={handleDecreaseQuantity}
            disabled={quantity <= 1 || !inStock}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              quantity <= 1 || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
            }`}
          >
            <FiMinus size={14} />
          </button>
          <span className="mx-2 w-8 text-center text-sm">{quantity}</span>
          <button
            onClick={handleIncreaseQuantity}
            disabled={quantity >= maxQuantity || !inStock}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              quantity >= maxQuantity || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
            }`}
          >
            <FiPlus size={14} />
          </button>
        </div>

        {/* Giá */}
        <div className="w-28 text-right">
          <div className="text-pink-600 font-medium">
            {new Intl.NumberFormat('vi-VN').format(itemTotal)}đ
          </div>
          {originalPrice && originalPrice > price && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400 line-through">
                {new Intl.NumberFormat('vi-VN').format(originalPrice * quantity)}đ
              </span>
              <span className="text-xs text-pink-500">
                Tiết kiệm {new Intl.NumberFormat('vi-VN').format(savedAmount)}đ (-{discountPercentage}%)
              </span>
            </div>
          )}
        </div>

        {/* Nút xóa */}
        <button
          onClick={() => onRemove(variantId)} // Use variantId
          className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
          title="Xóa sản phẩm"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
