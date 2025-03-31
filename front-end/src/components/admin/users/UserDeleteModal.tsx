import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { UserNotifications } from './';
import { toast } from 'react-hot-toast';

interface UserDeleteModalProps {
  _id: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (_id: string) => void;
}

const UserDeleteModal: React.FC<UserDeleteModalProps> = ({
  _id,
  isOpen,
  onClose,
  onDelete,
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

  const handleDelete = () => {
    // Hiển thị thông báo đang xử lý
    const toastId = UserNotifications.info.loading();
    
    // Gọi hàm xử lý xóa từ props
    setTimeout(() => {
      toast.dismiss(toastId);
      onDelete(_id);
      // Không hiển thị thông báo thành công ở đây
      // vì đã được xử lý trong hàm confirmDelete ở index.tsx
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
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-white p-6">
            <div className="flex items-center justify-center mb-6 text-red-600">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-red-100 sm:mx-0 sm:h-16 sm:w-16 animate-pulse">
                <FiAlertTriangle className="h-8 w-8" />
              </div>
            </div>
            
            <div className="text-center sm:text-center">
              <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">
                Xác nhận xóa người dùng
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 bg-gray-100 p-2 rounded">
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
                  className="w-32 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors sm:text-sm items-center"
                  onClick={handleDelete}
                >
                  <FiTrash2 className="mr-2" /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDeleteModal; 