import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'; // Add useMemo
import { FaFilter, FaChevronDown, FaChevronUp, FaGift, FaPercent, FaHeart, FaSearch } from 'react-icons/fa';
// Removed IoMdColorPalette, FaShippingFast as they are no longer used
import { GiMilkCarton } from 'react-icons/gi';
import { TbBottle } from 'react-icons/tb';
// Import the new filter type
import { ShopProductFilters, useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { useCategories } from '@/contexts/user/categories/CategoryContext'; // Import Category context hook mới
import { useBrands } from '@/contexts/user/brands/BrandContext'; // Import Brand context hook mới
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axiosInstance';

// Simplified FilterSection
interface FilterSection {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  type: 'checkbox' | 'range'; // Only checkbox and range are used now
  options?: { id: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  filterKey: keyof ShopProductFilters | 'price'; // Map section to filter key
}

interface ShopFiltersProps {
  filters: ShopProductFilters; // Use the imported type
  onFilterChange: (newFilters: Partial<ShopProductFilters>) => void; // Use the specific type
  onSearch: (searchTerm: string) => void; // Add onSearch prop
}

// Thêm memoized component cho filter option
const FilterOptionItem = memo<{
  section: FilterSection;
  option: { id: string; label: string };
  isChecked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}>(({ section, option, isChecked, onToggle }) => (
  <div className="flex items-center py-1.5">
    <div className="flex items-center w-full cursor-pointer">
      <input
        type="checkbox"
        id={`${section.filterKey}-${option.id}-input`}
        className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c] cursor-pointer h-4 w-4"
        checked={isChecked}
        onChange={(e) => onToggle(option.id, e.target.checked)}
      />
      <label
        htmlFor={`${section.filterKey}-${option.id}-input`}
        className="text-sm cursor-pointer flex-grow"
        onClick={(e) => {
          e.preventDefault();
          onToggle(option.id, !isChecked);
        }}
      >
        {option.label}
      </label>
    </div>
  </div>
));

FilterOptionItem.displayName = 'FilterOptionItem';

// Memoized ExpandableFilterOptions component
const ExpandableFilterOptions = memo<{
  section: FilterSection;
  filters: ShopProductFilters;
  onToggle: (filterKey: keyof ShopProductFilters, id: string, checked: boolean) => void;
  loading?: boolean;
  limit?: number;
}>(({ section, filters, onToggle, loading = false, limit = 8 }) => {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return <div className="text-sm text-gray-500">Đang tải...</div>;
  }

  if (!section.options || section.options.length === 0) {
    return <div className="text-sm text-gray-500">Không có dữ liệu.</div>;
  }

  const displayOptions = showAll ? section.options : section.options.slice(0, limit);
  const hasMore = section.options.length > limit;

  return (
    <div className="space-y-2">
      {displayOptions.map((option) => {
        const isChecked =
          section.filterKey === 'categoryId' ? (filters.categoryId?.split(',') || []).includes(option.id) :
          section.filterKey === 'brandId' ? (filters.brandId?.split(',') || []).includes(option.id) :
          section.filterKey === 'skinTypes' ? (filters.skinTypes?.split(',') || []).includes(option.id) :
          section.filterKey === 'concerns' ? (filters.concerns?.split(',') || []).includes(option.id) :
          false;

        return (
          <FilterOptionItem
            key={`${section.filterKey}-${option.id}`}
            section={section}
            option={option}
            isChecked={isChecked}
            onToggle={(id, checked) => onToggle(section.filterKey as keyof ShopProductFilters, id, checked)}
          />
        );
      })}
      
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-[#d53f8c] hover:text-[#b83280] flex items-center transition-colors"
        >
          {showAll ? (
            <>
              <FaChevronUp className="mr-1" size={12} />
              Thu gọn
            </>
          ) : (
            <>
              <FaChevronDown className="mr-1" size={12} />
              Xem thêm ({section.options.length - limit})
            </>
          )}
        </button>
      )}
    </div>
  );
});

