import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from './AuthContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { NotificationProvider } from './NotificationContext';
import { BannerProvider } from './BannerContext';
import { BrandProvider, useBrands } from './BrandContext';
import { CategoryProvider } from './CategoryContext';
import { BranchProvider } from './BranchContext';
import { ProductProvider } from './ProductContext'; // Admin Product Provider
import { ShopProductProvider } from './user/shop/ShopProductContext'; // User Shop Product Provider
import { VoucherProvider } from './VoucherContext';
import { EventsProvider } from './EventsContext';
import { CampaignProvider } from './CampaignContext'; // Import CampaignProvider
import { AdminOrderProvider } from './AdminOrderContext'; // Import AdminOrderProvider
import { UserContextProvider } from './user/UserContextProvider';
import { RecommendationProvider } from './user/RecommendationContext'; // Import RecommendationProvider

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [shouldUseProductProvider, setShouldUseProductProvider] = useState(false);

  // Kiểm tra ban đầu dựa vào URL hiện tại của trình duyệt
  useEffect(() => {
    // Hàm kiểm tra đường dẫn
    const checkPath = (path: string) => {
      return path.startsWith('/admin/products') || path.startsWith('/shop') || path.startsWith('/product') || path.startsWith('/admin/events') || path.startsWith('/admin/campaigns') || path.startsWith('/admin/vouchers');
    };

    // Kiểm tra ngay lập tức dựa trên window.location
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      setShouldUseProductProvider(checkPath(currentPath));
    }

    // Đồng thời kiểm tra dựa trên router.pathname
    if (router.pathname) {
      setShouldUseProductProvider(checkPath(router.pathname));
    }

    // Lắng nghe các sự kiện thay đổi route của Next.js
    const handleRouteChange = (url: string) => {
      setShouldUseProductProvider(checkPath(url));
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('routeChangeStart', handleRouteChange);

    // Cleanup function
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
  // --- Logic xác định trang ---
  const [currentPageType, setCurrentPageType] = useState<'admin' | 'shop' | 'product_detail' | 'voucher' | 'event' | 'campaign' | 'order' | 'other'>('other');

  useEffect(() => {
    const checkPath = (path: string) => {
      if (path.startsWith('/admin/products')) return 'admin';
      if (path.startsWith('/admin/events')) return 'event';
      if (path.startsWith('/admin/campaigns')) return 'campaign';
      if (path.startsWith('/admin/vouchers')) return 'voucher';
      if (path.startsWith('/admin/orders')) return 'order';
      if (path.startsWith('/shop')) return 'shop';
      if (path.startsWith('/product')) return 'product_detail';
      return 'other';
    };

    const handleRouteChange = (url: string) => {
      setCurrentPageType(checkPath(url));
    };

    // Initial check
    if (typeof window !== 'undefined') {
      setCurrentPageType(checkPath(window.location.pathname));
    } else if (router.pathname) {
      setCurrentPageType(checkPath(router.pathname));
    }

    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('routeChangeStart', handleRouteChange); // Check on start too for faster updates

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  // --- Cấu trúc provider cơ bản ---
  // Các provider này áp dụng cho tất cả các trang
  // AuthProvider và AdminAuthProvider đã được cung cấp ở _app.tsx
  const baseProviders = (
    <NotificationProvider>
      <BannerProvider>
        <BrandProvider>
          <CategoryProvider>
            <BranchProvider>
              <CampaignProvider>
                <UserContextProvider>
                  {children}
                </UserContextProvider>
              </CampaignProvider>
            </BranchProvider>
          </CategoryProvider>
        </BrandProvider>
      </BannerProvider>
    </NotificationProvider>
  );

  // Xác định các provider cụ thể cho từng trang
  // Sử dụng router.pathname để xác định trang hiện tại một cách trực tiếp hơn
  const currentPath = router.pathname;
  let pageSpecificProviders = baseProviders; // Bắt đầu với base providers

  if (currentPath.startsWith('/admin/products') || currentPath.startsWith('/admin/campaigns')) {
    pageSpecificProviders = <ProductProvider>{pageSpecificProviders}</ProductProvider>;
  }

  if (currentPath.startsWith('/admin/events')) {
     // Logic cho trang admin/events, có thể cần ProductProvider và EventsProvider
     pageSpecificProviders = (
        <ProductProvider>
            <EventsProvider>
                {pageSpecificProviders}
            </EventsProvider>
        </ProductProvider>
     );
  }


  if (currentPath.startsWith('/shop') || currentPath.startsWith('/product') || currentPath === '/') {
    pageSpecificProviders = (
      <EventsProvider>
        <RecommendationProvider>
          <ShopProductProvider>
            {pageSpecificProviders}
          </ShopProductProvider>
        </RecommendationProvider>
      </EventsProvider>
    );
  }

  if (currentPath.startsWith('/admin/vouchers')) {
    pageSpecificProviders = (
      <ProductProvider> {/* ProductProvider cần thiết cho VoucherForm để chọn sản phẩm */}
        <EventsProvider> {/* EventsProvider cần thiết cho VoucherProvider */}
          <VoucherProvider>
            {pageSpecificProviders}
          </VoucherProvider>
        </EventsProvider>
      </ProductProvider>
    );
  }

  if (currentPath.startsWith('/admin/orders')) {
    pageSpecificProviders = (
      <AdminOrderProvider>
        {pageSpecificProviders}
      </AdminOrderProvider>
    );
  }

  if (currentPath.startsWith('/admin/dashboard')) {
    // Dashboard cần nhiều provider để hiển thị thống kê tổng hợp
    pageSpecificProviders = (
      <AdminOrderProvider>
        <ProductProvider>
          {pageSpecificProviders}
        </ProductProvider>
      </AdminOrderProvider>
    );
  }

  // Các trường hợp khác có thể được thêm vào đây

  return pageSpecificProviders;
};

export { useAuth } from './AuthContext';
export { useAdminAuth } from './AdminAuthContext';
export { useNotification } from './NotificationContext';
export { useBanner } from './BannerContext';
export { useBrands } from './BrandContext';
export { useCategory } from './CategoryContext';
export { useBranches } from './BranchContext';
export { useProduct } from './ProductContext'; // Admin Product Context hook
export { useShopProduct } from './user/shop/ShopProductContext'; // User Shop Product Context hook
export { useVoucher } from './VoucherContext';
export { useEvents } from './EventsContext';
export { useCampaign } from './CampaignContext'; // Export useCampaign
export { useAdminOrder, AdminOrderProvider } from './AdminOrderContext'; // Export useAdminOrder and AdminOrderProvider
export { useUserOrder } from './user/UserOrderContext'; // Export useUserOrder
export { useUserPayment } from './user/UserPaymentContext'; // Export useUserPayment
export { useOrder } from './user/OrderContext'; // Export useOrder
export { useUserReview } from './user/UserReviewContext'; // Export useUserReview
export { useAdminUserReview } from './AdminUserReviewContext'; // Export useAdminUserReview
export { useRecommendation } from './user/RecommendationContext'; // Export useRecommendation hook

// Alias cho useBrands (để tương thích ngược)
export const useBrand = useBrands;
