import { useState, useEffect } from 'react';
import { FiX, FiEye } from 'react-icons/fi'; // Removed FiEdit2, FiTrash2
import CategoryDetail from './CategoryDetail';
import { Category } from '@/contexts/CategoryContext';
// Removed toast
// Removed Modal, Button

const CategoryDetailModal = ({
  category,
  onClose,
  onEdit,
  onDelete,
  // childrenCount = 0, // Removed unused prop
  isOpen = false,
  parentCategory = null,
  childCategories = []
}: {
  category: Category | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  // childrenCount?: number; // Removed unused prop
  isOpen: boolean;
  parentCategory?: Category | null;
  childCategories?: Category[];
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  // const [loading, setLoading] = useState(false); // Removed unused state

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
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-sm transition-all w-full sm:max-w-4xl">
            {/* Header */}
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FiEye className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Chi tiết danh mục: {category?.name || 'Không có tên'}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 p-1"
                onClick={closeModal}
              >
                <span className="sr-only">Đóng</span>
                <FiX className="h-5 w-5" aria-hidden="true" />
              </button>
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
