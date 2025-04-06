import React, { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface EventDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  eventId?: string;
  eventTitle?: string;
  productsCount?: number;
}

const EventDeleteModal: React.FC<EventDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventId,
  eventTitle,
  productsCount = 0
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Hiển thị/ẩn modal với animation
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);
  
  // Xử lý xác nhận xóa
  const handleConfirm = async () => {
    if (!eventId) return;
    
    try {
      setIsDeleting(true);
      
      // Gọi hàm xóa từ parent component
      await onConfirm(eventId);
      
      // Đóng modal sau khi xóa thành công
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Xóa sự kiện
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa sự kiện <strong>{eventTitle}</strong>?
                  </p>
                  {productsCount > 0 && (
                    <p className="mt-2 text-sm text-red-500">
                      Sự kiện này hiện đang có <strong>{productsCount}</strong> sản phẩm. Việc xóa sự kiện sẽ hủy bỏ tất cả giá khuyến mãi đang áp dụng.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDeleteModal; 