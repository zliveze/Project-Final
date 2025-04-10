import React, { useState } from 'react';
import Link from 'next/link';
import { FiX, FiUser, FiShoppingCart, FiHeart, FiMapPin, FiPhone, FiChevronDown } from 'react-icons/fi';
import { Category, Brand, UserProfile } from '@/contexts/HeaderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHeader } from '@/contexts/HeaderContext';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  featuredBrands: Brand[];
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
}

export default function MobileSideMenu({
  isOpen,
  onClose,
  categories,
  featuredBrands,
  isLoggedIn,
  userProfile,
}: MobileSideMenuProps) {
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const { logout } = useAuth();
  const { updateAuthState } = useHeader();
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Cập nhật UI ngay lập tức
      updateAuthState(false, null);
      
      // Đóng menu
      onClose();
      
      // Hiển thị thông báo đăng xuất thành công
      toast.success('Đăng xuất thành công!');
      
      // Thực hiện đăng xuất ở backend
      await logout();
      
      // Chuyển hướng về trang chủ
      router.push('/');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      toast.error('Đã xảy ra lỗi khi đăng xuất!');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-50 z-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-labelledby="mobile-menu-heading"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <span id="mobile-menu-heading" className="text-lg font-medium">Menu</span>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-pink-600 rounded-full transition-colors"
              aria-label="Đóng menu"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Tài khoản */}
          <div className="p-4 border-b bg-gray-50">
            {isLoggedIn ? (
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                    <FiUser className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="font-medium">{userProfile?.name || 'Người dùng'}</div>
                    <div className="text-xs text-gray-500">{userProfile?.email || ''}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Link 
                    href="/profile" 
                    className="text-center py-1.5 text-sm border border-pink-500 text-pink-500 rounded-md"
                    onClick={onClose}
                  >
                    Tài khoản
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-center py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/auth/login" 
                  className="text-center py-2 text-sm bg-pink-500 text-white rounded-md"
                  onClick={onClose}
                >
                  Đăng nhập
                </Link>
                <Link 
                  href="/auth/register" 
                  className="text-center py-2 text-sm border border-pink-500 text-pink-500 rounded-md"
                  onClick={onClose}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              {/* Danh mục */}
              <div className="px-4 py-2 border-b">
                <div className="text-xs uppercase text-gray-500 mb-2">Danh mục sản phẩm</div>
                {categories.map((category, index) => (
                  <div key={index} className="mb-1">
                    <button
                      className="w-full flex items-center justify-between py-2 text-sm"
                      onClick={() => setOpenCategory(openCategory === index ? null : index)}
                      aria-expanded={openCategory === index}
                      aria-controls={`category-submenu-${index}`}
                    >
                      <span>{category.name}</span>
                      <FiChevronDown 
                        className={`w-4 h-4 transform transition-transform ${
                          openCategory === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {openCategory === index && category.children && (
                      <div 
                        id={`category-submenu-${index}`}
                        className="pl-4 py-2 space-y-2 bg-gray-50"
                      >
                        {category.children.map((sub, subIndex) => (
                          <Link
                            key={subIndex}
                            href={`/danh-muc/${sub.slug}`}
                            className="block py-1.5 text-sm text-gray-600 hover:text-pink-600"
                            onClick={onClose}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="px-4 py-2">
                <Link 
                  href="/shop" 
                  replace={true}
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>CỬA HÀNG</span>
                </Link>
                <Link 
                  href="/thuong-hieu" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>THƯƠNG HIỆU</span>
                </Link>
                
                <Link 
                  href="/hang-moi-ve" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>HÀNG MỚI VỀ</span>
                </Link>
                
                <Link 
                  href="/ban-chay" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>BÁN CHẠY</span>
                </Link>
                
                <Link 
                  href="/tra-cuu-don-hang" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>Tra cứu đơn hàng</span>
                </Link>
                
                <Link 
                  href="/wishlist" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <FiHeart className="w-5 h-5 mr-3" />
                  <span>Danh sách yêu thích</span>
                </Link>
                
                <Link 
                  href="/cart" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <FiShoppingCart className="w-5 h-5 mr-3" />
                  <span>Giỏ hàng</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="space-y-3">
              <Link href="/stores" className="flex items-center text-sm">
                <FiMapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span>Hệ thống cửa hàng</span>
              </Link>
              
              <Link href="/support" className="flex items-center text-sm">
                <FiPhone className="w-4 h-4 mr-2 text-gray-500" />
                <span>Hỗ trợ khách hàng</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 