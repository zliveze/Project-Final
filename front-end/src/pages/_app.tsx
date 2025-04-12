import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Error from "next/error";
import { AppProviders } from "../contexts";
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminUserProvider } from '@/contexts/AdminUserContext'
import { useRouter } from 'next/router'
import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';
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

  if (isAdminPage && !isAdminLoginPage) {
    return <AdminUserProvider>{children}</AdminUserProvider>;
  }

  return <>{children}</>;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Nếu có lỗi từ getServerSideProps hoặc getStaticProps, render trang lỗi
  if (pageProps.error) {
    return <Error statusCode={pageProps.error.statusCode} title={pageProps.error.message} />;
  }

  // Sử dụng getLayout nếu trang có định nghĩa nó, nếu không thì sử dụng layout mặc định
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <AppProviders>
      <AdminAuthProvider>
        <AdminWrapper>
          {getLayout(<Component {...pageProps} />)}
          <LoadingOverlay />
        </AdminWrapper>
      </AdminAuthProvider>
      <Toaster position="top-right" />
    </AppProviders>
  );
}
