import { useState, useEffect } from 'react';
import { FiBell, FiUser, FiSearch, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAdminAuth } from '../../contexts';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';

export default function Header() {
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const { logout } = useAdminAuth();

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
    <header className="bg-white shadow-sm px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="relative max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
              <span className="sr-only">Xem thông báo</span>
              <FiBell className="h-6 w-6" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-pink-500 text-xs text-white text-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center">
            <div className="hidden md:flex md:flex-col md:items-end md:leading-tight">
              <span className="text-sm font-medium text-gray-700">
                {user?.name || user?.email || 'Admin'}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {user?.role || 'admin'}
              </span>
            </div>
            <Menu as="div" className="ml-3 relative">
              <div>
                <Menu.Button className="h-8 w-8 rounded-full bg-pink-500 flex items-center justify-center text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                  <FiUser className="h-5 w-5" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link 
                        href="/admin/profile"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center px-4 py-2 text-sm text-gray-700`}
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
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
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
    </header>
  );
} 