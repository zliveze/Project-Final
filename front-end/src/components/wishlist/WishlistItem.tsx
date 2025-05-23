import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiShoppingCart, FiEye, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { formatImageUrl } from '@/utils/imageUtils';
import { useCart } from '@/contexts/user/cart/CartContext'; // Import useCart
import { VariantOptions } from '@/contexts/user/wishlist/WishlistContext'; // Import VariantOptions interface

// Updated props to receive productId and variantId
interface WishlistItemProps {
  productId: string; // Changed from _id
  variantId: string;
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
    logo?: string; // Optional logo
  } | null; // Allow brand to be null
  inStock: boolean;
  onRemove: (productId: string, variantId: string) => void; // Updated onRemove signature
  variantOptions?: VariantOptions; // Optional variant options
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
}

const WishlistItem: React.FC<WishlistItemProps> = ({
  productId, // Use productId
  variantId,
  name,
  slug,
  price,
  currentPrice,
  image,
  brand,
  inStock,
  onRemove,
  variantOptions, // Destructure variantOptions
  originalPrice,
  rating,
  reviewCount,
  isOnSale
}) => {
  const { addItemToCart } = useCart(); // Use cart context
  const [imageError, setImageError] = useState(false);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => { // Make async
    if (!inStock) {
      toast.error('Sản phẩm hiện đang hết hàng.', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fef2f2', color: '#dc2626', borderLeft: '4px solid #dc2626' }
      });
      return;
    }

    // Construct options object for the backend DTO based on variantOptions
    const optionsForBackend: Record<string, string> = {};
    if (variantOptions?.color) {
        // Assuming color might be like "Color Name \"#hex\""
         const colorMatch = (variantOptions.color as string).match(/^(.*?)(?:\s*"(#[0-9a-fA-F]{6})")?$/);
         if (colorMatch) optionsForBackend['Color'] = colorMatch[1].trim();
    }
    if (variantOptions?.sizes && Array.isArray(variantOptions.sizes) && variantOptions.sizes.length > 0) {
        optionsForBackend['Size'] = variantOptions.sizes[0]; // Assuming first size
    }
     if (variantOptions?.shades && Array.isArray(variantOptions.shades) && variantOptions.shades.length > 0) {
        optionsForBackend['Shade'] = variantOptions.shades[0]; // Assuming first shade
    }


    // Add item to cart using context
    await addItemToCart(productId, variantId, 1, optionsForBackend); // Add 1 item

    // Toast messages are handled by the context
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const discountPercentage = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Determine display name (potentially include variant info)
  // Example: "Product Name - Red, 50ml"
  const displayName = name; // Keep it simple for now, or construct based on variantOptions

  return (
    <div className="flex flex-col sm:flex-row items-center p-4 border-b border-gray-100 gap-4 group hover:bg-gray-50 transition-colors">
      {/* Ảnh sản phẩm */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-100">
        <Link href={`/product/${slug}`}>
          <div className="w-full h-full relative">
            <Image
              src={imageError ? '/404.png' : formatImageUrl(image.url)}
              alt={image.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
            />

            {/* Badge giảm giá nếu có */}
            {currentPrice < price && (
              <div className="absolute top-1 right-1 bg-pink-500 text-white text-[10px] font-medium px-1 py-0.5 rounded">
                -{Math.round((1 - currentPrice / price) * 100)}%
              </div>
            )}

            {/* Badges */}
            {isOnSale && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Sale
              </div>
            )}
            
            {!inStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="bg-white text-gray-800 text-xs px-2 py-1 rounded">
                  Hết hàng
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        {brand && (
          <Link href={`/brands/${brand.slug}`} className="text-xs text-gray-500 hover:text-pink-600 uppercase tracking-wide">
            {brand.name}
          </Link>
        )}
        <Link href={`/product/${slug}`} className="block group-hover:text-pink-600 transition-colors mt-0.5">
          <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-2">{displayName}</h3>
        </Link>
         {/* Display selected variant attributes */}
         {variantOptions && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {/* Display all selected attributes as pills */}
                {Object.entries(variantOptions).map(([key, value]) => {
                    // Skip empty values
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;

                    // Handle color specially to extract the color name without hex code
                    if (key === 'color') {
                        const colorMatch = (value as string).match(/^(.*?)(?:\s*"(#[0-9a-fA-F]{6})")?$/);
                        const colorName = colorMatch ? colorMatch[1].trim() : value as string;
                        const colorHex = colorMatch && colorMatch[2] ? colorMatch[2] : null;

                        return (
                            <div key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                {colorHex && (
                                    <span
                                        className="inline-block w-3 h-3 rounded-full mr-1 border border-gray-200"
                                        style={{ backgroundColor: colorHex }}
                                    ></span>
                                )}
                                {colorName}
                            </div>
                        );
                    }

                    // For sizes, display the selected size
                    if (key === 'sizes' && Array.isArray(value) && value.length > 0) {
                        return (
                            <div key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                {value[0]} {/* Display first size */}
                            </div>
                        );
                    }

                    // For shades, display the selected shade
                    if (key === 'shades' && Array.isArray(value) && value.length > 0) {
                        return (
                            <div key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                {value[0]} {/* Display first shade */}
                            </div>
                        );
                    }

                    // For shape
                    if (key === 'shape' && value) {
                        return (
                            <div key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                Hình: {String(value)}
                            </div>
                        );
                    }

                    // For material
                    if (key === 'material' && value) {
                        return (
                            <div key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                Chất liệu: {String(value)}
                            </div>
                        );
                    }

                    // For other attributes
                    return (
                        <div key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            {Array.isArray(value) ? value[0] : String(value)}
                        </div>
                    );
                })}
            </div>
        )}

        {/* Đánh giá */}
        {rating && rating > 0 && (
          <div className="flex items-center mt-2">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            {reviewCount && (
              <span className="ml-1 text-xs text-gray-500">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Giá */}
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-pink-600">
              {formatPrice(currentPrice)}đ
            </span>
            
            {originalPrice && originalPrice > currentPrice && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(originalPrice)}đ
                </span>
                <span className="text-xs font-medium text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full">
                  -{discountPercentage}%
                </span>
              </>
            )}
          </div>
          
          {originalPrice && originalPrice > currentPrice && (
            <div className="text-xs text-green-600 mt-1">
              Tiết kiệm: {formatPrice(originalPrice - currentPrice)}đ
            </div>
          )}
        </div>

        {/* Trạng thái */}
        <div className="mt-1">
          {inStock ? (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span> Còn hàng
            </span>
          ) : (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-flex items-center">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span> Hết hàng
            </span>
          )}
        </div>
      </div>

      {/* Các nút tương tác */}
      <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0 flex-shrink-0">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`p-2 rounded-full transition-colors duration-200 ${
            inStock
              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Thêm vào giỏ hàng"
        >
          <FiShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <Link
          href={`/product/${slug}`}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm transition-colors"
          title="Xem chi tiết"
        >
          <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>

        <button
          onClick={() => onRemove(productId, variantId)} // Use updated onRemove signature
          className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 shadow-sm transition-colors"
          title="Xóa khỏi danh sách yêu thích"
        >
          <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default WishlistItem;
