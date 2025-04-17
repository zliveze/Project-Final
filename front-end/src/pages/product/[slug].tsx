import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';
// Toast container is now in DefaultLayout
import { formatImageUrl } from '@/utils/imageUtils';

// Components
import ProductSEO from '@/components/product/ProductSEO';
import ProductImages, { ImageType } from '@/components/product/ProductImages';
import ProductInfo, { Variant } from '@/components/product/ProductInfo'; // Import Variant type
import { VariantCombination } from '@/components/product/ProductVariants'; // Import VariantCombination type
import ProductDescription from '@/components/product/ProductDescription';
import ProductReviews from '@/components/product/ProductReviews';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import ProductInventory from '@/components/product/ProductInventory';
import ProductCategories, { CategoryWithImage } from '@/components/product/ProductCategories'; // Import CategoryWithImage
import ProductPromotions from '@/components/product/ProductPromotions';
import DefaultLayout from '@/layout/DefaultLayout';
// import { useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { BrandWithLogo } from '@/components/product/ProductInfo'; // Import BrandWithLogo

interface ProductPageProps {
  product: any; // Keep 'any' for now, or define a full Product type
  fullBrand: BrandWithLogo; // Add full brand details
  productCategories: CategoryWithImage[]; // Add specific categories for the product
  reviews: any[]; // Define Review type if needed
  recommendedProducts: any[]; // Define RecommendedProduct type if needed
  branches: any[]; // Define Branch type if needed
  categories: any[]; // Keep all categories for SEO/other uses for now
  events: any[]; // Define Event type if needed
  campaigns: any[]; // Define Campaign type if needed
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}


