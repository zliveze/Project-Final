import React, { useState, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMenu, FiSearch, FiUser, FiShoppingCart, FiHeart, FiLogOut, FiSettings, FiBell, FiStar } from 'react-icons/fi';
import { UserProfile } from '@/contexts/HeaderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useHeader } from '@/contexts/HeaderContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

interface MiddleHeaderProps {
  onMenuToggle: () => void;
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  cartItemCount: number;
  wishlistItemCount: number;
}

function MiddleHeader({
  onMenuToggle,
  isLoggedIn,
  userProfile,
  cartItemCount,
  wishlistItemCount,
}: MiddleHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { logout } = useAuth();
  const router = useRouter();
  const { updateAuthState } = useHeader();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search for:', searchQuery);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowUserDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowUserDropdown(false);
    }, 300); // Đợi 300ms trước khi ẩn menu
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Cập nhật UI ngay lập tức
      updateAuthState(false, null);

      // Hiển thị thông báo đăng xuất thành công
      toast.success('Đăng xuất thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Đóng dropdown
      setShowUserDropdown(false);

      // Thực hiện đăng xuất ở backend
      await logout();

      // Chuyển hướng về trang chủ
      router.push('/');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      toast.error('Đã xảy ra lỗi khi đăng xuất!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Dọn dẹp timeout khi component bị unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full bg-white border-b border-gray-100 py-3 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Menu button for mobile */}
          <motion.button
            className="lg:hidden text-pink-600 mr-3 w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"
            onClick={onMenuToggle}
            aria-label="Menu"
            whileTap={{ scale: 0.9 }}
          >
            <FiMenu className="w-5 h-5" />
          </motion.button>

          {/* Logo */}
          <Link href="/" className="flex items-center mr-4 lg:mr-0">
            <div className="relative h-8 w-24">
              <span className="text-pink-600 text-xl font-bold tracking-wide">YUMIN</span>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8 bg-gray-50 rounded-md overflow-hidden border border-gray-200 transition-all hover:border-pink-300 focus-within:border-pink-400 focus-within:ring-1 focus-within:ring-pink-300">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu bạn mong muốn..."
                className="w-full pl-4 pr-24 py-2 rounded-md focus:outline-none text-sm bg-gray-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-gray-50 border-l border-gray-200 hover:bg-gray-100 transition-colors"
                aria-label="Tìm kiếm"
              >
                <span className="text-pink-600 text-sm font-medium flex items-center">
                  <FiSearch className="mr-1.5" />
                  Tìm kiếm
                </span>
              </button>
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-5">
            {/* User account - desktop */}
            <div className="hidden lg:block relative" ref={dropdownRef}>
              <motion.div
                className="flex items-center text-gray-700 cursor-pointer group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                whileHover={{ scale: 1.03 }}
              >
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-2 text-pink-600">
                  <FiUser className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{isLoggedIn ? (userProfile?.name || 'Tài khoản') : 'Đăng nhập'}</span>
                  <span className="text-xs text-gray-500">{isLoggedIn ? 'Quản lý' : 'Tài khoản'}</span>
                </div>

                {/* Dropdown menu */}
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-100"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {isLoggedIn ? (
                      <>
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiUser className="mr-2 w-4 h-4" />
                          Thông tin tài khoản
                        </Link>
                        <Link
                          href="/profile?tab=orders"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiShoppingCart className="mr-2 w-4 h-4" />
                          Đơn hàng của tôi
                        </Link>
                        <Link
                          href="/profile?tab=wishlist"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiHeart className="mr-2 w-4 h-4" />
                          Danh sách yêu thích
                        </Link>
                        <Link
                          href="/profile?tab=notifications"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiBell className="mr-2 w-4 h-4" />
                          Thông báo
                        </Link>
                        <Link
                          href="/profile?tab=reviews"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiStar className="mr-2 w-4 h-4" />
                          Đánh giá của tôi
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <a
                          href="#"
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiLogOut className="mr-2 w-4 h-4" />
                          Đăng xuất
                        </a>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiUser className="mr-2 w-4 h-4" />
                          Đăng nhập
                        </Link>
                        <Link
                          href="/auth/register"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                        >
                          <FiSettings className="mr-2 w-4 h-4" />
                          Đăng ký
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Wishlist */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link href="/wishlist" className="relative w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600" aria-label="Danh sách yêu thích">
                <FiHeart className="w-4 h-4" />
                {wishlistItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {wishlistItemCount}
                  </span>
                )}
              </Link>
            </motion.div>

            {/* Cart */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link href="/cart" className="relative w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600" aria-label="Giỏ hàng">
                <FiShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MiddleHeader);