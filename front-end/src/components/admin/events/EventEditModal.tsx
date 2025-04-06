import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import EventForm, { EventFormData } from './EventForm';
import EventProductAddModal from './EventProductAddModal';
import { Event, useEvents } from '@/contexts/EventsContext';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: EventFormData) => Promise<void>;
  eventId?: string;
  events: Event[];
}

const EventEditModal: React.FC<EventEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  eventId,
  events
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [formData, setFormData] = useState<EventFormData | null>(null);
  
  // Sử dụng context để thao tác với API
  const { addProductsToEvent, removeProductFromEvent, updateProductPriceInEvent } = useEvents();
  
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
  
  // Tải dữ liệu sự kiện khi mở modal và có eventId
  useEffect(() => {
    if (isOpen && eventId) {
      const event = events.find(e => e._id === eventId);
      if (event) {
        setFormData({
          _id: event._id,
          title: event.title,
          description: event.description,
          tags: [...event.tags],
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          products: [...event.products]
        });
      }
    }
  }, [isOpen, eventId, events]);
  
  // Xử lý thêm sản phẩm vào sự kiện
  const handleAddProducts = async (products: {
    productId: string;
    variantId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[]) => {
    if (!formData || !eventId) return;
    
    try {
      // Giới hạn số lượng sản phẩm có thể thêm vào một lần
      if (formData.products.length + products.length > 50) {
        toast.error('Số lượng sản phẩm trong sự kiện vượt quá giới hạn cho phép (50)');
        return;
      }
      
      // Kiểm tra sản phẩm trùng lặp
      const existingProductIds = new Set(formData.products.map(p => p.productId));
      const uniqueProducts = products.filter(p => !existingProductIds.has(p.productId));
      
      if (uniqueProducts.length === 0) {
        toast.error('Các sản phẩm đã tồn tại trong sự kiện');
        return;
      }
      
      // Gọi API thêm sản phẩm vào sự kiện
      setIsSubmitting(true);
      const updatedEvent = await addProductsToEvent(eventId, uniqueProducts);
      setIsSubmitting(false);
      
      if (updatedEvent) {
        // Cập nhật state với sản phẩm mới
        setFormData({
          ...formData,
          products: updatedEvent.products
        });
        
        setShowProductModal(false);
      }
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error('Có lỗi xảy ra khi thêm sản phẩm');
      setIsSubmitting(false);
    }
  };
  
  // Xử lý xóa sản phẩm khỏi sự kiện
  const handleRemoveProduct = async (productId: string) => {
    if (!formData || !eventId) return;
    
    try {
      setIsSubmitting(true);
      const updatedEvent = await removeProductFromEvent(eventId, productId);
      setIsSubmitting(false);
      
      if (updatedEvent) {
        // Cập nhật state local
        setFormData({
          ...formData,
          products: formData.products.filter(product => product.productId !== productId)
        });
      }
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm');
      setIsSubmitting(false);
    }
  };
  
  // Xử lý cập nhật giá sản phẩm trong sự kiện
  const handleUpdateProductPrice = async (productId: string, newPrice: number) => {
    if (!formData || !eventId) return;
    
    try {
      setIsSubmitting(true);
      const updatedEvent = await updateProductPriceInEvent(eventId, productId, newPrice);
      setIsSubmitting(false);
      
      if (updatedEvent) {
        // Cập nhật state local
        setFormData({
          ...formData,
          products: formData.products.map(product => 
            product.productId === productId 
              ? { ...product, adjustedPrice: newPrice }
              : product
          )
        });
        
        toast.success('Đã cập nhật giá sản phẩm thành công');
      }
    } catch (error) {
      console.error('Error updating product price:', error);
      toast.error('Có lỗi xảy ra khi cập nhật giá sản phẩm');
      setIsSubmitting(false);
    }
  };
  
  // Xử lý khi submit form
  const handleSubmit = async (data: EventFormData) => {
    if (!eventId) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Gọi hàm submit từ parent component
      await onSubmit(eventId, data);
      
      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật sự kiện!');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!modalVisible || !formData) return null;

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

          <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Chỉnh sửa sự kiện
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <EventForm
                initialData={formData}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={isSubmitting}
                onAddProduct={() => setShowProductModal(true)}
                onRemoveProduct={handleRemoveProduct}
                onUpdateProductPrice={handleUpdateProductPrice}
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

export default EventEditModal; 