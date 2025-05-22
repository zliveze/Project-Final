import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart, FiStar, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { formatImageUrl } from '@/utils/imageUtils';
import { useRecommendation, RecommendedProduct } from '@/contexts/user/RecommendationContext';
import { useAuth } from '@/contexts/AuthContext';

// Định nghĩa kiểu dữ liệu cho component props
interface RecommendedProductsProps {
  products?: RecommendedProduct[];
  title?: string;
  seeMoreLink?: string;
  seeMoreText?: string;
  type?: 'recommended' | 'personalized' | 'similar';
  productId?: string;
  limit?: number;
  hideIfEmpty?: boolean;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products: propProducts,
  title = 'Có thể bạn cũng thích',
  seeMoreLink = '/shop',
  seeMoreText = 'Xem thêm',
  type = 'recommended',
  productId,
  limit = 8,
  hideIfEmpty = false,
}) => {
  const shopProductContext = useShopProduct();
  const { isAuthenticated } = useAuth();
  const { 
    recommendedProducts, 
    personalizedProducts, 
    similarProducts, 
    loadingRecommended,
    loadingPersonalized,
    loadingSimilar,
    fetchRecommendedProducts,
    fetchPersonalizedProducts,
    fetchSimilarProducts 
  } = useRecommendation();

  // Xác định danh sách sản phẩm hiển thị
  let displayProducts: RecommendedProduct[] = propProducts || [];
  let isLoading = false;

  // Nếu không có sản phẩm được truyền vào, lấy từ context dựa trên type
  if (!propProducts) {
    if (type === 'recommended') {
      displayProducts = recommendedProducts;
      isLoading = loadingRecommended;
    } else if (type === 'personalized') {
      displayProducts = personalizedProducts;
      isLoading = loadingPersonalized;
    } else if (type === 'similar' && productId) {
      displayProducts = similarProducts;
      isLoading = loadingSimilar;
    }
  }

  // Tải dữ liệu khi component được mount
  useEffect(() => {
    if (!propProducts) {
      if (type === 'recommended') {
        fetchRecommendedProducts(limit);
      } else if (type === 'personalized') {
        fetchPersonalizedProducts(limit);
      } else if (type === 'similar' && productId) {
        fetchSimilarProducts(productId, limit);
      }
    }
  }, [type, productId, limit, propProducts]);

  // Hàm placeholder khi context thiếu phương thức
  const placeholderAction = (action: string) => {
    return () => {
      console.warn(`Chức năng ${action} chưa được triển khai.`);
      toast.error(`Chức năng ${action} tạm thời không khả dụng`, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return Promise.resolve(false);
    };
  };

  // Sử dụng các hàm từ context hoặc tạo hàm placeholder nếu context không tồn tại
  const addToCart = shopProductContext?.addToCart ||
    ((productId: string, quantity: number) => placeholderAction('thêm vào giỏ hàng')());

  const addToWishlist = shopProductContext?.addToWishlist ||
    ((productId: string) => placeholderAction('thêm vào danh sách yêu thích')());

  const logProductClick = shopProductContext?.logProductClick || 
    ((productId: string) => {
      // Nếu không có hàm logProductClick, không làm gì cả
      return;
    });

  // Xử lý sự kiện khi người dùng click vào sản phẩm
  const handleProductClick = (productId: string) => {
    if (isAuthenticated) {
      logProductClick(productId);
    }
  };

  // Lấy ảnh đại diện cho sản phẩm
  const getProductImage = (product: RecommendedProduct) => {
    // Nếu sản phẩm có imageUrl (từ API mới)
    if (product.imageUrl) {
      return {
        url: product.imageUrl,
        alt: product.name
      };
    }
    
    // Xử lý theo cấu trúc cũ
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

  // Nếu đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden h-80 animate-pulse">
              <div className="h-52 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Nếu không có sản phẩm và hideIfEmpty = true
  if (displayProducts.length === 0 && hideIfEmpty) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Link
          href={seeMoreLink}
          className="flex items-center text-pink-600 hover:underline text-sm font-medium group transition-all duration-200"
        >
          <span>{seeMoreText}</span>
          <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>

      {displayProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có sản phẩm gợi ý</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayProducts.map((product) => {
            const inStock = product.status === 'active';
            const imageData = getProductImage(product);
            const rating = product.reviews?.averageRating || 0;
            const reviewCount = product.reviews?.reviewCount || 0;
            const isNew = product.flags?.isNew;

            return (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
              >
                {/* Ảnh sản phẩm */}
                <div className="relative h-52 overflow-hidden">
                  <Link 
                    href={`/product/${product.slug}`}
                    onClick={() => handleProductClick(product._id)}
                  >
                    <Image
                      src={formatImageUrl(imageData.url)}
                      alt={imageData.alt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Badge cho sản phẩm mới */}
                  {isNew && (
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
                      onClick={() => product.brand?.slug && handleProductClick(product._id)}
                    >
                      {product.brand.name}
                    </Link>
                  )}

                  {/* Tên sản phẩm */}
                  <Link 
                    href={`/product/${product.slug}`}
                    onClick={() => handleProductClick(product._id)}
                  >
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
      )}
    </div>
  );
};

export default RecommendedProducts;