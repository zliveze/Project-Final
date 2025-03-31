import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import EventForm, { EventFormData } from './EventForm';
import EventProductAddModal from './EventProductAddModal';
import { Event } from './EventsTable';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: EventFormData) => void;
  eventId?: string;
  events: Event[]; // Danh sách tất cả các sự kiện
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
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    tags: [],
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    products: []
  });
  
  // Tìm sự kiện cần chỉnh sửa từ danh sách sự kiện
  useEffect(() => {
    if (eventId && isOpen) {
      const event = events.find(e => e._id === eventId);
      if (event) {
        // Chuẩn bị dữ liệu cho form
        const eventFormData: EventFormData = {
          _id: event._id,
          title: event.title,
          description: event.description,
          tags: event.tags,
          startDate: event.startDate,
          endDate: event.endDate,
          products: event.products.map(product => ({
            productId: product.productId,
            variantId: product.variantId,
            adjustedPrice: product.adjustedPrice,
            // Có thể bổ sung thêm tên và ảnh sản phẩm nếu cần (sẽ cần thêm API call)
          }))
        };
        
        setFormData(eventFormData);
      }
    }
  }, [eventId, isOpen, events]);
  
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
  const handleAddProducts = (products: {
    productId: string;
    variantId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[]) => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, ...products]
    }));
    
    setShowProductModal(false);
    toast.success(`Đã thêm ${products.length} sản phẩm vào sự kiện`);
  };
  
  // Xử lý xóa sản phẩm khỏi sự kiện
  const handleRemoveProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product.productId !== productId)
    }));
    
    toast.success('Đã xóa sản phẩm khỏi sự kiện');
  };
  
  // Xử lý khi submit form
  const handleSubmit = async (data: EventFormData) => {
    if (!eventId) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gọi hàm submit từ parent component
      onSubmit(eventId, data);
      
      // Thông báo thành công
      toast.success('Cập nhật sự kiện thành công!');
      
      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật sự kiện!');
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