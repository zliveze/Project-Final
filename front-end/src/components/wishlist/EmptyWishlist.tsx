import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingBag, FiHeart } from 'react-icons/fi';

const EmptyWishlist = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-40 h-40 relative mb-8">
        <Image 
          src="/images/empty-wishlist.svg" 
          alt="Danh sách yêu thích trống"
          fill
          className="object-contain"
          onError={(e) => {
            // Fallback khi ảnh không tồn tại
            e.currentTarget.style.display = 'none';
            document.getElementById('fallback-icon')!.style.display = 'flex';
          }}
        />
        
        <div 
          id="fallback-icon"
          className="w-full h-full rounded-full bg-gradient-to-br from-pink-50 to-purple-50 hidden items-center justify-center border border-pink-100"
        >
          <div className="relative">
            <FiHeart className="w-20 h-20 text-pink-200" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FiHeart className="w-10 h-10 text-pink-500" />
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Danh sách yêu thích trống</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        Bạn chưa thêm sản phẩm nào vào danh sách yêu thích. Hãy khám phá các sản phẩm và thêm vào danh sách để dễ dàng theo dõi.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/shop" 
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-colors flex items-center justify-center"
        >
          <FiShoppingBag className="mr-2" />
          Khám phá sản phẩm
        </Link>
        
        <Link 
          href="/" 
          className="px-6 py-3 border border-pink-200 text-pink-600 rounded-md hover:bg-pink-50 transition-colors flex items-center justify-center"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default EmptyWishlist; 