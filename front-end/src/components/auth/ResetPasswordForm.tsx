import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

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
      toast.error('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
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
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    setLoading(true);
    const resetToken = token || router.query.token as string;

    try {
      // Gọi API đặt lại mật khẩu thông qua AuthContext
      const success = await resetPassword(resetToken, formData.password);
      
      if (success) {
        toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/auth/login');
        }
      } else {
        toast.error('Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      toast.error('Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-pink-600 mb-4">Liên kết không hợp lệ</h2>
          <p className="text-gray-600 mb-6">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Link href="/auth/forgot-password">
            <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
              Yêu cầu liên kết mới
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center text-pink-600 mb-6">Đặt lại mật khẩu</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu mới
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Nhập mật khẩu mới"
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Nhập lại mật khẩu mới"
            minLength={6}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
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