import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiTag,
  FiGift,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiImage,
  FiBell,
  FiStar,
  FiMap,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { useAdminAuth } from '../../contexts';
import { motion } from 'framer-motion';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: FiHome
  },
  {
    name: 'Sản phẩm',
    href: '/admin/products',
    icon: FiShoppingBag
  },
  {
    name: 'Đơn hàng',
    href: '/admin/orders',
    icon: FiShoppingCart
  },
  {
    name: 'Người dùng',
    href: '/admin/users',
    icon: FiUsers
  },
  {
    name: 'Danh mục',
    href: '/admin/categories',
    icon: FiGrid
  },
  {
    name: 'Thương hiệu',
    href: '/admin/brands',
    icon: FiTag
  },
  {
    name: 'Voucher',
    href: '/admin/vouchers',
    icon: FiGift
  },
  {
    name: 'Campaigns',
    href: '/admin/campaigns',
    icon: FiCalendar
  },
  {
    name: 'Sự kiện',
    href: '/admin/events',
    icon: FiStar
  },
  {
    name: 'Banners',
    href: '/admin/banners',
    icon: FiImage
  },
  {
    name: 'Thông báo',
    href: '/admin/notifications',
    icon: FiBell
  },{
    name: 'Chi nhánh',
    href: '/admin/branches',
    icon: FiMap
  }
];

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.div
      className={`bg-white shadow-lg h-screen ${collapsed ? 'w-16' : 'w-64'} flex flex-col relative`}
      initial={{ width: collapsed ? 64 : 256 }}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="text-xl font-bold text-pink-600">Yumin Admin</span>
        )}

        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? 'mx-auto' : 'ml-auto'} p-1.5 rounded-md hover:bg-pink-50 text-gray-500 hover:text-pink-500 transition-colors`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? (
            <FiChevronRight className="h-5 w-5" />
          ) : (
            <FiChevronLeft className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      <nav className="mt-6 flex-grow overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);

            return (
              <motion.li
                key={item.name}
                whileHover={{ x: collapsed ? 0 : 3 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-pink-100 text-pink-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-pink-500'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : ''}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-pink-500' : 'text-gray-400'}`} />
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <motion.button
          onClick={handleLogout}
          className={`flex items-center p-2 rounded-md text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-colors w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          whileHover={{ backgroundColor: '#FDF2F8' }}
          whileTap={{ scale: 0.98 }}
        >
          <FiLogOut className="h-5 w-5 text-gray-400" />
          {!collapsed && (
            <span className="ml-3 font-medium">Đăng xuất</span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}