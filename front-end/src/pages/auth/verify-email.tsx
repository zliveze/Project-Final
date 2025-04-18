import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import DefaultLayout from '@/layout/DefaultLayout';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
// import { motion } from 'framer-motion'; // Không sử dụng animation phức tạp
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

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
          showSuccessToast('Email của bạn đã được xác minh thành công!');
        } else {
          setError(data.message || 'Xác minh email thất bại. Token không hợp lệ hoặc đã hết hạn.');
          showErrorToast('Xác minh email thất bại. Token không hợp lệ hoặc đã hết hạn.');
        }
      } catch (error) {
        console.error('Lỗi xác minh email:', error);
        setError('Đã xảy ra lỗi khi xác minh email của bạn.');
        showErrorToast('Đã xảy ra lỗi khi xác minh email của bạn.');
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
        <title>Xác minh Email | Yumin Beauty</title>
        <meta name="description" content="Xác minh email tài khoản Yumin Beauty của bạn" />
      </Head>

      <div className="py-12 sm:py-16 bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8 min-h-[80vh]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold text-pink-600 mb-2">YUMIN</h1>
          <div className="h-1 w-16 bg-pink-600 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-center text-base text-gray-600">
            Xác minh email tài khoản của bạn
          </h2>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm sm:rounded-md sm:px-8 border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center h-60">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-600"></div>
              </div>
            ) : verified ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                  <FaCheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Email đã được xác minh!</h3>
                <p className="mt-3 text-sm text-gray-600">
                  Cảm ơn bạn đã xác minh email. Bạn có thể tiếp tục sử dụng tài khoản của mình.
                </p>
                <div className="mt-8">
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
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                  <FaTimes className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Xác minh thất bại</h3>
                <p className="mt-3 text-sm text-gray-600">
                  {error || 'Đã xảy ra lỗi khi xác minh email của bạn. Token có thể đã hết hạn hoặc không hợp lệ.'}
                </p>
                <div className="mt-8">
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
    </DefaultLayout>
  );
};

export default VerifyEmailPage;