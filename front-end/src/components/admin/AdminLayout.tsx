import { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
  }, [router.pathname]); // Chỉ gọi lại khi router.pathname thay đổi

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Nếu không xác thực, không hiển thị gì cả (sẽ được chuyển hướng bởi useEffect)
  if (!isAuthenticated && router.pathname !== '/admin/auth/login') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Yumin Admin</title>
      </Head>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#333333',
          },
        }}
      />
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
