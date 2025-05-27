import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Error from "next/error";
import { AppProviders } from "../contexts";
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminUserProvider } from '@/contexts/AdminUserContext'
import { AdminUserReviewProvider } from '@/contexts/AdminUserReviewContext'
import { useRouter } from 'next/router'
import { NextPage } from 'next';
import { ReactElement, ReactNode, useEffect } from 'react';
import LoadingOverlay from '@/components/common/LoadingOverlay';

// Định nghĩa các type mới để hỗ trợ getLayout
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Component wrapper để xử lý logic cấu trúc provider với các điều kiện
const AdminWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith('/admin');
  const isAdminLoginPage = router.pathname === '/admin/auth/login';
  const isAdminUserPage = router.pathname.startsWith('/admin/users');
  const isAdminReviewPage = router.pathname.startsWith('/admin/reviews');

  if (isAdminPage && !isAdminLoginPage) {
    if (isAdminUserPage || isAdminReviewPage) {
      return (
        <AdminUserProvider>
          <AdminUserReviewProvider>
            {children}
          </AdminUserReviewProvider>
        </AdminUserProvider>
      );
    }
    return <AdminUserProvider>{children}</AdminUserProvider>;
  }

  return <>{children}</>;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  // Xử lý loading state khi chuyển trang
  useEffect(() => {
    const handleStart = () => {
      document.body.classList.add('page-loading');
    };

    const handleComplete = () => {
      document.body.classList.remove('page-loading');
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Nếu có lỗi từ getServerSideProps hoặc getStaticProps, render trang lỗi
  if (pageProps.error) {
    return <Error statusCode={pageProps.error.statusCode} title={pageProps.error.message} />;
  }

  // Sử dụng getLayout nếu trang có định nghĩa nó, nếu không thì sử dụng layout mặc định
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AppProviders>
          <AdminWrapper>
            {getLayout(<Component {...pageProps} />)}
            <LoadingOverlay />
          </AdminWrapper>
        </AppProviders>
        <Toaster position="top-right" />
      </AdminAuthProvider>
    </AuthProvider>
  );
}
