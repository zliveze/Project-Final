import React, { useEffect, useCallback } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import ProductCardShop from '../../components/common/ProductCardShop';
import ShopFilters from '../../components/shop/ShopFilters';
import ShopBanner from '../../components/shop/ShopBanner';
import ShopPagination from '../../components/shop/ShopPagination';
import { BreadcrumItem } from '@/components/common/Breadcrum';
// Import hook mới cho shop
import { useShopProduct, ShopProductFilters } from '@/contexts/user/shop/ShopProductContext';
// Import kiểu LightProduct từ context mới
import { LightProduct } from '@/contexts/user/shop/ShopProductContext';
import { useCategories } from '@/contexts/user/categories/CategoryContext';
import { useBrands } from '@/contexts/user/brands/BrandContext';
import { useRouter } from 'next/router';

// Sử dụng lại interface Product từ context mới nếu cần, hoặc dùng LightProduct trực tiếp
// interface Product { ... } // Có thể xóa nếu LightProduct đủ dùng

// Xóa interface Filters cũ
/*
interface Filters {
  categories: string[];
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  brandId?: string;
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  imageUrl?: string;
}

interface Filters {
  categories: string[];
  brands: string[];
  priceRange: number[];
  skinType: string[];
  concerns: string[];
  sortBy: string;
  rating: number;
  hasPromotion: boolean;
  hasFreeShipping: boolean;
  hasGifts: boolean;
  colors: string[];
}
*/

