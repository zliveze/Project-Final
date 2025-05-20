import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import EventProductsTable from './EventProductsTable';

export interface EventFormData {
  _id?: string;
  title: string;
  description: string;
  tags: string[];
  startDate: Date | string;
  endDate: Date | string;
  products: {
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
  }[];
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  onAddProduct: () => void;
  onRemoveProduct: (productId: string, variantId?: string, combinationId?: string) => void;
  onUpdateProductPrice?: (productId: string, newPrice: number, variantId?: string, combinationId?: string) => void;
}

const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  onAddProduct,
  onRemoveProduct,
  onUpdateProductPrice
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    tags: [],
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    products: []
  });

  const [tagInput, setTagInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Khởi tạo form với dữ liệu có sẵn (nếu có)
  useEffect(() => {
    if (initialData) {
      // Trường hợp 1: ID sự kiện thay đổi (load sự kiện khác để edit, hoặc chuyển từ add sang edit)
      // Hoặc trường hợp 2: Chế độ thêm mới (initialData._id không có) VÀ form hiện tại rỗng (người dùng chưa nhập gì)
      // thì reset toàn bộ form với initialData.
      if (
        (initialData._id && initialData._id !== formData._id) ||
        (!initialData._id && !formData.title && !formData.description && formData.products.length === 0)
      ) {
        setFormData({
          ...initialData,
          title: initialData.title || '',
          description: initialData.description || '',
          tags: initialData.tags ? [...initialData.tags] : [],
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
          endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(new Date().setDate(new Date().getDate() + 7)),
          products: initialData.products ? [...initialData.products] : []
        });
      } else {
        // Trường hợp 3: Cùng một sự kiện đang được chỉnh sửa, hoặc đang nhập liệu cho sự kiện mới.
        // Chỉ cập nhật products nếu nó thay đổi, giữ nguyên các trường khác người dùng đã nhập.
        // So sánh sâu mảng products để tránh cập nhật không cần thiết
        if (JSON.stringify(initialData.products) !== JSON.stringify(formData.products)) {
          setFormData(prev => ({
            ...prev,
            products: initialData.products ? [...initialData.products] : []
          }));
        }
      }
    }
  }, [initialData, formData._id, formData.title, formData.description, formData.products]);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Xóa thông báo lỗi khi người dùng điền vào trường đó
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý thay đổi ngày
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: new Date(value)
    }));

    // Xóa thông báo lỗi khi người dùng điền vào trường đó
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý thêm tag
  const handleAddTag = () => {
    if (tagInput.trim() !== '') {
      // Kiểm tra xem tag đã tồn tại chưa
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  // Xử lý nhấn phím khi thêm tag
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Xử lý xóa tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Xử lý điều chỉnh giá sản phẩm trong sự kiện
  const handleProductPriceChange = (productId: string, newPrice: number, variantId?: string, combinationId?: string) => {
    // Nếu có callback, gọi callback để cập nhật qua API
    if (onUpdateProductPrice) {
      onUpdateProductPrice(productId, newPrice, variantId, combinationId);
    } else {
      // Nếu không, chỉ cập nhật state local
      setFormData(prev => ({
        ...prev,
        products: prev.products.map(product => {
          // Nếu có combinationId, kiểm tra cả productId, variantId và combinationId
          if (combinationId && product.combinationId) {
            return (product.productId === productId &&
                    product.variantId === variantId &&
                    product.combinationId === combinationId)
              ? { ...product, adjustedPrice: newPrice }
              : product;
          }
          // Nếu có variantId nhưng không có combinationId, kiểm tra productId và variantId
          else if (variantId && product.variantId && !product.combinationId) {
            return (product.productId === productId && product.variantId === variantId)
              ? { ...product, adjustedPrice: newPrice }
              : product;
          }
          // Nếu chỉ có productId, kiểm tra productId
          else if (!variantId && !product.variantId) {
            return product.productId === productId
              ? { ...product, adjustedPrice: newPrice }
              : product;
          }
          return product;
        })
      }));
    }
  };

  // Kiểm tra form trước khi submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề sự kiện';
    }

    if (!formData.description.trim()) {
      errors.description = 'Vui lòng nhập mô tả sự kiện';
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime())) {
      errors.startDate = 'Ngày bắt đầu không hợp lệ';
    }

    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Ngày kết thúc không hợp lệ';
    }

    if (startDate >= endDate) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (formData.products.length === 0) {
      errors.products = 'Vui lòng thêm ít nhất một sản phẩm vào sự kiện';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Format date cho input type="datetime-local"
  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      onClick={(e) => {
        // Ngăn chặn sự kiện submit form khi click vào các phần tử trong form
        // Trừ khi click vào nút submit
        if (e.target !== e.currentTarget) {
          // Chỉ cho phép submit khi click vào nút có type="submit"
          const target = e.target as HTMLElement;
          if (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit') {
            // Cho phép sự kiện tiếp tục
          } else {
            e.stopPropagation();
          }
        }
      }}
    >
      <div className="space-y-6">
        {/* Tiêu đề */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`mt-1 block w-full border ${
              formErrors.title ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-200`}
            placeholder="Nhập tiêu đề sự kiện"
          />
          {formErrors.title && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.title}
            </p>
          )}
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1 block w-full border ${
              formErrors.description ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-200`}
            placeholder="Nhập mô tả sự kiện"
          />
          {formErrors.description && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="mt-1 flex flex-wrap gap-2 items-center border border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-white">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-pink-100 text-pink-800 text-xs px-2.5 py-1.5 rounded-full flex items-center transition-colors duration-150 hover:bg-pink-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 text-pink-500 hover:text-pink-700 focus:outline-none"
                  title="Xóa tag"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag}
              className="flex-1 min-w-[150px] border-0 focus:outline-none focus:ring-0 p-0 text-sm"
              placeholder={formData.tags.length > 0 ? "" : "Nhập tags và nhấn Enter"}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nhập tag và nhấn Enter để thêm. Ví dụ: flash sale, chăm sóc da, v.v.
          </p>
        </div>

        {/* Thời gian */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formatDateForInput(formData.startDate)}
                onChange={handleDateChange}
                className={`block w-full border ${
                  formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm py-2.5 pl-10 pr-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-200`}
              />
            </div>
            {formErrors.startDate && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.startDate}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formatDateForInput(formData.endDate)}
                onChange={handleDateChange}
                className={`block w-full border ${
                  formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm py-2.5 pl-10 pr-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-200`}
              />
            </div>
            {formErrors.endDate && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Sản phẩm */}
        <div>
          <div className="flex justify-between items-center mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sản phẩm trong sự kiện <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Thêm sản phẩm và thiết lập giá khuyến mãi cho sự kiện
              </p>
            </div>
            <button
              type="button"
              onClick={onAddProduct}
              className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm sản phẩm
            </button>
          </div>

          <EventProductsTable
            products={formData.products}
            onRemoveProduct={onRemoveProduct}
            onPriceChange={handleProductPriceChange}
          />

          {formErrors.products && (
            <p className="mt-3 text-sm text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.products}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all duration-200"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300 flex items-center transition-all duration-200 transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lưu sự kiện
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
