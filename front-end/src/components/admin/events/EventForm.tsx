import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar, AlertCircle, Info, Save, X } from 'lucide-react'; // Added Lucide icons
import EventProductsTable from './EventProductsTable';

// Định nghĩa cấu trúc dữ liệu lồng nhau cho sản phẩm trong form
// Các trường được đánh dấu ? để phù hợp với dữ liệu có thể thiếu từ context
export interface CombinationInEventData {
  combinationId: string;
  attributes: Record<string, string>;
  adjustedPrice: number;
  originalPrice?: number; // Cho phép undefined
  combinationPrice?: number;
}

export interface VariantInEventData {
  variantId: string;
  variantName?: string;
  variantSku?: string;
  variantPrice?: number;
  adjustedPrice: number;
  originalPrice?: number; // Cho phép undefined
  variantAttributes?: Record<string, string>;
  image?: string;
  combinations?: CombinationInEventData[];
}

export interface ProductInEventData {
  productId: string;
  name?: string;
  image?: string;
  originalPrice?: number; // Cho phép undefined
  adjustedPrice: number;
  sku?: string;
  status?: string;
  brandId?: string;
  brand?: string;
  variants?: VariantInEventData[];

  // Các trường này có thể được thêm vào bởi EventProductAddModal hoặc các logic khác
  // và có thể không tồn tại trên ProductInEvent từ context ban đầu.
  // Chúng vẫn hữu ích cho việc hiển thị và xử lý trong form.
  variantId?: string;
  combinationId?: string;
  // variantName, variantAttributes, etc. đã có trong VariantInEventData
}


export interface EventFormData {
  _id?: string;
  title: string;
  description: string;
  tags: string[];
  startDate: Date | string;
  endDate: Date | string;
  products: ProductInEventData[]; // Sử dụng cấu trúc lồng mới
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
    if (onUpdateProductPrice) {
      onUpdateProductPrice(productId, newPrice, variantId, combinationId);
    } else {
      // Cập nhật state local với cấu trúc lồng
      setFormData(prev => {
        const updatedProducts = prev.products.map(p => {
          if (p.productId === productId) {
            // Cập nhật sản phẩm gốc hoặc biến thể/tổ hợp của nó
            if (variantId && p.variants) {
              const updatedVariants = p.variants.map(v => {
                if (v.variantId === variantId) {
                  if (combinationId && v.combinations) {
                    const updatedCombinations = v.combinations.map(c => {
                      if (c.combinationId === combinationId) {
                        return { ...c, adjustedPrice: newPrice };
                      }
                      return c;
                    });
                    return { ...v, combinations: updatedCombinations };
                  }
                  // Cập nhật biến thể (không có tổ hợp cụ thể)
                  return { ...v, adjustedPrice: newPrice };
                }
                return v;
              });
              return { ...p, variants: updatedVariants };
            }
            // Cập nhật sản phẩm gốc (không có variantId)
            return { ...p, adjustedPrice: newPrice };
          }
          return p;
        });
        return { ...prev, products: updatedProducts };
      });
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
            className={`mt-1.5 block w-full border ${
              formErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
            } rounded-lg shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200 bg-white`}
            placeholder="Ví dụ: Flash Sale Tháng 5"
          />
          {formErrors.title && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {formErrors.title}
            </p>
          )}
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1.5 block w-full border ${
              formErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
            } rounded-lg shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200 bg-white`}
            placeholder="Mô tả chi tiết về sự kiện..."
          />
          {formErrors.description && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {formErrors.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-slate-700">
            Tags
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2 items-center border border-slate-300 rounded-lg shadow-sm p-2.5 bg-white focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-pink-500">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-pink-100 text-pink-700 text-xs px-2.5 py-1 rounded-md flex items-center transition-colors duration-150 hover:bg-pink-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 text-pink-500 hover:text-pink-700 focus:outline-none"
                  title="Xóa tag"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag} // Add tag on blur as well
              className="flex-1 min-w-[120px] border-0 focus:outline-none focus:ring-0 p-0.5 text-sm placeholder-slate-400"
              placeholder={formData.tags.length > 0 ? "" : "Nhập tag..."}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Nhấn Enter hoặc dấu phẩy (,) để thêm tag.
          </p>
        </div>

        {/* Thời gian */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formatDateForInput(formData.startDate)}
                onChange={handleDateChange}
                className={`block w-full border ${
                  formErrors.startDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
                } rounded-lg shadow-sm py-2.5 pl-11 pr-3.5 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200 bg-white`}
              />
            </div>
            {formErrors.startDate && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                {formErrors.startDate}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formatDateForInput(formData.endDate)}
                onChange={handleDateChange}
                className={`block w-full border ${
                  formErrors.endDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
                } rounded-lg shadow-sm py-2.5 pl-11 pr-3.5 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200 bg-white`}
              />
            </div>
            {formErrors.endDate && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                {formErrors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Sản phẩm trong sự kiện <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Thêm sản phẩm và điều chỉnh giá khuyến mãi cho sự kiện này.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddProduct}
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2 -ml-1" />
              Thêm sản phẩm
            </button>
          </div>

          <EventProductsTable
            products={formData.products}
            onRemoveProduct={onRemoveProduct}
            onPriceChange={handleProductPriceChange}
          />

          {formErrors.products && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {formErrors.products}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-6 mt-8 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 transition-all duration-200"
        >
          <X className="w-4 h-4 mr-1.5 inline-block -mt-0.5" /> Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 flex items-center justify-center transition-all duration-200 transform hover:scale-105"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2 -ml-1" />
              Lưu sự kiện
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
