import { useState, useEffect } from 'react';
import { FiX, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CategoryForm from './CategoryForm';
import { Category } from '@/contexts/CategoryContext';

interface CategoryEditModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Category>) => void;
  categories: Category[];
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  category,
  isOpen,
  onClose,
  onSubmit,
  categories
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

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      console.log(`Đang chuẩn bị cập nhật danh mục ID: ${category?._id}`);
      console.log(`Dữ liệu form được submit:`, JSON.stringify(values, null, 2));
      
      // Đảm bảo _id được đính kèm
      const dataToSubmit = {
        ...values,
        _id: category?._id
      };
      
      console.log(`Dữ liệu sẽ gửi đến callback:`, JSON.stringify(dataToSubmit, null, 2));
      
      // Giả lập độ trễ của API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsSubmitting(false);
      toast.success("Danh mục đã được cập nhật thành công!", {
        duration: 3000,
        position: "bottom-right",
        icon: '✅'
      });
      
      // Đóng modal và gọi hàm callback để làm mới dữ liệu
      onClose();
      
      if (onSubmit) {
        console.log('Gọi onSubmit callback với dữ liệu đã chuẩn bị');
        onSubmit(dataToSubmit);
      } else {
        console.warn('Không có onSubmit callback để gửi dữ liệu');
      }
    } catch (error) {
      console.error("Lỗi chi tiết khi cập nhật danh mục:", error);
      setIsSubmitting(false);
      toast.error("Đã xảy ra lỗi khi cập nhật danh mục", {
        duration: 3000,
        position: "bottom-right",
        icon: '❌'
      });
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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
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
          
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <FiEdit2 className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chỉnh sửa danh mục - {category.name}
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <CategoryForm 
              initialData={category}
              categories={categories.filter(cat => cat._id !== category._id)}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditModal; 