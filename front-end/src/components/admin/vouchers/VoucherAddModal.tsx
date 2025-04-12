import { useState, useEffect } from 'react';
import { Voucher } from '@/contexts/VoucherContext';
import { FiX, FiCalendar, FiUsers, FiSearch, FiLoader } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useVoucherSelections } from '@/hooks/useVoucherSelections';

interface VoucherAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (voucherData: Partial<Voucher>) => void;
  isSubmitting: boolean;
  initialData?: Partial<Voucher>;
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
    applicableProducts: [],
    applicableCategories: [],
    applicableBrands: [],
    applicableEvents: [],
    applicableCampaigns: [],
    applicableUserGroups: {
      all: true,
      new: false,
      specific: [],
      levels: []
    },
    showSpecificProducts: false
  });

  // State for product search
  const [productSearch, setProductSearch] = useState('');

  // Get brands, categories, and products data
  const {
    brands,
    categories,
    products,
    brandsLoading,
    categoriesLoading,
    productsLoading,
    fetchBrands,
    fetchCategories,
    fetchProducts
  } = useVoucherSelections();

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Nếu có initialData (trường hợp duplicate), sử dụng nó
        // Check if this voucher has specific product settings
        const hasSpecificProducts = !!(initialData.applicableProducts?.length || initialData.applicableCategories?.length || initialData.applicableBrands?.length);

        setFormData({
          ...initialData,
          code: `${initialData.code || ''}_COPY`,
          _id: undefined, // Đảm bảo không copy ID
          applicableProducts: initialData.applicableProducts || [],
          applicableCategories: initialData.applicableCategories || [],
          applicableBrands: initialData.applicableBrands || [],
          applicableEvents: initialData.applicableEvents || [],
          applicableCampaigns: initialData.applicableCampaigns || [],
          applicableUserGroups: initialData.applicableUserGroups || {
            all: true,
            new: false,
            specific: [],
            levels: []
          },
          showSpecificProducts: hasSpecificProducts
        });
      } else {
        // Khởi tạo form với giá trị mặc định
        setFormData({
          code: '',
          description: '',
          discountType: 'percentage',
          discountValue: 0,
          minimumOrderValue: 0,
          usageLimit: 0,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          isActive: true,
          applicableProducts: [],
          applicableCategories: [],
          applicableBrands: [],
          applicableEvents: [],
          applicableCampaigns: [],
          applicableUserGroups: {
            all: true,
            new: false,
            specific: [],
            levels: []
          },
          showSpecificProducts: false
        });
      }

      // Fetch brands, categories, and products when modal is opened
      fetchBrands();
      fetchCategories();
      fetchProducts(1, 100);
    }
  }, [isOpen, initialData, fetchBrands, fetchCategories, fetchProducts]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="VD: SUMMER2023"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                >
                  <option value="percentage">Giảm theo %</option>
                  <option value="fixed">Giảm số tiền cố định</option>
                </select>
              </div>

              {/* Giá trị giảm giá */}
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị giảm giá <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
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
                  <p className="mt-1 text-sm text-red-600">
                    Giá trị phần trăm không thể vượt quá 100%
                  </p>
                )}
              </div>

              {/* Giá trị đơn hàng tối thiểu */}
              <div>
                <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị đơn hàng tối thiểu
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
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
                <p className="mt-1 text-xs text-gray-500">
                  Để trống hoặc 0 nếu không giới hạn
                </p>
              </div>

              {/* Ngày bắt đầu */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* Ngày kết thúc */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* Giới hạn sử dụng */}
              <div>
                <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  Giới hạn sử dụng
                </label>
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
                <p className="mt-1 text-xs text-gray-500">
                  Để trống hoặc 0 nếu không giới hạn
                </p>
              </div>

              {/* Trạng thái */}
              <div className="flex items-start pt-6">
                <div className="flex items-center h-5">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive || false}
                    onChange={handleChange}
                    className="focus:ring-pink-500 h-4 w-4 text-pink-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isActive" className="font-medium text-gray-700">Kích hoạt voucher</label>
                  <p className="text-gray-500">Voucher sẽ có thể sử dụng ngay sau khi tạo nếu đã đến thời gian</p>
                </div>
              </div>
            </div>

            {/* Mô tả voucher */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholder="Mô tả ngắn về voucher (không bắt buộc)"
              />
            </div>

            {/* Tab điều kiện áp dụng voucher */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Điều kiện áp dụng voucher</h3>

              {/* Phần người dùng */}
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm mb-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <FiUsers className="mr-2 text-pink-500" />
                  Đối tượng người dùng
                </h4>

                {/* Radio buttons for user targeting options - horizontal layout */}
                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex-1 min-w-[200px] p-2 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
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
                    <p className="mt-1 ml-6 text-xs text-gray-500">Tất cả người dùng trong hệ thống</p>
                  </div>

                  <div className="flex-1 min-w-[200px] p-2 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
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
                    <p className="mt-1 ml-6 text-xs text-gray-500">Người dùng mới đăng ký</p>
                  </div>

                  <div className="flex-1 min-w-[200px] p-2 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
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
                    <p className="mt-1 ml-6 text-xs text-gray-500">Chọn cấp độ cụ thể</p>
                  </div>
                </div>

                {/* User level selection - horizontal layout */}
                {(formData.applicableUserGroups?.levels?.length || 0) > 0 && (
                  <div className="mt-2 p-3 border border-pink-100 rounded-md bg-pink-50">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Chọn cấp độ:
                      </label>

                      {/* Level checkboxes in a row */}
                      <div className="flex flex-wrap gap-3">
                        {[
                          { id: 'level-new', value: 'Khách hàng mới', color: 'bg-gray-100' },
                          { id: 'level-silver', value: 'Khách hàng bạc', color: 'bg-gray-200' },
                          { id: 'level-gold', value: 'Khách hàng vàng', color: 'bg-yellow-100' },
                          { id: 'level-loyal', value: 'Khách hàng thân thiết', color: 'bg-pink-100' }
                        ].map(level => (
                          <div key={level.id} className="inline-flex items-center">
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
                                    all: prev.applicableUserGroups?.all || false,
                                    new: prev.applicableUserGroups?.new || false,
                                    specific: prev.applicableUserGroups?.specific || [],
                                    levels: newLevels
                                  }
                                }));
                              }}
                              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            />
                            <label htmlFor={level.id} className="ml-2 flex items-center whitespace-nowrap">
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${level.color}`}></span>
                              <span className="text-xs text-gray-700">{level.value}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected levels as badges */}
                    {(formData.applicableUserGroups?.levels?.length || 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 self-center">Cấp độ đã chọn:</span>
                        {formData.applicableUserGroups?.levels?.map((level, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            {level}
                            <button
                              type="button"
                              onClick={() => {
                                const newLevels = formData.applicableUserGroups?.levels?.filter(l => l !== level) || [];
                                setFormData(prev => ({
                                  ...prev,
                                  applicableUserGroups: {
                                    ...(prev.applicableUserGroups || {}),
                                    levels: newLevels
                                  }
                                }));
                              }}
                              className="ml-1 inline-flex items-center justify-center h-3 w-3 rounded-full text-pink-400 hover:text-pink-600 focus:outline-none"
                            >
                              <span className="sr-only">Remove</span>
                              <FiX className="h-2 w-2" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Phần sản phẩm */}
              <div className="bg-gray-50 p-4 rounded-md border mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Áp dụng cho sản phẩm</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="allProducts"
                      name="productApplyType"
                      checked={!formData.applicableProducts?.length && !formData.applicableCategories?.length && !formData.applicableBrands?.length && !formData.showSpecificProducts}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          applicableProducts: [],
                          applicableCategories: [],
                          applicableBrands: [],
                          showSpecificProducts: false
                        }));
                      }}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    />
                    <label htmlFor="allProducts" className="ml-2 block text-sm text-gray-900">
                      Tất cả sản phẩm
                    </label>
                  </div>

                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="specificProducts"
                      name="productApplyType"
                      checked={!!(formData.applicableProducts?.length || formData.applicableCategories?.length || formData.applicableBrands?.length || formData.showSpecificProducts)}
                      onChange={() => {
                        // Không thay đổi các lựa chọn hiện tại, chỉ bật chế độ lựa chọn
                        if (!formData.applicableProducts?.length && !formData.applicableCategories?.length && !formData.applicableBrands?.length) {
                          setFormData(prev => ({
                            ...prev,
                            // Use a placeholder value to indicate specific products mode
                            showSpecificProducts: true
                          }));
                        }
                      }}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                    />
                    <label htmlFor="specificProducts" className="ml-2 block text-sm text-gray-900">
                      Chỉ áp dụng cho sản phẩm cụ thể
                    </label>
                  </div>

                  {/* Phần chọn sản phẩm cụ thể */}
                  {!!(formData.applicableProducts?.length || formData.applicableCategories?.length || formData.applicableBrands?.length || formData.showSpecificProducts) && (
                    <div className="pl-6 grid grid-cols-1 gap-4">
                      {/* Chọn thương hiệu */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chọn thương hiệu
                        </label>
                        <div className="relative">
                          {brandsLoading && (
                            <div className="absolute right-2 top-2">
                              <FiLoader className="animate-spin text-pink-500" />
                            </div>
                          )}
                          <select
                            multiple
                            name="applicableBrands"
                            className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm h-20"
                            onChange={(e) => {
                              const options = e.target.options;
                              const values: string[] = [];
                              for (let i = 0; i < options.length; i++) {
                                if (options[i].selected) {
                                  values.push(options[i].value);
                                }
                              }
                              setFormData(prev => ({
                                ...prev,
                                applicableBrands: values
                              }));
                            }}
                            value={formData.applicableBrands || []}
                          >
                            {brandsLoading ? (
                              <option value="" disabled>Loading brands...</option>
                            ) : brands && brands.length > 0 ? (
                              brands.map(brand => {
                                const brandId = brand._id || brand.id || '';
                                return (
                                  <option key={brandId} value={brandId}>
                                    {brand.name}
                                  </option>
                                );
                              })
                            ) : (
                              <option value="" disabled>No brands available</option>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Chọn danh mục */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chọn danh mục
                        </label>
                        <div className="relative">
                          {categoriesLoading && (
                            <div className="absolute right-2 top-2">
                              <FiLoader className="animate-spin text-pink-500" />
                            </div>
                          )}
                          <select
                            multiple
                            name="applicableCategories"
                            className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm h-20"
                            onChange={(e) => {
                              const options = e.target.options;
                              const values: string[] = [];
                              for (let i = 0; i < options.length; i++) {
                                if (options[i].selected) {
                                  values.push(options[i].value);
                                }
                              }
                              setFormData(prev => ({
                                ...prev,
                                applicableCategories: values
                              }));
                            }}
                            value={formData.applicableCategories || []}
                          >
                            {categoriesLoading ? (
                              <option value="" disabled>Loading categories...</option>
                            ) : categories && categories.length > 0 ? (
                              categories.map(category => {
                                const categoryId = category._id || category.id || '';
                                return (
                                  <option key={categoryId} value={categoryId}>
                                    {category.name}
                                  </option>
                                );
                              })
                            ) : (
                              <option value="" disabled>No categories available</option>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Chọn sản phẩm */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chọn sản phẩm
                        </label>
                        <div className="mb-2 relative">
                          <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                fetchProducts(1, 100, productSearch);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                            onClick={() => fetchProducts(1, 100, productSearch)}
                          >
                            <FiSearch />
                          </button>
                        </div>
                        <div className="relative">
                          {productsLoading && (
                            <div className="absolute right-2 top-2">
                              <FiLoader className="animate-spin text-pink-500" />
                            </div>
                          )}
                          <select
                            multiple
                            name="applicableProducts"
                            className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm h-32"
                            onChange={(e) => {
                              const options = e.target.options;
                              const values: string[] = [];
                              for (let i = 0; i < options.length; i++) {
                                if (options[i].selected) {
                                  values.push(options[i].value);
                                }
                              }
                              setFormData(prev => ({
                                ...prev,
                                applicableProducts: values
                              }));
                            }}
                            value={formData.applicableProducts || []}
                          >
                            {productsLoading ? (
                              <option value="" disabled>Loading products...</option>
                            ) : products && products.length > 0 ? (
                              products.map(product => {
                                const productId = product._id || product.id || '';
                                return (
                                  <option key={productId} value={productId}>
                                    {product.name} ({product.sku})
                                  </option>
                                );
                              })
                            ) : (
                              <option value="" disabled>No products available</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Phần sự kiện và chiến dịch */}
              <div className="bg-gray-50 p-4 rounded-md border mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Áp dụng cho sự kiện và chiến dịch</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn sự kiện
                    </label>
                    <select
                      multiple
                      name="applicableEvents"
                      className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm h-20"
                      onChange={(e) => {
                        const options = e.target.options;
                        const values: string[] = [];
                        for (let i = 0; i < options.length; i++) {
                          if (options[i].selected) {
                            values.push(options[i].value);
                          }
                        }
                        setFormData(prev => ({
                          ...prev,
                          applicableEvents: values
                        }));
                      }}
                    >
                      {/* Danh sách sự kiện sẽ được render từ context */}
                      <option value="example-event-1">Sự kiện 1</option>
                      <option value="example-event-2">Sự kiện 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn chiến dịch
                    </label>
                    <select
                      multiple
                      name="applicableCampaigns"
                      className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm h-20"
                      onChange={(e) => {
                        const options = e.target.options;
                        const values: string[] = [];
                        for (let i = 0; i < options.length; i++) {
                          if (options[i].selected) {
                            values.push(options[i].value);
                          }
                        }
                        setFormData(prev => ({
                          ...prev,
                          applicableCampaigns: values
                        }));
                      }}
                    >
                      {/* Danh sách chiến dịch sẽ được render từ context */}
                      <option value="example-campaign-1">Chiến dịch 1</option>
                      <option value="example-campaign-2">Chiến dịch 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút xử lý */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? 'Đang xử lý...' : initialData ? 'Sao chép' : 'Thêm voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}