import React from 'react';
import { AuthProvider } from './AuthContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { NotificationProvider } from './NotificationContext';
import { BannerProvider } from './BannerContext';
import { BrandProvider } from './BrandContext';
import { CategoryProvider } from './CategoryContext';
import { BranchProvider } from './BranchContext';
import { ProductProvider, ProductContext } from './ProductContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminLoginPage, setIsAdminLoginPage] = React.useState(false);
  
  // Kiểm tra xem người dùng có đang ở trang đăng nhập admin không
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    setIsAdminLoginPage(currentPath === '/admin/auth/login');
  }, []);
  
  // ProductProvider có điều kiện, các provider khác giữ nguyên
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <NotificationProvider>
          <BannerProvider>
            <BrandProvider>
              <CategoryProvider>
                <BranchProvider>
                  {isAdminLoginPage ? (
                    // Nếu ở trang đăng nhập admin, không sử dụng ProductProvider
                    children
                  ) : (
                    // Ngược lại, sử dụng ProductProvider
                    <ProductProvider>
                      {children}
                    </ProductProvider>
                  )}
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