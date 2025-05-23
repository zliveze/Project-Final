import React, { useEffect, useCallback, useMemo, memo } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import ProductCardShop from '../../components/common/ProductCardShop';
import ShopFilters from '../../components/shop/ShopFilters';
import ShopBanner from '../../components/shop/ShopBanner';
import ShopPagination from '../../components/shop/ShopPagination';
import { BreadcrumItem } from '@/components/common/Breadcrum';
import { useShopProduct, ShopProductFilters } from '@/contexts/user/shop/ShopProductContext';
import { LightProduct } from '@/contexts/user/shop/ShopProductContext';
import { useCategories } from '@/contexts/user/categories/CategoryContext';
import { useBrands } from '@/contexts/user/brands/BrandContext';
import { useRouter } from 'next/router';

// Memoized skeleton loader component
const ProductSkeleton = memo(() => (
  <div className="h-full">
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
));

ProductSkeleton.displayName = 'ProductSkeleton';

// Memoized ProductCard wrapper
const MemoizedProductCard = memo<{
  product: LightProduct;
}>(({ product }) => (
  <div className="h-full">
    <ProductCardShop
      id={product.id}
      name={product.name}
      image={product.imageUrl || '/images/product-placeholder.jpg'}
      price={product.currentPrice}
      originalPrice={product.price}
      rating={product.reviews?.averageRating || 0}
      ratingCount={product.reviews?.reviewCount || 0}
      soldCount={product.soldCount || 0}
      discount={product.currentPrice < product.price ? Math.round(((product.price - product.currentPrice) / product.price) * 100) : undefined}
      slug={product.slug}
      promotion={product.promotion}
      flashSale={product.promotion?.type === 'event' && product.promotion?.name === 'Flash Sale' ? {
        isActive: true,
        endTime: new Date(Date.now() + 86400000).toISOString(),
        soldPercent: product.soldCount ? Math.min(Math.round((product.soldCount / 100) * 100), 95) : 0
      } : undefined}
    />
  </div>
));

MemoizedProductCard.displayName = 'MemoizedProductCard';

// Memoized ActiveFilter component
const ActiveFilter = memo<{
  type: string;
  value: string;
  onRemove: () => void;
}>(({ type, value, onRemove }) => (
  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
    {type}: {value}
    <button
      className="ml-2 text-gray-500 hover:text-gray-700"
      onClick={onRemove}
    >
      ×
    </button>
  </div>
));

ActiveFilter.displayName = 'ActiveFilter';

