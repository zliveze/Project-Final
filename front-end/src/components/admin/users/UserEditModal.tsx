import React, { useEffect, useState } from 'react';
import { FiX, FiEdit } from 'react-icons/fi';
import UserForm from './UserForm';
import { UserNotifications } from './';
import { toast } from 'react-hot-toast';
import { useAdminUser } from '../../../contexts/AdminUserContext';

interface UserEditModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    customerLevel: string;
    avatar?: string;
    googleId?: string;
    addresses?: {
      addressId: string;
      addressLine: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      isDefault: boolean;
    }[];
    wishlist?: { productId: string; variantId: string }[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { updateUserStatus, updateUserCustomerLevel } = useAdminUser();
  
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (userData: any) => {
    // Hiển thị thông báo đang xử lý
    const toastId = UserNotifications.info.loading();
    
    try {
      // Kiểm tra xem trạng thái có thay đổi không
      if (userData.status !== user.status) {
        // Nếu trạng thái thay đổi, gọi API cập nhật trạng thái riêng
        await updateUserStatus(user._id, userData.status);
        console.log('Đã cập nhật trạng thái người dùng thành:', userData.status);
      }
      
      // Kiểm tra xem cấp độ khách hàng có thay đổi không
      if (userData.customerLevel !== user.customerLevel) {
        // Nếu cấp độ thay đổi, gọi API cập nhật cấp độ riêng
        await updateUserCustomerLevel(user._id, userData.customerLevel);
        console.log('Đã cập nhật cấp độ khách hàng thành:', userData.customerLevel);
      }
      
      // Đảm bảo rằng _id và các trường bắt buộc được giữ nguyên
      const updatedUserData = {
        ...userData,
        _id: user._id,
        customerLevel: userData.customerLevel || 'Khách hàng mới',
        addresses: userData.addresses || user.addresses || [],
        wishlist: userData.wishlist || user.wishlist || [],
      };
      
      // Gọi hàm xử lý cập nhật từ props
      await onSubmit(updatedUserData);
      
      // Đóng modal chỉnh sửa sau khi hoàn thành
      onClose();
      
      toast.dismiss(toastId);
      toast.success('Cập nhật thông tin người dùng thành công!');
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Lỗi khi cập nhật người dùng:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin người dùng');
    }
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
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <FiEdit className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Chỉnh sửa thông tin người dùng
              </h2>
              <p className="text-sm text-gray-600">ID: {user._id.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="p-6">
            <UserForm
              initialValues={user}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isEditMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal; 