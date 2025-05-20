import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react'; // Updated icons
import toast from 'react-hot-toast'; // Added toast import

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
      // onClose(); // Sẽ được gọi từ component cha sau khi deleteEvent thành công
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi xóa sự kiện!');
    } finally {
      setIsDeleting(false);
      // Đảm bảo modal đóng ngay cả khi có lỗi, hoặc để component cha quyết định
      // onClose(); 
    }
  };

  if (!modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          <div className="bg-white px-6 pt-6 pb-5 sm:p-7">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                <AlertTriangle className="h-8 w-8 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-xl font-semibold text-slate-800" id="modal-title">
                  Xác nhận xóa sự kiện
                </h3>
                <div className="mt-2.5">
                  <p className="text-sm text-slate-600">
                    Bạn có chắc chắn muốn xóa sự kiện <strong className="font-medium text-slate-700">{eventTitle || 'này'}</strong>?
                  </p>
                  {productsCount !== undefined && productsCount > 0 && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
                      <AlertTriangle className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                      Sự kiện này hiện có <strong>{productsCount}</strong> sản phẩm. Việc xóa sẽ hủy bỏ tất cả giá khuyến mãi liên quan.
                    </p>
                  )}
                   <p className="mt-2 text-xs text-slate-500">
                      Hành động này không thể hoàn tác.
                    </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-7">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirm}
              className={`w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150 ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2 -ml-1" />
                  Xóa sự kiện
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-slate-300 shadow-sm px-5 py-2.5 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-150"
            >
               <X className="h-4 w-4 mr-2 -ml-1" />
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDeleteModal;
