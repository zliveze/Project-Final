import { useState, useEffect, useCallback } from 'react';
import { FiX, FiCalendar, FiUsers, FiSearch, FiLoader, FiSave, FiTag, FiPercent, FiDollarSign, FiShoppingBag, FiList, FiCheck, FiEdit } from 'react-icons/fi'; // Added FiEdit
import DatePicker from 'react-datepicker';
// Remove react-select imports if no longer used directly here
// import Select, { MultiValue, ActionMeta } from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import { useVoucherSelections } from '@/hooks/useVoucherSelections';
import { Voucher } from '@/contexts/VoucherContext';
import { formatDate } from '@/utils/formatters';
import ItemSelectionModal from '../common/ItemSelectionModal'; // Import the new modal

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

  // State for the ItemSelectionModal
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [itemSelectionType, setItemSelectionType] = useState<'product' | 'brand' | 'category' | null>(null);
  // Store a reference to the field update function
  const [itemSelectionCallback, setItemSelectionCallback] = useState<((ids: string[]) => void) | null>(null);


  const {
    brands, categories, products,
    brandsLoading, categoriesLoading, productsLoading,
    fetchBrands, fetchCategories, fetchProducts
  } = useVoucherSelections();

  // --- Data Mapping for displaying selected item names (optional improvement) ---
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

  // Function to get names from IDs (simple implementation, might need optimization)
  const getSelectedItemNames = (ids: string[] | undefined, options: SelectOption[]): string[] => {
    if (!ids) return [];
    return options.filter(option => ids.includes(option.value)).map(opt => opt.label);
  };


  // Initialize form data
  useEffect(() => {
    let defaultData: VoucherFormData = {
      code: '', description: '', discountType: 'percentage', discountValue: 0, minimumOrderValue: 0, usageLimit: 100,
      startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), isActive: true,
      applicableProducts: [], applicableCategories: [], applicableBrands: [], applicableEvents: [], applicableCampaigns: [],
      applicableUserGroups: { all: true, new: false, specific: [], levels: [] }, showSpecificProducts: false,
    };

    if (initialData) {
      const hasSpecificProducts = !!(initialData.applicableProducts?.length || initialData.applicableCategories?.length || initialData.applicableBrands?.length);
      const isCopyMode = !isEditMode && initialData._id;
      defaultData = {
        ...defaultData, ...initialData,
        code: isCopyMode ? `${initialData.code || ''}_COPY` : initialData.code,
        _id: isEditMode ? initialData._id : undefined,
        startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
        applicableUserGroups: initialData.applicableUserGroups || { all: true, new: false, specific: [], levels: [] },
        showSpecificProducts: hasSpecificProducts,
        usedCount: isCopyMode ? 0 : initialData.usedCount,
        applicableProducts: initialData.applicableProducts || [], applicableCategories: initialData.applicableCategories || [],
        applicableBrands: initialData.applicableBrands || [], applicableEvents: initialData.applicableEvents || [],
        applicableCampaigns: initialData.applicableCampaigns || [],
      };
    }
    setFormData(defaultData);
    // Fetch initial data needed for displaying names or other purposes
    // fetchBrands(); fetchCategories(); fetchProducts(1, 100); // Maybe fetch only if needed to display names
  }, [initialData, isEditMode]); // Removed fetch calls from here, handle inside modal or when needed

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

  // --- Render Helper ---
  const renderError = (field: string) => errors[field] ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p> : null;

  const userLevelsOptions = [
    { id: 'level-new', value: 'Khách hàng mới', color: 'bg-gray-100' },
    { id: 'level-silver', value: 'Khách hàng bạc', color: 'bg-gray-200' },
    { id: 'level-gold', value: 'Khách hàng vàng', color: 'bg-yellow-100' },
    { id: 'level-loyal', value: 'Khách hàng thân thiết', color: 'bg-pink-100' }
  ];

  // Helper to render selected items as pills/tags
  const renderSelectedItems = (
    ids: string[] | undefined,
    options: SelectOption[], // Use options to get names
    onEditClick: () => void,
    placeholder: string
  ) => {
    const selectedNames = getSelectedItemNames(ids, options);
    const hasSelection = selectedNames.length > 0;

    return (
      <div className="flex items-center flex-wrap gap-2 mt-1">
        <button
          type="button"
          onClick={onEditClick}
          className={`inline-flex items-center px-3 py-1.5 border ${hasSelection ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-gray-300 bg-white text-gray-700'} rounded-md shadow-sm text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500`}
        >
          <FiEdit className="h-3 w-3 mr-1.5" />
          {hasSelection ? `Đã chọn (${selectedNames.length})` : placeholder}
        </button>
        {/* Optionally display some names as pills, limited count */}
        {/* {selectedNames.slice(0, 3).map(name => (
          <span key={name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {name}
          </span>
        ))}
        {selectedNames.length > 3 && (
          <span className="text-xs text-gray-500">+{selectedNames.length - 3} nữa</span>
        )} */}
      </div>
    );
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main 3-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Column 1: Basic Information */}
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

          {/* Column 2: Application Conditions */}
          <div className="space-y-4 p-4 border rounded-md shadow-sm">
            <h4 className="text-base font-semibold text-gray-800 border-b pb-2 mb-4">Điều kiện áp dụng</h4>

            {/* User Targeting */}
            <div className="p-3 border rounded-md bg-gray-50">
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
            <div className="p-3 border rounded-md bg-gray-50">
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
                    {renderSelectedItems(formData.applicableBrands, brandOptions, handleSelectBrands, 'Chọn thương hiệu...')}
                  </div>
                  {/* Categories Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Danh mục</label>
                    {renderSelectedItems(formData.applicableCategories, categoryOptions, handleSelectCategories, 'Chọn danh mục...')}
                  </div>
                  {/* Products Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sản phẩm</label>
                    {renderSelectedItems(formData.applicableProducts, productOptions, handleSelectProducts, 'Chọn sản phẩm...')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Events & Campaigns */}
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
      </form>

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
    </>
  );
};

export default VoucherForm;
