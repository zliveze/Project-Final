import { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Brand } from './BrandForm';

interface BrandDeleteModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const BrandDeleteModal: React.FC<BrandDeleteModalProps> = ({
  brand,
  isOpen,
  onClose,
  onDelete
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (!brand) return;
    
    setIsSubmitting(true);
    
    try {
      // Gọi hàm xử lý từ props
      setTimeout(() => {
        setIsSubmitting(false);
        onDelete(brand.id);
      }, 500);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Có lỗi xảy ra khi xóa thương hiệu!', {
        duration: 3000,
        position: 'top-right',
      });
      console.error('Error deleting brand:', error);
    }
  };
  
  if (!isOpen && !modalVisible || !brand) return null;

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
          
          <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <FiTrash2 className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Xóa thương hiệu
            </h2>
          </div>

          <div className="p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Xác nhận xóa thương hiệu
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa thương hiệu <span className="font-medium text-gray-900">{brand.name}</span>?<br />
                    Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
                  </p>

                  {brand.productCount && brand.productCount > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-100 text-sm">
                      <p className="flex items-start">
                        <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                        <span>
                          Thương hiệu này hiện đang có <strong>{brand.productCount}</strong> sản phẩm liên kết.<br />
                          Xóa thương hiệu có thể ảnh hưởng đến hiển thị của các sản phẩm này.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xóa thương hiệu'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDeleteModal; 