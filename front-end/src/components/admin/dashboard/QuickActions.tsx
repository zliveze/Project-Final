import React from 'react';
import Link from 'next/link';
import { 
  FiPlus, 
  FiBox, 
  FiTarget, 
  FiGift, 
  FiUsers, 
  FiBarChart3,
  FiDownload,
  FiBell
} from 'react-icons/fi';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

const QuickActions = () => {
  const actions: QuickAction[] = [
    {
      id: 'add-product',
      title: 'Thêm sản phẩm',
      description: 'Tạo sản phẩm mới',
      icon: <FiBox className="h-5 w-5" />,
      href: '/admin/products/create',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'create-campaign',
      title: 'Tạo Campaign',
      description: 'Chiến dịch marketing',
      icon: <FiTarget className="h-5 w-5" />,
      href: '/admin/campaigns/create',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100'
    },
    {
      id: 'create-voucher',
      title: 'Tạo Voucher',
      description: 'Mã giảm giá mới',
      icon: <FiGift className="h-5 w-5" />,
      href: '/admin/vouchers/create',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'manage-users',
      title: 'Quản lý User',
      description: 'Xem danh sách user',
      icon: <FiUsers className="h-5 w-5" />,
      href: '/admin/users',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'view-reports',
      title: 'Báo cáo',
      description: 'Thống kê chi tiết',
      icon: <FiBarChart3 className="h-5 w-5" />,
      href: '/admin/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'export-data',
      title: 'Xuất dữ liệu',
      description: 'Export Excel/CSV',
      icon: <FiDownload className="h-5 w-5" />,
      href: '/admin/export',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'notifications',
      title: 'Thông báo',
      description: 'Gửi thông báo',
      icon: <FiBell className="h-5 w-5" />,
      href: '/admin/notifications',
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      id: 'add-more',
      title: 'Thêm tính năng',
      description: 'Mở rộng hệ thống',
      icon: <FiPlus className="h-5 w-5" />,
      href: '/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h2>
        <span className="text-xs text-gray-500">Truy cập nhanh các chức năng chính</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`${action.bgColor} ${action.color} p-4 rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-md group`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`${action.color} group-hover:scale-110 transition-transform duration-200`}>
                {action.icon}
              </div>
              <div>
                <h3 className="font-medium text-sm">{action.title}</h3>
                <p className="text-xs opacity-75 mt-1">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Shortcuts info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>💡 Tip: Sử dụng Ctrl+K để tìm kiếm nhanh</span>
          <span>⚡ {actions.length} thao tác có sẵn</span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
