import React, { useState } from 'react';
import Link from 'next/link';
import { FiX, FiUser, FiShoppingCart, FiHeart, FiMapPin, FiPhone, FiChevronDown, FiHome, FiTag, FiStar, FiPlus } from 'react-icons/fi';
import { Category, UserProfile } from '@/contexts/HeaderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHeader } from '@/contexts/HeaderContext';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
}

export default function MobileSideMenu({
  isOpen,
  onClose,
  categories,
  isLoggedIn,
  userProfile,
}: MobileSideMenuProps) {
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { logout } = useAuth();
  const { updateAuthState } = useHeader();
  const router = useRouter();

  // Giới hạn hiển thị danh mục
  const CATEGORY_DISPLAY_LIMIT = 10;
  const displayedCategories = showAllCategories
    ? categories
    : categories.slice(0, CATEGORY_DISPLAY_LIMIT);
  const hasMoreCategories = categories.length > CATEGORY_DISPLAY_LIMIT;

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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 lg:hidden overflow-hidden"
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        aria-labelledby="mobile-menu-heading"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-white text-gray-800 shadow-sm">
            <span id="mobile-menu-heading" className="text-lg font-medium">Menu</span>
            <motion.button
              onClick={onClose}
              className="p-1.5 hover:bg-pink-100 rounded-full transition-colors text-pink-600"
              aria-label="Đóng menu"
              whileTap={{ scale: 0.9 }}
            >
              <FiX className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Tài khoản */}
          <div className="p-4 border-b bg-gray-50 shadow-inner">
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
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/profile"
                      className="text-center py-1.5 text-sm border border-pink-500 text-pink-500 rounded-md block"
                      onClick={onClose}
                    >
                      Tài khoản
                    </Link>
                  </motion.div>
                  <motion.button
                    onClick={handleLogout}
                    className="text-center py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md w-full"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Đăng xuất
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/auth/login"
                    className="text-center py-2 text-sm bg-pink-500 text-white rounded-md block"
                    onClick={onClose}
                  >
                    Đăng nhập
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/auth/register"
                    className="text-center py-2 text-sm border border-pink-500 text-pink-500 rounded-md block"
                    onClick={onClose}
                  >
                    Đăng ký
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              {/* Danh mục */}
              <div className="px-4 py-2 border-b">
                <div className="text-xs uppercase text-gray-500 mb-2">Danh mục sản phẩm</div>
                {displayedCategories.map((category, index) => (
                  <div key={category._id || index} className="mb-1">
                    <motion.button
                      className="w-full flex items-center justify-between py-2 text-sm hover:text-pink-600"
                      onClick={() => setOpenCategory(openCategory === index ? null : index)}
                      aria-expanded={openCategory === index}
                      aria-controls={`category-submenu-${index}`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>{category.name}</span>
                      <motion.div
                        animate={{ rotate: openCategory === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiChevronDown className="w-4 h-4" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {openCategory === index && category.children && (
                        <motion.div
                          id={`category-submenu-${index}`}
                          className="pl-4 py-2 space-y-2 bg-gray-50"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Nút xem thêm/ít hơn danh mục */}
                {hasMoreCategories && (
                  <motion.button
                    className="w-full flex items-center justify-center py-2 text-sm text-pink-600 hover:text-pink-700 border-t border-gray-100 mt-2 pt-3"
                    onClick={() => {
                      setShowAllCategories(!showAllCategories);
                      // Reset opened category khi toggle
                      setOpenCategory(null);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className={`w-4 h-4 mr-2 transition-transform ${showAllCategories ? 'rotate-45' : ''}`} />
                    <span>{showAllCategories ? 'Thu gọn' : `Xem thêm ${categories.length - CATEGORY_DISPLAY_LIMIT} danh mục`}</span>
                  </motion.button>
                )}
              </div>

              {/* Links */}
              <div className="px-4 py-2">
                <Link
                  href="/shop"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiHome className="w-5 h-5 mr-3 text-gray-500" />
                  <span>CỬA HÀNG</span>
                </Link>
                <Link
                  href="/thuong-hieu"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiTag className="w-5 h-5 mr-3 text-gray-500" />
                  <span>THƯƠNG HIỆU</span>
                </Link>

                <Link
                  href="/hang-moi-ve"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiStar className="w-5 h-5 mr-3 text-gray-500" />
                  <span>HÀNG MỚI VỀ</span>
                </Link>

                <Link
                  href="/ban-chay"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiStar className="w-5 h-5 mr-3 text-gray-500" />
                  <span>BÁN CHẠY</span>
                </Link>

                <Link
                  href="/tra-cuu-don-hang"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiShoppingCart className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Tra cứu đơn hàng</span>
                </Link>

                <Link
                  href="/wishlist"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiHeart className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Danh sách yêu thích</span>
                </Link>

                <Link
                  href="/cart"
                  className="flex items-center py-3 border-b hover:text-pink-600 transition-colors"
                  onClick={onClose}
                >
                  <FiShoppingCart className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Giỏ hàng</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-3">
              <Link href="/stores" className="flex items-center text-sm hover:text-pink-600 transition-colors">
                <FiMapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span>Hệ thống cửa hàng</span>
              </Link>

              <Link href="/support" className="flex items-center text-sm hover:text-pink-600 transition-colors">
                <FiPhone className="w-4 h-4 mr-2 text-gray-500" />
                <span>Hỗ trợ khách hàng</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
