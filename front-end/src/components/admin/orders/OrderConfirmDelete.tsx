import React, { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminOrder } from '@/contexts';

interface OrderConfirmDeleteProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function OrderConfirmDelete({ orderId, isOpen, onClose, onConfirm }: OrderConfirmDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { cancelOrder } = useAdminOrder();

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);

      // Sử dụng hàm cancelOrder từ context
      await cancelOrder(orderId, 'Xóa bởi admin');

      setIsDeleting(false);
      toast.success('Đã xóa đơn hàng thành công!', {
        id: `delete-order-success-${orderId}`
      });
      onConfirm();

    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error(`Có lỗi xảy ra khi xóa đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`, {
        id: `delete-order-error-${orderId}`
      });
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiAlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Xóa đơn hàng
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa đơn hàng #{orderId}? Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xóa...
                </div>
              ) : (
                'Xóa'
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isDeleting}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}