ExpandableFilterOptions.displayName = 'ExpandableFilterOptions';

// Memoized PriceSlider component với drag functionality
const PriceSlider = memo<{
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (values: [number, number]) => void;
  formatValue: (value: number) => string;
}>(({ minValue, maxValue, min, max, step, onChange, formatValue }) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPercentage = useCallback((value: number) => {
    return ((value - min) / (max - min)) * 100;
  }, [min, max]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return min;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    let value = min + (percentage / 100) * (max - min);
    
    // Snap to step
    value = Math.round(value / step) * step;
    return Math.max(min, Math.min(max, value));
  }, [min, max, step]);

  const handleMouseDown = useCallback((type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const newValue = getValueFromPosition(e.clientX);
    
    if (isDragging === 'min') {
      const newMin = Math.min(newValue, maxValue - step);
      onChange([newMin, maxValue]);
    } else {
      const newMax = Math.max(newValue, minValue + step);
      onChange([minValue, newMax]);
    }
  }, [isDragging, minValue, maxValue, step, onChange, getValueFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    
    const newValue = getValueFromPosition(e.clientX);
    const distanceToMin = Math.abs(newValue - minValue);
    const distanceToMax = Math.abs(newValue - maxValue);
    
    if (distanceToMin < distanceToMax) {
      const newMin = Math.min(newValue, maxValue - step);
      onChange([newMin, maxValue]);
    } else {
      const newMax = Math.max(newValue, minValue + step);
      onChange([minValue, newMax]);
    }
  }, [isDragging, minValue, maxValue, step, onChange, getValueFromPosition]);

  return (
    <div className="relative mt-6 mb-4 h-5">
      {/* Track */}
      <div 
        ref={sliderRef}
        className="absolute top-1/2 h-2 w-full bg-gray-200 rounded-full transform -translate-y-1/2 cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Active range */}
        <div
          className="absolute h-2 bg-gradient-to-r from-[#d53f8c] to-[#805ad5] rounded-full transition-all duration-75"
          style={{
            left: `${getPercentage(minValue)}%`,
            width: `${getPercentage(maxValue) - getPercentage(minValue)}%`
          }}
        />
      </div>
      
      {/* Min thumb */}
      <div
        className={`absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full shadow-md top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
          isDragging === 'min' 
            ? 'cursor-grabbing shadow-lg' 
            : 'cursor-grab hover:shadow-lg transition-shadow duration-150'
        }`}
        style={{
          left: `${getPercentage(minValue)}%`,
          zIndex: isDragging === 'min' ? 30 : 10
        }}
        onMouseDown={handleMouseDown('min')}
        title={formatValue(minValue)}
      />
      
      {/* Max thumb */}
      <div
        className={`absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full shadow-md top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
          isDragging === 'max' 
            ? 'cursor-grabbing shadow-lg' 
            : 'cursor-grab hover:shadow-lg transition-shadow duration-150'
        }`}
        style={{
          left: `${getPercentage(maxValue)}%`,
          zIndex: isDragging === 'max' ? 30 : 20
        }}
        onMouseDown={handleMouseDown('max')}
        title={formatValue(maxValue)}
      />
    </div>
  );
});

PriceSlider.displayName = 'PriceSlider';

