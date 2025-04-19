import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi';
import { Brand } from './BrandForm';

interface BrandDeleteModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const BrandDeleteModal: React.FC<BrandDeleteModalProps> = ({ brand, isOpen, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!brand) return;

    setIsDeleting(true);
    try {
      await onDelete(brand.id);
    } catch (error) {
      console.error('Error deleting brand:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!brand || (!isOpen && !modalVisible)) return null;

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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-sm transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
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

          <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <FiTrash2 className="text-red-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Xóa thương hiệu
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-start mb-5">
              <div className="flex-shrink-0 mt-0.5">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn xóa thương hiệu <span className="font-medium text-gray-900">{brand.name}</span>?
                  Hành động này không thể hoàn tác và có thể ảnh hưởng đến các sản phẩm thuộc thương hiệu này.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                onClick={handleDelete}
                disabled={isDeleting}
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
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDeleteModal;