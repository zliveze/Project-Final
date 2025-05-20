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
  | { type: 'remove'; productId: string; variantId?: string; combinationId?: string }
  | { type: 'update_price'; productId: string; adjustedPrice: number; variantId?: string; combinationId?: string };

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
    combinationId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
    variantName?: string;
    variantAttributes?: Record<string, string>;
    sku?: string;
    status?: string;
    brandId?: string;
    brand?: string;
    variantSku?: string;
    variantPrice?: number;
    combinationPrice?: number;
  }[]) => {
    if (!formData || !eventId) return;

    try {
      // Log dữ liệu sản phẩm được thêm vào
      console.log('EventEditModal - handleAddProducts - Dữ liệu sản phẩm:', JSON.stringify(products, null, 2));

      // Giới hạn số lượng sản phẩm có thể thêm vào một lần
      if (formData.products.length + products.length > 50) {
        toast.error('Số lượng sản phẩm trong sự kiện vượt quá giới hạn cho phép (50)');
        return;
      }

      // Kiểm tra sản phẩm trùng lặp
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

      // Thêm thao tác vào danh sách các thao tác đang chờ xử lý
      setPendingOperations(prev => [...prev, { type: 'add', products: uniqueProducts }]);

      // Log thao tác đang chờ xử lý
      console.log('EventEditModal - Thao tác đang chờ xử lý:', { type: 'add', products: uniqueProducts });

      // Cập nhật state local mà không gọi API
      setFormData({
        ...formData,
        products: [...formData.products, ...uniqueProducts]
      });

      // Xóa các sản phẩm mới thêm khỏi danh sách sản phẩm đã xóa (nếu có)
      const addedProductIds = uniqueProducts.map(p => p.productId);
      setRemovedProductIds(prev => prev.filter(id => !addedProductIds.includes(id)));

      setShowProductModal(false);
      toast.success('Đã thêm sản phẩm vào sự kiện. Nhấn Lưu để hoàn tất thay đổi.', { id: 'event-edit-add-product-temp' });
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm sản phẩm', { id: 'event-edit-add-product-error' });
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
      toast.success('Đã xóa sản phẩm khỏi sự kiện. Nhấn Lưu để hoàn tất thay đổi.', { id: 'event-edit-remove-product-temp' });

      // Việc gọi API removeProductFromEvent sẽ được thực hiện khi submit form
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa sản phẩm', { id: 'event-edit-remove-product-error' });
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

    // Log thông tin đầu vào
    console.log('EventEditModal - handleUpdateProductPrice - Dữ liệu đầu vào:', {
      productId,
      newPrice,
      variantId,
      combinationId
    });

    // Thêm thao tác vào danh sách các thao tác đang chờ xử lý
    const newOperation = {
      type: 'update_price' as const,
      productId,
      variantId,
      combinationId,
      adjustedPrice: newPrice
    };

    console.log('EventEditModal - Thêm thao tác mới:', newOperation);

    setPendingOperations(prev => {
      // Kiểm tra xem đã có thao tác cập nhật giá cho sản phẩm/biến thể/tổ hợp này chưa
      const existingIndex = prev.findIndex(op =>
        op.type === 'update_price' &&
        op.productId === productId &&
        op.variantId === variantId &&
        op.combinationId === combinationId
      );

      // Nếu đã có, thay thế thao tác cũ bằng thao tác mới
      if (existingIndex !== -1) {
        const newOperations = [...prev];
        newOperations[existingIndex] = newOperation;
        console.log('EventEditModal - Cập nhật thao tác đã tồn tại:', newOperations);
        return newOperations;
      }

      // Nếu chưa có, thêm thao tác mới
      console.log('EventEditModal - Thêm thao tác mới vào danh sách:', [...prev, newOperation]);
      return [...prev, newOperation];
    });

    // Cập nhật state local
    setFormData(prevFormData => {
      // Tìm sản phẩm cần cập nhật
      const updatedProducts = prevFormData.products.map(product => {
        // Nếu là sản phẩm chính
        if (product.productId === productId && !variantId) {
          console.log('EventEditModal - Cập nhật giá sản phẩm chính:', {
            productId,
            oldPrice: product.adjustedPrice,
            newPrice
          });
          return { ...product, adjustedPrice: newPrice };
        }

        // Nếu là biến thể hoặc tổ hợp biến thể
        if (product.productId === productId && product.variants) {
          // Tạo bản sao của mảng variants
          const updatedVariants = product.variants.map(variant => {
            // Nếu là biến thể cần cập nhật
            if (variant.variantId === variantId && !combinationId) {
              console.log('EventEditModal - Cập nhật giá biến thể:', {
                productId,
                variantId,
                oldPrice: variant.adjustedPrice,
                newPrice
              });
              return { ...variant, adjustedPrice: newPrice };
            }

            // Nếu là tổ hợp biến thể cần cập nhật
            if (variant.variantId === variantId && variant.combinations) {
              // Tạo bản sao của mảng combinations
              const updatedCombinations = variant.combinations.map(combination => {
                if (combination.combinationId === combinationId) {
                  console.log('EventEditModal - Cập nhật giá tổ hợp biến thể:', {
                    productId,
                    variantId,
                    combinationId,
                    oldPrice: combination.adjustedPrice,
                    newPrice
                  });
                  return { ...combination, adjustedPrice: newPrice };
                }
                return combination;
              });

              return { ...variant, combinations: updatedCombinations };
            }

            return variant;
          });

          return { ...product, variants: updatedVariants };
        }

        return product;
      });

      return { ...prevFormData, products: updatedProducts };
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
              console.log('EventEditModal - handleSubmit - Thêm sản phẩm:', operation.products);
              await addProductsToEvent(eventId, operation.products);
              break;

            case 'remove':
              // Xóa sản phẩm khỏi sự kiện
              console.log('EventEditModal - handleSubmit - Xóa sản phẩm:', {
                productId: operation.productId,
                variantId: operation.variantId,
                combinationId: operation.combinationId
              });
              await removeProductFromEvent(
                eventId,
                operation.productId,
                operation.variantId,
                operation.combinationId
              );
              break;

            case 'update_price':
              // Cập nhật giá sản phẩm
              console.log('EventEditModal - handleSubmit - Cập nhật giá sản phẩm:', {
                productId: operation.productId,
                adjustedPrice: operation.adjustedPrice,
                variantId: operation.variantId,
                combinationId: operation.combinationId
              });

              try {
                const result = await updateProductPriceInEvent(
                  eventId,
                  operation.productId,
                  operation.adjustedPrice,
                  operation.variantId,
                  operation.combinationId,
                  false // Không hiển thị toast
                );
                console.log('EventEditModal - handleSubmit - Kết quả cập nhật giá:', result ? 'Thành công' : 'Thất bại');
              } catch (error) {
                console.error('EventEditModal - handleSubmit - Lỗi khi cập nhật giá:', error);
                toast.error(`Lỗi khi cập nhật giá: ${error.message || 'Không xác định'}`, { id: 'event-edit-update-price-error' });
              }
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
      toast.success('Đã lưu sự kiện thành công', { id: 'event-update-success' });

      // Đóng modal
      onClose();
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi cập nhật sự kiện!', { id: 'event-update-error' });
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