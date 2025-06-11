import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import { useCategories } from '../../contexts/user/categories/CategoryContext';

// Function để tạo icon dự phòng dựa trên tên danh mục
const getFallbackIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('son') || name.includes('môi')) return "💄";
  if (name.includes('mắt') || name.includes('mascara') || name.includes('phấn mắt')) return "👁️";
  if (name.includes('dưỡng') || name.includes('chăm sóc') || name.includes('serum')) return "🧴";
  if (name.includes('tẩy') || name.includes('rửa mặt')) return "🫧";
  if (name.includes('chống nắng') || name.includes('sunscreen')) return "☀️";
  if (name.includes('nước') || name.includes('toner')) return "💦";
  if (name.includes('kem') || name.includes('cream')) return "💧";
  if (name.includes('tự nhiên') || name.includes('organic')) return "🌿";
  return "✨";
};

interface DisplayCategory {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  image?: {
    url: string;
    alt?: string;
  };
  featured?: boolean;
  level?: number;
}

export default function CategorySection() {
  const { featuredCategories, loading, error, fetchFeaturedCategories } = useCategories();
  const [displayCategories, setDisplayCategories] = useState<DisplayCategory[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Transform categories từ context để phù hợp với component
    if (featuredCategories && featuredCategories.length > 0) {
      const transformedCategories = featuredCategories.slice(0, 10).map(category => ({
        _id: category.id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        image: category.image,
        featured: category.featured,
        level: category.level
      }));
      setDisplayCategories(transformedCategories);
    }
  }, [featuredCategories]);

  // Function để handle image error
  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => new Set(prev).add(categoryId));
  };

  // Function để kiểm tra image có lỗi không
  const isImageError = (categoryId: string) => {
    return imageErrors.has(categoryId);
  };

  // Skeleton loading component - Minimalist design
  const CategorySkeleton = () => (
    <div className="category-skeleton bg-white rounded-2xl p-6 h-48 shadow-sm animate-pulse">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 bg-stone-200 rounded-full mb-4"></div>
        <div className="h-4 bg-stone-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-stone-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-stone-200 rounded w-20"></div>
      </div>
    </div>
  );

  return (
    <section className="py-2 relative">
      <div className="mx-auto px-4 md:px-8 lg:px-12 relative z-10" style={{ maxWidth: 'calc(100vw - 50px)' }}>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-stone-800 mb-4 tracking-tight leading-tight">
            Danh Mục Sản Phẩm
            <span className="block text-2xl font-medium text-stone-600 mt-2">Mỹ Phẩm Cao Cấp</span>
          </h2>

          <p className="text-lg text-stone-700 max-w-3xl mx-auto leading-relaxed font-medium">
            Khám phá các danh mục sản phẩm mỹ phẩm
            <span className="text-rose-600 font-semibold"> đa dạng và chất lượng cao</span> của chúng tôi
          </p>

          <div className="w-12 h-px bg-rose-300 mt-6 mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {loading && (
            Array.from({ length: 10 }).map((_, index) => (
              <CategorySkeleton key={`skeleton-${index}`} />
            ))
          )}

          {!loading && error && (
            <div className="col-span-full text-center text-stone-500 py-12">
              <p>{error}</p>
              <button 
                onClick={fetchFeaturedCategories}
                className="mt-4 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && displayCategories.length === 0 && (
            <div className="col-span-full text-center text-stone-500 py-12">
              <p>Không có danh mục nào để hiển thị.</p>
            </div>
          )}

          {!loading && !error && displayCategories.map((category) => (
            <div key={category._id} className="relative">
              {/* Featured badge */}
              {category.featured && (
                <div className="absolute -top-2 -right-2 z-20">
                  <div className="bg-gradient-to-r from-rose-400 to-pink-400 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <FiStar className="w-3 h-3" />
                    <span>Nổi bật</span>
                  </div>
                </div>
              )}

              <Link href={`/shop?categoryId=${category._id}`} className="block h-full">
                <div className={`bg-white rounded-2xl p-8 flex flex-col items-center text-center h-56 relative group shadow-sm border ${category.featured ? 'border-rose-200 shadow-md' : 'border-stone-100'} hover:border-rose-200 transition-colors`}>

                  {category.image && category.image.url && !isImageError(category._id) ? (
                    <div className="w-20 h-20 flex items-center justify-center mb-6 relative">
                       <Image
                        src={category.image.url}
                        alt={category.image.alt || category.name}
                        width={80}
                        height={80}
                        className="object-contain rounded-full"
                        onError={() => handleImageError(category._id)}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center mb-6 text-3xl relative bg-stone-100 rounded-full">
                      <span className="relative z-10 filter grayscale">{getFallbackIcon(category.name)}</span>
                    </div>
                  )}

                  <div className="flex-grow flex flex-col justify-center relative z-10">
                    <h3 className={`font-medium text-lg mb-3 transition-colors ${category.featured ? 'text-stone-900 group-hover:text-rose-600' : 'text-stone-800 group-hover:text-rose-600'}`}>
                      {category.name}
                    </h3>
                    <p className="text-base text-stone-500 line-clamp-2 mb-4 leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div className="text-base font-medium text-rose-400 flex items-center group-hover:text-rose-600 transition-colors relative z-10">
                    Xem sản phẩm
                    <FiArrowRight className="h-5 w-5 ml-2" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {!loading && !error && displayCategories.length > 0 && (
          <div className="flex justify-center mt-12">
            <Link
              href="/categories"
              className="px-8 py-3 bg-white text-stone-700 border border-stone-200 rounded-full font-medium hover:bg-stone-50 hover:shadow-sm transition-all shadow-sm hover:border-rose-200 hover:text-rose-600"
            >
              Xem tất cả danh mục
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .category-skeleton {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }
      `}</style>
    </section>
  )
}
