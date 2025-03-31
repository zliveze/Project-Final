import { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Định nghĩa interfaces cho Voucher
export interface Voucher {
  _id?: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount?: number;
  usedByUsers?: string[];
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VoucherFormProps {
  initialData?: Partial<Voucher>;
  onSubmit: (data: Partial<Voucher>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const VoucherForm: React.FC<VoucherFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<Partial<Voucher>>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumOrderValue: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    usageLimit: 100,
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    ...(initialData || {})
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Format dates if they come as string
  useEffect(() => {
    if (initialData) {
      if (typeof initialData.startDate === 'string') {
        initialData.startDate = new Date(initialData.startDate);
      }
      if (typeof initialData.endDate === 'string') {
        initialData.endDate = new Date(initialData.endDate);
      }
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý thay đổi số
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : Number(value)
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý thay đổi checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Xử lý thay đổi ngày
  const handleDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date
      }));
    }
  };

  // Xử lý validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = 'Mã voucher không được để trống';
    }
    
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Mô tả voucher không được để trống';
    }
    
    if (typeof formData.discountValue !== 'number' || (formData.discountValue !== undefined && formData.discountValue <= 0)) {
      newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    }
    
    if (formData.discountType === 'percentage' && formData.discountValue && formData.discountValue > 100) {
      newErrors.discountValue = 'Phần trăm giảm giá không được vượt quá 100%';
    }
    
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mã voucher */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Mã voucher <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.code ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            placeholder="VD: SUMMER2023"
            disabled={initialData?._id ? true : false}
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
        </div>

        {/* Loại giảm giá */}
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
            Loại giảm giá <span className="text-red-500">*</span>
          </label>
          <select
            id="discountType"
            name="discountType"
            value={formData.discountType || 'percentage'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="percentage">Giảm theo phần trăm (%)</option>
            <option value="fixed">Giảm số tiền cố định (VND)</option>
          </select>
        </div>

        {/* Giá trị giảm giá */}
        <div>
          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
            Giá trị giảm giá <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="discountValue"
              name="discountValue"
              value={formData.discountValue || 0}
              onChange={handleNumberChange}
              min={0}
              max={formData.discountType === 'percentage' ? 100 : undefined}
              className={`w-full px-3 py-2 border ${
                errors.discountValue ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {formData.discountType === 'percentage' ? '%' : 'đ'}
            </div>
          </div>
          {errors.discountValue && <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>}
        </div>

        {/* Giá trị đơn hàng tối thiểu */}
        <div>
          <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-gray-700 mb-1">
            Giá trị đơn hàng tối thiểu
          </label>
          <div className="relative">
            <input
              type="number"
              id="minimumOrderValue"
              name="minimumOrderValue"
              value={formData.minimumOrderValue || 0}
              onChange={handleNumberChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              đ
            </div>
          </div>
        </div>

        {/* Ngày bắt đầu */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={formData.startDate}
            onChange={(date: Date | null) => handleDateChange(date, 'startDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
          />
        </div>

        {/* Ngày kết thúc */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={formData.endDate}
            onChange={(date: Date | null) => handleDateChange(date, 'endDate')}
            className={`w-full px-3 py-2 border ${
              errors.endDate ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            dateFormat="dd/MM/yyyy"
            minDate={formData.startDate}
          />
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
        </div>

        {/* Giới hạn sử dụng */}
        <div>
          <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">
            Giới hạn sử dụng
          </label>
          <input
            type="number"
            id="usageLimit"
            name="usageLimit"
            value={formData.usageLimit || 0}
            onChange={handleNumberChange}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <p className="mt-1 text-xs text-gray-500">Để 0 nếu không giới hạn số lần sử dụng</p>
        </div>

        {/* Trạng thái */}
        <div>
          <div className="flex items-center h-full mt-7">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Kích hoạt voucher
            </label>
          </div>
        </div>

        {/* Mô tả */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            placeholder="Mô tả chi tiết về voucher..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Các sản phẩm áp dụng */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sản phẩm áp dụng
          </label>
          <p className="text-xs text-gray-500 mb-2">Để trống nếu áp dụng cho tất cả sản phẩm</p>
          <div className="border border-gray-300 rounded-md p-2 min-h-[80px] bg-gray-50">
            {/* Đây là nơi sẽ hiển thị các sản phẩm đã chọn và nút thêm sản phẩm */}
            <button 
              type="button" 
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Các danh mục áp dụng */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục áp dụng
          </label>
          <p className="text-xs text-gray-500 mb-2">Để trống nếu áp dụng cho tất cả danh mục</p>
          <div className="border border-gray-300 rounded-md p-2 min-h-[80px] bg-gray-50">
            {/* Đây là nơi sẽ hiển thị các danh mục đã chọn và nút thêm danh mục */}
            <button 
              type="button" 
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              + Thêm danh mục
            </button>
          </div>
        </div>
      </div>

      {/* Các nút hành động */}
      <div className="flex justify-end space-x-3 mt-8 pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          disabled={isSubmitting}
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          disabled={isSubmitting}
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu voucher'}
        </button>
      </div>
    </form>
  );
};

export default VoucherForm; 