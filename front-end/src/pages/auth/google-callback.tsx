import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts';

const GoogleCallback = () => {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth() as any; // Type assertion vì chúng ta thêm phương thức mới
  
  useEffect(() => {
    // Chỉ thực hiện khi router sẵn sàng và có query params
    if (!router.isReady) return;
    
    const { accessToken, refreshToken, user: userString } = router.query;
    
    if (accessToken && refreshToken && userString) {
      try {
        // Parse thông tin user từ query string
        const user = JSON.parse(decodeURIComponent(userString as string));
        
        // Lưu thông tin vào localStorage
        localStorage.setItem('accessToken', accessToken as string);
        localStorage.setItem('refreshToken', refreshToken as string);
        localStorage.setItem('user', userString as string);
        
        // Cập nhật trạng thái trong AuthContext
        setUser(user);
        setIsAuthenticated(true);
        
        toast.success('Đăng nhập bằng Google thành công!');
        
        // Chuyển hướng về trang hồ sơ
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      } catch (error) {
        console.error('Lỗi khi xử lý callback Google:', error);
        toast.error('Đăng nhập bằng Google thất bại!');
        // Chuyển hướng về trang đăng nhập
        router.push('/auth/login');
      }
    } else {
      // Nếu không có đủ thông tin
      toast.error('Không nhận được đầy đủ thông tin từ Google!');
      router.push('/auth/login');
    }
  }, [router.isReady, router.query, router, setUser, setIsAuthenticated]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-pink-600">
          Đang xử lý đăng nhập từ Google...
        </h1>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-pink-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback; 