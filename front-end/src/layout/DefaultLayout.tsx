import React, { useState, useEffect } from 'react'
import MainHeader from '@/components/common/header/MainHeader'
import Footer from '@/components/common/Footer'
import Breadcrum, { BreadcrumItem } from '@/components/common/Breadcrum'
import BackgroundAnimation from '@/components/common/BackgroundAnimation'
import { HeaderProvider } from '@/contexts/HeaderContext'
import { useRouter } from 'next/router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useCart } from '@/contexts/user/cart/CartContext'
import { useWishlist } from '@/contexts/user/wishlist/WishlistContext'

interface DefaultLayoutProps {
  children: React.ReactNode;
  breadcrumItems?: BreadcrumItem[];
}

export default function DefaultLayout({ children, breadcrumItems }: DefaultLayoutProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Xử lý hydration mismatch bằng cách chỉ render sau khi component đã được mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tạo breadcrumb items mặc định dựa trên đường dẫn hiện tại nếu không có items được truyền vào
  const getBreadcrumItems = (): BreadcrumItem[] => {
    if (breadcrumItems) return breadcrumItems;

    const pathSegments = router.asPath.split('/').filter(segment => segment);
    const defaultItems: BreadcrumItem[] = [
      { label: 'Trang chủ', href: '/' }
    ];

    // Xử lý các trường hợp đặc biệt
    if (pathSegments[0] === 'product') {
      // Nếu là trang chi tiết sản phẩm
      defaultItems.push({ label: 'Sản phẩm', href: '/shop' });

      if (pathSegments.length > 1) {
        // Lấy tên sản phẩm từ slug
        const productName = pathSegments[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        defaultItems.push({ label: productName });
      }

      return defaultItems;
    }

    // Nếu là trang danh mục (category)
    if (pathSegments[0] === 'category') {
      defaultItems.push({ label: 'Danh mục', href: '/categories' });

      if (pathSegments.length > 1) {
        const categoryName = pathSegments[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        defaultItems.push({ label: categoryName });
      }

      return defaultItems;
    }

    // Trường hợp mặc định cho các trang khác
    pathSegments.forEach((segment, index) => {
      // Xử lý các tham số query
      const cleanSegment = segment.split('?')[0];

      // Chuyển đổi tên segment theo quy tắc riêng
      let label = '';

      switch (cleanSegment) {
        case 'shop':
          label = 'Sản phẩm';
          break;
        case 'product':
          label = 'Sản phẩm';
          break;
        case 'category':
          label = 'Danh mục';
          break;
        case 'brands':
          label = 'Thương hiệu';
          break;
        case 'blog':
          label = 'Blog';
          break;
        case 'auth':
          label = 'Tài khoản';
          break;
        case 'cart':
          label = 'Giỏ hàng';
          break;
        case 'checkout':
          label = 'Thanh toán';
          break;
        default:
          // Tạo label từ segment (chuyển đổi slug thành text)
          label = cleanSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }

      // Tạo href cho breadcrumb item
      let href: string | undefined;

      // Nếu segment là "auth", không tạo href để người dùng không thể nhấp vào
      if (cleanSegment === 'auth') {
        href = undefined;
      } else {
        href = index === pathSegments.length - 1
          ? undefined
          : `/${pathSegments.slice(0, index + 1).join('/')}`;
      }

      defaultItems.push({ label, href });
    });

    return defaultItems;
  };

  // Nếu chưa mount, hiển thị một div trống để tránh lỗi hydration
  if (!mounted) {
    return <div className="min-h-screen flex flex-col"></div>;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 z-0">
        <BackgroundAnimation />
      </div>
      {/* Header không sử dụng sticky và z-index */}
      <div className="w-full">
        <MainHeader />
      </div>
      <div className="relative">
         {router.asPath !== '/' && <Breadcrum items={getBreadcrumItems()} />}
      </div>
      <main className="flex-grow relative">
         {children}
      </main>
      <div className="relative">
        <Footer />
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 1000 }}
        toastStyle={{
          marginBottom: '60px',
          marginRight: '10px'
        }}
        theme="light"
      />
    </div>
  )
}
