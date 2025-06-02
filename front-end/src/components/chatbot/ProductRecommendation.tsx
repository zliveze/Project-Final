import React, { useState } from 'react';
import { RecommendedProduct } from '@/contexts/chatbot/ChatbotContext';
import { ShoppingCart, ChevronRight, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductRecommendationProps {
  products: RecommendedProduct[];
}

// Component cho từng sản phẩm với xử lý ảnh riêng biệt
const ProductCard: React.FC<{ product: RecommendedProduct }> = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return null;
    const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return discount > 0 ? `-${discount}%` : null;
  };

  const discount = product.currentPrice && product.price
    ? calculateDiscount(product.price, product.currentPrice)
    : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-pink-200 hover:shadow-sm transition-all duration-200 group"
    >
      {/* Product Image */}
      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-3">
        <Image
          src={imageError ? '/404.png' : (product.imageUrl || '/404.png')}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
        />

        {discount && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            {discount}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h4>

        {product.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-pink-600">
              {formatPrice(product.currentPrice || product.price)}
            </span>

            {product.currentPrice && product.currentPrice < product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-400 group-hover:text-pink-500 transition-colors">
            <Eye className="w-3 h-3 mr-1" />
            <span>Xem</span>
            <ChevronRight className="w-3 h-3 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

const ProductRecommendation: React.FC<ProductRecommendationProps> = ({ products }) => {
  const [showAll, setShowAll] = React.useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const displayProducts = showAll ? products : products.slice(0, 4);

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <ShoppingCart className="w-4 h-4 mr-2 text-pink-500" />
          Sản phẩm gợi ý
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {products.length} sản phẩm
        </span>
      </div>

      <div className="space-y-3">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length > 4 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center text-xs text-pink-600 hover:text-pink-700 font-medium bg-pink-50 hover:bg-pink-100 py-2 px-4 rounded-full border border-pink-200 transition-all duration-200"
          >
            {showAll ? (
              <>
                Thu gọn
                <ChevronRight className="w-3 h-3 ml-1 rotate-90" />
              </>
            ) : (
              <>
                Xem thêm {products.length - 4} sản phẩm
                <ChevronRight className="w-3 h-3 ml-1" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendation; 