const ProductPage: React.FC<ProductPageProps> = ({
  product,
  fullBrand, // Destructure new prop
  productCategories, // Destructure new prop
  reviews,
  recommendedProducts,
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
  // We'll use the ShopProductContext if needed in the future
  // const shopProductContext = useShopProduct();

  // Process variants to include total stock information and combination inventory
  const processedVariants = React.useMemo(() => {
    if (!product?.variants?.length) return [];

    return product.variants.map((variant: any) => {
      // Get variant inventory from product.variantInventory
      const variantInventory = product.variantInventory?.filter(
        (inv: any) => inv.variantId === variant.variantId
      ) || [];

      // Get combination inventory for this variant
      const combinationInventory = product.combinationInventory?.filter(
        (inv: any) => inv.variantId === variant.variantId
      ) || [];

      // Calculate total stock across all branches for this variant
      const totalStock = variantInventory.reduce(
        (sum: number, inv: any) => sum + (inv.quantity || 0),
        0
      );

      // Log for debugging
      console.log(`Variant ${variant.variantId} (${variant.options?.color || 'unknown'}) has totalStock: ${totalStock}`);
      console.log('Variant inventory details:', variantInventory);

      // Process combinations if they exist
      let combinations = variant.combinations || [];
      if (combinations.length > 0) {
        console.log(`Variant ${variant.variantId} has ${combinations.length} combinations`);
        console.log('Combination inventory details:', combinationInventory);
      }

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

  const [selectedCombination, setSelectedCombination] = useState<VariantCombination | null>(null);

  // Handler to update the selected variant and combination state
  const handleSelectVariant = (variant: Variant | null, combination?: VariantCombination | null) => {
    setSelectedVariant(variant);
    setSelectedCombination(combination || null);
  };

  // --- Helper Functions for Variant Names ---
  const parseColorString = (colorString?: string): { name: string, code: string } => {
    if (!colorString) return { name: '', code: '' };
    const regex = /^(.*?)\s*"(#[0-9a-fA-F]{6})"$/;
    const match = colorString.match(regex);
    if (match && match.length === 3) {
      return { name: match[1].trim(), code: match[2] };
    }
    return { name: colorString, code: '' };
  };

  const getVariantName = (variant: Variant): string | undefined => {
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
  };

  // --- Image Aggregation and Initial Image Logic ---
  const { allImages, initialImageUrl } = React.useMemo(() => {
    // 1. Get Base Product Images
    const baseImages: ImageType[] = product?.images
      ?.filter((img: any): img is { url: string, alt: string, isPrimary?: boolean } =>
        typeof img === 'object' && img !== null && typeof img.url === 'string'
      )
      .map((img: any): ImageType => ({
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
        return variant.images?.map((imgData: any): ImageType | null => {
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
      const selectedVariantImageUrls = selectedVariant.images.map((imgData: any) =>
        typeof imgData === 'string' ? imgData : (typeof imgData === 'object' && imgData?.url ? imgData.url : null)
      ).filter(url => url);

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

  }, [selectedVariant, product?.images, product?.variants, product?.name]);


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
                products={recommendedProducts}
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
  // Lấy slug từ params
  const { slug } = context.params || {};
  const cookies = context.req.cookies;
  const token = cookies.token || '';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  try {
    // Lấy thông tin sản phẩm từ API
    const productRes = await fetch(`${API_URL}/products/slug/${slug}`);

    if (!productRes.ok) {
      return {
        notFound: true,
      };
    }

    const product = await productRes.json();

    // --- LOGGING: Check fetched product and variant data ---
    console.log(`getServerSideProps: Fetched product with ID: ${product._id}`);
    if (product.variants && product.variants.length > 0) {
      console.log(`getServerSideProps: Variants found:`, product.variants.map((v: any) => ({ variantId: v.variantId, sku: v.sku, options: v.options })));
    } else {
      console.log(`getServerSideProps: No variants found for this product.`);
    }
    // --- END LOGGING ---

    // --- Fetch Full Brand Details ---
    let fullBrand = null;
    if (product.brandId) {
      try {
        const brandRes = await fetch(`${API_URL}/brands/${product.brandId}`);
        if (brandRes.ok) {
          fullBrand = await brandRes.json();
        } else {
          console.error(`Failed to fetch brand ${product.brandId}: ${brandRes.status}`);
        }
      } catch (brandError) {
        console.error(`Error fetching brand ${product.brandId}:`, brandError);
      }
    }

    // --- Fetch Full Category Details for this Product ---
    let productCategories: CategoryWithImage[] = [];
    if (product.categoryIds && product.categoryIds.length > 0) {
      const categoryPromises = product.categoryIds.map(async (id: string) => {
        try {
          const catRes = await fetch(`${API_URL}/categories/${id}`);
          if (catRes.ok) {
            return await catRes.json();
          } else {
            console.error(`Failed to fetch category ${id}: ${catRes.status}`);
            return null;
          }
        } catch (catError) {
          console.error(`Error fetching category ${id}:`, catError);
          return null;
        }
      });
      const resolvedCategories = await Promise.all(categoryPromises);
      productCategories = resolvedCategories.filter((cat): cat is CategoryWithImage => cat !== null);
    }

    // Lấy danh sách đánh giá từ API
    const reviewsRes = await fetch(`${API_URL}/reviews/product/${product._id}`);
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [], total: 0 };

    // Lấy sản phẩm gợi ý (từ sản phẩm liên quan hoặc cùng danh mục)
    const relatedIds = product.relatedProducts || [];
    let recommendedProductsQuery = '';

    if (relatedIds.length > 0) {
      recommendedProductsQuery = `relatedTo=${product._id}`;
    } else if (product.categoryIds && product.categoryIds.length > 0) {
      recommendedProductsQuery = `categoryId=${product.categoryIds[0]}&exclude=${product._id}`;
    }

    const recommendedRes = await fetch(`${API_URL}/products/light?${recommendedProductsQuery}&limit=6`);
    const recommendedData = recommendedRes.ok ? await recommendedRes.json() : { data: [] };

    // Lấy danh sách chi nhánh
    const branchesRes = await fetch(`${API_URL}/branches`); // Fetch all branches for inventory
    let branchesData = []; // Default to empty array
    if (branchesRes.ok) {
      const branchesResponse = await branchesRes.json();
      // Check if the response has a 'data' property that is an array
      if (branchesResponse && Array.isArray(branchesResponse.data)) {
        branchesData = branchesResponse.data;
      } else if (Array.isArray(branchesResponse)) {
        // Handle case where it directly returns an array
        branchesData = branchesResponse;
      } else {
        console.error('Unexpected branches API response structure:', branchesResponse);
      }
    } else {
       console.error(`Failed to fetch branches: ${branchesRes.status}`);
    }


    // Lấy danh sách *tất cả* danh mục (e.g., for SEO breadcrumbs or filtering)
    const allCategoriesRes = await fetch(`${API_URL}/categories`);
    const allCategories = allCategoriesRes.ok ? await allCategoriesRes.json() : [];

    // Lấy danh sách sự kiện và chiến dịch đang hoạt động
    const eventsRes = await fetch(`${API_URL}/events/active`);
    const events = eventsRes.ok ? await eventsRes.json() : [];

    const campaignsRes = await fetch(`${API_URL}/campaigns/active`);
    const campaigns = campaignsRes.ok ? await campaignsRes.json() : [];

    // Kiểm tra xem người dùng đã đăng nhập và đã mua sản phẩm và đã đánh giá hay chưa
    let isAuthenticated = false;
    let hasPurchased = false;
    let hasReviewed = false;

    if (token) {
      try {
        // Kiểm tra token hợp lệ
        const verifyRes = await fetch(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (verifyRes.ok) {
          isAuthenticated = true;

          // Kiểm tra đã mua sản phẩm chưa
          const purchaseRes = await fetch(`${API_URL}/orders/check-purchased?productId=${product._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (purchaseRes.ok) {
            const { purchased } = await purchaseRes.json();
            hasPurchased = purchased;
          }

          // Kiểm tra đã đánh giá chưa
          const reviewCheckRes = await fetch(`${API_URL}/reviews/check-reviewed?productId=${product._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (reviewCheckRes.ok) {
            const { reviewed } = await reviewCheckRes.json();
            hasReviewed = reviewed;
          }
        }
      } catch (error) {
        console.error('Error verifying authentication:', error);
      }
    }

    return {
      props: {
        product,
        fullBrand: fullBrand || {}, // Pass fetched full brand or empty object
        productCategories: productCategories || [], // Pass fetched specific categories or empty array
        reviews: reviewsData.data || [],
        recommendedProducts: recommendedData.data || [],
        branches: branchesData, // Pass the extracted array
        categories: allCategories || [], // Pass all categories
        events: events || [],
        campaigns: campaigns || [],
        isAuthenticated,
        hasPurchased,
        hasReviewed,
      },
    };
  } catch (error) {
    console.error('Error fetching product data:', error);

    return {
      notFound: true,
    };
  }
};

export default ProductPage;
