import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageUtils';

interface ProductCardEventProps {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  remainingTime?: string;
  soldCount?: number;
  remainingCount?: number;
}

const ProductCardEvent = React.memo(({
  id,
  name,
  image,
  price,
  oldPrice,
  discount,
  remainingTime,
  soldCount = 234,
  remainingCount = 20
}: ProductCardEventProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <Link
      href={`/product/${id}`}
      className="block bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
    >
      <div className="aspect-square relative mb-3">
        <Image
          src={imageError ? '/404.png' : formatImageUrl(image)}
          alt={name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, 20vw"
          priority={false}
          onError={handleImageError}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
        />
        <div className="absolute top-0 left-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] px-2 py-1 rounded-br-lg font-medium">
         Online 24/7 {remainingTime}
        </div>
        {discount && (
          <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs w-10 h-10 rounded-full flex items-center justify-center font-bold">
            -{discount}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-pink-600">
              {formatPrice(price)}
            </span>
            <span className="text-[11px] text-pink-600">đ</span>
          </div>
          {oldPrice && (
            <span className="text-[11px] text-gray-400 line-through">
              {formatPrice(oldPrice)}đ
            </span>
          )}
        </div>

        <h3 className="text-[13px] text-gray-700 line-clamp-2 min-h-[40px] font-medium">
          {name}
        </h3>

        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-pink-500 to-purple-600 h-1.5 relative"
            style={{width: `${discount}%`}}
          >
            <div className="w-full h-full opacity-20 bg-[url('/images/pattern-wave.png')] bg-repeat-x animate-wave absolute inset-0"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            Đã bán: <span className="text-pink-600 font-medium">{soldCount}</span>
          </div>
          <div className="text-[11px] text-pink-600 font-medium">
            Còn lại: {remainingCount}
          </div>
        </div>
      </div>
    </Link>
  );
});

ProductCardEvent.displayName = 'ProductCardEvent';

export default ProductCardEvent;
