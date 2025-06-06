import React from 'react';
import { FaUser, FaMapMarkerAlt, FaHeart, FaShoppingBag, FaBell, FaStar } from 'react-icons/fa';
import { User, TabType, Address } from './types/index'; // Corrected import path and added Address

interface ProfileSidebarProps {
  user: User;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  notificationCount: number;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  notificationCount
}) => {
  // Hàm hiển thị badge cấp độ khách hàng
  const getLevelBadge = (level: string | undefined): string => {
    if (!level) return 'Khách hàng mới';

    switch (level) {
      case 'Khách hàng thân thiết':
        return '💎 ' + level;
      case 'Khách hàng vàng':
        return '🌟 ' + level;
      case 'Khách hàng bạc':
        return '⭐ ' + level;
      default:
        return '🔵 ' + level;
    }
  };

  const tabs = [
    { id: 'account' as const, label: 'Tài khoản', icon: <FaUser /> },
    { id: 'wishlist' as const, label: 'Yêu thích', icon: <FaHeart /> }, // Khôi phục tab Yêu thích
    { id: 'orders' as const, label: 'Đơn hàng', icon: <FaShoppingBag /> },
    { id: 'notifications' as const, label: 'Thông báo', icon: <FaBell /> },
    { id: 'reviews' as const, label: 'Đánh giá', icon: <FaStar /> },
  ];

  return (
    <div className="w-full bg-white shadow rounded p-4">
      <div className="flex flex-col">
        <div className="p-4 mb-4 text-center border-b border-gray-200">
          <div className="w-24 h-24 rounded-full bg-pink-600 mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>

          {/* Hiển thị cấp độ khách hàng */}
          {user.customerLevel && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border border-pink-300">
                {getLevelBadge(user.customerLevel)}
              </span>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span className="flex-1 font-medium">{tab.label}</span>

              {tab.id === 'notifications' && notificationCount > 0 && (
                <span className="ml-auto bg-white text-pink-600 text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 font-bold border border-current">
                  {notificationCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="px-4 py-3 bg-gray-50 rounded border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Địa chỉ giao hàng mặc định</h3>
            {/* Find the default address */}
            {(() => {
              const defaultAddress = user?.addresses?.find((addr: Address) => addr.isDefault);
              if (defaultAddress) {
                return (
                  <div className="text-sm text-gray-700">
                    <p className="mb-1">{defaultAddress.addressLine}</p>
                    {/* Display district and province */}
                    <p>
                      {defaultAddress.districtName && `${defaultAddress.districtName}, `}
                      {defaultAddress.provinceName}, {defaultAddress.country || 'Việt Nam'}
                    </p>
                  </div>
                );
              } else {
                return <p className="text-sm text-gray-500">Bạn chưa có địa chỉ mặc định</p>;
              }
            })()}
            {/* Remove extra closing parenthesis */}
            <button
              onClick={() => onTabChange('account')}
              className="mt-2 text-sm text-pink-600 hover:text-pink-700 flex items-center font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              <FaMapMarkerAlt className="mr-1" /> Quản lý địa chỉ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
