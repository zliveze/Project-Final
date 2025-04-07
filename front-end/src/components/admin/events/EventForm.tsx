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
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[];
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  onAddProduct: () => void;
  onRemoveProduct: (productId: string) => void;
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
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
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Đảm bảo startDate và endDate là đối tượng Date
        startDate: initialData.startDate ? new Date(initialData.startDate) : prev.startDate,
        endDate: initialData.endDate ? new Date(initialData.endDate) : prev.endDate,
        // Đảm bảo mảng products là một mảng mới và luôn cập nhật khi có thay đổi
        products: initialData.products ? [...initialData.products] : []
      }));
    }
  }, [initialData]);
  
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
  const handleProductPriceChange = (productId: string, newPrice: number) => {
    // Nếu có callback, gọi callback để cập nhật qua API
    if (onUpdateProductPrice) {
      onUpdateProductPrice(productId, newPrice);
    } else {
      // Nếu không, chỉ cập nhật state local
      setFormData(prev => ({
        ...prev,
        products: prev.products.map(product => 
          product.productId === productId 
            ? { ...product, adjustedPrice: newPrice } 
            : product
        )
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
            placeholder="Nhập tiêu đề sự kiện"
          />
          {formErrors.title && (
            <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
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
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1 block w-full border ${
              formErrors.description ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
            placeholder="Nhập mô tả sự kiện"
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
          )}
        </div>
        
        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="mt-1 flex flex-wrap gap-2 items-center border border-gray-300 rounded-md shadow-sm py-2 px-3">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-pink-500 hover:text-pink-700 focus:outline-none"
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
              className="flex-1 min-w-[120px] border-0 focus:outline-none focus:ring-0 p-0 text-sm"
              placeholder={formData.tags.length > 0 ? "" : "Nhập tags và nhấn Enter"}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Nhập tag và nhấn Enter để thêm. Ví dụ: flash sale, chăm sóc da, v.v.
          </p>
        </div>
        
        {/* Thời gian */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formatDateForInput(formData.startDate)}
              onChange={handleDateChange}
              className={`mt-1 block w-full border ${
                formErrors.startDate ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
            />
            {formErrors.startDate && (
              <p className="mt-1 text-sm text-red-500">{formErrors.startDate}</p>
            )}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formatDateForInput(formData.endDate)}
              onChange={handleDateChange}
              className={`mt-1 block w-full border ${
                formErrors.endDate ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
            />
            {formErrors.endDate && (
              <p className="mt-1 text-sm text-red-500">{formErrors.endDate}</p>
            )}
          </div>
        </div>
        
        {/* Sản phẩm */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Sản phẩm trong sự kiện <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={onAddProduct}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Thêm sản phẩm
            </button>
          </div>
          
          <EventProductsTable 
            products={formData.products} 
            onRemoveProduct={onRemoveProduct}
            onPriceChange={handleProductPriceChange}
          />
          
          {formErrors.products && (
            <p className="mt-1 text-sm text-red-500">{formErrors.products}</p>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </>
          ) : (
            'Lưu sự kiện'
          )}
        </button>
      </div>
    </form>
  );
};

export default EventForm; 