export default function Shop() {
  // Lấy các thuộc tính cần thiết từ context
  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    filters,
    setFilters,
    changePage,
    selectedCampaign,
    fetchProducts,
    itemsPerPage
  } = useShopProduct();

  // Không cần state nữa vì đã sử dụng useMemo
  // Thêm router
  const router = useRouter();

  // Thêm context cho danh mục và thương hiệu
  const { categories } = useCategories();
  const { brands } = useBrands();

  // Khai báo biến để ngăn chặn vòng lặp
  const isUpdatingFromUrl = React.useRef(false);

  // Khai báo hàm xử lý URL parameters ở mức component để có thể sử dụng ở nhiều nơi
  const handleUrlParams = useCallback(() => {
    // Ngăn chặn xử lý nếu đang trong quá trình cập nhật từ URL để tránh vòng lặp
    if (isUpdatingFromUrl.current) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const newFiltersFromUrl: Partial<ShopProductFilters> = {};

    // Danh sách các key filter có thể có trên URL và trong ShopProductFilters
    const possibleFilterKeys: (keyof ShopProductFilters)[] = [
      'search', 'brandId', 'categoryId', 'eventId', 'campaignId',
      'status', 'minPrice', 'maxPrice', 'tags', 'skinTypes',
      'concerns', 'isBestSeller', 'isNew', 'isOnSale', 'hasGifts',
      'sortBy', 'sortOrder'
    ];

    possibleFilterKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value !== null && value !== 'undefined' && String(value).trim() !== '') {
        // Chuyển đổi kiểu dữ liệu nếu cần
        if (key === 'minPrice' || key === 'maxPrice') {
          newFiltersFromUrl[key] = Number(value);
        } else if (key === 'isBestSeller' || key === 'isNew' || key === 'isOnSale' || key === 'hasGifts') {
          newFiltersFromUrl[key] = value === 'true';
        } else if (key === 'sortOrder') {
          if (value === 'asc' || value === 'desc') {
            newFiltersFromUrl[key] = value;
          } else {
            // Nếu giá trị không hợp lệ, không gán hoặc gán undefined
            newFiltersFromUrl[key] = undefined; 
          }
        } else {
          newFiltersFromUrl[key] = value;
        }
      } else {
        // Đặc biệt xử lý search rỗng
        if (key === 'search' && searchParams.has(key)) {
          newFiltersFromUrl[key] = '';
        } else {
          // Nếu tham số không có trên URL, đặt là undefined để có thể xóa khỏi state
          newFiltersFromUrl[key] = undefined;
        }
      }
    });
    
    // Logic đặc biệt: Nếu có campaignId hoặc eventId, chúng có thể cần được ưu tiên hoặc loại trừ lẫn nhau
    if (newFiltersFromUrl.campaignId) {
        newFiltersFromUrl.eventId = undefined; // Campaign ưu tiên
    }

    // So sánh newFiltersFromUrl với filters hiện tại trong context
    let hasChanged = false;
    // Kiểm tra các key có trong newFiltersFromUrl hoặc trong filters hiện tại
    const allKeysToCheck = Array.from(new Set([...Object.keys(newFiltersFromUrl), ...Object.keys(filters)])) as (keyof ShopProductFilters)[];

    for (const key of allKeysToCheck) {
      // Xử lý đặc biệt cho search: chuỗi rỗng và undefined đều được coi là trống
      if (key === 'search') {
        const oldValueEmpty = !filters[key] || filters[key] === '';
        const newValueEmpty = !newFiltersFromUrl[key] || newFiltersFromUrl[key] === '';
        
        if (oldValueEmpty !== newValueEmpty) {
          hasChanged = true;
          break;
        }
        continue;
      }
      
      // Các trường dữ liệu khác
      if (String(filters[key] ?? '') !== String(newFiltersFromUrl[key] ?? '')) {
        hasChanged = true;
        break;
      }
    }

    if (hasChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('URL params changed or initial load. Updating filters from URL:', newFiltersFromUrl);
      }
      // Đánh dấu là đang cập nhật từ URL
      isUpdatingFromUrl.current = true;
      setFilters(newFiltersFromUrl, false); 
      
      // Reset cờ báo sau 300ms để cho phép các thay đổi hoàn thành
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 300);
    }
  }, [filters, setFilters]); 

  // Khai báo handleRouteChange ở mức component để có thể sử dụng ở nhiều nơi
  const handleRouteChange = useCallback(() => handleUrlParams(), [handleUrlParams]);

  // Xử lý URL parameters khi component mount và khi URL thay đổi
  useEffect(() => {
    // Xử lý params ngay khi component được mount
    handleUrlParams();

    // Lắng nghe sự kiện route change
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, handleUrlParams, handleRouteChange]); // Chỉ phụ thuộc vào router và các hàm callback

  // Đếm số bộ lọc đang hoạt động - sử dụng useMemo thay vì useEffect
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ShopProductFilters];
      if (value !== undefined && value !== null && value !== '') {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Hàm xử lý thay đổi bộ lọc
  const handleFilterChange = useCallback((newFiltersFromShopFilters: Partial<ShopProductFilters>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Shop.tsx: handleFilterChange called with:', newFiltersFromShopFilters);
    }
    isUpdatingFromUrl.current = true; // Đánh dấu để handleUrlParams không chạy lại ngay

    // Gọi setFilters từ context để cập nhật state và có thể trigger fetch (context sẽ debounce)
    // false nghĩa là không skipFetch, context sẽ quyết định có fetch hay không
    setFilters(newFiltersFromShopFilters, false);

    // Tạo query mới cho URL
    const currentRouterQuery = { ...router.query };
    const combinedQuery: Record<string, any> = {}; // Bắt đầu với object rỗng để chỉ chứa các filter active

    // Merge newFiltersFromShopFilters vào filters hiện tại của context để có bộ filter đầy đủ nhất
    const effectiveFilters = { ...filters, ...newFiltersFromShopFilters };

    Object.entries(effectiveFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        combinedQuery[key] = String(value);
      }
    });
    
    // Xóa các filter đã bị clear (value là undefined hoặc rỗng) trong newFiltersFromShopFilters
    Object.entries(newFiltersFromShopFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || String(value).trim() === '') {
            delete combinedQuery[key];
        }
    });


    // Luôn reset về trang 1 khi filter thay đổi
    delete combinedQuery.page;
    if (process.env.NODE_ENV === 'development') {
      console.log('Shop.tsx: Pushing to router with query:', combinedQuery);
    }

    router.push({
      pathname: router.pathname,
      query: combinedQuery,
    }, undefined, { shallow: true })
    .finally(() => {
        // Đảm bảo isUpdatingFromUrl được reset sau một khoảng thời gian ngắn
        // để cho phép handleUrlParams hoạt động trở lại sau khi push hoàn tất.
        setTimeout(() => {
            isUpdatingFromUrl.current = false;
        }, 50); // Thời gian chờ ngắn
    });

  }, [router, setFilters, itemsPerPage, filters]); // Thêm filters vào dependencies

  // Hàm xử lý thay đổi trang (sử dụng changePage từ context)
  const handlePageChange = (page: number) => {
    changePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm xử lý tìm kiếm (sử dụng setFilters từ context)
  const handleSearch = useCallback((searchTerm: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Shop.tsx: handleSearch called with:', searchTerm);
    }
    isUpdatingFromUrl.current = true;

    // Gọi setFilters của context. Context sẽ tự động chuẩn hóa search term ('' thành undefined)
    // và trigger fetchProducts với forceRefresh nếu search term thay đổi.
    // false = không skipFetch
    setFilters({ search: searchTerm }, false);

    // Cập nhật URL
    const currentRouterQuery = { ...router.query };
    if (searchTerm.trim()) {
      currentRouterQuery.search = searchTerm.trim();
    } else {
      delete currentRouterQuery.search;
    }
    delete currentRouterQuery.page; // Reset về trang 1

    router.push({
      pathname: router.pathname,
      query: currentRouterQuery,
    }, undefined, { shallow: true })
    .finally(() => {
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 50);
    });
  }, [router, setFilters, itemsPerPage]); // loại bỏ filters và fetchProducts khỏi dependencies

  // Breadcrumb cho trang
  // Breadcrumb cho trang
  const breadcrumbs: BreadcrumItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' }, // Removed 'active: true'
  ];

  // Hàm helper để lấy tên danh mục từ ID
  const getCategoryName = (categoryId: string): string => {
    // Tìm trong categories dựa trên cả _id và id
    const category = categories.find((cat: any) =>
      (cat._id === categoryId) || (cat.id === categoryId)
    );

    // Nếu không tìm thấy trong categories, thử tìm từ sản phẩm đầu tiên
    if (!category && products.length > 0) {
      // Lấy sản phẩm đầu tiên có categoryId này
      const firstProductWithCategory = products.find(
        (p) => p.categoryIds?.some((cat) => cat.id === categoryId)
      );

      if (firstProductWithCategory) {
        const matchingCategory = firstProductWithCategory.categoryIds?.find(
          (cat) => cat.id === categoryId
        );
        if (matchingCategory) {
          return matchingCategory.name;
        }
      }
    }

    return category ? category.name : categoryId;
  };

  // Hàm helper để lấy tên thương hiệu từ ID
  const getBrandName = (brandId: string): string => {
    // Tìm trong brands dựa trên cả _id và id
    const brand = brands.find((brand: any) =>
      (brand._id === brandId) || (brand.id === brandId)
    );
    return brand ? brand.name : brandId;
  };

  // Thêm hàm helper để lấy tên chiến dịch từ ID
  const getCampaignName = (campaignId: string): string => {
    // Nếu đã có selectedCampaign, sử dụng title của nó
    if (selectedCampaign && selectedCampaign._id === campaignId) {
      return selectedCampaign.title;
    }

    // Backup: Tìm tên chiến dịch từ dữ liệu sản phẩm
    const productWithCampaign = products.find(product =>
      product.promotion &&
      product.promotion.type === 'campaign' &&
      product.promotion.id === campaignId
    );

    return productWithCampaign?.promotion?.name || 'Khuyến mãi';
  };

  // Thêm hàm helper để lấy tên sự kiện từ ID
  const getEventName = (eventId: string): string => {
    // Tìm sự kiện từ dữ liệu sản phẩm
    const productWithEvent = products.find(product =>
      product.promotion &&
      product.promotion.type === 'event' &&
      product.promotion.id === eventId
    );

    return productWithEvent?.promotion?.name || 'Sự kiện';
  };

  return (
    <DefaultLayout breadcrumItems={breadcrumbs}>
      <ShopBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar filters - Truyền filters và setFilters từ context */}
          <div className="md:w-64 shrink-0">
            <ShopFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>

          {/* Main content */}
          <div className="flex-grow">
            {/* Bộ lọc đang active - Cập nhật để sử dụng filters từ context */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Bộ lọc ({activeFiltersCount}):
                </span>

                {/* Hiển thị từ khóa tìm kiếm */}
                {filters.search && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Tìm kiếm: {filters.search}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ search: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Hiển thị tên thương hiệu thay vì ID */}
                {filters.brandId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Thương hiệu: {getBrandName(filters.brandId)}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ brandId: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Hiển thị tên danh mục thay vì ID */}
                {filters.categoryId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Danh mục: {getCategoryName(filters.categoryId)}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ categoryId: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho price */}
                 {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Giá: {filters.minPrice?.toLocaleString() ?? '0'}đ - {filters.maxPrice?.toLocaleString() ?? '∞'}đ
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ minPrice: undefined, maxPrice: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho skinTypes */}
                 {filters.skinTypes && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Loại da: {filters.skinTypes.split(',').join(', ')}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ skinTypes: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho concerns */}
                 {filters.concerns && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Vấn đề da: {filters.concerns.split(',').join(', ')}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ concerns: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho isOnSale */}
                 {filters.isOnSale && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Đang giảm giá
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ isOnSale: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Hiển thị khi có quà tặng */}
                 {filters.hasGifts && (
                   <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                     Có quà tặng
                     <button
                       className="ml-2 text-gray-500 hover:text-gray-700"
                       onClick={() => setFilters({ hasGifts: undefined })}
                     >
                       ×
                     </button>
                   </div>
                 )}

                 {/* Hiển thị tên campaign thay vì ID */}
                 {filters.campaignId && (
                   <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                     Khuyến mãi: {getCampaignName(filters.campaignId)}
                     <button
                       className="ml-2 text-gray-500 hover:text-gray-700"
                       onClick={() => setFilters({ campaignId: undefined })}
                     >
                       ×
                     </button>
                   </div>
                 )}

                {/* Thêm filter hiển thị Event nếu có */}
                {filters.eventId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Sự kiện: {getEventName(filters.eventId)}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ eventId: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Nút xóa tất cả bộ lọc */}
                <button
                  className="text-[#d53f8c] hover:underline text-sm"
                  onClick={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Shop.tsx: "Xóa tất cả bộ lọc" (active filters) clicked');
                    }
                    isUpdatingFromUrl.current = true;

                    const allFiltersResetPayload: ShopProductFilters = {
                      search: undefined, brandId: undefined, categoryId: undefined,
                      eventId: undefined, campaignId: undefined, status: undefined,
                      minPrice: undefined, maxPrice: undefined, tags: undefined,
                      skinTypes: undefined, concerns: undefined, isBestSeller: undefined,
                      isNew: undefined, isOnSale: undefined, hasGifts: undefined,
                      sortBy: undefined, sortOrder: undefined,
                    };
                    
                    // Gọi setFilters của context, không skip fetch để context tự xử lý
                    setFilters(allFiltersResetPayload, false);

                    // Xóa tất cả query params khỏi URL
                    router.replace(router.pathname, undefined, { shallow: true })
                    .finally(() => {
                        setTimeout(() => {
                            isUpdatingFromUrl.current = false;
                        }, 50);
                    });
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Hiển thị lỗi nếu có */}
            {error && (
              <div className="text-center py-12 bg-red-100 text-red-700 rounded-lg mb-4">
                <p>Đã xảy ra lỗi: {error}</p>
              </div>
            )}

            {/* Danh sách sản phẩm - Sử dụng loading và products từ context */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {/* Skeleton loading */}
                {Array(12).fill(null).map((_, index) => ( // Hiển thị skeleton dựa trên itemsPerPage
                  <div key={index} className="h-full">
                    <div className="bg-white rounded-sm shadow-sm skeleton-loader h-full flex flex-col">
                      <div className="relative pt-[100%] bg-gray-300"></div>
                      <div className="p-3 flex-grow flex flex-col">
                        <div className="h-[40px] bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="mt-auto">
                          <div className="h-3 bg-gray-300 rounded w-full mt-2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-[#fdf2f8] rounded-lg">
                <div className="text-5xl mb-4">😕</div>
                <p className="text-lg text-gray-600 font-medium">Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                <p className="mt-2 text-gray-500 mb-4">Vui lòng thử lại với các bộ lọc khác hoặc xóa một số bộ lọc.</p>
                <button
                  className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1] text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Shop.tsx: "Xóa tất cả bộ lọc" (no products) clicked');
                    }
                    isUpdatingFromUrl.current = true;
                    const allFiltersResetPayload: ShopProductFilters = {
                      search: undefined, brandId: undefined, categoryId: undefined,
                      eventId: undefined, campaignId: undefined, status: undefined,
                      minPrice: undefined, maxPrice: undefined, tags: undefined,
                      skinTypes: undefined, concerns: undefined, isBestSeller: undefined,
                      isNew: undefined, isOnSale: undefined, hasGifts: undefined,
                      sortBy: undefined, sortOrder: undefined,
                    };
                    
                    // Gọi setFilters của context, không skip fetch
                    setFilters(allFiltersResetPayload, false);

                    // Xóa tất cả query params khỏi URL
                    router.replace(router.pathname, undefined, { shallow: true })
                    .finally(() => {
                        setTimeout(() => {
                            isUpdatingFromUrl.current = false;
                        }, 50);
                    });
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {/* Map qua products từ context */}
                {products.map((product: LightProduct) => (
                  <div key={product.id} className="h-full">
                    <ProductCardShop
                      id={product.id}
                      name={product.name}
                      // Sử dụng imageUrl từ LightProduct
                      image={product.imageUrl || '/images/product-placeholder.jpg'}
                      price={product.currentPrice}
                      originalPrice={product.price}
                      rating={product.reviews?.averageRating || 0}
                      ratingCount={product.reviews?.reviewCount || 0}
                      soldCount={product.soldCount || 0} // Hiển thị số lượng đã bán thực tế từ database
                      discount={product.currentPrice < product.price ? Math.round(((product.price - product.currentPrice) / product.price) * 100) : undefined}
                      slug={product.slug}
                      promotion={product.promotion} // Truyền thông tin promotion từ API
                      flashSale={product.promotion?.type === 'event' && product.promotion?.name === 'Flash Sale' ? {
                        isActive: true,
                        endTime: new Date(Date.now() + 86400000).toISOString(),
                        soldPercent: product.soldCount ? Math.min(Math.round((product.soldCount / 100) * 100), 95) : 0 // Hiển thị phần trăm đã bán thực tế
                      } : undefined}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination - Sử dụng currentPage, totalPages, changePage từ context */}
            {!loading && products.length > 0 && (
              <ShopPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange} // Sử dụng handlePageChange đã được cập nhật
              />
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
