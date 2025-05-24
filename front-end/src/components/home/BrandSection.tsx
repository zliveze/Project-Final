import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useBrands, Brand } from '@/contexts/user/brands/BrandContext';

export default function BrandSection() {
  const {
    brands: activeBrands,
    featuredBrands,
    loading,
    error
  } = useBrands();

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Handle image error
  const handleImageError = (brandId: string) => {
    setImageErrors(prev => new Set(prev).add(brandId));
  };

  // Check if image has error
  const isImageError = (brandId: string) => {
    return imageErrors.has(brandId);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="text-center mb-12">
              <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 h-24 shadow-md border border-gray-100">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-red-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Đã xảy ra lỗi: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {featuredBrands && featuredBrands.length > 0 && (
          <>
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                  ⭐ Thương Hiệu Nổi Bật
                </span>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                Khám Phá Những Thương Hiệu 
                <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text"> Hàng Đầu</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Trải nghiệm các thương hiệu mỹ phẩm đẳng cấp thế giới với sản phẩm chất lượng cao
              </p>
              
              {/* Decorative line */}
              <div className="flex items-center justify-center mt-6">
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-blue-300"></div>
                <div className="mx-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-purple-300"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 pt-3">
              {featuredBrands.map((brand: Brand) => (
                <div key={brand.id} className="relative group">
                  <a href={`/brands/${brand.slug}`} className="block">
                    <div className="relative bg-white rounded-xl p-4 h-32 flex flex-col items-center justify-center shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group overflow-visible">
                      {/* Featured badge */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                          🏆 Nổi bật
                        </div>
                      </div>

                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:to-purple-50/30 rounded-xl transition-all duration-300"></div>

                      {/* Logo container */}
                      <div className="flex-1 flex items-center justify-center mb-2 relative z-10">
                        {brand.logo?.url && !isImageError(`featured-${brand.id}`) ? (
                          <Image
                            src={brand.logo.url}
                            alt={brand.logo.alt || brand.name}
                            width={80}
                            height={40}
                            className="object-contain max-h-full max-w-full filter grayscale group-hover:grayscale-0 transition-all duration-300"
                            onError={() => handleImageError(`featured-${brand.id}`)}
                          />
                        ) : (
                          <div className="w-full h-12 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 rounded-lg text-sm font-medium">
                            {brand.name}
                          </div>
                        )}
                      </div>

                      {/* Brand name */}
                      <div className="text-center relative z-10">
                        <h4 className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                          {brand.name}
                        </h4>
                      </div>

                      {/* Subtle border glow */}
                      <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-blue-200/50 transition-all duration-300"></div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {activeBrands && activeBrands.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Tất Cả Thương Hiệu</h3>
                <p className="text-gray-600 text-sm">Khám phá bộ sưu tập đầy đủ của chúng tôi</p>
              </div>
              <a
                href="/brands"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
              >
                Xem tất cả
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {activeBrands.slice(0, 16).map((brand: Brand) => (
                <div key={brand.id} className="relative group">
                  <a href={`/brands/${brand.slug}`} className="block">
                    <div className="relative bg-white rounded-lg p-3 h-16 flex items-center justify-center shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                      {/* Special indicator for featured brands */}
                      {brand.featured && (
                        <div className="absolute top-1 right-1 z-10">
                          <div className="w-2 h-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-full shadow-sm"></div>
                        </div>
                      )}

                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/20 group-hover:to-purple-50/20 rounded-lg transition-all duration-300"></div>

                      {brand.logo?.url && !isImageError(`active-${brand.id}`) ? (
                        <Image
                          src={brand.logo.url}
                          alt={brand.logo.alt || brand.name}
                          width={60}
                          height={30}
                          className="object-contain max-h-full max-w-full filter grayscale group-hover:grayscale-0 transition-all duration-300 relative z-10"
                          onError={() => handleImageError(`active-${brand.id}`)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 rounded text-xs relative z-10">
                          <span className="truncate px-1 font-medium">{brand.name}</span>
                        </div>
                      )}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!featuredBrands || featuredBrands.length === 0) && (!activeBrands || activeBrands.length === 0) && !loading && (
           <div className="text-center py-12">
             <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
               <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                 <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                 </svg>
               </div>
               <p className="text-gray-700 font-semibold">Hiện chưa có thương hiệu nào.</p>
               <p className="text-gray-500 text-sm mt-1">Vui lòng quay lại sau.</p>
             </div>
           </div>
        )}
      </div>
    </section>
  )
}
