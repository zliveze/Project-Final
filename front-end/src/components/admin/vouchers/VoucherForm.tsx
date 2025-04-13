import { useState, useEffect, useCallback } from 'react';
import { FiX, FiCalendar, FiUsers, FiSearch, FiLoader, FiSave, FiTag, FiPercent, FiDollarSign, FiShoppingBag, FiList, FiCheck, FiEdit, FiInfo, FiSettings, FiPackage } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
// Remove react-select imports if no longer used directly here
// import Select, { MultiValue, ActionMeta } from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import { useVoucherSelections } from '@/hooks/useVoucherSelections';
import { Voucher } from '@/contexts/VoucherContext';
import ItemSelectionModal from './ItemSelectionModal';
import { TabInterface } from './TabInterface';
import { SelectedItemsList } from './SelectedItemsList';

// Define the structure for form data, including potential temporary states
interface VoucherFormData extends Partial<Voucher> {
  showSpecificProducts?: boolean; // To manage UI state for product selection
}

// Define the option type for mapping (can be removed if not used for react-select anymore)
interface SelectOption {
  value: string;
  label: string;
}

interface VoucherFormProps {
  initialData?: Partial<Voucher>; // For edit or copy
  onSubmit: (data: Partial<Voucher>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode: boolean; // Differentiate between Add/Edit
}

const VoucherForm: React.FC<VoucherFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditMode
}) => {
  // Form data state
  const [formData, setFormData] = useState<VoucherFormData>({
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
    showSpecificProducts: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab state for UI
  const [activeTab, setActiveTab] = useState<string>('basic');

  // State for the ItemSelectionModal
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [itemSelectionType, setItemSelectionType] = useState<'product' | 'brand' | 'category' | null>(null);
  // Store a reference to the field update function
  const [itemSelectionCallback, setItemSelectionCallback] = useState<((ids: string[]) => void) | null>(null);

  // Define tabs for the interface
  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: <FiInfo /> },
    { id: 'conditions', label: 'Điều kiện áp dụng', icon: <FiSettings /> },
    { id: 'events', label: 'Sự kiện & Chiến dịch', icon: <FiPackage /> },
  ];

  const {
    brands, categories, products,
    brandsLoading, categoriesLoading, productsLoading,
    fetchBrands, fetchCategories, fetchProducts
  } = useVoucherSelections();

  // Data mapping functions
  const mapToOptions = (items: Array<{ _id?: string; id?: string; name: string; sku?: string }> | undefined): SelectOption[] => {
    if (!items) return [];
    return items.map(item => ({
      value: item._id || item.id || '',
      label: item.sku ? `${item.name} (${item.sku})` : item.name
    })).filter(option => option.value);
  };

  const brandOptions = mapToOptions(brands);
  const categoryOptions = mapToOptions(categories);
  const productOptions = mapToOptions(products);

  // Initialize form data
  useEffect(() => {
    let defaultData: VoucherFormData = {
      code: '', description: '', discountType: 'percentage', discountValue: 0, minimumOrderValue: 0, usageLimit: 100,
      startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true, applicableProducts: [], applicableCategories: [], applicableBrands: [],
      applicableEvents: [], applicableCampaigns: [],
      applicableUserGroups: { all: true, new: false, specific: [], levels: [] },
      showSpecificProducts: false
    };

    if (initialData) {
      const hasSpecificProducts = !!(initialData.applicableProducts?.length || initialData.applicableCategories?.length || initialData.applicableBrands?.length);
      const isCopyMode = !isEditMode && initialData._id;
      
      defaultData = {
        ...defaultData,
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate) : defaultData.startDate,
        endDate: initialData.endDate ? new Date(initialData.endDate) : defaultData.endDate,
        showSpecificProducts: hasSpecificProducts,
        applicableUserGroups: initialData.applicableUserGroups || { all: true, new: false, specific: [], levels: [] },
        usedCount: isCopyMode ? 0 : initialData.usedCount,
        applicableProducts: initialData.applicableProducts || [], 
        applicableCategories: initialData.applicableCategories || [],
        applicableBrands: initialData.applicableBrands || [], 
        applicableEvents: initialData.applicableEvents || [],
        applicableCampaigns: initialData.applicableCampaigns || [],
      };
    }
    
    setFormData(defaultData);
    
    // Tải dữ liệu thương hiệu, danh mục và sản phẩm khi form được mở
    fetchBrands();
    fetchCategories();
    fetchProducts();
  }, [initialData, isEditMode, fetchBrands, fetchCategories, fetchProducts]);

  // --- Form Validation ---
  const validateForm = useCallback((): boolean => {
    // ... (validation logic remains the same) ...
    const newErrors: Record<string, string> = {};
    if (!formData.code || formData.code.trim() === '') newErrors.code = 'Mã voucher không được để trống';
    if (formData.discountValue === undefined || formData.discountValue <= 0) newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    if (formData.discountType === 'percentage' && formData.discountValue && formData.discountValue > 100) newErrors.discountValue = 'Giá trị phần trăm không thể vượt quá 100%';
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu không được để trống';
    if (!formData.endDate) newErrors.endDate = 'Ngày kết thúc không được để trống';
    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) newErrors.endDate = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
    setFormData(prev => {
      const newState = { ...prev, [field]: date };
      if (field === 'startDate' && newState.endDate && date && newState.endDate < date) newState.endDate = date;
      if (field === 'endDate' && newState.startDate && date && date < newState.startDate) newState.startDate = date;
      return newState;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Open the Item Selection Modal
  const openItemSelectionModal = (
    type: 'product' | 'brand' | 'category',
    currentIds: string[] | undefined,
    onConfirm: (ids: string[]) => void
  ) => {
    setItemSelectionType(type);
    // Store the callback function to update the correct field
    setItemSelectionCallback(() => onConfirm); // Wrap in function to avoid immediate call
    setIsItemSelectionModalOpen(true);
  };

  // Callback from ItemSelectionModal
  const handleConfirmItemSelection = (selectedIds: string[]) => {
    if (itemSelectionCallback) {
      itemSelectionCallback(selectedIds); // Execute the stored callback
    }
    setIsItemSelectionModalOpen(false);
    setItemSelectionType(null);
    setItemSelectionCallback(null);
  };

  // Specific handlers to open modal for each type
  const handleSelectBrands = () => {
    openItemSelectionModal('brand', formData.applicableBrands, (ids) => {
      setFormData(prev => ({ ...prev, applicableBrands: ids }));
    });
  };
  const handleSelectCategories = () => {
    openItemSelectionModal('category', formData.applicableCategories, (ids) => {
      setFormData(prev => ({ ...prev, applicableCategories: ids }));
    });
  };
  const handleSelectProducts = () => {
    openItemSelectionModal('product', formData.applicableProducts, (ids) => {
      setFormData(prev => ({ ...prev, applicableProducts: ids }));
    });
  };


  const handleUserGroupChange = (type: 'all' | 'new' | 'levels' | 'specific') => {
    setFormData(prev => {
      const newUserGroups = { ...(prev.applicableUserGroups || { all: false, new: false, specific: [], levels: [] }) };
      newUserGroups.all = type === 'all';
      newUserGroups.new = type === 'new';
      if (type !== 'levels') newUserGroups.levels = [];
      if (type !== 'specific') newUserGroups.specific = [];
      return { ...prev, applicableUserGroups: newUserGroups };
    });
  };

  const handleUserLevelToggle = (levelValue: string, checked: boolean) => {
    setFormData(prev => {
      const currentLevels = prev.applicableUserGroups?.levels || [];
      let newLevels = checked ? [...currentLevels, levelValue] : currentLevels.filter(l => l !== levelValue);
      return {
        ...prev,
        applicableUserGroups: {
          all: prev.applicableUserGroups?.all || false,
          new: prev.applicableUserGroups?.new || false,
          specific: prev.applicableUserGroups?.specific || [],
          levels: newLevels
        }
      };
    });
  };

  const handleProductApplyTypeChange = (applyToAll: boolean) => {
    setFormData(prev => ({
      ...prev,
      showSpecificProducts: !applyToAll,
      applicableProducts: applyToAll ? [] : prev.applicableProducts,
      applicableCategories: applyToAll ? [] : prev.applicableCategories,
      applicableBrands: applyToAll ? [] : prev.applicableBrands,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const { showSpecificProducts, ...submitData } = formData;
      onSubmit(submitData);
    } else {
      console.log("Validation Errors:", errors);
    }
  };

  // Render Helper
  const renderError = (field: string) => errors[field] ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p> : null;

  const userLevelsOptions = [
    { id: 'level-new', value: 'Khách hàng mới', color: 'bg-gray-100' },
    { id: 'level-silver', value: 'Khách hàng bạc', color: 'bg-gray-200' },
    { id: 'level-gold', value: 'Khách hàng vàng', color: 'bg-yellow-100' },
    { id: 'level-loyal', value: 'Khách hàng thân thiết', color: 'bg-pink-100' }
  ];

  // Get selected items data (for display in UI)
  const getSelectedBrands = useCallback(() => {
    if (!formData.applicableBrands?.length) return [];
    return formData.applicableBrands.map(id => {
      // Tìm thương hiệu trong danh sách brands từ API
      const brand = brands?.find(b => (b._id || b.id) === id);
      // Nếu tìm thấy, sử dụng tên thực tế, nếu không thì tìm trong options
      if (brand) {
        return { id, name: brand.name };
      }
      // Fallback vào options nếu không tìm thấy trong brands
      const option = brandOptions.find(o => o.value === id);
      return { 
        id, 
        name: option?.label || `Thương hiệu #${id.slice(0, 6)}` 
      };
    });
  }, [formData.applicableBrands, brandOptions, brands]);

  const getSelectedCategories = useCallback(() => {
    if (!formData.applicableCategories?.length) return [];
    return formData.applicableCategories.map(id => {
      // Tìm danh mục trong danh sách categories từ API
      const category = categories?.find(c => (c._id || c.id) === id);
      // Nếu tìm thấy, sử dụng tên thực tế, nếu không thì tìm trong options
      if (category) {
        return { id, name: category.name };
      }
      // Fallback vào options nếu không tìm thấy trong categories
      const option = categoryOptions.find(o => o.value === id);
      return { 
        id, 
        name: option?.label || `Danh mục #${id.slice(0, 6)}` 
      };
    });
  }, [formData.applicableCategories, categoryOptions, categories]);

  const getSelectedProducts = useCallback(() => {
    if (!formData.applicableProducts?.length) return [];
    return formData.applicableProducts.map(id => {
      // Tìm sản phẩm trong danh sách products từ API
      const product = products?.find(p => (p._id || p.id) === id);
      // Nếu tìm thấy, sử dụng tên thực tế, nếu không thì tìm trong options
      if (product) {
        return { id, name: product.sku ? `${product.name} (${product.sku})` : product.name };
      }
      // Fallback vào options nếu không tìm thấy trong products
      const option = productOptions.find(o => o.value === id);
      return { 
        id, 
        name: option?.label || `Sản phẩm #${id.slice(0, 6)}` 
      };
    });
  }, [formData.applicableProducts, productOptions, products]);

  // Render các tab nội dung
  const renderBasicInfoTab = () => (
    <div className="space-y-4 p-4 border rounded-md shadow-sm">
      <h4 className="text-base font-semibold text-gray-800 border-b pb-2 mb-4">Thông tin cơ bản</h4>
      {/* Mã voucher */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">Mã voucher <span className="text-red-500">*</span>{isEditMode && <span className="text-xs text-gray-500 ml-2">(Không thể thay đổi)</span>}</label>
        <input type="text" id="code" name="code" value={formData.code || ''} onChange={handleChange} required readOnly={isEditMode} className={`mt-1 block w-full px-3 py-2 border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="VD: SUMMER2024"/>
        {renderError('code')}
      </div>
      {/* Loại & Giá trị */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">Loại <span className="text-red-500">*</span></label>
          <select id="discountType" name="discountType" value={formData.discountType || 'percentage'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
            <option value="percentage">%</option>
            <option value="fixed">Số tiền</option>
          </select>
        </div>
        <div>
          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">Giá trị <span className="text-red-500">*</span></label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input type="number" id="discountValue" name="discountValue" value={formData.discountValue || ''} onChange={handleChange} required min={0} step={formData.discountType === 'percentage' ? 1 : 1000} className={`block w-full px-3 py-2 border ${errors.discountValue ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm pr-10`} placeholder={formData.discountType === 'percentage' ? 'VD: 10' : '100000'}/>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><span className="text-gray-500 sm:text-sm">{formData.discountType === 'percentage' ? '%' : 'đ'}</span></div>
          </div>
          {renderError('discountValue')}
        </div>
      </div>
      {/* Đơn tối thiểu */}
      <div>
        <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-gray-700">Đơn hàng tối thiểu</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input type="number" id="minimumOrderValue" name="minimumOrderValue" value={formData.minimumOrderValue || ''} onChange={handleChange} min={0} step={1000} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm pr-10" placeholder="VD: 500000"/>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><span className="text-gray-500 sm:text-sm">đ</span></div>
        </div>
        <p className="mt-1 text-xs text-gray-500">Để trống hoặc 0 nếu không yêu cầu.</p>
      </div>
      {/* Ngày bắt đầu & kết thúc */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Bắt đầu <span className="text-red-500">*</span></label>
          <div className="mt-1 relative">
            <DatePicker selected={formData.startDate} onChange={(date) => handleDateChange(date, 'startDate')} selectsStart startDate={formData.startDate} endDate={formData.endDate} dateFormat="dd/MM/yy HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={15} className={`block w-full px-3 py-2 pl-10 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`} placeholderText="Chọn ngày"/>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiCalendar className="h-5 w-5 text-gray-400" /></div>
          </div>
          {renderError('startDate')}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Kết thúc <span className="text-red-500">*</span></label>
          <div className="mt-1 relative">
            <DatePicker selected={formData.endDate} onChange={(date) => handleDateChange(date, 'endDate')} selectsEnd startDate={formData.startDate} endDate={formData.endDate} minDate={formData.startDate} dateFormat="dd/MM/yy HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={15} className={`block w-full px-3 py-2 pl-10 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`} placeholderText="Chọn ngày"/>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiCalendar className="h-5 w-5 text-gray-400" /></div>
          </div>
          {renderError('endDate')}
        </div>
      </div>
      {/* Giới hạn & Đã SD */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700">Giới hạn SD</label>
          <input type="number" id="usageLimit" name="usageLimit" value={formData.usageLimit || ''} onChange={handleChange} min={0} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm" placeholder="0 = ∞"/>
        </div>
        {isEditMode && (
          <div>
            <label htmlFor="usedCount" className="block text-sm font-medium text-gray-700">Đã sử dụng</label>
            <input type="number" id="usedCount" name="usedCount" value={formData.usedCount || 0} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed focus:outline-none sm:text-sm"/>
          </div>
        )}
      </div>
      {/* Mô tả */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm" placeholder="Mô tả ngắn về voucher..."/>
      </div>
      {/* Trạng thái */}
      <div className="flex items-start">
        <div className="flex items-center h-5"><input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"/></div>
        <div className="ml-3 text-sm"><label htmlFor="isActive" className="font-medium text-gray-700">Kích hoạt voucher</label></div>
      </div>
    </div>
  );

  const renderConditionsTab = () => (
    <div className="space-y-6">
      {/* User Targeting */}
      <div className="p-4 border rounded-md shadow-sm">
        <h5 className="font-medium text-gray-700 mb-3 flex items-center text-sm"><FiUsers className="mr-2 text-pink-500" /> Đối tượng người dùng</h5>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer"><input type="radio" name="userTargeting" checked={formData.applicableUserGroups?.all || false} onChange={() => handleUserGroupChange('all')} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"/><span className="ml-2 text-sm text-gray-800">Tất cả người dùng</span></label>
          <label className="flex items-center cursor-pointer"><input type="radio" name="userTargeting" checked={formData.applicableUserGroups?.new || false} onChange={() => handleUserGroupChange('new')} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"/><span className="ml-2 text-sm text-gray-800">Chỉ người dùng mới</span></label>
          <label className="flex items-center cursor-pointer"><input type="radio" name="userTargeting" checked={formData.applicableUserGroups?.levels?.length ? true : false} onChange={() => handleUserGroupChange('levels')} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"/><span className="ml-2 text-sm text-gray-800">Theo cấp độ</span></label>
        </div>
        {formData.applicableUserGroups?.levels !== undefined && !formData.applicableUserGroups.all && !formData.applicableUserGroups.new && (
          <div className="mt-3 pt-3 border-t border-pink-100">
            <label className="text-xs font-medium text-gray-600 mb-2 block">Chọn cấp độ:</label>
            <div className="flex flex-wrap gap-2">
              {userLevelsOptions.map(level => (
                <label key={level.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border ${formData.applicableUserGroups?.levels?.includes(level.value) ? `${level.color} border-pink-400 ring-1 ring-pink-400` : 'bg-white border-gray-300 hover:bg-gray-100'}`}>
                  <input type="checkbox" id={level.id} checked={formData.applicableUserGroups?.levels?.includes(level.value) || false} onChange={(e) => handleUserLevelToggle(level.value, e.target.checked)} className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mr-1 opacity-0 absolute"/>
                  {level.value}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Targeting */}
      <div className="p-4 border rounded-md shadow-sm">
        <h5 className="font-medium text-gray-700 mb-3 flex items-center text-sm"><FiShoppingBag className="mr-2 text-pink-500" /> Sản phẩm áp dụng</h5>
        <div className="space-y-2 mb-3">
          <label className="flex items-center cursor-pointer"><input type="radio" name="productApplyType" checked={!formData.showSpecificProducts} onChange={() => handleProductApplyTypeChange(true)} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"/><span className="ml-2 text-sm text-gray-800">Tất cả sản phẩm</span></label>
          <label className="flex items-center cursor-pointer"><input type="radio" name="productApplyType" checked={!!formData.showSpecificProducts} onChange={() => handleProductApplyTypeChange(false)} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"/><span className="ml-2 text-sm text-gray-800">Sản phẩm/Danh mục/Thương hiệu cụ thể</span></label>
        </div>

        {formData.showSpecificProducts && (
          <div className="space-y-4 border-t pt-3">
            {/* Brands Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Thương hiệu</label>
              <button
                type="button"
                onClick={handleSelectBrands}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500"
              >
                <FiEdit className="h-3 w-3 mr-1.5" />
                {formData.applicableBrands?.length 
                  ? `Đã chọn (${formData.applicableBrands.length})`
                  : 'Chọn thương hiệu...'}
              </button>
              <SelectedItemsList 
                items={getSelectedBrands()}
                onRemove={(id) => {
                  setFormData(prev => ({
                    ...prev,
                    applicableBrands: prev.applicableBrands?.filter(brandId => brandId !== id) || []
                  }));
                }} 
                emptyText="Chưa chọn thương hiệu nào"
                maxDisplayItems={5}
              />
            </div>

            {/* Categories Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Danh mục</label>
              <button
                type="button"
                onClick={handleSelectCategories}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500"
              >
                <FiEdit className="h-3 w-3 mr-1.5" />
                {formData.applicableCategories?.length 
                  ? `Đã chọn (${formData.applicableCategories.length})`
                  : 'Chọn danh mục...'}
              </button>
              <SelectedItemsList 
                items={getSelectedCategories()}
                onRemove={(id) => {
                  setFormData(prev => ({
                    ...prev,
                    applicableCategories: prev.applicableCategories?.filter(catId => catId !== id) || []
                  }));
                }} 
                emptyText="Chưa chọn danh mục nào"
                maxDisplayItems={5}
              />
            </div>

            {/* Products Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sản phẩm</label>
              <button
                type="button"
                onClick={handleSelectProducts}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500"
              >
                <FiEdit className="h-3 w-3 mr-1.5" />
                {formData.applicableProducts?.length 
                  ? `Đã chọn (${formData.applicableProducts.length})`
                  : 'Chọn sản phẩm...'}
              </button>
              <SelectedItemsList 
                items={getSelectedProducts()}
                onRemove={(id) => {
                  setFormData(prev => ({
                    ...prev,
                    applicableProducts: prev.applicableProducts?.filter(prodId => prodId !== id) || []
                  }));
                }} 
                emptyText="Chưa chọn sản phẩm nào"
                maxDisplayItems={5}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-4 p-4 border rounded-md shadow-sm">
      <h4 className="text-base font-semibold text-gray-800 border-b pb-2 mb-4">Sự kiện & Chiến dịch</h4>
      {/* Event Select */}
      <div className="p-3 border rounded-md bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FiTag className="mr-2 text-pink-500" /> Sự kiện áp dụng</label>
        {/* Replace Select with button and display area */}
        <button type="button" className="mt-1 inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500" disabled>
          <FiEdit className="h-3 w-3 mr-1.5" /> Chọn sự kiện...
        </button>
        <p className="mt-1 text-xs text-gray-500">Tính năng đang phát triển.</p>
      </div>
      {/* Campaign Select */}
      <div className="p-3 border rounded-md bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FiTag className="mr-2 text-pink-500" /> Chiến dịch áp dụng</label>
          {/* Replace Select with button and display area */}
        <button type="button" className="mt-1 inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500" disabled>
          <FiEdit className="h-3 w-3 mr-1.5" /> Chọn chiến dịch...
        </button>
        <p className="mt-1 text-xs text-gray-500">Tính năng đang phát triển.</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Interface */}
      <TabInterface 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === 'basic' && renderBasicInfoTab()}
        {activeTab === 'conditions' && renderConditionsTab()}
        {activeTab === 'events' && renderEventsTab()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-5 border-t mt-6">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiX className="inline-block w-4 h-4 mr-1" /> Hủy
        </button>
        <button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}
          className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isSubmitting || Object.keys(errors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? <><FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />Đang xử lý...</> : <><FiSave className="inline-block w-4 h-4 mr-1" />{isEditMode ? 'Lưu thay đổi' : (initialData?._id ? 'Sao chép Voucher' : 'Thêm Voucher')}</>}
        </button>
      </div>

      {/* Item Selection Modal */}
      {itemSelectionType && (
        <ItemSelectionModal
          isOpen={isItemSelectionModalOpen}
          onClose={() => setIsItemSelectionModalOpen(false)}
          itemType={itemSelectionType}
          currentlySelectedIds={
            itemSelectionType === 'brand' ? formData.applicableBrands || [] :
            itemSelectionType === 'category' ? formData.applicableCategories || [] :
            formData.applicableProducts || []
          }
          onConfirmSelection={handleConfirmItemSelection}
          // Pass necessary context/fetch functions here if ItemSelectionModal needs them
        />
      )}
    </form>
  );
};

export default VoucherForm;