export default function Shop() {
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
    itemsPerPage
  } = useShopProduct();

  const router = useRouter();
  const { categories } = useCategories();
  const { brands } = useBrands();

  // Refs để optimize performance
  const isUpdatingFromUrl = React.useRef(false);
  const lastUrlParamsRef = React.useRef<string>('');

  // Memoized helper functions
  const getCategoryName = useCallback((categoryId: string): string => {
    const category = categories.find((cat: any) =>
      (cat._id === categoryId) || (cat.id === categoryId)
    );

    if (!category && products.length > 0) {
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
  }, [categories, products]);

  const getBrandName = useCallback((brandId: string): string => {
    const brand = brands.find((brand: any) =>
      (brand._id === brandId) || (brand.id === brandId)
    );
    return brand ? brand.name : brandId;
  }, [brands]);

  const getCampaignName = useCallback((campaignId: string): string => {
    if (selectedCampaign && selectedCampaign._id === campaignId) {
      return selectedCampaign.title;
    }

    const productWithCampaign = products.find(product =>
      product.promotion &&
      product.promotion.type === 'campaign' &&
      product.promotion.id === campaignId
    );

    return productWithCampaign?.promotion?.name || 'Khuyến mãi';
  }, [selectedCampaign, products]);

  const getEventName = useCallback((eventId: string): string => {
    const productWithEvent = products.find(product =>
      product.promotion &&
      product.promotion.type === 'event' &&
      product.promotion.id === eventId
    );

    return productWithEvent?.promotion?.name || 'Sự kiện';
  }, [products]);

  // Memoized URL params handler
  const handleUrlParams = useCallback(() => {
    if (isUpdatingFromUrl.current) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const currentUrlParams = searchParams.toString();
    
    // Skip if URL params haven't changed
    if (currentUrlParams === lastUrlParamsRef.current) {
      return;
    }
    
    lastUrlParamsRef.current = currentUrlParams;
    
    searchParams.delete('_');

    const newFiltersFromUrl: Partial<ShopProductFilters> = {};
    const possibleFilterKeys: (keyof ShopProductFilters)[] = [
      'search', 'brandId', 'categoryId', 'eventId', 'campaignId',
      'status', 'minPrice', 'maxPrice', 'tags', 'skinTypes',
      'concerns', 'isBestSeller', 'isNew', 'isOnSale', 'hasGifts',
      'sortBy', 'sortOrder'
    ];

    possibleFilterKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value !== null && value !== 'undefined' && String(value).trim() !== '') {
        if (key === 'minPrice' || key === 'maxPrice') {
          newFiltersFromUrl[key] = Number(value);
        } else if (key === 'isBestSeller' || key === 'isNew' || key === 'isOnSale' || key === 'hasGifts') {
          newFiltersFromUrl[key] = value === 'true';
        } else if (key === 'sortOrder') {
          if (value === 'asc' || value === 'desc') {
            newFiltersFromUrl[key] = value;
          } else {
            newFiltersFromUrl[key] = undefined; 
          }
        } else {
          newFiltersFromUrl[key] = value;
        }
      } else {
        if (key === 'search' && searchParams.has(key)) {
          newFiltersFromUrl[key] = '';
        } else {
          newFiltersFromUrl[key] = undefined;
        }
      }
    });
    
    if (newFiltersFromUrl.campaignId) {
      newFiltersFromUrl.eventId = undefined;
    }

    // Check for actual changes
    const hasChanged = Object.keys(newFiltersFromUrl).some(key => {
      const filterKey = key as keyof ShopProductFilters;
      if (filterKey === 'search') {
        const oldValueEmpty = !filters[filterKey] || filters[filterKey] === '';
        const newValueEmpty = !newFiltersFromUrl[filterKey] || newFiltersFromUrl[filterKey] === '';
        return oldValueEmpty !== newValueEmpty;
      }
      return String(filters[filterKey] ?? '') !== String(newFiltersFromUrl[filterKey] ?? '');
    });

    if (hasChanged) {
      isUpdatingFromUrl.current = true;
      setFilters(newFiltersFromUrl, false); 
      
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 300);
    }
  }, [filters, setFilters]);

  // Optimized route change handler
  const handleRouteChange = useCallback(() => {
    isUpdatingFromUrl.current = false;
    handleUrlParams();
  }, [handleUrlParams]);

  // Memoized filter change handler
  const handleFilterChange = useCallback((newFiltersFromShopFilters: Partial<ShopProductFilters>) => {
    isUpdatingFromUrl.current = true;

    setFilters(newFiltersFromShopFilters, false);

    const currentRouterQuery = { ...router.query };
    const combinedQuery: Record<string, any> = {};

    const effectiveFilters = { ...filters, ...newFiltersFromShopFilters };

    Object.entries(effectiveFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        combinedQuery[key] = String(value);
      }
    });
    
    Object.entries(newFiltersFromShopFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value).trim() === '') {
        delete combinedQuery[key];
      }
    });

    delete combinedQuery.page;

    router.push({
      pathname: router.pathname,
      query: combinedQuery,
    }, undefined, { shallow: true })
    .finally(() => {
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 50);
    });
  }, [router, setFilters, filters]);

  // Memoized page change handler
  const handlePageChange = useCallback((page: number) => {
    changePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [changePage]);

  // Memoized search handler
  const handleSearch = useCallback((searchTerm: string) => {
    isUpdatingFromUrl.current = true;

    setFilters({ search: searchTerm }, false);

    const currentRouterQuery = { ...router.query };
    if (searchTerm.trim()) {
      currentRouterQuery.search = searchTerm.trim();
    } else {
      delete currentRouterQuery.search;
    }
    delete currentRouterQuery.page;

    router.push({
      pathname: router.pathname,
      query: currentRouterQuery,
    }, undefined, { shallow: true })
    .finally(() => {
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 50);
    });
  }, [router, setFilters]);

  // Effects with optimization
  useEffect(() => {
    handleUrlParams();

    router.events.on('routeChangeComplete', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [router, handleUrlParams, handleRouteChange]);

  useEffect(() => {
    if (!isUpdatingFromUrl.current) {
      if ('search' in router.query) {
        const searchQuery = router.query.search as string;
        setFilters({ search: searchQuery }, false);
      } else {
        handleUrlParams();
      }
    }
  }, [router.query, handleUrlParams, setFilters]);

  // Memoized calculations
  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).reduce((count, key) => {
      const value = filters[key as keyof ShopProductFilters];
      return (value !== undefined && value !== null && value !== '') ? count + 1 : count;
    }, 0);
  }, [filters]);

  const breadcrumbs: BreadcrumItem[] = useMemo(() => [
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' },
  ], []);

  // Memoized reset all filters handler
  const handleResetAllFilters = useCallback(() => {
    const allFiltersResetPayload: ShopProductFilters = {
      search: undefined, brandId: undefined, categoryId: undefined,
      eventId: undefined, campaignId: undefined, status: undefined,
      minPrice: undefined, maxPrice: undefined, tags: undefined,
      skinTypes: undefined, concerns: undefined, isBestSeller: undefined,
      isNew: undefined, isOnSale: undefined, hasGifts: undefined,
      sortBy: undefined, sortOrder: undefined,
    };
    
    handleFilterChange(allFiltersResetPayload);
  }, [handleFilterChange]);

  // Memoized active filters
  const activeFilterComponents = useMemo(() => {
    const components = [];

    if (filters.search) {
      components.push(
        <ActiveFilter
          key="search"
          type="Tìm kiếm"
          value={filters.search}
          onRemove={() => handleFilterChange({ search: undefined })}
        />
      );
    }

    if (filters.brandId) {
      const brandIds = filters.brandId.split(',');
      if (brandIds.length === 1) {
        components.push(
          <ActiveFilter
            key="brand"
            type="Thương hiệu"
            value={getBrandName(brandIds[0])}
            onRemove={() => handleFilterChange({ brandId: undefined })}
          />
        );
      } else {
        brandIds.forEach((brandId, index) => {
          components.push(
            <ActiveFilter
              key={`brand-${index}`}
              type="Thương hiệu"
              value={getBrandName(brandId)}
              onRemove={() => {
                const remainingBrands = brandIds.filter(id => id !== brandId);
                handleFilterChange({ 
                  brandId: remainingBrands.length > 0 ? remainingBrands.join(',') : undefined 
                });
              }}
            />
          );
        });
      }
    }

    if (filters.categoryId) {
      const categoryIds = filters.categoryId.split(',');
      if (categoryIds.length === 1) {
        components.push(
          <ActiveFilter
            key="category"
            type="Danh mục"
            value={getCategoryName(categoryIds[0])}
            onRemove={() => handleFilterChange({ categoryId: undefined })}
          />
        );
      } else {
        categoryIds.forEach((categoryId, index) => {
          components.push(
            <ActiveFilter
              key={`category-${index}`}
              type="Danh mục"
              value={getCategoryName(categoryId)}
              onRemove={() => {
                const remainingCategories = categoryIds.filter(id => id !== categoryId);
                handleFilterChange({ 
                  categoryId: remainingCategories.length > 0 ? remainingCategories.join(',') : undefined 
                });
              }}
            />
          );
        });
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      components.push(
        <ActiveFilter
          key="price"
          type="Giá"
          value={`${filters.minPrice?.toLocaleString() ?? '0'}đ - ${filters.maxPrice?.toLocaleString() ?? '∞'}đ`}
          onRemove={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
        />
      );
    }

    if (filters.skinTypes) {
      components.push(
        <ActiveFilter
          key="skinTypes"
          type="Loại da"
          value={filters.skinTypes.split(',').join(', ')}
          onRemove={() => handleFilterChange({ skinTypes: undefined })}
        />
      );
    }

    if (filters.concerns) {
      components.push(
        <ActiveFilter
          key="concerns"
          type="Vấn đề da"
          value={filters.concerns.split(',').join(', ')}
          onRemove={() => handleFilterChange({ concerns: undefined })}
        />
      );
    }

    if (filters.isOnSale) {
      components.push(
        <ActiveFilter
          key="isOnSale"
          type="Đang giảm giá"
          value=""
          onRemove={() => handleFilterChange({ isOnSale: undefined })}
        />
      );
    }

    if (filters.hasGifts) {
      components.push(
        <ActiveFilter
          key="hasGifts"
          type="Có quà tặng"
          value=""
          onRemove={() => handleFilterChange({ hasGifts: undefined })}
        />
      );
    }

    if (filters.campaignId) {
      components.push(
        <ActiveFilter
          key="campaign"
          type="Khuyến mãi"
          value={getCampaignName(filters.campaignId)}
          onRemove={() => handleFilterChange({ campaignId: undefined })}
        />
      );
    }

    if (filters.eventId) {
      components.push(
        <ActiveFilter
          key="event"
          type="Sự kiện"
          value={getEventName(filters.eventId)}
          onRemove={() => handleFilterChange({ eventId: undefined })}
        />
      );
    }

    return components;
  }, [filters, getBrandName, getCategoryName, getCampaignName, getEventName, handleFilterChange]);

  // Memoized product grid
  const productGrid = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          {Array(12).fill(null).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-12 bg-[#fdf2f8] rounded-lg">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-lg text-gray-600 font-medium">Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</p>
          <p className="mt-2 text-gray-500 mb-4">Vui lòng thử lại với các bộ lọc khác hoặc xóa một số bộ lọc.</p>
          <button
            className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1] text-white px-4 py-2 rounded-md transition-colors"
            onClick={handleResetAllFilters}
          >
            Xóa tất cả
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {products.map((product: LightProduct) => (
          <MemoizedProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }, [loading, products, handleResetAllFilters]);

  return (
    <DefaultLayout breadcrumItems={breadcrumbs}>
      <ShopBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 shrink-0">
            <ShopFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>

          <div className="flex-grow">
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Bộ lọc ({activeFiltersCount}):
                </span>

                {activeFilterComponents}

                <button
                  className="text-[#d53f8c] hover:underline text-sm"
                  onClick={handleResetAllFilters}
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {error && (
              <div className="text-center py-12 bg-red-100 text-red-700 rounded-lg mb-4">
                <p>Đã xảy ra lỗi: {error}</p>
              </div>
            )}

            {productGrid}

            {!loading && products.length > 0 && (
              <ShopPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
