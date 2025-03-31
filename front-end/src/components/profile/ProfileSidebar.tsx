import React from 'react';
import { FaUser, FaMapMarkerAlt, FaHeart, FaShoppingBag, FaBell, FaStar } from 'react-icons/fa';
import { User, TabType } from './types';

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
  const tabs = [
    { id: 'account' as const, label: 'Tài khoản', icon: <FaUser /> },
    { id: 'wishlist' as const, label: 'Yêu thích', icon: <FaHeart /> },
    { id: 'orders' as const, label: 'Đơn hàng', icon: <FaShoppingBag /> },
    { id: 'notifications' as const, label: 'Thông báo', icon: <FaBell /> },
    { id: 'reviews' as const, label: 'Đánh giá', icon: <FaStar /> },
  ];

  return (
    <div className="w-full md:w-64 bg-white shadow rounded-lg p-4">
      <div className="flex flex-col">
        <div className="p-4 mb-4 text-center border-b">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>
        
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span className="flex-1">{tab.label}</span>
              
              {tab.id === 'notifications' && notificationCount > 0 && (
                <span className="ml-auto bg-pink-100 text-pink-800 text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                  {notificationCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="mt-6 pt-6 border-t">
          <div className="px-4 py-3 bg-pink-50 rounded-lg">
            <h3 className="font-medium text-pink-700 mb-1">Địa chỉ giao hàng mặc định</h3>
            {user.addresses.find(addr => addr.isDefault) ? (
              <div className="text-sm text-gray-700">
                <p className="mb-1">
                  {user.addresses.find(addr => addr.isDefault)?.addressLine}
                </p>
                <p className="mb-1">
                  {user.addresses.find(addr => addr.isDefault)?.ward}, {user.addresses.find(addr => addr.isDefault)?.district}
                </p>
                <p>
                  {user.addresses.find(addr => addr.isDefault)?.city}, {user.addresses.find(addr => addr.isDefault)?.country}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Bạn chưa có địa chỉ mặc định</p>
            )}
            <button
              onClick={() => onTabChange('account')}
              className="mt-2 text-xs text-pink-600 flex items-center"
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