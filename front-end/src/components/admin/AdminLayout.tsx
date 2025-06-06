import { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminUserReviewProvider } from '../../contexts/AdminUserReviewContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = 'Yumin Admin' }: AdminLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const authCheckRef = useRef(false);

  useEffect(() => {
    // Kiểm tra xem đã thực hiện xác thực chưa để tránh gọi liên tục
    if (authCheckRef.current || router.pathname === '/admin/auth/login') return;

    const verifyAuth = async () => {
      if (router.pathname !== '/admin/auth/login') {
        try {
          authCheckRef.current = true;
          // Kiểm tra xác thực thông qua context
          const isAuth = await checkAuth();

          if (!isAuth) {
            router.push('/admin/auth/login');
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra xác thực:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router.pathname, checkAuth, router]); // Chỉ gọi lại khi router.pathname, checkAuth, or router thay đổi

  // Nếu đang ở trang đăng nhập, không hiển thị layout
  if (router.pathname === '/admin/auth/login') {
    return (
      <>
        <Toaster position="top-right" />
        {children}
      </>
    );
  }

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải...</p>
        </motion.div>
      </div>
    );
  }

  // Nếu không xác thực, không hiển thị gì cả (sẽ được chuyển hướng bởi useEffect)
  if (!isAuthenticated && router.pathname !== '/admin/auth/login') {
    return null;
  }

  return (
    <AdminUserReviewProvider>
      <Head>
        <title>{title}</title>
      </Head>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#333333',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        }}
      />
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <motion.main
            className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={router.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-full mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </AdminUserReviewProvider>
  );
}
