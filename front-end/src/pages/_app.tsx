import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Error from "next/error";
import { AppProviders } from "../contexts";
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminUserProvider } from '@/contexts/AdminUserContext'
import { useRouter } from 'next/router'

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

export default function App({ Component, pageProps }: AppProps) {
  // Nếu có lỗi từ getServerSideProps hoặc getStaticProps, render trang lỗi
  if (pageProps.error) {
    return <Error statusCode={pageProps.error.statusCode} title={pageProps.error.message} />;
  }
  
  return (
    <AppProviders>
      <AdminAuthProvider>
        <AdminWrapper>
          <Component {...pageProps} />
        </AdminWrapper>
      </AdminAuthProvider>
      <Toaster position="top-right" />
    </AppProviders>
  );
}
