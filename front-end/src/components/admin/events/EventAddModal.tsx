import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import EventForm, { EventFormData } from './EventForm';
import EventProductAddModal from './EventProductAddModal';

interface EventAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => void;
}

const EventAddModal: React.FC<EventAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    tags: [],
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    products: []
  });

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

  // Xử lý thêm sản phẩm vào sự kiện
  const handleAddProducts = (products: any[]) => {
    try {
      // Giới hạn số lượng sản phẩm có thể thêm vào một lần
      if (formData.products.length + products.length > 50) {
        toast.error('Số lượng sản phẩm trong sự kiện vượt quá giới hạn cho phép (50)');
        return;
      }

      // Tạo một danh sách sản phẩm đã được làm phẳng để kiểm tra trùng lặp
      const existingProductKeys = new Set();
      formData.products.forEach(p => {
        const key = p.productId +
          (p.variantId ? `:${p.variantId}` : '') +
          (p.combinationId ? `:${p.combinationId}` : '');
        existingProductKeys.add(key);
      });

      // Lọc ra các sản phẩm không trùng lặp
      const uniqueProducts = products.filter(p => {
        const key = p.productId +
          (p.variantId ? `:${p.variantId}` : '') +
          (p.combinationId ? `:${p.combinationId}` : '');
        return !existingProductKeys.has(key);
      });

      if (uniqueProducts.length === 0) {
        toast.error('Các sản phẩm đã tồn tại trong sự kiện');
        return;
      }

      // Cập nhật state với sản phẩm mới
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, ...uniqueProducts]
      }));

      setShowProductModal(false);
      toast.success(`Đã thêm ${uniqueProducts.length} sản phẩm vào sự kiện`);
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error('Có lỗi xảy ra khi thêm sản phẩm');
    }
  };

  // Xử lý xóa sản phẩm khỏi sự kiện
  const handleRemoveProduct = (productId: string, variantId?: string, combinationId?: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => {
        // Nếu có combinationId, kiểm tra cả productId, variantId và combinationId
        if (combinationId) {
          return !(product.productId === productId &&
                  product.variantId === variantId &&
                  product.combinationId === combinationId);
        }
        // Nếu có variantId nhưng không có combinationId, kiểm tra productId và variantId
        else if (variantId) {
          return !(product.productId === productId && product.variantId === variantId);
        }
        // Nếu chỉ có productId, kiểm tra productId
        return product.productId !== productId;
      })
    }));

    toast.success('Đã xóa sản phẩm khỏi sự kiện');
  };

  // Xử lý khi submit form
  const handleSubmit = (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Gọi hàm submit từ parent component
      onSubmit(data);

      // Đóng modal
      onClose();

      // Reset form
      setFormData({
        title: '',
        description: '',
        tags: [],
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        products: []
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Đã xảy ra lỗi khi thêm sự kiện!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!modalVisible) return null;

  // Danh sách ID sản phẩm đã thêm vào sự kiện
  const excludedProductIds = formData.products.map(product => product.productId);

  return (
    <>
      <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
            {/* Header */}
            <div className="bg-pink-50 px-6 py-4 border-b border-pink-100 sm:px-8 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Thêm sự kiện mới
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none rounded-full hover:bg-pink-100 p-2 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Body với padding lớn hơn */}
            <div className="bg-white px-8 pt-6 pb-8 sm:p-8 max-h-[80vh] overflow-y-auto">
              <EventForm
                initialData={formData}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={isSubmitting}
                onAddProduct={() => setShowProductModal(true)}
                onRemoveProduct={handleRemoveProduct}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal thêm sản phẩm */}
      <EventProductAddModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onAdd={handleAddProducts}
        excludedProductIds={excludedProductIds}
      />
    </>
  );
};

export default EventAddModal;