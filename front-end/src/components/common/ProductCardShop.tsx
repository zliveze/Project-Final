import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiStar } from 'react-icons/fi'

interface ProductCardProps {
  id: string
  name: string
  image: string
  price: number
  originalPrice: number
  rating: number
  ratingCount: number
  soldCount: number
  discount?: number
  slug: string
  flashSale?: {
    isActive: boolean
    endTime: string
    soldPercent: number
  };
  promotion?: { // Add promotion prop
    type: 'event' | 'campaign';
    name: string;
    adjustedPrice: number;
  } | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(price)
}

export default function ProductCardShop({
  id,
  name,
  image,
  price,
  originalPrice,
  rating,
  ratingCount,
  soldCount,
  discount,
  slug,
  flashSale,
  promotion // Destructure promotion prop
}: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`} className="block group h-full">
      <div className="bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
        {/* Product Image Container - Fixed aspect ratio */}
        <div className="relative pt-[100%]">
          {/* Product Image */}
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover rounded-t-sm"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          
          {/* Discount Badge */}
          {discount && discount > 0 && (
            <div className="absolute top-3 right-3 bg-pink-500 text-white text-sm font-medium px-2 py-1 rounded">
              -{discount}%
            </div>
          )}

          {/* Promotion Badge (Event/Campaign) */}
          {promotion && (
            <div className={`absolute top-0 left-0 text-white text-xs px-2 py-1 ${promotion.type === 'event' ? 'bg-blue-500' : 'bg-green-500'}`}>
              <div className="flex items-center gap-1">
                <span className="font-medium">{promotion.name || (promotion.type === 'event' ? 'Sự kiện' : 'Chiến dịch')}</span>
              </div>
            </div>
          )}

          {/* Flash Sale Badge (Show only if no other promotion or if flash sale is prioritized) */}
          {flashSale?.isActive && !promotion && ( // Example: Prioritize promotion over flash sale badge if both exist
            <div className="absolute top-0 left-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1">
              <div className="flex items-center gap-1">
                <span className="font-medium">FLASH SALE</span>
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Fixed height with flex-grow to fill remaining space */}
        <div className="p-3 flex flex-col flex-grow">
          {/* Product Name - Fixed height */}
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-[40px] mb-2">
            {name}
          </h3>

          {/* Price Section */}
          <div className="flex flex-col mb-2">
            <span className="text-lg font-bold text-pink-600">
              {formatPrice(price)}đ
            </span>
            {originalPrice > price && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(originalPrice)}đ
                </span>
                <span className="text-xs bg-pink-100 text-pink-700 px-1 py-0.5 rounded">
                  Tiết kiệm {formatPrice(originalPrice - price)}đ
                </span>
              </div>
            )}
          </div>

          {/* Rating & Sold */}
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <div className="flex items-center text-pink-400">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(rating) ? 'fill-current' : 'fill-none'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs">({ratingCount})</span>
            </div>
            <span className="mx-2">|</span>
            <span className="text-xs">Đã bán {soldCount}</span>
          </div>

          {/* Flash Sale Progress - With fixed height container */}
          <div className="mt-auto pt-2 min-h-[30px]">
            {flashSale?.isActive && flashSale.soldPercent > 0 ? (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-pink-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${flashSale.soldPercent}%` }}
                  />
                </div>
                <div className="text-xs text-pink-600 mt-1 font-medium">
                  Đã bán {flashSale.soldPercent}%
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
