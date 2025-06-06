import React from 'react';
import { FaHeart, FaShoppingCart, FaEye, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { WishlistItem } from './types';

interface WishlistItemProps {
  items: WishlistItem[];
  onRemoveFromWishlist?: (productId: string, variantId?: string | null) => void;
  onAddToCart?: (productId: string, variantId?: string | null) => void;
  isLoading?: boolean;
}

const WishlistItems = ({ items, onRemoveFromWishlist, onAddToCart, isLoading = false }: WishlistItemProps) => { // Destructure and provide default
  const handleRemoveFromWishlist = (productId: string, variantId?: string | null) => {
    if (onRemoveFromWishlist) {
      onRemoveFromWishlist(productId, variantId);
      toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!');
    }
  };

  const handleAddToCart = (productId: string, variantId?: string | null) => {
    if (onAddToCart) {
      onAddToCart(productId, variantId);
      toast.success('Đã thêm sản phẩm vào giỏ hàng!');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sản phẩm yêu thích</h2>
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-3">
            <FaHeart className="text-pink-400 text-4xl" />
          </div>
          <p className="text-gray-500 mb-4">Bạn chưa có sản phẩm yêu thích nào</p>
          <Link href="/shop">
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity shadow-sm">
              Khám phá sản phẩm
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Show loading indicator if isLoading is true
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sản phẩm yêu thích</h2>
        <p className="text-gray-500">Đang tải danh sách yêu thích...</p>
        {/* Optional: Add a spinner */}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Sản phẩm yêu thích</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              items.forEach(item => {
                handleAddToCart(item._id, item.variantId);
              });
              toast.success('Đã thêm tất cả sản phẩm vào giỏ hàng!');
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity text-sm flex items-center shadow-sm"
          >
            <FaShoppingCart className="mr-2" /> Thêm tất cả vào giỏ
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item._id}-${item.variantId || ''}`}
            className="bg-white border border-gray-200 hover:border-pink-200 rounded-lg shadow-sm hover:shadow-md transition-all p-4"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Ảnh sản phẩm */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <Link href={`/shop/product/${item._id}`}>
                  <div className="w-full h-full relative overflow-hidden rounded-md group">
                    <Image
                      src={item.image || '/404.png'}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md transition-transform group-hover:scale-110 duration-300"
                    />
                    {(item.currentPrice && item.currentPrice < item.price) && (
                      <div className="absolute top-1 right-1 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-sm">
                        -{Math.round(((item.price - item.currentPrice) / item.price) * 100)}%
                      </div>
                    )}
                  </div>
                </Link>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <Link href={`/shop/product/${item._id}`} className="block">
                  <h3 className="text-base font-medium text-gray-800 hover:text-pink-600 transition-colors">{item.name}</h3>
                </Link>

                {/* Hiển thị các tùy chọn nếu có */}
                {item.options && Object.keys(item.options).length > 0 && (
                  <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
                    {Object.entries(item.options).map(([key, value]) => (
                      <span key={key} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        {key === 'size' ? 'Kích thước' :
                         key === 'shade' ? 'Màu' :
                         key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Giá */}
                <div className="mt-2 flex items-center justify-center sm:justify-start">
                  <span className="text-pink-600 font-semibold">
                    {item.currentPrice && item.currentPrice < item.price
                      ? formatPrice(item.currentPrice)
                      : formatPrice(item.price)}
                  </span>

                  {item.currentPrice && item.currentPrice < item.price && (
                    <span className="ml-2 text-gray-400 line-through text-sm">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Các nút tương tác */}
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <button
                  onClick={() => handleAddToCart(item._id, item.variantId)}
                  className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                  title="Thêm vào giỏ hàng"
                >
                  <FaShoppingCart className="w-4 h-4" />
                </button>

                <Link
                  href={`/shop/product/${item._id}`}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                  title="Xem chi tiết"
                >
                  <FaEye className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleRemoveFromWishlist(item._id, item.variantId)}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600 transition-colors"
                  title="Xóa khỏi danh sách yêu thích"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Thống kê */}
      <div className="mt-6 bg-pink-50 p-4 rounded-lg border border-pink-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Tổng số sản phẩm: <span className="font-semibold text-pink-600">{items.length}</span></p>
            <p className="text-gray-600 mt-1">
              Tổng giá trị: <span className="font-semibold text-pink-600">
                {formatPrice(items.reduce((total, item) =>
                  total + ((item.currentPrice && item.currentPrice < item.price) ? item.currentPrice : item.price), 0)
                )}
              </span>
            </p>
          </div>
          <Link href="/shop" className="text-pink-600 hover:text-pink-800 text-sm font-medium">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WishlistItems;
