import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
// import { motion } from 'framer-motion'; // Không sử dụng animation phức tạp
import { FaLock, FaExclamationTriangle } from 'react-icons/fa'; // Removed FaCheckCircle

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
}

const ResetPasswordForm = ({ token, onSuccess }: ResetPasswordFormProps) => {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Lấy token từ query nếu không được truyền vào qua props
  useEffect(() => {
    const { token: queryToken } = router.query;

    // Kiểm tra tính hợp lệ của token (giả lập)
    if (!token && !queryToken) {
      setTokenValid(false);
      showErrorToast('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }
  }, [router.query, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra mật khẩu xác nhận
    if (formData.password !== formData.confirmPassword) {
      showErrorToast('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    const resetToken = token || router.query.token as string;

    try {
      // Gọi API đặt lại mật khẩu thông qua AuthContext
      const success = await resetPassword(resetToken, formData.password);

      if (success) {
        showSuccessToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/auth/login');
        }
      } else {
        showErrorToast('Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      showErrorToast('Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-md shadow-sm p-8 border border-gray-200">

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
            <FaExclamationTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-pink-600 mb-4">Liên kết không hợp lệ</h2>
          <p className="text-gray-600 mb-6">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Link href="/auth/forgot-password">
            <button
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Yêu cầu liên kết mới
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-md shadow-sm p-8 border border-gray-200">

      <h2 className="text-2xl font-bold text-center text-pink-600 mb-6">Đặt lại mật khẩu</h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu mới
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <Link href="/auth/login" className="text-sm font-medium text-pink-600 hover:text-pink-500">
          Quay lại trang đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
