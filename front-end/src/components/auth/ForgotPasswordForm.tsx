import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

const ForgotPasswordForm = ({ onSuccess }: ForgotPasswordFormProps) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Đang gửi yêu cầu quên mật khẩu với email:", email);

    try {
      // Gọi API quên mật khẩu thông qua AuthContext
      console.log("Bắt đầu gọi API forgotPassword");
      const success = await forgotPassword(email);
      console.log("Kết quả gọi API forgotPassword:", success);
      
      if (success) {
        toast.success('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn!');
        setSubmitted(true);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', error);
      toast.error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center text-pink-600 mb-6">Quên mật khẩu</h2>
      
      {!submitted ? (
        <>
          <p className="text-gray-600 text-center mb-6">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để đặt lại mật khẩu.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Nhập email của bạn"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Gửi hướng dẫn đặt lại mật khẩu'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="bg-pink-50 text-pink-600 p-4 rounded-md mb-6">
            <p>Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.</p>
            <p className="mt-2">Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn.</p>
          </div>
          
          <p className="text-gray-600 mt-4">
            Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
            <button 
              onClick={() => setSubmitted(false)} 
              className="text-pink-600 hover:text-pink-500 font-medium"
            >
              thử lại
            </button>
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/auth/login" className="text-sm font-medium text-pink-600 hover:text-pink-500">
          Quay lại trang đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 