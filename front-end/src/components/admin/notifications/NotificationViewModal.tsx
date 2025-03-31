import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Notification } from './NotificationForm';

interface NotificationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const NotificationViewModal: React.FC<NotificationViewModalProps> = ({
  isOpen,
  onClose,
  notification,
  onEdit,
  onDelete,
  onToggleStatus
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

  if (!isOpen && !modalVisible) return null;

  // Format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Không giới hạn';
    return format(new Date(date), 'dd MMMM yyyy', { locale: vi });
  };

  // Hiển thị tên loại thông báo
  const getTypeText = (type: string) => {
    switch (type) {
      case 'voucher':
        return 'Mã giảm giá';
      case 'shipping':
        return 'Vận chuyển';
      case 'promotion':
        return 'Khuyến mãi';
      case 'system':
        return 'Hệ thống';
      default:
        return type;
    }
  };

  // Hiển thị màu cho loại thông báo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'voucher':
        return 'bg-purple-100 text-purple-800';
      case 'shipping':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          
          <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiEye className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết thông báo
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Preview thông báo */}
            <div className="mb-6 border rounded-lg overflow-hidden">
              <h3 className="font-medium text-gray-700 mb-2">Hiển thị trên giao diện người dùng:</h3>
              <div 
                className="w-full h-[30px]"
                style={{ backgroundColor: notification.backgroundColor || '#E5FBF1' }}
              >
                <div className="h-full flex items-center overflow-hidden px-4">
                  <div className="marquee-container">
                    <span 
                      className="text-sm font-bold"
                      style={{ color: notification.textColor || '#306E51' }}
                    >
                      {notification.content}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                    <p className="mt-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        notification.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {notification.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Loại thông báo</p>
                    <p className="mt-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                        {getTypeText(notification.type)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Độ ưu tiên</p>
                    <p className="mt-1 text-gray-900">{notification.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Liên kết</p>
                    <p className="mt-1 text-gray-900 truncate">
                      {notification.link ? (
                        <a href={notification.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {notification.link}
                        </a>
                      ) : (
                        'Không có'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
                    <p className="mt-1 text-gray-900">{formatDate(notification.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày kết thúc</p>
                    <p className="mt-1 text-gray-900">{formatDate(notification.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Màu nền</p>
                    <div className="mt-1 flex items-center">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: notification.backgroundColor || '#E5FBF1' }}
                      ></div>
                      <span className="text-gray-900">{notification.backgroundColor || '#E5FBF1'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Màu chữ</p>
                    <div className="mt-1 flex items-center">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: notification.textColor || '#306E51' }}
                      ></div>
                      <span className="text-gray-900">{notification.textColor || '#306E51'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                    <p className="mt-1 text-gray-900">{formatDate(notification.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                    <p className="mt-1 text-gray-900">{formatDate(notification.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 space-x-3">
              <button
                type="button"
                onClick={onToggleStatus}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  notification.isActive 
                    ? 'text-orange-700 bg-orange-50 hover:bg-orange-100' 
                    : 'text-green-700 bg-green-50 hover:bg-green-100'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500`}
              >
                {notification.isActive ? (
                  <>
                    <FiToggleRight className="mr-2 -ml-1 h-5 w-5" />
                    Ẩn thông báo
                  </>
                ) : (
                  <>
                    <FiToggleLeft className="mr-2 -ml-1 h-5 w-5" />
                    Hiển thị
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FiEdit2 className="mr-2 -ml-1 h-5 w-5" />
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FiTrash2 className="mr-2 -ml-1 h-5 w-5" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationViewModal; 