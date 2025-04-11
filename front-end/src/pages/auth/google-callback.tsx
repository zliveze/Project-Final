import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

const GoogleCallback = () => {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      console.log('Router ready:', router.isReady);
      console.log('Router query:', router.query);

      if (!router.isReady) return;

      // Kiểm tra xem chúng ta có nhận được tokens và thông tin người dùng không
      const { accessToken, refreshToken, user, error: callbackError } = router.query;

      console.log('Received tokens:', !!accessToken, !!refreshToken);

      if (callbackError) {
        const errorMessage = 'Đăng nhập bằng Google thất bại: ' + callbackError;
        console.error(errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      // Nếu không có tokens hoặc thông tin người dùng, kiểm tra xem có code không (flow cũ)
      if (!accessToken || !refreshToken || !user) {
        const { code } = router.query;

        if (!code) {
          const errorMessage = 'Không nhận được thông tin xác thực từ Google';
          console.error(errorMessage);
          setError(errorMessage);
          toast.error(errorMessage);
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }

        // Nếu có code nhưng không có tokens, chuyển hướng về trang đăng nhập
        const errorMessage = 'Không nhận được tokens từ Google';
        console.error(errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      try {
        // Parse user từ chuỗi JSON
        const userData = JSON.parse(user as string);

        // Lưu token và thông tin người dùng vào localStorage và cookie
        localStorage.setItem('accessToken', accessToken as string);
        localStorage.setItem('refreshToken', refreshToken as string);
        localStorage.setItem('user', JSON.stringify(userData));

        // Cập nhật trạng thái đăng nhập trong context
        setUser(userData);
        setIsAuthenticated(true);

        toast.success('Đăng nhập bằng Google thành công!');
        router.push('/profile');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        console.error('Lỗi khi xử lý callback Google:', errorMessage);
        setError('Đăng nhập thất bại: ' + errorMessage);
        toast.error('Đăng nhập bằng Google thất bại!');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    handleGoogleCallback();
  }, [router.isReady, router.query, setUser, setIsAuthenticated, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-center text-red-600">
              Đăng nhập thất bại
            </h1>
            <p className="text-center text-red-500">{error}</p>
            <p className="text-center text-gray-500 text-sm">
              Đang chuyển hướng về trang đăng nhập...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center text-pink-600">
              Đang xử lý đăng nhập từ Google...
            </h1>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-t-2 border-b-2 border-pink-500 rounded-full animate-spin"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;