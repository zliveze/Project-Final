import { useState, useEffect } from 'react';
import { FiBell, FiUser, FiLogOut, FiSettings, FiStar } from 'react-icons/fi';
import { useAdminAuth } from '../../contexts';
import { useAdminUserReview } from '../../contexts/AdminUserReviewContext';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Header() {
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const { logout } = useAdminAuth();
  const { newReviewsCount, resetNewReviewsCount } = useAdminUserReview();

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
      }
    }

    // Giả lập có 3 thông báo mới
    setNotifications(3);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.header
      className="bg-white shadow-sm px-6 py-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">

        </div>

        <div className="flex items-center space-x-5">
          {/* Thông báo đánh giá mới */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/admin/reviews"
              className="p-2 rounded-md text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition-colors flex items-center"
              title="Quản lý đánh giá sản phẩm"
            >
              <span className="sr-only">Đánh giá mới</span>
              <FiStar className="h-5 w-5" />
              {newReviewsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-500 text-xs text-white flex items-center justify-center font-medium">
                  {newReviewsCount}
                </span>
              )}
            </Link>
          </motion.div>

          {/* Thông báo hệ thống */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button className="p-2 rounded-md text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition-colors">
              <span className="sr-only">Xem thông báo</span>
              <FiBell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-500 text-xs text-white flex items-center justify-center font-medium">
                  {notifications}
                </span>
              )}
            </button>
          </motion.div>

          <div className="flex items-center">
            <div className="hidden md:flex md:flex-col md:items-end md:leading-tight mr-3">
              <span className="text-sm font-medium text-gray-700">
                {user?.name || user?.email || 'Admin'}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {user?.role || 'admin'}
              </span>
            </div>
            <Menu as="div" className="relative">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Menu.Button className="h-9 w-9 rounded-md bg-pink-500 flex items-center justify-center text-white hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-sm">
                  <FiUser className="h-5 w-5" />
                </Menu.Button>
              </motion.div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/admin/profile"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center px-4 py-2 text-sm text-gray-700 hover:text-pink-600 transition-colors`}
                      >
                        <FiSettings className="mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                        Thông tin tài khoản
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:text-pink-600 transition-colors`}
                      >
                        <FiLogOut className="mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                        Đăng xuất
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}