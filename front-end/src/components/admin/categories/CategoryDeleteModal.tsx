import { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Category } from '@/contexts/CategoryContext';
import { Modal, Button } from '@/components/admin/common';

interface CategoryDeleteModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  category,
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
    if (!category) return;

    setIsSubmitting(true);

    try {
      // Gọi hàm xử lý từ props
      setTimeout(() => {
        setIsSubmitting(false);
        onDelete(category._id || '');
      }, 500);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Có lỗi xảy ra khi xóa danh mục!', {
        duration: 3000,
        position: 'top-right',
      });
      console.error('Error deleting category:', error);
    }
  };

  if (!isOpen && !modalVisible || !category) return null;

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
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-red-50 px-4 py-3 border-b border-gray-200 flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <FiTrash2 className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Xóa danh mục
            </h2>
          </div>

          <div className="p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Xác nhận xóa danh mục
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa danh mục <span className="font-medium text-gray-900">{category.name}</span>?<br />
                    Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
                  </p>

                  {category.childrenCount && category.childrenCount > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-100 text-sm">
                      <p className="flex items-start">
                        <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                        <span>
                          Danh mục này hiện đang có <strong>{category.childrenCount}</strong> danh mục con liên kết.<br />
                          Xóa danh mục có thể ảnh hưởng đến hiển thị của các danh mục này.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 sm:flex sm:flex-row-reverse">
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="sm:ml-3"
              >
                Xóa danh mục
              </Button>
              <Button
                variant="light"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 sm:mt-0"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDeleteModal;