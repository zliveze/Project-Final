import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';
import { formatImageUrl } from '@/utils/imageUtils';
import { useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { usePerformanceMonitor } from '@/utils/performanceMonitor';

// Static imports for critical components
import ProductSEO from '@/components/product/ProductSEO';
import ProductImages, { ImageType } from '@/components/product/ProductImages';
import ProductInfo, { Variant } from '@/components/product/ProductInfo';
import { VariantCombination } from '@/components/product/ProductVariants';
import DefaultLayout from '@/layout/DefaultLayout';
import { BrandWithLogo } from '@/components/product/ProductInfo';

// Dynamic imports for non-critical components
const ProductDescription = dynamic(() => import('@/components/product/ProductDescription'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
});
const ProductReviews = dynamic(() => import('@/components/product/ProductReviews'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
});
const RecommendedProducts = dynamic(() => import('@/components/common/RecommendedProducts'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
});
const ProductInventory = dynamic(() => import('@/components/product/ProductInventory'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
});
const ProductCategories = dynamic(() => import('@/components/product/ProductCategories'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-16 rounded-lg" />
});
const ProductPromotions = dynamic(() => import('@/components/product/ProductPromotions'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-20 rounded-lg" />
});

// Import CategoryWithImage type
import { CategoryWithImage } from '@/components/product/ProductCategories';

// Define proper types to replace 'any'
interface Review {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  imageUrl?: string;
}

interface Branch {
  _id: string;
  name: string;
  address: string;
  phone?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Event {
  _id: string;
  title: string;
  products: Array<{
    productId: string;
    adjustedPrice: number;
    variants?: Array<{
      variantId: string;
      adjustedPrice: number;
      combinations?: Array<{
        combinationId: string;
        adjustedPrice: number;
      }>;
    }>;
  }>;
}

interface Campaign {
  _id: string;
  title: string;
  products: Array<{
    productId: string;
    adjustedPrice: number;
    variants?: Array<{
      variantId: string;
      adjustedPrice: number;
      combinations?: Array<{
        combinationId: string;
        adjustedPrice: number;
      }>;
    }>;
  }>;
}

// Extended interfaces for promotion support
interface VariantWithPromotion extends Variant {
  promotionPrice?: number;
  promotion?: {
    type: string;
    id: string;
    name: string;
    adjustedPrice: number;
  };
}

// VariantCombinationWithPromotion interface removed as it's not used in the component

interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: {
    short?: string;
    full?: string;
  };
  price: number;
  currentPrice: number;
  status: string;
  brandId?: string;
  categoryIds?: string[];
  cosmetic_info?: Record<string, unknown>;
  variants?: VariantWithPromotion[];
  flags?: Record<string, unknown>;
  gifts?: unknown[];
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
  tags?: string[];
  inventory?: unknown[];
  variantInventory?: Array<{
    variantId: string;
    quantity: number;
  }>;
  combinationInventory?: Array<{
    variantId: string;
    quantity: number;
  }>;
  seo?: Record<string, unknown>;
  promotion?: {
    type: string;
    id: string;
    name: string;
    adjustedPrice: number;
  };
}

interface ProductPageProps {
  product: Product;
  fullBrand: BrandWithLogo;
  productCategories: CategoryWithImage[];
  reviews: Review[];
  recommendedProducts: RecommendedProduct[];
  branches: Branch[];
  categories: Category[];
  events: Event[];
  campaigns: Campaign[];
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}


const ProductPage: React.FC<ProductPageProps> = ({
  product,
  fullBrand, // Destructure new prop
  productCategories, // Destructure new prop
  reviews,
  // recommendedProducts - removed as it's not used in the component
  branches, // Keep for ProductInventory
  categories, // Keep for ProductSEO
  events,
  campaigns,
  isAuthenticated,
  hasPurchased,
  hasReviewed,
}) => {
  // ... (rest of component logic remains the same for now)
  const router = useRouter();
  const shopProductContext = useShopProduct();
  const { logProductView } = shopProductContext || {};
  const { markStart, markEnd, logMetrics } = usePerformanceMonitor();

  // Tối ưu tracking thời gian xem sản phẩm
  const startViewTimeRef = React.useRef<number>(0);

  // Ghi lại hoạt động xem sản phẩm khi component được mount
  useEffect(() => {
    // Start performance monitoring
    markStart('product-page-render');

    if (isAuthenticated && product?._id && logProductView) {
      // Ghi lại thời điểm bắt đầu xem
      startViewTimeRef.current = Date.now();

      // Ghi lại hoạt động xem sản phẩm
      logProductView(product._id);

      // Cleanup function để ghi lại thời gian đã xem
      return () => {
        if (startViewTimeRef.current > 0) {
          const timeSpent = Math.floor((Date.now() - startViewTimeRef.current) / 1000);
          if (timeSpent > 5) { // Chỉ ghi lại nếu xem ít nhất 5 giây
            logProductView(product._id, timeSpent);
          }
        }

        // End performance monitoring and log metrics
        markEnd('product-page-render');
        logMetrics();
      };
    }
  }, [isAuthenticated, product?._id, logProductView, markStart, markEnd, logMetrics]);

  // Process variants to include total stock information and combination inventory
  const processedVariants = useMemo(() => {
    if (!product?.variants?.length) return [];

    return product.variants.map((variant: Variant) => {
      // Get variant inventory from product.variantInventory
      const variantInventory = product.variantInventory?.filter(
        (inv) => inv.variantId === variant.variantId
      ) || [];

      // Get combination inventory for this variant
      const combinationInventory = product.combinationInventory?.filter(
        (inv) => inv.variantId === variant.variantId
      ) || [];

      // Calculate total stock across all branches for this variant
      const totalStock = variantInventory.reduce(
        (sum: number, inv) => sum + (inv.quantity || 0),
        0
      );

      return {
        ...variant,
        inventory: variantInventory,
        combinationInventory: combinationInventory,
        totalStock
      };
    });
  }, [product?.variants, product?.variantInventory, product?.combinationInventory]);

  // State for the currently selected variant and combination
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    // Initialize with the first processed variant if available
    return processedVariants.length > 0 ? processedVariants[0] : null;
  });

  // selectedCombination is not currently used in the component but kept for future implementation
  const [, setSelectedCombination] = useState<VariantCombination | null>(null);

  // Handler to update the selected variant and combination state
  const handleSelectVariant = useCallback((variant: Variant | null, combination?: VariantCombination | null) => {
    setSelectedVariant(variant);
    setSelectedCombination(combination || null);
  }, []);

  // --- Helper Functions for Variant Names ---
  const parseColorString = useCallback((colorString?: string): { name: string, code: string } => {
    if (!colorString) return { name: '', code: '' };
    const regex = /^(.*?)\s*"(#[0-9a-fA-F]{6})"$/;
    const match = colorString.match(regex);
    if (match && match.length === 3) {
      return { name: match[1].trim(), code: match[2] };
    }
    return { name: colorString, code: '' };
  }, []);

  const getVariantName = useCallback((variant: Variant): string | undefined => {
    const parts: string[] = [];
    if (variant.options?.color) {
      const { name } = parseColorString(variant.options.color);
      if (name) parts.push(`Màu: ${name}`);
    }
    if (variant.options?.sizes && variant.options.sizes.length > 0) {
      parts.push(`Dung tích: ${variant.options.sizes.join(', ')}`);
    }
    if (variant.options?.shades && variant.options.shades.length > 0) {
      parts.push(`Tone: ${variant.options.shades.join(', ')}`);
    }
    return parts.length > 0 ? parts.join(' | ') : undefined;
  }, [parseColorString]);

  // --- Image Aggregation and Initial Image Logic ---
  const { allImages, initialImageUrl } = useMemo(() => {
    // 1. Get Base Product Images
    const baseImages: ImageType[] = product?.images
      ?.filter((img): img is { url: string, alt?: string, isPrimary?: boolean } =>
        typeof img === 'object' && img !== null && typeof img.url === 'string'
      )
      .map((img): ImageType => ({
        url: formatImageUrl(img.url),
        alt: img.alt || product.name,
        isPrimary: img.isPrimary ?? false,
        // No variantName for base images
      })) || [];

    // 2. Get All Variant Images with Names
    const allVariantImages: ImageType[] = product?.variants
      ?.flatMap((variant: Variant) => {
        const variantName = getVariantName(variant);
        // Assuming variant.images are URLs or objects with { url: string, alt?: string, isPrimary?: boolean }
        return variant.images?.map((imgData: string | { url: string; alt?: string; isPrimary?: boolean }): ImageType | null => {
          let url: string | undefined;
          let alt: string | undefined;
          let isPrimary: boolean | undefined;

          if (typeof imgData === 'string') {
            url = imgData; // Assume it's a URL string
          } else if (typeof imgData === 'object' && imgData !== null && imgData.url) {
            url = imgData.url;
            alt = imgData.alt;
            isPrimary = imgData.isPrimary;
          }

          if (url) {
            return {
              url: formatImageUrl(url),
              alt: alt || product.name,
              isPrimary: isPrimary ?? false,
              variantName: variantName, // Add the generated variant name
            };
          }
          return null; // Filter out invalid image data
        }).filter((img): img is ImageType => img !== null) || [];
      }) || [];

    // 3. Combine and Deduplicate (based on URL)
    const combinedImages = [...baseImages, ...allVariantImages];
    const uniqueImages = Array.from(new Map(combinedImages.map(img => [img.url, img])).values());

    // 4. Determine Initial Image URL
    let initialUrl: string | undefined;
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      // Find primary image of selected variant, or just the first image
      const selectedVariantImageUrls = selectedVariant.images.map((imgData: string | { url: string; alt?: string; isPrimary?: boolean }) =>
        typeof imgData === 'string' ? imgData : (typeof imgData === 'object' && imgData?.url ? imgData.url : null)
      ).filter((url): url is string => url !== null);

      const primaryVariantImage = uniqueImages.find(img =>
        selectedVariantImageUrls.includes(img.url) && img.isPrimary
      );
      initialUrl = primaryVariantImage?.url || selectedVariantImageUrls[0];
    }

    // Fallback to primary base image or first base image if no variant image found
    if (!initialUrl) {
      const primaryBaseImage = baseImages.find(img => img.isPrimary);
      initialUrl = primaryBaseImage?.url || baseImages[0]?.url;
    }

    return { allImages: uniqueImages, initialImageUrl: initialUrl };

  }, [selectedVariant, product?.images, product?.variants, product?.name, getVariantName]);


  return (
    <DefaultLayout>
      {/* SEO - Pass all categories for now, might refine later */}
      <ProductSEO
        seo={product.seo || {}}
        product={product}
        categories={categories} // Pass all categories here
      />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Nút quay lại */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-[#d53f8c] transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Thông tin sản phẩm - Section chính */}
        <div className="mb-10">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Ảnh sản phẩm - Bên trái */}
              <div className="p-6 bg-gradient-to-br from-white to-[#fdf2f8]/20">
                <ProductImages
                  images={allImages}
                  initialImageUrl={initialImageUrl}
                  productName={product.name}
                />
              </div>

              {/* Thông tin chi tiết - Bên phải */}
              <div className="p-6 md:p-8 flex flex-col h-full">
                <ProductInfo
                  _id={product._id}
                  name={product.name}
                  sku={product.sku}
                  description={{ short: product.description?.short || '' }}
                  price={product.price || 0}
                  currentPrice={product.currentPrice || product.price || 0}
                  status={product.status || 'active'}
                  brand={fullBrand}
                  cosmetic_info={product.cosmetic_info || {}}
                  variants={processedVariants}
                  flags={product.flags || {}}
                  gifts={product.gifts || []}
                  reviews={product.reviews || { averageRating: 0, reviewCount: 0 }}
                  selectedVariant={selectedVariant}
                  onSelectVariant={handleSelectVariant}
                  branches={branches}
                  product={{
                    inventory: product.inventory || [],
                    combinationInventory: product.combinationInventory || []
                  }}
                />
              </div>
            </div>

            {/* Thông tin nhanh về sản phẩm */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
              <div className="flex flex-wrap gap-6 justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Loại da:</span>
                  <div className="flex flex-wrap gap-1">
                    {product.cosmetic_info?.skinType?.map((type: string, index: number) => (
                      <span key={index} className="px-2 py-0.5 bg-[#fdf2f8] text-[#d53f8c] text-xs rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Dung tích:</span>
                  <span className="text-sm">
                    {product.cosmetic_info?.volume?.value || 0} {product.cosmetic_info?.volume?.unit || 'ml'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Xuất xứ:</span>
                  <span className="text-sm">{product.cosmetic_info?.madeIn || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Hạn sử dụng:</span>
                  <span className="text-sm">
                    {product.cosmetic_info?.expiry?.shelf || 0} tháng
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs cho thông tin chi tiết */}
        <div className="mb-10">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <ProductDescription
              fullDescription={product.description?.full || ''}
              cosmeticInfo={product.cosmetic_info || {}}
            />
          </div>
        </div>

        {/* Thông tin bổ sung - Grid 3 cột */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Tồn kho theo chi nhánh */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="font-medium text-gray-800 flex items-center">
                <FiMapPin className="mr-2 text-pink-500" />
                Tồn kho theo chi nhánh
              </h3>
            </div>
            <div className="p-5">
              <ProductInventory
                inventory={product.inventory || []}
                branches={branches}
              />
            </div>
          </div>

          {/* Khuyến mãi đang áp dụng */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="font-medium text-gray-800 flex items-center">
                <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Khuyến mãi đang áp dụng
              </h3>
            </div>
            <div className="p-5">
              <ProductPromotions
                events={events}
                campaigns={campaigns}
              />
            </div>
          </div>

          {/* Danh mục và tags */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="font-medium text-gray-800 flex items-center">
                <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Danh mục và tags
              </h3>
            </div>
            <div className="p-5">
              <ProductCategories
                categories={productCategories}
                tags={product.tags || []}
              />
            </div>
          </div>
        </div>

        {/* Đánh giá sản phẩm */}
        <div className="mb-10" id="reviews">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Đánh giá sản phẩm ({product.reviews?.reviewCount || 0})
              </h2>
            </div>
            <div className="p-6">
              <ProductReviews
                productId={product._id}
                reviews={reviews}
                averageRating={product.reviews?.averageRating || 0}
                reviewCount={product.reviews?.reviewCount || 0}
                isAuthenticated={isAuthenticated}
                hasPurchased={hasPurchased}
                hasReviewed={hasReviewed}
              />
            </div>
          </div>
        </div>

        {/* Sản phẩm gợi ý */}
        <div className="mb-10">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-5 h-5 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Sản phẩm tương tự
              </h2>
            </div>
            <div className="p-6">
              <RecommendedProducts
                type="similar"
                productId={product._id}
                title="Sản phẩm tương tự"
                seeMoreLink="/shop"
                seeMoreText="Xem thêm sản phẩm"
                limit={8}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast Container is now in DefaultLayout */}
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Import helper functions
  const {
    fetchBrandDetails,
    fetchProductCategories,
    fetchBranches,
    fetchProductReviews,
    fetchRecommendedProducts,
    fetchAllCategories,
    fetchActivePromotions,
    checkUserStatus,
    applyPromotionsToProduct
  } = await import('@/utils/productPageHelpers');

  // Lấy slug từ params
  const { slug } = context.params || {};
  const cookies = context.req.cookies;
  const token = cookies.token || '';
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.endsWith('/api')
    ? process.env.NEXT_PUBLIC_API_URL
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

  try {
    // Lấy thông tin sản phẩm từ API
    const productRes = await fetch(`${API_URL}/products/slug/${slug}`);

    if (!productRes.ok) {
      return {
        notFound: true,
      };
    }

    let product = await productRes.json();

    // Lấy thông tin khuyến mãi từ Event và Campaign đang hoạt động
    try {
      const { events: activeEvents, campaigns: activeCampaigns } = await fetchActivePromotions();

      // Apply promotions to product using helper function
      product = applyPromotionsToProduct(product, activeEvents, activeCampaigns);
    } catch (error) {
      // Silently handle promotion fetch errors in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching promotions:', error);
      }
    }

    // Fetch data in parallel for better performance
    const [
      fullBrand,
      productCategories,
      reviews,
      recommendedProducts,
      branchesData,
      allCategories,
      { isAuthenticated, hasPurchased, hasReviewed }
    ] = await Promise.all([
      fetchBrandDetails(product.brandId),
      fetchProductCategories(product.categoryIds || []),
      fetchProductReviews(product._id),
      fetchRecommendedProducts(product),
      fetchBranches(),
      fetchAllCategories(),
      checkUserStatus(token, product._id)
    ]);

    // Get active promotions for the response
    const { events, campaigns } = await fetchActivePromotions();

    return {
      props: {
        product,
        fullBrand: fullBrand || {},
        productCategories: productCategories || [],
        reviews: reviews || [],
        recommendedProducts: recommendedProducts || [],
        branches: branchesData || [],
        categories: allCategories || [],
        events: events || [],
        campaigns: campaigns || [],
        isAuthenticated,
        hasPurchased,
        hasReviewed,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching product data:', error);
    }

    return {
      notFound: true,
    };
  }
};

export default ProductPage;
