import { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import DefaultLayout from '@/layout/DefaultLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
// import { motion } from 'framer-motion'; // Không sử dụng animation phức tạp

// Import RegisterForm với dynamic để tránh lỗi hydration
const RegisterForm = dynamic(() => import('@/components/auth/RegisterForm'), {
  ssr: false,
  loading: () => <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 flex justify-center items-center h-96">
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
      <div className="w-full h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-600 mb-3"></div>
          <p className="text-gray-600 font-medium">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Đăng ký | Yumin Beauty</title>
        <meta name="description" content="Tạo tài khoản mới tại Yumin Beauty" />
      </Head>

      <div className="py-12 sm:py-16 bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8 min-h-[80vh]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold text-pink-600 mb-2">YUMIN</h1>
          <div className="h-1 w-16 bg-pink-600 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-center text-base text-gray-600">
            Tạo tài khoản mới
          </h2>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          {isClient ? <RegisterForm /> :
            <div className="w-full max-w-md mx-auto bg-white rounded-md shadow-sm p-8 flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-600"></div>
            </div>
          }
        </div>
      </div>
    </DefaultLayout>
  );
};

export default RegisterPage;