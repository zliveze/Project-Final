import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiKey } from 'react-icons/fi';
import { UserNotifications } from './';
import { toast } from 'react-hot-toast';

interface UserResetPasswordModalProps {
  _id: string;
  isOpen: boolean;
  onClose: () => void;
  onResetPassword: (_id: string) => void;
}

const UserResetPasswordModal: React.FC<UserResetPasswordModalProps> = ({
  _id,
  isOpen,
  onClose,
  onResetPassword,
}) => {
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

  const handleResetPassword = () => {
    // Hiển thị thông báo đang xử lý
    const toastId = UserNotifications.info.loading();
    
    // Gọi hàm xử lý đặt lại mật khẩu từ props
    setTimeout(() => {
      toast.dismiss(toastId);
      onResetPassword(_id);
      // Không hiển thị thông báo thành công ở đây
      // vì đã được xử lý trong hàm confirmResetPassword ở index.tsx
    }, 500);
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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
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

          <div className="bg-white p-6">
            <div className="flex items-center justify-center mb-6 text-yellow-600">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 sm:mx-0 sm:h-16 sm:w-16">
                <FiKey className="h-8 w-8" />
              </div>
            </div>
            
            <div className="text-center sm:text-center">
              <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">
                Xác nhận đặt lại mật khẩu
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này? Mật khẩu mới sẽ được gửi qua email cho người dùng.
                </p>
                
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200 flex items-start">
                  <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    Người dùng sẽ phải sử dụng mật khẩu mới này cho lần đăng nhập kế tiếp.
                  </span>
                </div>
                
                <p className="mt-4 text-sm font-medium text-gray-800 bg-gray-100 p-2 rounded">
                  ID: {_id}
                </p>
              </div>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  className="w-32 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors sm:text-sm"
                  onClick={onClose}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="w-48 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors sm:text-sm items-center"
                  onClick={handleResetPassword}
                >
                  <FiKey className="mr-2" /> Đặt lại mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserResetPasswordModal; 