import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import EventForm, { EventFormData } from './EventForm';
import EventProductAddModal from './EventProductAddModal';
import { Event, useEvents, ProductInEvent } from '@/contexts/EventsContext';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: EventFormData) => Promise<void>;
  eventId?: string;
  events: Event[];
}

// Định nghĩa kiểu dữ liệu cho các thao tác với sản phẩm
type ProductOperation =
  | { type: 'add'; products: ProductInEvent[] }
  | { type: 'remove'; productId: string }
  | { type: 'update_price'; productId: string; adjustedPrice: number };

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
  // State để theo dõi các sản phẩm đã xóa (để loại trừ khỏi modal thêm sản phẩm)
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);
  // State mới để theo dõi tất cả các thao tác với sản phẩm trong một phiên chỉnh sửa
  const [pendingOperations, setPendingOperations] = useState<ProductOperation[]>([]);

  // Sử dụng context để thao tác với API
  const { addProductsToEvent, removeProductFromEvent, updateProductPriceInEvent, fetchEventById } = useEvents();

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
        // Reset danh sách sản phẩm đã xóa và các thao tác đang chờ xử lý khi mở modal mới
        setRemovedProductIds([]);
        setPendingOperations([]);
      }
    }
  }, [isOpen, eventId, events]);

  // Xử lý thêm sản phẩm vào sự kiện - Cách tiếp cận mới
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

      // Thêm thao tác vào danh sách các thao tác đang chờ xử lý
      setPendingOperations(prev => [...prev, { type: 'add', products: uniqueProducts }]);

      // Cập nhật state local mà không gọi API
      setFormData({
        ...formData,
        products: [...formData.products, ...uniqueProducts]
      });

      // Xóa các sản phẩm mới thêm khỏi danh sách sản phẩm đã xóa (nếu có)
      const addedProductIds = uniqueProducts.map(p => p.productId);
      setRemovedProductIds(prev => prev.filter(id => !addedProductIds.includes(id)));

      setShowProductModal(false);
      toast.success('Đã thêm sản phẩm vào sự kiện. Nhấn Lưu để hoàn tất thay đổi.');
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error('Có lỗi xảy ra khi thêm sản phẩm');
    }
  };

  // Xử lý xóa sản phẩm khỏi sự kiện - Cách tiếp cận mới
  const handleRemoveProduct = async (
    productId: string,
    variantId?: string,
    combinationId?: string
  ) => {
    if (!formData || !eventId) return;

    try {
      // Thêm thao tác vào danh sách các thao tác đang chờ xử lý
      setPendingOperations(prev => [...prev, {
        type: 'remove',
        productId,
        variantId,
        combinationId
      }]);

      // Cập nhật state local, không gọi API
      setFormData({
        ...formData,
        products: formData.products.filter(product => {
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
      });

      // Thêm productId vào danh sách sản phẩm đã xóa để loại trừ khỏi modal thêm sản phẩm
      // Chỉ thêm productId vào danh sách nếu không có variantId hoặc combinationId
      if (!variantId && !combinationId) {
        setRemovedProductIds(prev => [...prev, productId]);
      }

      // Hiển thị thông báo thành công nhưng không đóng modal
      toast.success('Đã xóa sản phẩm khỏi sự kiện. Nhấn Lưu để hoàn tất thay đổi.');

      // Việc gọi API removeProductFromEvent sẽ được thực hiện khi submit form
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  // Xử lý cập nhật giá sản phẩm trong sự kiện - Cách tiếp cận mới
  const handleUpdateProductPrice = async (
    productId: string,
    newPrice: number,
    variantId?: string,
    combinationId?: string
  ) => {
    if (!formData || !eventId) return;

    // Thêm thao tác vào danh sách các thao tác đang chờ xử lý
    setPendingOperations(prev => [...prev, {
      type: 'update_price',
      productId,
      variantId,
      combinationId,
      adjustedPrice: newPrice
    }]);

    // Chỉ cập nhật state local, không gọi API
    setFormData({
      ...formData,
      products: formData.products.map(product => {
        // Nếu có combinationId, kiểm tra cả productId, variantId và combinationId
        if (combinationId && product.combinationId) {
          if (product.productId === productId &&
              product.variantId === variantId &&
              product.combinationId === combinationId) {
            return { ...product, adjustedPrice: newPrice };
          }
          return product;
        }
        // Nếu có variantId nhưng không có combinationId, kiểm tra productId và variantId
        else if (variantId && product.variantId && !combinationId && !product.combinationId) {
          if (product.productId === productId && product.variantId === variantId) {
            return { ...product, adjustedPrice: newPrice };
          }
          return product;
        }
        // Nếu chỉ có productId, kiểm tra productId
        else if (!variantId && !product.variantId) {
          if (product.productId === productId) {
            return { ...product, adjustedPrice: newPrice };
          }
        }
        return product;
      })
    });

    // Không gọi API updateProductPriceInEvent nữa
    // Việc cập nhật API sẽ được thực hiện khi submit form
    // Không hiển thị toast để tránh làm đóng dropdown
    // toast.success('Đã cập nhật giá sản phẩm. Nhấn Lưu để hoàn tất thay đổi.');
  };

  // Xử lý khi submit form - Cách tiếp cận mới
  const handleSubmit = async (data: EventFormData) => {
    if (!eventId) {
      toast.error('Không tìm thấy ID sự kiện');
      return;
    }

    try {
      setIsSubmitting(true);

      // Xử lý tất cả các thao tác đang chờ xử lý
      if (formData && pendingOperations.length > 0) {
        // Xử lý từng thao tác theo thứ tự
        for (const operation of pendingOperations) {
          switch (operation.type) {
            case 'add':
              // Thêm sản phẩm vào sự kiện
              await addProductsToEvent(eventId, operation.products);
              break;

            case 'remove':
              // Xóa sản phẩm khỏi sự kiện
              await removeProductFromEvent(
                eventId,
                operation.productId,
                operation.variantId,
                operation.combinationId
              );
              break;

            case 'update_price':
              // Cập nhật giá sản phẩm
              await updateProductPriceInEvent(
                eventId,
                operation.productId,
                operation.adjustedPrice,
                operation.variantId,
                operation.combinationId,
                false // Không hiển thị toast
              );
              break;
          }
        }

        // Reset danh sách thao tác đang chờ xử lý và sản phẩm đã xóa
        setPendingOperations([]);
        setRemovedProductIds([]);
      }

      // Gọi hàm submit từ parent component để cập nhật thông tin sự kiện
      await onSubmit(eventId, data);

      // Hiển thị thông báo thành công
      toast.success('Đã lưu sự kiện thành công');

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

  // Danh sách ID sản phẩm đã thêm vào sự kiện và đã xóa
  const excludedProductIds = [
    ...formData.products.map(product => product.productId),
    ...removedProductIds
  ];

  return (
    <>
      <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
            {/* Header với màu hồng nhạt */}
            <div className="bg-pink-50 px-6 py-4 border-b border-pink-100 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-800 flex items-center">
                <span className="bg-pink-100 p-1.5 rounded-lg mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm11 14a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v9a1 1 0 001 1h12z" clipRule="evenodd" />
                  </svg>
                </span>
                Chỉnh sửa sự kiện
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-pink-500 focus:outline-none transition-colors duration-200 bg-white rounded-full p-1.5 hover:bg-pink-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Body với padding lớn hơn và scroll */}
            <div className="bg-white px-8 pt-6 pb-8 sm:p-8 max-h-[80vh] overflow-y-auto">
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