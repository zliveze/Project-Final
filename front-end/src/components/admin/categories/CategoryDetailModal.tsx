import { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import CategoryDetail from './CategoryDetail';
import { Category } from '@/contexts/CategoryContext';
import toast from 'react-hot-toast';

const CategoryDetailModal = ({
  category,
  onClose,
  onEdit,
  onDelete,
  childrenCount = 0,
  isOpen = false,
  parentCategory = null,
  childCategories = []
}: {
  category: Category | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  childrenCount?: number;
  isOpen: boolean;
  parentCategory?: Category | null;
  childCategories?: Category[];
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cập nhật trạng thái modalVisible khi isOpen thay đổi
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  }, [isOpen]);

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Nếu không isOpen, không render gì cả
  if (!isOpen) {
    return null;
  }

  // Nếu category là null hoặc undefined, hiển thị thông báo loading hoặc đóng modal
  if (!category) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity">
        <div className="fixed inset-0 z-10 overflow-y-auto transition-all">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Đang tải...
                </h3>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={closeModal}
                >
                  <span className="sr-only">Đóng</span>
                  <FiX className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <p>Không thể tải thông tin danh mục. Vui lòng thử lại sau.</p>
              <button
                type="button"
                className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-pink-100 px-4 py-2 text-sm font-medium text-pink-900 hover:bg-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                onClick={closeModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${modalVisible ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`fixed inset-0 z-10 overflow-y-auto transition-all ${modalVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full sm:max-w-4xl">
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Chi tiết danh mục: {category?.name || 'Không có tên'}
                    </h3>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Đóng</span>
                      <FiX className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white p-6">
              <div className="overflow-y-auto max-h-[70vh]">
                <CategoryDetail
                  category={category}
                  parentCategory={parentCategory}
                  childCategories={childCategories}
                  productCount={0}
                  onEdit={() => category._id && onEdit(category._id)}
                  onDelete={() => category._id && onDelete(category._id)}
                  onBack={onClose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryDetailModal; 