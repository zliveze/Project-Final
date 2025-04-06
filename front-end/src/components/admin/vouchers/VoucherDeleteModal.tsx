import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { Voucher } from '@/contexts/VoucherContext';

interface VoucherDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isSubmitting: boolean;
  voucher: Voucher | null;
}

export default function VoucherDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  voucher
}: VoucherDeleteModalProps) {
  if (!isOpen || !voucher) return null;

  const handleConfirm = () => {
    if (voucher._id) {
      onConfirm(voucher._id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex items-center justify-between px-6 py-4 bg-red-50 border-b border-red-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 sm:h-12 sm:w-12">
                <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <h3 className="ml-3 text-lg font-medium text-red-800">
                Xác nhận xóa voucher
              </h3>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left">
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa voucher <span className="font-semibold">{voucher.code}</span>? 
                    Hành động này không thể hoàn tác và tất cả dữ liệu liên quan đến voucher này sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 flex flex-row-reverse">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className={`inline-flex justify-center w-full sm:w-auto rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:text-sm ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xóa...
                </>
              ) : (
                'Xóa voucher'
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 