import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiMapPin, FiShoppingBag, FiX, FiEdit, 
  FiMail, FiPhone, FiCalendar, FiCheck, FiClock,
  FiDollarSign, FiPackage, FiTruck, FiAlertTriangle,
  FiHeart, FiStar
} from 'react-icons/fi';

interface Address {
  addressId: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

interface OrderSummary {
  _id: string;
  date: string;
  status: string;
  totalAmount: number;
}

interface UserDetailModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    googleId?: string;
    addresses?: Address[];
    orders?: OrderSummary[];
    wishlist?: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}

// Tab Content Components
const UserInfoTab: React.FC<{ user: UserDetailModalProps['user'] }> = ({ user }) => {
  return (
    <div className="space-y-6 py-4 animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiUser className="text-pink-500" />
            </div>
            <h3 className="font-medium text-gray-700">Thông tin cá nhân</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-gray-500">Tên</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{user.name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-gray-500">Email</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-gray-500">Điện thoại</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{user.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiClock className="text-pink-500" />
            </div>
            <h3 className="font-medium text-gray-700">Thông tin tài khoản</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-gray-500">Ngày tạo</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{user.createdAt}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-gray-500">Trạng thái</span>
              </div>
              <div className="flex-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 
                  user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'active' ? 'Đang hoạt động' : 
                  user.status === 'inactive' ? 'Chưa kích hoạt' : 'Đã khóa'}
                </span>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-gray-500">Vai trò</span>
              </div>
              <div className="flex-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </span>
              </div>
            </div>
            
            {user.googleId && (
              <div className="flex items-start mt-3">
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm text-gray-500">Đăng nhập</span>
                </div>
                <div className="flex-1">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Google Account
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
            <FiAlertTriangle className="text-pink-500" />
          </div>
          <p className="text-sm text-gray-700">
            ID người dùng: <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-pink-200">{user._id}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const UserAddressTab: React.FC<{ addresses: Address[] | undefined }> = ({ addresses = [] }) => {
  return (
    <div className="py-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
            <FiMapPin className="text-pink-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Danh sách địa chỉ ({addresses.length})</h3>
        </div>
        <button className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200 flex items-center">
          <FiMapPin className="mr-1" /> Thêm địa chỉ
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FiMapPin className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-500 mb-1">Người dùng chưa có địa chỉ nào</p>
          <p className="text-sm text-gray-400">Bạn có thể thêm địa chỉ mới cho người dùng</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div 
              key={address.addressId} 
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                address.isDefault ? 'border-pink-300 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {address.addressLine}
                    {address.isDefault && (
                      <span className="ml-2 text-xs bg-pink-100 text-pink-800 py-0.5 px-2 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {address.city}, {address.state}, {address.country}, {address.postalCode}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1 text-gray-500 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors">
                    <FiEdit size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserOrderTab: React.FC<{ orders: OrderSummary[] | undefined }> = ({ orders = [] }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'shipped':
        return 'Đang giao';
      case 'pending':
        return 'Chờ xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="mr-1" />;
      case 'shipped':
        return <FiTruck className="mr-1" />;
      case 'pending':
        return <FiClock className="mr-1" />;
      case 'cancelled':
        return <FiX className="mr-1" />;
      default:
        return <FiPackage className="mr-1" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="py-4 animate-fadeIn">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
          <FiShoppingBag className="text-pink-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">Lịch sử đơn hàng ({orders.length})</h3>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FiShoppingBag className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-500 mb-1">Người dùng chưa có đơn hàng nào</p>
          <p className="text-sm text-gray-400">Các đơn hàng sẽ hiển thị ở đây khi người dùng mua hàng</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="p-4 flex justify-between items-center border-b border-gray-100">
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">{`Đơn hàng #${order._id}`}</p>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Ngày đặt: {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-pink-600">{formatCurrency(order.totalAmount)}</p>
                  <button className="mt-1 text-sm text-pink-600 hover:text-pink-700 flex items-center justify-end">
                    <FiPackage className="mr-1" /> Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserWishlistTab: React.FC<{ wishlist: any[] | undefined }> = ({ wishlist = [] }) => {
  return (
    <div className="py-4 animate-fadeIn">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
          <FiHeart className="text-pink-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">Danh sách yêu thích ({wishlist.length})</h3>
      </div>
      
      {wishlist.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FiHeart className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-500 mb-1">Người dùng chưa có sản phẩm yêu thích nào</p>
          <p className="text-sm text-gray-400">Các sản phẩm yêu thích sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-md mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Sản phẩm {index + 1}</p>
                  <p className="text-sm text-gray-500">ID: {item.productId}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserReviewsTab: React.FC = () => {
  return (
    <div className="py-4 animate-fadeIn">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
          <FiStar className="text-pink-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">Đánh giá sản phẩm</h3>
      </div>
      
      <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <FiStar className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-gray-500 mb-1">Người dùng chưa có đánh giá nào</p>
        <p className="text-sm text-gray-400">Các đánh giá sẽ hiển thị ở đây</p>
      </div>
    </div>
  );
};

const TabNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'info', label: 'Thông tin', icon: <FiUser className="mr-2" /> },
    { id: 'addresses', label: 'Địa chỉ', icon: <FiMapPin className="mr-2" /> },
    { id: 'orders', label: 'Đơn hàng', icon: <FiShoppingBag className="mr-2" /> },
    { id: 'wishlist', label: 'Yêu thích', icon: <FiHeart className="mr-2" /> },
    { id: 'reviews', label: 'Đánh giá', icon: <FiStar className="mr-2" /> },
  ];
  
  return (
    <div className="border-b border-gray-200">
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              flex items-center whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors 
              ${activeTab === tab.id 
                ? 'border-pink-500 text-pink-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const UserHeader: React.FC<{ user: UserDetailModalProps['user'] }> = ({ user }) => {
  return (
    <div className="p-6 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center mr-4">
          <span className="text-pink-600 text-xl font-bold">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
    </div>
  );
};

const ModalFooter: React.FC<{
  onClose: () => void;
  onEdit: () => void;
}> = ({ onClose, onEdit }) => {
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center space-x-3">
      <button
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
        onClick={onClose}
      >
        Đóng
      </button>
      <button
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors flex items-center"
        onClick={onEdit}
      >
        <FiEdit className="mr-2" />
        Chỉnh sửa
      </button>
    </div>
  );
};

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);

  const handleEdit = () => {
    onEdit(user._id);
    onClose();
  };

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <UserHeader user={user} />

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="overflow-hidden p-6" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {activeTab === 'info' && <UserInfoTab user={user} />}
            {activeTab === 'addresses' && <UserAddressTab addresses={user.addresses} />}
            {activeTab === 'orders' && <UserOrderTab orders={user.orders} />}
            {activeTab === 'wishlist' && <UserWishlistTab wishlist={user.wishlist} />}
            {activeTab === 'reviews' && <UserReviewsTab />}
          </div>

          <ModalFooter onClose={onClose} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal; 