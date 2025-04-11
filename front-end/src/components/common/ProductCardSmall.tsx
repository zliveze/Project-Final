import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ProductCardSmallProps {
  id: string
  name: string
  image: string
  price: number
  originalPrice: number
  discount?: number
  slug: string
  flashSale?: {
    isActive: boolean
    endTime: string
    soldPercent: number
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(price)
}

export default function ProductCardSmall({
  id,
  name,
  image,
  price,
  originalPrice,
  discount,
  slug,
  flashSale
}: ProductCardSmallProps) {
  return (
    <Link href={`/product/${slug}`} className="block">
      <div className="bg-gradient-to-b from-pink-500 to-purple-600 rounded-lg overflow-hidden">
        {/* Timer Badge */}
        <div className="absolute top-2 left-2 bg-pink-600/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
          15:3
        </div>

        {/* Discount Badge */}
        {discount && discount > 0 && (
          <div className="absolute top-2 right-2 bg-pink-600/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
            -{discount}%
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-square bg-white p-2">
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 40vw, 20vw"
          />

          {/* SL Badge */}
          <div className="absolute bottom-1 right-1 bg-white rounded-full w-8 h-8 flex items-center justify-center">
            <div className="text-[10px] font-medium text-pink-500">
              SL<br/>100
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-2 bg-white">
          {/* Price Section */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-base font-bold text-pink-600">
              {formatPrice(price)}đ
            </span>
            {originalPrice > price && (
              <span className="text-[10px] text-gray-400 line-through">
                {formatPrice(originalPrice)}đ
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-xs text-gray-700 line-clamp-2 min-h-[32px]">
            {name}
          </h3>

          {/* Progress Bar */}
          {flashSale?.isActive && (
            <div className="mt-2">
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${flashSale.soldPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-pink-500 mt-1">
                {flashSale.soldPercent}%
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
