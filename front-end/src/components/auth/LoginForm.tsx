'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaGoogle, FaEnvelope, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import { showSuccessToast, showErrorToast, showInfoToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
// import { motion } from 'framer-motion'; // Không sử dụng animation phức tạp

// Lấy API_URL từ biến môi trường cho mục đích debug
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const LoginForm = () => {
  const router = useRouter();
  const { login, resendVerificationEmail } = useAuth(); // Removed googleLogin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedVerification(false);

    try {
      const result = await login(email, password);

      if (result.success) {
        showSuccessToast('Đăng nhập thành công!');
        router.push('/');
      } else if (result.needVerification) {
        setNeedVerification(true);
        showErrorToast('Vui lòng xác minh email của bạn trước khi đăng nhập');
      } else {
        showErrorToast('Email hoặc mật khẩu không chính xác');
      }
    } catch (error) {
      console.error('Login error:', error); // Added console.error
      showErrorToast('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Xử lý đăng nhập bằng Google
    try {
      // Chuyển hướng người dùng đến backend API endpoint để bắt đầu quá trình OAuth
      // Thêm tham số redirect_uri để chỉ định URL callback của frontend
      const frontendCallbackUrl = `${window.location.origin}/auth/google-callback`;
      const googleAuthUrl = `${API_URL}/auth/google/login?redirect_uri=${encodeURIComponent(frontendCallbackUrl)}`;

      console.log('Chuyển hướng đến:', googleAuthUrl);
      showInfoToast('Đang chuyển hướng đến trang đăng nhập Google...');

      // Chuyển hướng đến Google OAuth (sẽ được xử lý bởi Passport ở backend)
      window.location.href = googleAuthUrl;

    } catch (error) {
      console.error('Lỗi khi bắt đầu đăng nhập Google:', error);
      showErrorToast('Không thể bắt đầu quá trình đăng nhập Google.');
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const success = await resendVerificationEmail(email);

      if (success) {
        setResendSuccess(true);
        showSuccessToast('Email xác minh đã được gửi lại! Vui lòng kiểm tra hộp thư của bạn.');
      } else {
        showErrorToast('Không thể gửi lại email xác minh. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error resending verification email:', error); // Added console.error
      showErrorToast('Đã xảy ra lỗi khi gửi lại email xác minh');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm sm:rounded-md sm:px-8 border border-gray-200">

      {needVerification ? (
        <div className="text-center">

          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-yellow-100">
            <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="mt-3 text-center text-lg font-medium text-gray-900">Xác minh email</h3>
          <div className="mt-3 px-2">
            <p className="text-sm text-gray-600">
              Tài khoản của bạn chưa được xác minh. Vui lòng kiểm tra email để hoàn tất quá trình xác minh.
            </p>
          </div>
          <div className="mt-5">
            {resendSuccess ? (
              <div className="text-sm text-green-600 p-3 bg-green-50 rounded-md">
                Email xác minh đã được gửi! Vui lòng kiểm tra hộp thư của bạn.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {resendLoading ? 'Đang gửi...' : 'Gửi lại email xác minh'}
              </button>
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setNeedVerification(false)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-medium">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaGoogle className="w-5 h-5 text-red-500" />
            <span className="ml-2">Google</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
