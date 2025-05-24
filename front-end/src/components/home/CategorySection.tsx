import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import { useGSAP, gsapUtils } from '../../hooks/useGSAP';
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

export default function CategorySection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { featuredCategories, loading, error, fetchFeaturedCategories } = useCategories();
  const [displayCategories, setDisplayCategories] = useState<any[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // GSAP animations for section entrance - Minimalist approach
  useGSAP(({ gsap }) => {
    if (!sectionRef.current || loading) return;

    const tl = gsapUtils.timeline();

    // Set initial states - Simplified
    gsap.set('.category-section', { opacity: 0 });
    gsap.set('.category-header', { y: 30, opacity: 0 });
    gsap.set('.enhanced-title', { y: 20, opacity: 0 });
    gsap.set('.enhanced-description', { y: 15, opacity: 0 });
    gsap.set('.enhanced-decorative', { y: 10, opacity: 0, scale: 0.8 });
    gsap.set('.category-item', { y: 40, opacity: 0 });
    gsap.set('.view-all-section', { y: 20, opacity: 0 });

    // Main entrance animation - Clean and elegant
    tl.to('.category-section', {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    })
    .to('.category-header', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.3")
    .to('.enhanced-title', {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: "power3.out"
    }, "-=0.4")
    .to('.enhanced-description', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.3")
    .to('.enhanced-decorative', {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.7)"
    }, "-=0.2")
    .to('.category-item', {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: {
        amount: 0.4,
        grid: "auto",
        from: "start"
      },
      ease: "power2.out"
    }, "-=0.2")
    .to('.view-all-section', {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.1");

  }, [loading, displayCategories]);

  // GSAP animations for hover interactions - Subtle effects
  useGSAP(() => {
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach((item) => {
      const content = item.querySelector('.category-content');
      const arrow = item.querySelector('.category-arrow');

      const handleMouseEnter = () => {
        const tl = gsapUtils.timeline();

        tl.to(item, {
          y: -4,
          boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
          duration: 0.3,
          ease: "power2.out"
        })
        .to(content, {
          y: -2,
          duration: 0.2,
          ease: "power2.out"
        }, "-=0.2")
        .to(arrow, {
          x: 4,
          duration: 0.2,
          ease: "power2.out"
        }, "-=0.2");
      };

      const handleMouseLeave = () => {
        const tl = gsapUtils.timeline();

        tl.to(item, {
          y: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          duration: 0.4,
          ease: "power2.out"
        })
        .to([content, arrow], {
          y: 0,
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.3");
      };

      item.addEventListener('mouseenter', handleMouseEnter);
      item.addEventListener('mouseleave', handleMouseLeave);
    });

  }, [displayCategories]);

  useEffect(() => {
    // Transform categories từ context để phù hợp với component
    if (featuredCategories && featuredCategories.length > 0) {
      const transformedCategories = featuredCategories.slice(0, 8).map(category => ({
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
    <section className="py-2 relative overflow-hidden category-section" ref={sectionRef}>
      {/* Clean background */}

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="category-header text-center mb-12">
          {/* Enhanced title với gradient và typography */}
          <div className="enhanced-title mb-6">
            <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-stone-800 via-rose-600 to-stone-800 bg-clip-text mb-4 tracking-tight leading-tight">
              Danh Mục Sản Phẩm
              <span className="block text-2xl font-medium text-stone-600 mt-2">Mỹ Phẩm Cao Cấp</span>
            </h2>
          </div>
          
          {/* Enhanced description */}
          <div className="enhanced-description relative">
            <p className="text-lg text-stone-700 max-w-3xl mx-auto leading-relaxed font-medium">
              Khám phá các danh mục sản phẩm mỹ phẩm 
              <span className="text-rose-600 font-semibold"> đa dạng và chất lượng cao</span> của chúng tôi
            </p>
          </div>

          {/* Enhanced decorative elements */}
          <div className="enhanced-decorative flex justify-center items-center gap-4 mt-8">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-stone-300 to-rose-300"></div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full shadow-sm"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full"></div>
              <div className="w-1 h-1 bg-stone-200 rounded-full"></div>
            </div>
            <div className="h-px w-20 bg-gradient-to-r from-rose-300 via-stone-300 to-transparent"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading && (
            Array.from({ length: 8 }).map((_, index) => (
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
            <div
              key={category._id}
              className="category-item transform-gpu relative"
            >
              {/* Featured badge - Moved outside để không bị che */}
              {category.featured && (
                <div className="absolute -top-2 -right-2 z-20">
                  <div className="bg-gradient-to-r from-rose-400 to-pink-400 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <FiStar className="w-3 h-3" />
                    <span>Nổi bật</span>
                  </div>
                </div>
              )}

              <Link
                href={`/shop?categoryId=${category._id}`}
                className="block h-full"
              >
                <div className={`bg-white rounded-2xl p-6 flex flex-col items-center text-center h-48 relative group transition-all duration-300 shadow-sm border ${category.featured ? 'border-rose-200 shadow-md' : 'border-stone-100'} hover:border-rose-200`}>

                  {/* Subtle glow effect cho featured categories */}
                  {category.featured && (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  )}

                  {category.image && category.image.url && !isImageError(category._id) ? (
                    <div className="w-16 h-16 flex items-center justify-center mb-4 relative transform-gpu">
                       <Image
                        src={category.image.url}
                        alt={category.image.alt || category.name}
                        width={64}
                        height={64}
                        className="object-contain rounded-full"
                        onError={() => handleImageError(category._id)}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center mb-4 text-2xl relative transform-gpu bg-stone-100 rounded-full">
                      <span className="relative z-10 filter grayscale">{getFallbackIcon(category.name)}</span>
                    </div>
                  )}

                  <div className="category-content flex-grow flex flex-col justify-center relative z-10">
                    <h3 className={`font-medium text-base mb-2 transition-colors duration-300 ${category.featured ? 'text-stone-900 group-hover:text-rose-600' : 'text-stone-800 group-hover:text-rose-600'}`}>
                      {category.name}
                    </h3>
                    <p className="text-sm text-stone-500 line-clamp-2 mb-3 leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div className="category-arrow text-sm font-medium text-rose-400 flex items-center group-hover:text-rose-600 transition-colors duration-300 transform-gpu relative z-10">
                    Xem sản phẩm
                    <FiArrowRight className="h-4 w-4 ml-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {!loading && !error && displayCategories.length > 0 && (
          <div className="view-all-section flex justify-center mt-12">
            <Link
              href="/categories"
              className="px-8 py-3 bg-white text-stone-700 border border-stone-200 rounded-full font-medium hover:bg-stone-50 hover:shadow-sm transition-all shadow-sm transform-gpu hover:scale-105 hover:border-rose-200 hover:text-rose-600"
            >
              Xem tất cả danh mục
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
        }

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