const ShopFilters: React.FC<ShopFiltersProps> = ({ filters, onFilterChange, onSearch }) => {
  const { isAuthenticated } = useAuth();

  // Local state với debounce optimization
  const [minPriceInput, setMinPriceInput] = useState<string>(filters.minPrice?.toString() ?? '0');
  const [maxPriceInput, setMaxPriceInput] = useState<string>(filters.maxPrice?.toString() ?? '5000000');
  const [searchTerm, setSearchTerm] = useState<string>(filters.search || '');
  const [sectionsState, setSectionsState] = useState<FilterSection[]>([]);
  const [showAllBrands, setShowAllBrands] = useState<boolean>(false);

  // Constants for display limits
  const FEATURED_BRANDS_LIMIT = 6;
  const FILTER_OPTIONS_LIMIT = 8;

  const { categories } = useCategories(); // Use categories
  const { brands, loading: loadingBrands } = useBrands(); // Use brands
  const { skinTypeOptions, concernOptions, fetchSkinTypeOptions, fetchConcernOptions, logFilterUse, logSearch } = useShopProduct(); // Get skin type and concern options from context

  // Memoized validation function
  const isValidObjectId = useCallback((id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }, []);

  // Hàm tracking filter usage
  const trackFilterUsage = useCallback(async (filterData: Record<string, unknown>) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.post('/recommendations/log/filter', filterData);
    } catch (error: unknown) {
      console.error('Error logging filter usage:', error);
    }
  }, [isAuthenticated]);

  // Memoized sections builder
  const buildSections = useCallback((): FilterSection[] => {
    return [
      {
        title: 'Danh mục',
        filterKey: 'categoryId' as const,
        icon: <FaFilter />,
        isOpen: sectionsState.find(s => s.title === 'Danh mục')?.isOpen ?? true,
        type: 'checkbox' as const,
        options: categories.map((cat: { _id?: string; id?: string; name: string }) => ({
          id: cat._id || cat.id || '',
          label: cat.name
        }))
      },
      {
        title: 'Thương hiệu',
        filterKey: 'brandId' as const,
        icon: <FaHeart />,
        isOpen: sectionsState.find(s => s.title === 'Thương hiệu')?.isOpen ?? true,
        type: 'checkbox' as const,
        options: brands.map((brand: { _id?: string; id?: string; name: string }) => ({
          id: brand._id || brand.id || '',
          label: brand.name
        }))
      },
      {
        title: 'Khoảng giá',
        filterKey: 'price' as const,
        icon: <FaPercent />,
        isOpen: sectionsState.find(s => s.title === 'Khoảng giá')?.isOpen ?? true,
        type: 'range' as const,
        min: 0,
        max: 5000000,
        step: 5000
      },
      {
        title: 'Loại da',
        filterKey: 'skinTypes' as const,
        icon: <GiMilkCarton />,
        isOpen: sectionsState.find(s => s.title === 'Loại da')?.isOpen ?? true,
        type: 'checkbox' as const,
        options: skinTypeOptions.map(type => ({ id: type, label: type }))
      },
      {
        title: 'Vấn đề da',
        filterKey: 'concerns' as const,
        icon: <TbBottle />,
        isOpen: sectionsState.find(s => s.title === 'Vấn đề da')?.isOpen ?? true,
        type: 'checkbox' as const,
        options: concernOptions.map(concern => ({ id: concern, label: concern }))
      },
    ];
  }, [categories, brands, skinTypeOptions, concernOptions, sectionsState]);

  // Update local sections state when base sections change (e.g., data loaded)
  useEffect(() => {
    // Fetch options if not already loaded
    if (skinTypeOptions.length === 0) {
      fetchSkinTypeOptions();
    }
    if (concernOptions.length === 0) {
      fetchConcernOptions();
    }

    const newSections = buildSections();
    
    // Chỉ cập nhật nếu có sự thay đổi thực sự về cấu trúc
    const sectionsChanged = JSON.stringify(newSections.map(s => ({ 
      title: s.title, 
      optionsLength: s.options?.length || 0 
    }))) !== JSON.stringify(sectionsState.map(s => ({ 
      title: s.title, 
      optionsLength: s.options?.length || 0 
    })));

    if (sectionsChanged) {
      setSectionsState(newSections);
    }
  }, [categories, brands, skinTypeOptions, concernOptions, buildSections, fetchSkinTypeOptions, fetchConcernOptions, sectionsState]);

  // Mức giá phổ biến - memoized để tránh re-create
  const popularPriceRanges = useMemo(() => [
    { min: 0, max: 150000, label: 'Dưới 150.000đ' },
    { min: 150000, max: 300000, label: '150.000đ - 300.000đ' },
    { min: 300000, max: 500000, label: '300.000đ - 500.000đ' },
    { min: 500000, max: 1000000, label: '500.000đ - 1.000.000đ' },
    { min: 1000000, max: 5000000, label: 'Trên 1.000.000đ' }
  ], []);

  // Cập nhật giá trị input khi filters thay đổi từ context
  useEffect(() => {
    setMinPriceInput(filters.minPrice?.toString() ?? '0');
    setMaxPriceInput(filters.maxPrice?.toString() ?? '5000000');
  }, [filters.minPrice, filters.maxPrice]);

  // Cập nhật searchTerm khi filter search thay đổi từ context
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  // Cập nhật searchTerm khi filters.search thay đổi từ bên ngoài (như từ header)
  useEffect(() => {
    // Luôn cập nhật searchTerm từ filters.search khi filters.search thay đổi
    // bất kể là thay đổi từ đâu (header, URL, etc.)
    console.log('ShopFilters: filters.search changed:', filters.search, 'current searchTerm:', searchTerm);

    // Sử dụng hàm setter để cập nhật state
    setSearchTerm(filters.search || '');

  }, [filters.search, searchTerm]);

  // Function to toggle section visibility
  const toggleSection = (index: number) => {
    setSectionsState(prevSections => {
      const newSections = [...prevSections];
      newSections[index].isOpen = !newSections[index].isOpen;
      return newSections;
    });
  };

  // Updated Checkbox Handler
  const handleCheckboxChange = (filterKey: keyof ShopProductFilters, optionId: string, checked: boolean) => {
    let newFilterValue: string | undefined;

    if (filterKey === 'categoryId' || filterKey === 'brandId') {
      // Multi-select for category and brand (comma-separated string)
      const currentValues = filters[filterKey]?.split(',').filter(id => id.trim()) || [];
      let updatedValues: string[];
      
      if (checked) {
        // Add if not already present
        if (!currentValues.includes(optionId)) {
          updatedValues = [...currentValues, optionId];
        } else {
          updatedValues = currentValues;
        }
      } else {
        // Remove the optionId
        updatedValues = currentValues.filter(id => id !== optionId);
      }
      
      newFilterValue = updatedValues.length > 0 ? updatedValues.join(',') : undefined;

      // Kiểm tra xem tất cả IDs có phải là MongoDB ObjectId hợp lệ không
      if (newFilterValue) {
        const allValidIds = updatedValues.every(id => isValidObjectId(id));
        if (!allValidIds) {
          console.warn(`Có ID không hợp lệ cho ${filterKey}:`, updatedValues);
          return;
        }
      }

      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Setting ${filterKey} to:`, newFilterValue, typeof newFilterValue);
      }

      // Tạo một object mới với giá trị cần update
      const updateObj = { [filterKey]: newFilterValue };

      // Gọi callback update filter
      onFilterChange(updateObj);

      // Ghi lại hoạt động sử dụng bộ lọc
      if (isAuthenticated) {
        const filterData = {
          [filterKey]: newFilterValue
        };
        logFilterUse(filterData);
      }
    } else if (filterKey === 'skinTypes' || filterKey === 'concerns') {
      // Multi-select for skinTypes and concerns (comma-separated string)
      const currentValues = filters[filterKey]?.split(',') || [];
      let updatedValues: string[];
      if (checked) {
        updatedValues = [...currentValues, optionId];
      } else {
        updatedValues = currentValues.filter(id => id !== optionId);
      }
      newFilterValue = updatedValues.length > 0 ? updatedValues.join(',') : undefined;
      onFilterChange({ [filterKey]: newFilterValue });

      // Ghi lại hoạt động sử dụng bộ lọc
      if (isAuthenticated) {
        const filterData = {
          [filterKey]: newFilterValue
        };
        logFilterUse(filterData);
      }
    }
  };

  // Updated Price Range Handler - Tối ưu cho responsiveness
  const handlePriceRangeChange = useCallback((values: [number | undefined, number | undefined]) => {
    // Cập nhật local input state ngay lập tức
    setMinPriceInput(values[0]?.toString() ?? '0');
    setMaxPriceInput(values[1]?.toString() ?? '5000000');
    
    // Cập nhật filters ngay lập tức không debounce
    onFilterChange({ minPrice: values[0], maxPrice: values[1] });

    // Ghi lại hoạt động sử dụng bộ lọc giá (không debounce)
    if (isAuthenticated) {
      const filterData = {
        price: { min: values[0], max: values[1] }
      };
      logFilterUse(filterData);
    }
  }, [onFilterChange, isAuthenticated, logFilterUse]);

  const handleMinPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinPriceInput(e.target.value);
  };

  const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPriceInput(e.target.value);
  };

  // Updated Price Input Blur Handler
  const handlePriceInputBlur = () => {
    let min = parseInt(minPriceInput);
    let max = parseInt(maxPriceInput);

    // Handle NaN cases
    min = isNaN(min) ? 0 : min;
    max = isNaN(max) ? 5000000 : max; // Use max limit if NaN

    // Ensure min <= max
    if (min > max) {
      [min, max] = [max, min];
    }

    // Ensure values are within allowed range
    min = Math.max(0, Math.min(min, 5000000));
    max = Math.max(0, Math.min(max, 5000000));

    handlePriceRangeChange([min === 0 ? undefined : min, max === 5000000 ? undefined : max]);
  };

  // Updated Popular Price Range Click Handler
  const handlePopularPriceRangeClick = (min: number | undefined, max: number | undefined) => {
    handlePriceRangeChange([min, max]);
  };

  // Updated Promotion Change Handler
  const handlePromotionChange = (type: 'isOnSale' | 'hasGifts', checked: boolean) => {
    // Chỉ log trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Promotion change: ${type} - ${checked}`);
    }
    onFilterChange({ [type]: checked ? true : undefined }); // Set to undefined if unchecked

    // Ghi lại hoạt động sử dụng bộ lọc khuyến mãi
    if (isAuthenticated) {
      const filterData = {
        [type]: checked ? true : undefined
      };
      trackFilterUsage(filterData);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Handle search input change
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  }, []);

  // Handle search submission (e.g., on Enter key press or button click)
  const handleSearchSubmit = useCallback(() => {
    if (searchTerm.trim()) {
      console.log('ShopFilters: Submitting search term:', searchTerm.trim());
      onSearch(searchTerm);

      // Ghi lại hoạt động tìm kiếm
      if (isAuthenticated && searchTerm.trim()) {
        logSearch(searchTerm.trim());
      }
    } else {
      // Nếu search term rỗng, thực hiện search rỗng để xóa kết quả
      onSearch('');
    }
  }, [searchTerm, onSearch, isAuthenticated, logSearch]);

  // Handle Enter key press in search input
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Ngăn chặn hành vi mặc định của form
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  // Updated Reset Filters Handler
  const handleResetFilters = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ShopFilters: handleResetFilters called');
    }

    // Reset local state for input fields
    setSearchTerm('');
    setMinPriceInput('0');
    setMaxPriceInput('5000000');

    // Define a complete reset payload.
    // This ensures all filter keys are explicitly reset.
    const resetPayload: Partial<ShopProductFilters> = {
      search: undefined,
      brandId: undefined,
      categoryId: undefined,
      eventId: undefined,
      campaignId: undefined,
      status: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      tags: undefined,
      skinTypes: undefined,
      concerns: undefined,
      isBestSeller: undefined,
      isNew: undefined,
      isOnSale: undefined,
      hasGifts: undefined,
      sortBy: undefined, // Reset sortBy if it's part of filters
      sortOrder: undefined // Reset sortOrder if it's part of filters
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('ShopFilters: Calling onFilterChange with resetPayload:', resetPayload);
    }
    onFilterChange(resetPayload);
    // The responsibility of updating the URL and fetching products
    // is now delegated to the parent component (Shop.tsx) and the context.
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
       {/* Search Input */}
       <div className="relative">
        <input
          type="text"
          placeholder="Nhập từ khóa và bấm Enter hoặc click 🔍 để tìm kiếm..."
          className="w-full border rounded-lg p-2.5 pl-8 text-sm focus:ring-2 focus:ring-[#d53f8c] focus:border-[#d53f8c] transition-all"
          value={searchTerm}
          onChange={handleSearchInputChange}
          onKeyDown={handleSearchKeyDown}
        />
        <FaSearch
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-[#d53f8c] transition-colors"
          onClick={handleSearchSubmit}
          title="Tìm kiếm"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center text-gray-800">
          <FaFilter className="mr-2 text-[#d53f8c]" size={16} /> 
          Bộ lọc
        </h2>
        <button
          className="text-sm text-[#d53f8c] hover:text-[#b83280] transition-colors"
          onClick={handleResetFilters}
        >
          Xóa tất cả
        </button>
      </div>

      {/* Khuyến mãi đặc biệt */}
      <div className="bg-gradient-to-r from-[#fdf2f8] to-[#f5f3ff] p-3 rounded-lg border border-pink-100">
        <h3 className="font-medium text-[#d53f8c] mb-3 text-sm">✨ Khuyến mãi đặc biệt</h3>
        <div className="space-y-2.5">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="mr-2.5 text-[#d53f8c] focus:ring-[#d53f8c] cursor-pointer h-4 w-4 rounded"
              checked={filters.isOnSale || false}
              onChange={(e) => handlePromotionChange('isOnSale', e.target.checked)}
            />
            <span className="text-sm flex items-center group-hover:text-[#d53f8c] transition-colors">
              <FaPercent className="mr-1.5 text-red-500" size={12} /> 
              Đang giảm giá
            </span>
          </label>

          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="mr-2.5 text-[#d53f8c] focus:ring-[#d53f8c] cursor-pointer h-4 w-4 rounded"
              checked={filters.hasGifts || false}
              onChange={(e) => handlePromotionChange('hasGifts', e.target.checked)}
            />
            <span className="text-sm flex items-center group-hover:text-[#d53f8c] transition-colors">
              <FaGift className="mr-1.5 text-pink-500" size={12} /> 
              Có quà tặng kèm
            </span>
          </label>
        </div>
      </div>

      {/* Thương hiệu nổi bật - Sử dụng dữ liệu từ BrandContext */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Thương hiệu nổi bật</h3>
          {!loadingBrands && brands.length > FEATURED_BRANDS_LIMIT && (
            <button
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="text-xs text-[#d53f8c] hover:text-[#b83280] transition-colors flex items-center"
            >
              {showAllBrands ? (
                <>
                  <FaChevronUp size={10} className="mr-1" />
                  Thu gọn
                </>
              ) : (
                <>
                  <FaChevronDown size={10} className="mr-1" />
                  +{brands.length - FEATURED_BRANDS_LIMIT}
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {loadingBrands ? (
            // Hiển thị skeleton khi đang tải
            Array(6).fill(null).map((_, idx) => (
              <div key={`brand-skeleton-${idx}`}
                   className="border rounded-md p-2 flex flex-col items-center animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full mb-1"></div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            (showAllBrands ? brands : brands.slice(0, FEATURED_BRANDS_LIMIT)).map((brand: { _id?: string; id?: string; name: string }, brandIndex: number) => (
              <div
                key={`brand-featured-${brand.id || brandIndex}`}
                className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  (filters.brandId?.split(',') || []).includes(brand._id || brand.id || '')
                    ? 'border-[#d53f8c] bg-[#fdf2f8] shadow-sm'
                    : 'hover:border-[#d53f8c] hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => {
                  const brandId = brand._id || brand.id || '';
                  console.log('Clicked brand:', brand.name, brandId);
                  const currentBrandIds = filters.brandId?.split(',') || [];
                  const isCurrentlySelected = currentBrandIds.includes(brandId);
                  handleCheckboxChange('brandId', brandId, !isCurrentlySelected);
                }}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full mb-1 flex items-center justify-center text-xs font-bold text-gray-600">
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-center leading-tight">{brand.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sectionsState.map((section, index) => (
          <div key={`section-${section.title}-${index}`} className="border border-gray-100 rounded-lg overflow-hidden">
            <div
              className="flex justify-between items-center cursor-pointer py-3 px-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggleSection(index)}
            >
              <h3 className="font-medium flex items-center text-gray-700">
                <span className="mr-2 text-[#d53f8c]">{section.icon}</span>
                {section.title}
              </h3>
              <div className="text-gray-400">
                {section.isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </div>
            </div>

            {section.isOpen && (
              <div className="p-4 bg-white">
                {section.type === 'checkbox' && section.options && (
                  <ExpandableFilterOptions
                    section={section}
                    filters={filters}
                    onToggle={(filterKey, id, checked) => handleCheckboxChange(filterKey as keyof ShopProductFilters, id, checked)}
                    loading={loadingBrands}
                    limit={FILTER_OPTIONS_LIMIT}
                  />
                )}

                {section.type === 'range' && (
                  <div className="space-y-4">
                    {/* Price Inputs */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label htmlFor="minPrice" className="block text-xs text-gray-600 mb-1.5">Giá từ</label>
                        <input
                          type="number"
                          id="minPrice"
                          className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#d53f8c] focus:border-[#d53f8c] transition-all"
                          value={minPriceInput}
                          onChange={handleMinPriceInputChange}
                          onBlur={handlePriceInputBlur}
                          min={0}
                          max={5000000}
                          step={5000}
                          placeholder="0"
                        />
                      </div>
                      <div className="text-gray-400 mt-6">—</div>
                      <div className="flex-1">
                        <label htmlFor="maxPrice" className="block text-xs text-gray-600 mb-1.5">Đến</label>
                        <input
                          type="number"
                          id="maxPrice"
                          className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#d53f8c] focus:border-[#d53f8c] transition-all"
                          value={maxPriceInput}
                          onChange={handleMaxPriceInputChange}
                          onBlur={handlePriceInputBlur}
                          min={0}
                          max={5000000}
                          step={5000}
                          placeholder="5,000,000"
                        />
                      </div>
                    </div>

                    {/* Price Slider */}
                    <PriceSlider
                      minValue={filters.minPrice ?? 0}
                      maxValue={filters.maxPrice ?? 5000000}
                      min={0}
                      max={5000000}
                      step={5000}
                      onChange={handlePriceRangeChange}
                      formatValue={formatPrice}
                    />

                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatPrice(filters.minPrice ?? 0)}</span>
                      <span>{formatPrice(filters.maxPrice ?? 5000000)}</span>
                    </div>

                    {/* Popular Price Ranges */}
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium mb-3 text-gray-700">Mức giá phổ biến</h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        {popularPriceRanges.map((range, idx) => (
                          <button
                            key={`price-range-${idx}`}
                            className={`text-sm py-2 px-3 rounded-lg text-left transition-all ${
                              (filters.minPrice ?? 0) === range.min && (filters.maxPrice ?? 5000000) === range.max
                                ? 'bg-[#fdf2f8] text-[#d53f8c] border border-[#d53f8c]'
                                : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                            }`}
                            onClick={() => handlePopularPriceRangeClick(
                                range.min === 0 ? undefined : range.min,
                                range.max === 5000000 ? undefined : range.max
                            )}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Removed Ad Banner */}
    </div>
  );
};

export default memo(ShopFilters);
