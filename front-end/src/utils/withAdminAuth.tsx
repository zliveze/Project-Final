import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { NextPageWithLayout } from '@/pages/_app';

export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P> & Partial<NextPageWithLayout>
) {
  const WithAdminAuth = (props: P) => {
    const { isAuthenticated, isLoading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace('/admin/auth/login');
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
          <span className="ml-2 text-xl font-semibold">Đang tải...</span>
        </div>
      );
    }

    // Nếu người dùng đã xác thực thì hiển thị component
    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }

    // Return null khi đang chuyển hướng
    return null;
  };

  // Sao chép hàm getLayout từ component gốc nếu có
  if (WrappedComponent.getLayout) {
    WithAdminAuth.getLayout = WrappedComponent.getLayout;
  }

  return WithAdminAuth;
} 