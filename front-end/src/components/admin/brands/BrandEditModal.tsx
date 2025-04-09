import { useState, useEffect } from 'react';
import { FiX, FiEdit2 } from 'react-icons/fi';
import BrandForm, { Brand } from './BrandForm';

interface BrandEditModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Brand>) => void;
}

const BrandEditModal: React.FC<BrandEditModalProps> = ({ brand, isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (data: Partial<Brand>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error updating brand:', error);
    } finally {
      setIsSubmitting(false);
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
          
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <FiEdit2 className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chỉnh sửa thương hiệu: {brand.name}
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <BrandForm
              initialData={brand}
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

export default BrandEditModal; 