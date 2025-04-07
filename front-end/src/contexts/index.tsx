import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from './AuthContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { NotificationProvider } from './NotificationContext';
import { BannerProvider } from './BannerContext';
import { BrandProvider, useBrands } from './BrandContext';
import { CategoryProvider } from './CategoryContext';
import { BranchProvider } from './BranchContext';
import { ProductProvider, ProductContext } from './ProductContext';
import { VoucherProvider } from './VoucherContext';
import { EventsProvider } from './EventsContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [shouldUseProductProvider, setShouldUseProductProvider] = useState(false);
  
  // Kiểm tra ban đầu dựa vào URL hiện tại của trình duyệt
  useEffect(() => {
    // Hàm kiểm tra đường dẫn
    const checkPath = (path: string) => {
      return path.startsWith('/admin/products') || path.startsWith('/shop') || path.startsWith('/product') || path.startsWith('/admin/events');
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
  
  // Xác định sẽ dùng ProductProvider cho trang admin/products, shop và trang chi tiết sản phẩm
  const isAdminProductsPage = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/admin/products') || 
      (router.pathname && router.pathname.startsWith('/admin/products')));
  
  const isShopPage = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/shop') || 
      (router.pathname && router.pathname.startsWith('/shop')));
  
  const isProductDetailPage = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/product') || 
      (router.pathname && router.pathname.startsWith('/product')));
  
  // Kiểm tra nếu đang ở trang events
  const isEventsPage = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/admin/events') || 
      (router.pathname && router.pathname.startsWith('/admin/events')));
  
  // Sử dụng ProductProvider nếu ở trang admin/products, shop, trang chi tiết sản phẩm hoặc trang events
  const useProductProvider = isAdminProductsPage || isShopPage || isProductDetailPage || isEventsPage || shouldUseProductProvider;
  
  // Kiểm tra nếu đang ở trang voucher để sử dụng VoucherProvider
  const isVoucherPage = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/admin/vouchers') || 
      (router.pathname && router.pathname.startsWith('/admin/vouchers')));
  
  // Tạo hàm để quyết định bọc children bằng Provider phù hợp
  const wrapWithProviders = (children: React.ReactNode) => {
    let wrappedChildren = children;
    
    // Bọc với VoucherProvider nếu ở trang voucher
    if (isVoucherPage) {
      wrappedChildren = (
        <VoucherProvider>
          {wrappedChildren}
        </VoucherProvider>
      );
    }
    
    // Bọc với ProductProvider trước nếu cần
    if (useProductProvider) {
      wrappedChildren = (
        <ProductProvider>
          {wrappedChildren}
        </ProductProvider>
      );
    }
    
    // Sau đó bọc với EventsProvider nếu ở trang events
    if (isEventsPage) {
      wrappedChildren = (
        <EventsProvider>
          {wrappedChildren}
        </EventsProvider>
      );
    }
    
    return wrappedChildren;
  };
  
  // ProductProvider có điều kiện, các provider khác giữ nguyên
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <NotificationProvider>
          <BannerProvider>
            <BrandProvider>
              <CategoryProvider>
                <BranchProvider>
                  {wrapWithProviders(children)}
                </BranchProvider>
              </CategoryProvider>
            </BrandProvider>
          </BannerProvider>
        </NotificationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export { useAuth } from './AuthContext';
export { useAdminAuth } from './AdminAuthContext';
export { useNotification } from './NotificationContext';
export { useBanner } from './BannerContext';
export { useBrands } from './BrandContext';
export { useCategory } from './CategoryContext';
export { useBranches } from './BranchContext';
export { useProduct } from './ProductContext';
export { ProductContext } from './ProductContext';
export { useVoucher } from './VoucherContext';
export { useEvents } from './EventsContext';

// Alias cho useBrands (để tương thích ngược)
export const useBrand = useBrands;