import React from 'react';
import { RecommendedProduct } from '@/contexts/chatbot/ChatbotContext';
import { ShoppingCart, Heart, Star, ExternalLink, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface ProductRecommendationProps {
  products: RecommendedProduct[];
}

const ProductRecommendation: React.FC<ProductRecommendationProps> = ({ products }) => {
  const router = useRouter();
  const [showAll, setShowAll] = React.useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return null;
    const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return discount > 0 ? `-${discount}%` : null;
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleAddToCart = (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', productId);
  };

  const displayProducts = showAll ? products : products.slice(0, 3);

  return (
    <div className="w-full my-3 overflow-hidden">
      <h3 className="font-medium text-gray-700 mb-2">Sản phẩm gợi ý:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayProducts.map((product) => {
          const discount = product.currentPrice && product.price 
            ? calculateDiscount(product.price, product.currentPrice) 
            : null;
          
          return (
            <Link 
              href={`/product/${product.slug}`} 
              key={product.id}
              className="block border rounded-lg p-3 hover:shadow-md transition-shadow group"
            >
              <div className="flex flex-col h-full">
                <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden mb-2">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback nếu ảnh lỗi
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/products/default.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400">Không có ảnh</span>
                    </div>
                  )}
                  
                  {discount && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {discount}
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h4 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-pink-600">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                  
                  <div className="flex items-center space-x-2 mt-auto">
                    <span className="font-bold text-pink-600">
                      {formatPrice(product.currentPrice || product.price)}
                    </span>
                    
                    {product.currentPrice && product.currentPrice < product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      {products.length > 3 && (
        <div className="mt-3 text-center">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium bg-white py-2 px-4 rounded-full border border-pink-200 hover:shadow-md transition-all flex items-center mx-auto"
          >
            {showAll ? (
              <>Thu gọn</>
            ) : (
              <>
                <PlusCircle className="w-3 h-3 mr-1" />
                Xem thêm {products.length - 3} sản phẩm khác
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendation; 