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
  FiMap
} from 'react-icons/fi';
import { useAdminAuth } from '../../contexts';

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
    <div className={`bg-white shadow-lg h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
          {!collapsed && (
            <span className="text-xl font-bold text-pink-600">Yumin Admin</span>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-pink-600">Y</span>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      
      <nav className="mt-6 flex-grow overflow-y-auto">
        <ul>
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            
            return (
              <li key={item.name} className="px-2 py-1">
                <Link 
                  href={item.href}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${isActive ? 'text-pink-500' : 'text-gray-400'}`} />
                  {!collapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center p-2 rounded-md text-gray-600 hover:bg-gray-100 w-full ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <FiLogOut className="h-6 w-6 text-gray-400" />
          {!collapsed && (
            <span className="ml-3">Đăng xuất</span>
          )}
        </button>
      </div>
    </div>
  );
} 