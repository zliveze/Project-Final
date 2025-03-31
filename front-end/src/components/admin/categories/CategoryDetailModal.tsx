import { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import CategoryDetail from './CategoryDetail';
import { Category } from './CategoryTable';
import toast from 'react-hot-toast';

interface CategoryDetailModalProps {
  category: Category | null;
  parentCategory?: Category | null;
  childCategories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  category,
  parentCategory,
  childCategories,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    try {
      if (isOpen) {
        setModalVisible(true);
      } else {
        setTimeout(() => {
          setModalVisible(false);
        }, 300);
      }
    } catch (error) {
      console.error("Lỗi khi mở/đóng modal chi tiết danh mục:", error);
      toast.error("Đã xảy ra lỗi khi hiển thị chi tiết danh mục", {
        duration: 3000,
        position: "top-right",
        icon: '❌'
      });
    }
  }, [isOpen]);
  
  if (!isOpen && !modalVisible || !category) return null;

  // Hiển thị chi tiết trong modal
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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
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
          
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <FiEye className="text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết danh mục - {category.name}
            </h2>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <CategoryDetail
                category={category}
                parentCategory={parentCategory}
                childCategories={childCategories}
                productCount={category.productCount || 0}
                onEdit={onEdit}
                onDelete={onDelete}
                onBack={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal; 