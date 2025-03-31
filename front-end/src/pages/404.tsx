import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';

const NotFoundPage: NextPage = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Đếm ngược và chuyển hướng về trang chủ
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  if (!mounted) {
    return null; // Tránh lỗi hydration
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Không tìm thấy trang | YUMIN</title>
        <meta name="description" content="Trang bạn đang tìm kiếm không tồn tại" />
      </Head>

      <div className="min-h-[70vh] bg-gradient-to-b from-[#fdf2f8] to-[#f5f3ff] flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-lg">
          {/* Icon lỗi */}
          <div className="mx-auto w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-pink-500 bg-opacity-10 animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Mã lỗi */}
          <h1 className="text-8xl font-bold text-pink-600">404</h1>
          
          {/* Đường kẻ trang trí */}
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto my-4 rounded-full"></div>
          
          {/* Thông báo lỗi */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Không tìm thấy trang</h2>
          <p className="text-gray-600 mb-8">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>

          {/* Các nút điều hướng */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity duration-300 shadow-sm">
              Về trang chủ
            </Link>
            <button 
              onClick={() => router.back()} 
              className="px-6 py-3 border border-pink-500 text-pink-600 rounded-md hover:bg-pink-50 transition-colors duration-300"
            >
              Quay lại
            </button>
          </div>

          {/* Đếm ngược */}
          <p className="mt-8 text-sm text-gray-500">
            Tự động chuyển hướng về trang chủ sau <span className="font-medium text-pink-600">{countdown}</span> giây
          </p>

          {/* Gợi ý tìm kiếm */}
          <div className="mt-12 p-4 bg-white rounded-lg shadow-sm border border-pink-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Bạn có thể thử:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Kiểm tra lại đường dẫn URL</li>
              <li>• Sử dụng thanh tìm kiếm ở trên</li>
              <li>• Duyệt qua danh mục sản phẩm của chúng tôi</li>
              <li>• Liên hệ với bộ phận hỗ trợ khách hàng</li>
            </ul>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default NotFoundPage; 