import { useState, useEffect } from 'react';
import { Voucher } from '@/contexts/VoucherContext';
import { FiX, FiCalendar, FiUsers } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface VoucherAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (voucherData: Partial<Voucher>) => void;
  isSubmitting: boolean;
  initialData?: Partial<Voucher> | null;
}

export default function VoucherAddModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData
}: VoucherAddModalProps) {
  const [formData, setFormData] = useState<Partial<Voucher>>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumOrderValue: 0,
    usageLimit: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
    applicableUserGroups: {
      all: true,
      new: false,
      levels: [],
      specific: []
    },
    applicableProducts: [],
    applicableCategories: [],
    applicableBrands: [],
    applicableEvents: [],
    applicableCampaigns: []
  });

  // Cập nhật form khi initialData thay đổi (trường hợp sao chép voucher)
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        code: `${initialData.code}_COPY`,
        startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
        _id: undefined // Xóa ID để tạo mới
      });
    }
  }, [initialData]);

  // Cập nhật form khi người dùng nhập liệu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Cập nhật ngày bắt đầu
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        startDate: date,
        // Nếu ngày kết thúc nhỏ hơn ngày bắt đầu, cập nhật ngày kết thúc
        endDate: prev.endDate && prev.endDate < date ? date : prev.endDate
      }));
    }
  };

  // Cập nhật ngày kết thúc
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        endDate: date
      }));
    }
  };

  // Xử lý khi form được submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Validate form
  const isFormValid = () => {
    return (
      formData.code &&
      formData.code.trim() !== '' &&
      formData.discountValue !== undefined &&
      formData.discountValue > 0 &&
      formData.startDate &&
      formData.endDate &&
      formData.endDate >= formData.startDate
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {initialData ? 'Sao chép voucher' : 'Thêm voucher mới'}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Basic Information Section - Horizontal Layout */}
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Thông tin cơ bản</h4>
              
              <div className="flex flex-wrap -mx-2">
                {/* Left Column */}
                <div className="w-full md:w-1/2 px-2">
                  {/* Mã voucher */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        Mã voucher <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-gray-500">Không thể thay đổi sau</span>
                    </div>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      placeholder="VD: SUMMER2023"
                    />
                  </div>
                  
                  {/* Giá trị giảm giá */}
                  <div className="mb-3">
                    <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                      Giá trị giảm giá <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="discountValue"
                        name="discountValue"
                        value={formData.discountValue === undefined ? '' : formData.discountValue}
                        onChange={handleChange}
                        required
                        min={0}
                        step={formData.discountType === 'percentage' ? 1 : 1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        placeholder={formData.discountType === 'percentage' ? "VD: 10" : "VD: 50000"}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">
                          {formData.discountType === 'percentage' ? '%' : 'đ'}
                        </span>
                      </div>
                    </div>
                    {formData.discountType === 'percentage' && formData.discountValue && formData.discountValue > 100 && (
                      <p className="mt-1 text-xs text-red-600">
                        Giá trị phần trăm không thể vượt quá 100%
                      </p>
                    )}
                  </div>
                  
                  {/* Ngày bắt đầu */}
                  <div className="mb-3">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        placeholderText="Chọn ngày bắt đầu"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="w-full md:w-1/2 px-2">
                  {/* Loại giảm giá */}
                  <div className="mb-3">
                    <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                      Loại giảm giá <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="discountType"
                      name="discountType"
                      value={formData.discountType || 'percentage'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    >
                      <option value="percentage">Giảm theo %</option>
                      <option value="fixed">Giảm số tiền cố định</option>
                    </select>
                  </div>
                  
                  {/* Giá trị đơn hàng tối thiểu */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-gray-700">
                        Giá trị đơn hàng tối thiểu
                      </label>
                      <span className="text-xs text-gray-500">0 = không giới hạn</span>
                    </div>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="minimumOrderValue"
                        name="minimumOrderValue"
                        value={formData.minimumOrderValue === undefined ? '' : formData.minimumOrderValue}
                        onChange={handleChange}
                        min={0}
                        step={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        placeholder="VD: 100000"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">đ</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ngày kết thúc */}
                  <div className="mb-3">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        minDate={formData.startDate}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        placeholderText="Chọn ngày kết thúc"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Row - Usage Limit and Active Status */}
              <div className="mt-2">
                <div className="flex flex-wrap -mx-2">
                  {/* Giới hạn sử dụng */}
                  <div className="w-full md:w-1/4 px-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700">
                        Giới hạn sử dụng
                      </label>
                      <span className="text-xs text-gray-500">0 = không giới hạn</span>
                    </div>
                    <input
                      type="number"
                      id="usageLimit"
                      name="usageLimit"
                      value={formData.usageLimit === undefined ? '' : formData.usageLimit}
                      onChange={handleChange}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      placeholder="VD: 100"
                    />
                  </div>
                  
                  {/* Mô tả */}
                  <div className="w-full md:w-1/2 px-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      placeholder="Mô tả ngắn về voucher"
                    />
                  </div>
                  
                  {/* Kích hoạt voucher */}
                  <div className="w-full md:w-1/4 px-2 flex items-center">
                    <div className="mt-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive || false}
                          onChange={handleChange}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                          Kích hoạt voucher
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab điều kiện áp dụng voucher */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Điều kiện áp dụng voucher</h3>

              {/* Phần người dùng */}
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm mb-4">
                <div className="flex flex-wrap items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800 flex items-center">
                    <FiUsers className="mr-2 text-pink-500" /> 
                    Đối tượng người dùng
                  </h4>
                  
                  {/* Quick selection buttons */}
                  <div className="flex space-x-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          applicableUserGroups: {
                            ...(prev.applicableUserGroups || {}),
                            all: true,
                            new: false,
                            levels: [],
                            specific: []
                          }
                        }));
                      }}
                      className={`px-2 py-1 text-xs rounded-md ${formData.applicableUserGroups?.all ? 'bg-pink-100 text-pink-800 font-medium' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Tất cả
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          applicableUserGroups: {
                            ...(prev.applicableUserGroups || {}),
                            all: false,
                            new: true,
                            levels: [],
                            specific: []
                          }
                        }));
                      }}
                      className={`px-2 py-1 text-xs rounded-md ${formData.applicableUserGroups?.new ? 'bg-pink-100 text-pink-800 font-medium' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Người dùng mới
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          applicableUserGroups: {
                            ...(prev.applicableUserGroups || {}),
                            all: false,
                            new: false,
                            levels: ['Khách hàng mới'],
                            specific: []
                          }
                        }));
                      }}
                      className={`px-2 py-1 text-xs rounded-md ${formData.applicableUserGroups?.levels?.length ? 'bg-pink-100 text-pink-800 font-medium' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Theo cấp độ
                    </button>
                  </div>
                </div>
                
                {/* User targeting options - horizontal layout */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex-1 min-w-[150px] p-2 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="allUsers"
                        name="userTargeting"
                        checked={formData.applicableUserGroups?.all || false}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            applicableUserGroups: {
                              ...(prev.applicableUserGroups || {}),
                              all: true,
                              new: false,
                              levels: [],
                              specific: []
                            }
                          }));
                        }}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <label htmlFor="allUsers" className="ml-2 block text-sm font-medium text-gray-700">
                        Tất cả người dùng
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-[150px] p-2 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="newUsers"
                        name="userTargeting"
                        checked={formData.applicableUserGroups?.new || false}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            applicableUserGroups: {
                              ...(prev.applicableUserGroups || {}),
                              all: false,
                              new: true,
                              levels: [],
                              specific: []
                            }
                          }));
                        }}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <label htmlFor="newUsers" className="ml-2 block text-sm font-medium text-gray-700">
                        Chỉ người dùng mới
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-[150px] p-2 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="userLevels"
                        name="userTargeting"
                        checked={formData.applicableUserGroups?.levels?.length ? true : false}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            applicableUserGroups: {
                              ...(prev.applicableUserGroups || {}),
                              all: false,
                              new: false,
                              levels: ['Khách hàng mới'],
                              specific: []
                            }
                          }));
                        }}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <label htmlFor="userLevels" className="ml-2 block text-sm font-medium text-gray-700">
                        Theo cấp độ khách hàng
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* User level selection - horizontal layout */}
                {formData.applicableUserGroups?.levels?.length > 0 && (
                  <div className="p-3 border border-pink-100 rounded-md bg-pink-50">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Chọn cấp độ:
                      </label>
                      
                      {/* Level checkboxes in a row */}
                      <div className="flex flex-wrap gap-2 flex-1">
                        {[
                          { id: 'level-new', value: 'Khách hàng mới', color: 'bg-gray-100' },
                          { id: 'level-silver', value: 'Khách hàng bạc', color: 'bg-gray-200' },
                          { id: 'level-gold', value: 'Khách hàng vàng', color: 'bg-yellow-100' },
                          { id: 'level-loyal', value: 'Khách hàng thân thiết', color: 'bg-pink-100' }
                        ].map(level => (
                          <label key={level.id} className={`inline-flex items-center px-2 py-1 rounded-md cursor-pointer ${formData.applicableUserGroups?.levels?.includes(level.value) ? level.color + ' border-2 border-pink-200' : 'bg-white border border-gray-200'}`}>
                            <input
                              type="checkbox"
                              id={level.id}
                              checked={formData.applicableUserGroups?.levels?.includes(level.value) || false}
                              onChange={(e) => {
                                const currentLevels = formData.applicableUserGroups?.levels || [];
                                let newLevels;
                                
                                if (e.target.checked) {
                                  newLevels = [...currentLevels, level.value];
                                } else {
                                  newLevels = currentLevels.filter(l => l !== level.value);
                                }
                                
                                setFormData(prev => ({
                                  ...prev,
                                  applicableUserGroups: {
                                    ...(prev.applicableUserGroups || {}),
                                    levels: newLevels
                                  }
                                }));
                              }}
                              className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mr-1"
                            />
                            <span className="text-xs text-gray-700">{level.value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Phần sản phẩm */}
              <div className="bg-gray-50 p-4 rounded-md border mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Áp dụng cho sản phẩm</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[150px] p-2 border rounded-md bg-white">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="allProducts"
                        name="productTargeting"
                        checked={!formData.applicableProducts?.length}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            applicableProducts: []
                          }));
                        }}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <label htmlFor="allProducts" className="ml-2 block text-sm font-medium text-gray-700">
                        Tất cả sản phẩm
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-[150px] p-2 border rounded-md bg-white">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="specificProducts"
                        name="productTargeting"
                        checked={formData.applicableProducts?.length ? true : false}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            applicableProducts: ['placeholder']
                          }));
                        }}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                      />
                      <label htmlFor="specificProducts" className="ml-2 block text-sm font-medium text-gray-700">
                        Chỉ sản phẩm cụ thể
                      </label>
                    </div>
                  </div>
                </div>
                
                {formData.applicableProducts?.length > 0 && (
                  <div className="mt-2 p-2 border border-gray-200 rounded-md bg-white">
                    <p className="text-sm text-gray-500 mb-2">Tính năng chọn sản phẩm cụ thể sẽ được cập nhật sau</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isFormValid() ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500`}
              >
                {isSubmitting ? 'Đang lưu...' : initialData ? 'Sao chép' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
