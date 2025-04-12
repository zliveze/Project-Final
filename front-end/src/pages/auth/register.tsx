import { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import DefaultLayout from '@/layout/DefaultLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

// Import RegisterForm với dynamic để tránh lỗi hydration
const RegisterForm = dynamic(() => import('@/components/auth/RegisterForm'), {
  ssr: false,
  loading: () => <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
  </div>
});

const RegisterPage: NextPage = () => {
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Nếu người dùng đã đăng nhập, chuyển hướng đến trang chủ
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Nếu đã đăng nhập, không hiển thị gì cả (sẽ được chuyển hướng)
  if (isAuthenticated) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Đăng ký | Shop Online</title>
        <meta name="description" content="Tạo tài khoản mới tại Shop Online" />
      </Head>

      <div className="py-8 sm:py-10 bg-gradient-to-b from-[#fdf2f8] to-[#f5f3ff] flex flex-col justify-center sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-extrabold text-pink-600 mb-1">YUMIN</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-center text-sm text-gray-600">
            Tạo tài khoản mới
          </h2>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          {isClient ? <RegisterForm /> :
            <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
            </div>
          }
        </div>
      </div>
    </DefaultLayout>
  );
};

export default RegisterPage;