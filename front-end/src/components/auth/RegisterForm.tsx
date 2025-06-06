import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaGoogle, FaUser, FaEnvelope, FaPhone, FaLock, FaCheckCircle } from 'react-icons/fa';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
// import { motion } from 'framer-motion'; // Không sử dụng animation phức tạp

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RegisterFormProps {
  // onSuccess?: () => void; // Removed unused prop
}

const RegisterForm = ({}: RegisterFormProps) => { // Removed onSuccess from destructuring
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

    try {
      // Gọi API đăng ký từ AuthContext
      const success = await register(
        formData.name,
        formData.email,
        formData.phone,
        formData.password
      );

      if (success) {
        setRegistered(true);
        setRegisteredEmail(formData.email);
        showSuccessToast('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.');
      } else {
        showErrorToast('Đăng ký thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      showErrorToast('Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    // Xử lý đăng ký bằng Google
    setLoading(true);
    try {
      // Giả lập token cho demo
      const demoToken = 'google-demo-token-' + Date.now();
      const success = await googleLogin(demoToken);

      if (success) {
        showSuccessToast('Đăng nhập Google thành công!');
        router.push('/');
      } else {
        showErrorToast('Đăng nhập Google thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập Google:', error);
      showErrorToast('Đăng nhập Google thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-md shadow-sm p-8 border border-gray-200">

      <h2 className="text-2xl font-bold text-center text-pink-600 mb-6">Đăng ký tài khoản</h2>

      {registered ? (
        <div className="text-center">

          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
            <FaCheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Đăng ký thành công!</h3>
          <div className="mt-3 px-2">
            <p className="text-sm text-gray-600">
              Chúng tôi đã gửi một email đến <span className="font-medium text-pink-600">{registeredEmail}</span>.
              Vui lòng kiểm tra hộp thư của bạn và nhấp vào liên kết xác minh để hoàn tất quá trình đăng ký.
            </p>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Đi đến trang đăng nhập
            </button>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setRegistered(false)}
              className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Đăng ký tài khoản khác
            </button>
          </div>
        </div>
      ) : (
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
                  placeholder="Nhập số điện thoại của bạn"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
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

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                Tôi đồng ý với <a href="#" className="text-pink-600 hover:text-pink-500 transition-colors">Điều khoản dịch vụ</a> và <a href="#" className="text-pink-600 hover:text-pink-500 transition-colors">Chính sách bảo mật</a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 mt-2"
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">Hoặc đăng ký với</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FaGoogle className="text-red-500" />
                Google
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
