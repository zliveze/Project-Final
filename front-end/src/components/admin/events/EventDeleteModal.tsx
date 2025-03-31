import React, { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface EventDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  eventId?: string;
  eventTitle?: string;
  productsCount?: number;
}

const EventDeleteModal: React.FC<EventDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventId,
  eventTitle = 'sự kiện này',
  productsCount = 0
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
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
    if (!eventId) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gọi hàm xác nhận từ parent component
      onConfirm(eventId);
      
      // Thông báo thành công
      toast.success('Xóa sự kiện thành công!');
      
      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Đã xảy ra lỗi khi xóa sự kiện!');
    } finally {
      setIsSubmitting(false);
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
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Xóa sự kiện
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa sự kiện <span className="font-medium text-gray-900">{eventTitle}</span>? Hành động này không thể hoàn tác.
                  </p>
                  
                  {productsCount > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                      <p className="text-sm text-yellow-700">
                        <strong>Lưu ý:</strong> Sự kiện này đang áp dụng cho <strong>{productsCount}</strong> sản phẩm. Khi xóa sự kiện, tất cả sản phẩm sẽ trở về giá gốc.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xóa...
                </>
              ) : (
                'Xóa sự kiện'
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isSubmitting}
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