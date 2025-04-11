import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

// Lấy API_URL từ biến môi trường cho mục đích debug
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const LoginForm = () => {
  const router = useRouter();
  const { login, googleLogin, resendVerificationEmail } = useAuth();
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
        toast.success('Đăng nhập thành công!');
        router.push('/');
      } else if (result.needVerification) {
        setNeedVerification(true);
        toast.error('Vui lòng xác minh email của bạn trước khi đăng nhập');
      } else {
        toast.error('Email hoặc mật khẩu không chính xác');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi đăng nhập');
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
      toast.info('Đang chuyển hướng đến trang đăng nhập Google...');

      // Chuyển hướng đến Google OAuth (sẽ được xử lý bởi Passport ở backend)
      window.location.href = googleAuthUrl;

    } catch (error) {
      console.error('Lỗi khi bắt đầu đăng nhập Google:', error);
      toast.error('Không thể bắt đầu quá trình đăng nhập Google.');
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const success = await resendVerificationEmail(email);

      if (success) {
        setResendSuccess(true);
        toast.success('Email xác minh đã được gửi lại! Vui lòng kiểm tra hộp thư của bạn.');
      } else {
        toast.error('Không thể gửi lại email xác minh. Vui lòng thử lại sau.');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi gửi lại email xác minh');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {needVerification ? (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-3 text-center text-lg font-medium text-gray-900">Xác minh email</h3>
          <div className="mt-2 px-2">
            <p className="text-sm text-gray-500">
              Tài khoản của bạn chưa được xác minh. Vui lòng kiểm tra email để hoàn tất quá trình xác minh.
            </p>
          </div>
          <div className="mt-4">
            {resendSuccess ? (
              <div className="text-sm text-green-600">
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
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-pink-600 hover:text-pink-500">
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

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
              </svg>
              <span className="ml-2">Google</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="font-medium text-pink-600 hover:text-pink-500">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;