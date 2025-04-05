import React, { useState, useContext } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { FiArrowLeft } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import ProductSEO from '@/components/product/ProductSEO';
import ProductImages from '@/components/product/ProductImages';
import ProductInfo from '@/components/product/ProductInfo';
import ProductDescription from '@/components/product/ProductDescription';
import ProductReviews from '@/components/product/ProductReviews';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import ProductInventory from '@/components/product/ProductInventory';
import ProductCategories from '@/components/product/ProductCategories';
import ProductPromotions from '@/components/product/ProductPromotions';
import DefaultLayout from '@/layout/DefaultLayout'; 
import { ProductContext } from '@/contexts';

interface ProductPageProps {
  product: any;
  reviews: any[];
  recommendedProducts: any[];
  branches: any[];
  categories: any[];
  events: any[];
  campaigns: any[];
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}

const ProductPage: React.FC<ProductPageProps> = ({
  product,
  reviews,
  recommendedProducts,
  branches,
  categories,
  events,
  campaigns,
  isAuthenticated,
  hasPurchased,
  hasReviewed,
}) => {
  const router = useRouter();
  const productContext = useContext(ProductContext);
  const addToWishlist = productContext?.addToWishlist || ((productId: string) => {
    console.warn('ProductContext không được tìm thấy. Không thể thêm vào danh sách yêu thích.');
    return Promise.resolve(false);
  });
  
  // Xử lý thêm vào danh sách yêu thích
  const handleAddToWishlist = async (product: any) => {
    await addToWishlist(product._id);
  };

  return (
    <DefaultLayout>
      {/* SEO */}
      <ProductSEO 
        seo={product.seo || {}} 
        product={product} 
        categories={categories}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Nút quay lại */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-[#d53f8c] transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Thông tin sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-6 shadow-sm">
          {/* Ảnh sản phẩm */}
          <div className="space-y-6">
            <ProductImages images={product.images || []} productName={product.name} />
            
            {/* Thông tin nhanh về sản phẩm */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Thông tin nhanh:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loại da:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.cosmetic_info?.skinType?.map((type: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-[#fdf2f8] text-[#d53f8c] text-xs rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dung tích:</p>
                  <p className="text-sm font-medium">
                    {product.cosmetic_info?.volume?.value || 0} {product.cosmetic_info?.volume?.unit || 'ml'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Xuất xứ:</p>
                  <p className="text-sm font-medium">{product.cosmetic_info?.madeIn || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hạn sử dụng:</p>
                  <p className="text-sm font-medium">
                    {product.cosmetic_info?.expiry?.shelf || 0} tháng
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin chi tiết */}
          <div className="space-y-8">
            <ProductInfo
              _id={product._id}
              name={product.name}
              sku={product.sku}
              description={{ short: product.description?.short || '' }}
              price={product.price || 0}
              currentPrice={product.currentPrice || product.price || 0}
              status={product.status || 'active'}
              brand={product.brand || {}}
              cosmetic_info={product.cosmetic_info || {}}
              variants={product.variants || []}
              flags={product.flags || {}}
              gifts={product.gifts || []}
              reviews={product.reviews || { averageRating: 0, reviewCount: 0 }}
            />
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Tồn kho theo chi nhánh */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductInventory 
              inventory={product.inventory || []} 
              branches={branches} 
            />
          </div>
          
          {/* Khuyến mãi đang áp dụng */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductPromotions 
              events={events} 
              campaigns={campaigns} 
            />
          </div>
          
          {/* Danh mục và tags */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductCategories 
              categories={categories} 
              tags={product.tags || []} 
            />
          </div>
        </div>

        {/* Mô tả sản phẩm */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <ProductDescription
            fullDescription={product.description?.full || ''}
            cosmeticInfo={product.cosmetic_info || {}}
          />
        </div>

        {/* Đánh giá sản phẩm */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
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

        {/* Sản phẩm gợi ý */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <RecommendedProducts
            products={recommendedProducts}
          />
        </div>
      </main>

      <ToastContainer />
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
    const branchesRes = await fetch(`${API_URL}/branches`);
    const branches = branchesRes.ok ? await branchesRes.json() : [];

    // Lấy danh sách danh mục
    const categoriesRes = await fetch(`${API_URL}/categories`);
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];
    
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
        reviews: reviewsData.data || [],
        recommendedProducts: recommendedData.data || [],
        branches: branches || [],
        categories: categories || [],
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