import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DefaultLayout from '@/layout/DefaultLayout';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const VerifyEmailPage: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setVerified(true);
          toast.success('Email của bạn đã được xác minh thành công!');
        } else {
          setError(data.message || 'Xác minh email thất bại. Token không hợp lệ hoặc đã hết hạn.');
          toast.error('Xác minh email thất bại. Token không hợp lệ hoặc đã hết hạn.');
        }
      } catch (error) {
        console.error('Lỗi xác minh email:', error);
        setError('Đã xảy ra lỗi khi xác minh email của bạn.');
        toast.error('Đã xảy ra lỗi khi xác minh email của bạn.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmailToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <DefaultLayout>
      <Head>
        <title>Xác minh Email | Shop Online</title>
        <meta name="description" content="Xác minh email tài khoản của bạn" />
      </Head>
      
      <div className="py-8 sm:py-10 bg-gradient-to-b from-[#fdf2f8] to-[#f5f3ff] flex flex-col justify-center sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-extrabold text-pink-600 mb-1">YUMIN</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-center text-sm text-gray-600">
            Xác minh email tài khoản của bạn
          </h2>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
              </div>
            ) : verified ? (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Email đã được xác minh!</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Cảm ơn bạn đã xác minh email. Bạn có thể tiếp tục sử dụng tài khoản của mình.
                </p>
                <div className="mt-6">
                  {isAuthenticated ? (
                    <Link 
                      href="/account" 
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      Đi đến trang tài khoản
                    </Link>
                  ) : (
                    <Link 
                      href="/auth/login" 
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      Đăng nhập ngay
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Xác minh thất bại</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {error || 'Đã xảy ra lỗi khi xác minh email của bạn. Token có thể đã hết hạn hoặc không hợp lệ.'}
                </p>
                <div className="mt-6">
                  <Link 
                    href="/auth/login" 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    Quay lại trang đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </DefaultLayout>
  );
};

export default VerifyEmailPage; 