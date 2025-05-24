import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiSearch, FiArrowRight, FiTrendingUp } from 'react-icons/fi'
import { useGSAP, gsapUtils } from '../../hooks/useGSAP'

interface TopSearch {
  id: string;
  keyword: string;
  searchCount: number;
  trending?: boolean;
}

// Loading skeleton component - Minimalist
const TopSearchSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 animate-pulse">
      <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-stone-200 rounded w-1/2"></div>
    </div>
  );
};

// Search keyword card component - Minimalist design
const SearchKeywordCard = ({ search }: { search: TopSearch }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // GSAP hover animations
  useGSAP(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const trendingBadge = card.querySelector('.trending-badge');

    const handleMouseEnter = () => {
      const tl = gsapUtils.timeline();

      tl.to(card, {
        y: -4,
        boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
        duration: 0.3,
        ease: "power2.out"
      });

      if (trendingBadge) {
        tl.to(trendingBadge, {
          scale: 1.1,
          duration: 0.2,
          ease: "power2.out"
        }, "-=0.2");
      }
    };

    const handleMouseLeave = () => {
      const tl = gsapUtils.timeline();

      tl.to(card, {
        y: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        duration: 0.4,
        ease: "power2.out"
      });

      if (trendingBadge) {
        tl.to(trendingBadge, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.3");
      }
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="search-keyword-card transform-gpu"
    >
      <Link
        href={`/shop?search=${encodeURIComponent(search.keyword)}`}
        className="block group"
      >
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 transition-colors duration-300 group-hover:border-rose-200 relative">
          {/* Trending badge */}
          {search.trending && (
            <div className="trending-badge absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center shadow-sm">
              <FiTrendingUp className="w-3 h-3 mr-1" />
              Hot
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-stone-800 group-hover:text-rose-600 transition-colors duration-300 mb-1">
                {search.keyword}
              </h3>
              <p className="text-xs text-stone-500">
                {search.searchCount.toLocaleString()} lượt tìm kiếm
              </p>
            </div>
            <div className="ml-3 text-stone-400 group-hover:text-rose-500 transition-colors duration-300">
              <FiSearch className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function TopSearchSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GSAP animations for section entrance
  useGSAP(({ gsap }) => {
    if (!sectionRef.current || loading) return;

    const tl = gsapUtils.timeline();

    // Set initial states
    gsap.set('.search-section', { opacity: 0 });
    gsap.set('.search-header', { y: 30, opacity: 0 });
    gsap.set('.search-keyword-card', { y: 40, opacity: 0 });
    gsap.set('.search-box-section', { y: 20, opacity: 0 });

    // Animate entrance
    tl.to('.search-section', {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    })
    .to('.search-header', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.3")
    .to('.search-keyword-card', {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out"
    }, "-=0.2")
    .to('.search-box-section', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.1");

  }, [loading, topSearches]);

  // Fetch top searches and popular tags
  useEffect(() => {
    const fetchTopSearchData = async () => {
      try {
        setLoading(true);
        // TODO: Thay thế bằng API calls thực tế

        // Demo data for minimalist design showcase
        setTopSearches([
          {
            id: '1',
            keyword: 'serum vitamin c',
            searchCount: 1250,
            trending: true
          },
          {
            id: '2',
            keyword: 'kem chống nắng',
            searchCount: 980,
            trending: false
          },
          {
            id: '3',
            keyword: 'toner',
            searchCount: 756,
            trending: true
          },
          {
            id: '4',
            keyword: 'son môi',
            searchCount: 642,
            trending: false
          },
          {
            id: '5',
            keyword: 'mặt nạ',
            searchCount: 534,
            trending: false
          },
          {
            id: '6',
            keyword: 'kem dưỡng',
            searchCount: 423,
            trending: false
          }
        ]);

        setPopularTags([
          'Dưỡng da', 'Chống nắng', 'Làm sạch', 'Trang điểm',
          'Serum', 'Toner', 'Mặt nạ', 'Son môi'
        ]);

        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu tìm kiếm:', err);
        setError('Không thể tải dữ liệu tìm kiếm');
        setTopSearches([]);
        setPopularTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSearchData();
  }, []);

  // Không hiển thị section nếu đang loading
  if (loading) {
    return (
      <section className="py-2 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 relative z-10">
          <div className="text-center mb-6">
            <div className="h-8 bg-stone-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-stone-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[...Array(6)].map((_, index) => (
              <TopSearchSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Không hiển thị section nếu có lỗi hoặc không có dữ liệu
  if (error || (topSearches.length === 0 && popularTags.length === 0)) {
    return null;
  }

  return (
    <section className="py-4 relative overflow-hidden search-section" ref={sectionRef}>
      {/* Clean background */}

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="search-header text-center mb-10">
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center">
              <FiTrendingUp className="w-4 h-4 mr-2" />
              Xu Hướng Tìm Kiếm
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Từ Khóa 
            <span className="text-transparent bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text"> Được Yêu Thích Nhất</span>
          </h2>
          
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed mb-2">
            Khám phá những sản phẩm mỹ phẩm hot trend được hàng nghìn khách hàng tìm kiếm mỗi ngày tại Yumin
          </p>
          
          <p className="text-rose-600 font-medium text-sm">
            ✨ Cập nhật theo thời gian thực
          </p>

          {/* Enhanced decorative line */}
          <div className="flex items-center justify-center mt-8">
            <div className="h-0.5 w-20 bg-gradient-to-r from-transparent to-rose-300"></div>
            <div className="mx-4 flex items-center space-x-1">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            </div>
            <div className="h-0.5 w-20 bg-gradient-to-l from-transparent to-pink-300"></div>
          </div>
        </div>

        {topSearches.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mb-10">
            {topSearches.map((search) => (
              <SearchKeywordCard key={search.id} search={search} />
            ))}
          </div>
        )}

        {/* Search box section - Minimalist */}
        <div className="search-box-section bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3">
              <div className="flex items-center mb-3">
                <FiSearch className="w-6 h-6 text-rose-500 mr-2" />
                <h3 className="text-xl font-medium text-stone-800">Tìm Kiếm Nhanh</h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                Khám phá hàng ngàn sản phẩm mỹ phẩm chất lượng với công cụ tìm kiếm thông minh của chúng tôi.
              </p>
            </div>

            <div className="w-full md:w-2/3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  className="w-full py-3 px-4 pr-14 rounded-xl border border-stone-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-stone-700 bg-stone-50 focus:bg-white"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-lg transition-all hover:shadow-md">
                  <FiSearch className="h-5 w-5" />
                </button>
              </div>

              {popularTags.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center mb-3">
                    <h4 className="text-sm font-medium text-stone-700 mr-2">Từ khóa phổ biến:</h4>
                    <div className="h-px bg-stone-200 flex-grow"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.slice(0, 8).map((tag, index) => (
                      <Link
                        key={`tag-${index}`}
                        href={`/shop?search=${encodeURIComponent(tag)}`}
                        className="text-sm bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all hover:shadow-sm"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View all button */}
        {topSearches.length > 0 && (
          <div className="flex justify-center mt-10">
            <Link
              href="/shop"
              className="px-8 py-3 bg-white text-stone-700 border border-stone-200 rounded-full font-medium hover:bg-stone-50 hover:shadow-sm transition-all shadow-sm hover:scale-105 hover:border-rose-200 hover:text-rose-600 flex items-center"
            >
              Xem tất cả sản phẩm
              <FiArrowRight className="ml-2" />
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
        }
      `}</style>
    </section>
  );
}