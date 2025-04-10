import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaFilter, FaChevronDown, FaChevronUp, FaGift, FaPercent, FaStar, FaHeart, FaRegStar, FaSearch } from 'react-icons/fa';
// Removed IoMdColorPalette, FaShippingFast as they are no longer used
import { GiMilkCarton } from 'react-icons/gi';
import { TbBottle } from 'react-icons/tb';
// Import the new filter type
import { ShopProductFilters } from '@/contexts/user/shop/ShopProductContext';

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

const ShopFilters: React.FC<ShopFiltersProps> = ({ filters, onFilterChange, onSearch }) => {
  // State for price inputs, initialized from filters.minPrice/maxPrice
  const [minPriceInput, setMinPriceInput] = useState<string>(filters.minPrice?.toString() ?? '0');
  const [maxPriceInput, setMaxPriceInput] = useState<string>(filters.maxPrice?.toString() ?? '5000000');
  const [searchTerm, setSearchTerm] = useState<string>(filters.search || '');

  // Define sections with mapping to new filter keys
  // Removed sections: Màu sắc, Đánh giá, Dung tích
  const [sections, setSections] = useState<FilterSection[]>([
    {
      title: 'Danh mục',
      filterKey: 'categoryId', // Map to categoryId
      icon: <FaFilter />,
      isOpen: true,
      type: 'checkbox',
      options: [ // Replace with actual categories if available via API/Context later
        { id: '6616a012a47a35f1a0f4f18e', label: 'Chăm sóc da mặt' },
        { id: '6616a012a47a35f1a0f4f18f', label: 'Trang điểm' },
        { id: '6616a012a47a35f1a0f4f190', label: 'Chăm sóc cơ thể' },
        { id: '6616a012a47a35f1a0f4f191', label: 'Chăm sóc tóc' },
        { id: '6616a012a47a35f1a0f4f192', label: 'Nước hoa' },
        { id: '6616a012a47a35f1a0f4f193', label: 'Dụng cụ làm đẹp' },
      ]
    },
    {
      title: 'Thương hiệu',
      filterKey: 'brandId', // Map to brandId
      icon: <FaHeart />,
      isOpen: true,
      type: 'checkbox',
      options: [ // Replace with actual brands if available via API/Context later
        { id: '66169c8ea47a35f1a0f4f18a', label: 'Innisfree' },
        { id: '66169c8ea47a35f1a0f4f18b', label: 'The Face Shop' },
        { id: '66169c8ea47a35f1a0f4f18c', label: 'Laneige' },
        // Add more brands as needed
      ]
    },
    {
      title: 'Khoảng giá',
      filterKey: 'price', // Special key for price range
      icon: <FaPercent />,
      isOpen: true,
      type: 'range',
      min: 0,
      max: 5000000, // Adjust max price if needed
      step: 10000
    },
    {
      title: 'Loại da',
      filterKey: 'skinTypes', // Map to skinTypes (string)
      icon: <GiMilkCarton />,
      isOpen: true,
      type: 'checkbox',
      options: [
        { id: 'dry', label: 'Da khô' },
        { id: 'oily', label: 'Da dầu' },
        { id: 'combination', label: 'Da hỗn hợp' },
        { id: 'sensitive', label: 'Da nhạy cảm' },
        { id: 'normal', label: 'Da thường' },
        { id: 'acne-prone', label: 'Da mụn' }
      ]
    },
    {
      title: 'Vấn đề da',
      filterKey: 'concerns', // Map to concerns (string)
      icon: <TbBottle />,
      isOpen: true,
      type: 'checkbox',
      options: [
        { id: 'acne', label: 'Mụn' },
        { id: 'aging', label: 'Lão hóa' },
        { id: 'darkspots', label: 'Đốm nâu' },
        { id: 'dullness', label: 'Da xỉn màu' },
        { id: 'dryness', label: 'Khô da' },
        { id: 'pores', label: 'Lỗ chân lông to' },
        { id: 'wrinkles', label: 'Nếp nhăn' }
      ]
    },
  ]);

  // Mức giá phổ biến
  const popularPriceRanges = [
    { min: 0, max: 150000, label: 'Dưới 150.000đ' },
    { min: 150000, max: 300000, label: '150.000đ - 300.000đ' },
    { min: 300000, max: 500000, label: '300.000đ - 500.000đ' },
    { min: 500000, max: 1000000, label: '500.000đ - 1.000.000đ' },
    { min: 1000000, max: 5000000, label: 'Trên 1.000.000đ' }
  ];

  // Cập nhật giá trị input khi filters thay đổi từ context
  useEffect(() => {
    setMinPriceInput(filters.minPrice?.toString() ?? '0');
    setMaxPriceInput(filters.maxPrice?.toString() ?? '5000000');
  }, [filters.minPrice, filters.maxPrice]);

  // Cập nhật searchTerm khi filter search thay đổi từ context
   useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);


  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].isOpen = !newSections[index].isOpen;
    setSections(newSections);
  };

  // Updated Checkbox Handler
  const handleCheckboxChange = (filterKey: keyof ShopProductFilters, optionId: string, checked: boolean) => {
    let newFilterValue: string | undefined;

    if (filterKey === 'categoryId' || filterKey === 'brandId') {
      // Single select for category and brand
      newFilterValue = checked ? optionId : undefined;
      onFilterChange({ [filterKey]: newFilterValue });
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
    }
  };

  // Updated Price Range Handler
  const handlePriceRangeChange = useCallback((values: [number | undefined, number | undefined]) => {
    onFilterChange({ minPrice: values[0], maxPrice: values[1] });
  }, [onFilterChange]);

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
    onFilterChange({ [type]: checked ? true : undefined }); // Set to undefined if unchecked
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Calculate percentage for slider
  const calculatePercentage = (value: number | undefined, min: number, max: number) => {
    const val = value ?? min; // Default to min if undefined
    return ((val - min) / (max - min)) * 100;
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submission (e.g., on Enter key press or button click)
  const handleSearchSubmit = () => {
    onSearch(searchTerm);
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Debounce search submission
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only call onSearch if the searchTerm in state differs from the filter in context
      if (searchTerm !== filters.search) {
        onSearch(searchTerm);
      }
    }, 500); // Adjust debounce time as needed (e.g., 500ms)

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onSearch, filters.search]);


  // Updated Reset Filters Handler
  const handleResetFilters = () => {
    onFilterChange({
      categoryId: undefined,
      brandId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      skinTypes: undefined,
      concerns: undefined,
      isOnSale: undefined,
      hasGifts: undefined,
      // Keep search term or reset it? Resetting for now.
      search: undefined,
      // Reset sorting if needed
      // sortBy: 'createdAt',
      // sortOrder: 'desc',
    });
    setSearchTerm(''); // Reset local search term state as well
  };


  return (
    <div className="bg-white rounded-lg shadow p-4">
       {/* Search Input */}
       <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full border rounded p-2 pl-8 text-sm focus:ring-[#d53f8c] focus:border-[#d53f8c]"
          value={searchTerm}
          onChange={handleSearchInputChange}
          onKeyPress={handleSearchKeyPress}
        />
        <FaSearch
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
          onClick={handleSearchSubmit}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FaFilter className="mr-2" /> Bộ lọc
        </h2>
        <button
          className="text-sm text-[#306E51] hover:underline"
          onClick={handleResetFilters} // Use updated reset handler
        >
          Xóa tất cả
        </button>
      </div>

      {/* Khuyến mãi đặc biệt - Updated checks */}
      <div className="mb-6 bg-gradient-to-r from-[#fdf2f8] to-[#f5f3ff] p-3 rounded-lg">
        <h3 className="font-medium text-[#d53f8c] mb-2">Khuyến mãi đặc biệt</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOnSale" // Changed id
              className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
              checked={filters.isOnSale || false} // Use isOnSale
              onChange={(e) => handlePromotionChange('isOnSale', e.target.checked)} // Use isOnSale
            />
            <label htmlFor="isOnSale" className="text-sm flex items-center"> {/* Changed htmlFor */}
              <FaPercent className="mr-1 text-red-500" /> Đang giảm giá
            </label>
          </div>
          {/* Removed Free Shipping */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasGifts"
              className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
              checked={filters.hasGifts || false} // Use hasGifts
              onChange={(e) => handlePromotionChange('hasGifts', e.target.checked)} // Use hasGifts
            />
            <label htmlFor="hasGifts" className="text-sm flex items-center">
              <FaGift className="mr-1 text-pink-500" /> Có quà tặng kèm
            </label>
          </div>
        </div>
      </div>

      {/* Thương hiệu nổi bật - Updated logic */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Thương hiệu nổi bật</h3>
        <div className="grid grid-cols-3 gap-2">
          {/* Replace with actual brands */}
          {[
             { id: '66169c8ea47a35f1a0f4f18a', name: 'Innisfree' },
             { id: '66169c8ea47a35f1a0f4f18b', name: 'The Face Shop' },
             { id: '66169c8ea47a35f1a0f4f18c', name: 'Laneige' },
             // Add more brands
          ].map((brand) => (
            <div
              key={brand.id}
              className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                filters.brandId === brand.id ? 'border-[#d53f8c] bg-[#fdf2f8]' : 'hover:border-[#d53f8c] hover:bg-gray-50'
              }`}
              onClick={() => {
                handleCheckboxChange('brandId', brand.id, filters.brandId !== brand.id);
              }}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full mb-1 flex items-center justify-center text-xs font-bold">
                {brand.name.substring(0, 2)}
              </div>
              <span className="text-xs text-center">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.title} className="border-b pb-3">
            <div
              className="flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection(index)}
            >
              <h3 className="font-medium flex items-center">
                <span className="mr-2 text-[#d53f8c]">{section.icon}</span>
                {section.title}
              </h3>
              {section.isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </div>

            {section.isOpen && (
              <div className="mt-2">
                {section.type === 'checkbox' && section.options && (
                  <div className="space-y-2">
                    {section.options.map(option => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${section.filterKey}-${option.id}`} // Unique ID
                          className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
                          // Updated checked logic
                          checked={
                            section.filterKey === 'categoryId' ? filters.categoryId === option.id :
                            section.filterKey === 'brandId' ? filters.brandId === option.id :
                            section.filterKey === 'skinTypes' ? (filters.skinTypes?.split(',') || []).includes(option.id) :
                            section.filterKey === 'concerns' ? (filters.concerns?.split(',') || []).includes(option.id) :
                            false
                          }
                          onChange={(e) => handleCheckboxChange(section.filterKey as keyof ShopProductFilters, option.id, e.target.checked)}
                        />
                        <label htmlFor={`${section.filterKey}-${option.id}`} className="text-sm">{option.label}</label>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'range' && (
                  <div className="mt-4">
                    {/* Price Inputs */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-[45%]">
                        <label htmlFor="minPrice" className="block text-xs text-gray-600 mb-1">Giá từ</label>
                        <input
                          type="number"
                          id="minPrice"
                          className="w-full border rounded p-2 text-sm focus:ring-[#d53f8c] focus:border-[#d53f8c]"
                          value={minPriceInput}
                          onChange={handleMinPriceInputChange}
                          onBlur={handlePriceInputBlur}
                          min={0}
                          max={5000000}
                          step={10000}
                        />
                      </div>
                      <div className="text-gray-400">-</div>
                      <div className="w-[45%]">
                        <label htmlFor="maxPrice" className="block text-xs text-gray-600 mb-1">Đến</label>
                        <input
                          type="number"
                          id="maxPrice"
                          className="w-full border rounded p-2 text-sm focus:ring-[#d53f8c] focus:border-[#d53f8c]"
                          value={maxPriceInput}
                          onChange={handleMaxPriceInputChange}
                          onBlur={handlePriceInputBlur}
                          min={0}
                          max={5000000}
                          step={10000}
                        />
                      </div>
                    </div>

                    {/* Price Slider - Updated style calculations */}
                    <div className="relative mt-8 mb-6 h-5"> {/* Added height for thumbs */}
                      <div className="absolute top-1/2 h-1 w-full bg-gray-200 rounded transform -translate-y-1/2"></div>
                      <div
                        className="absolute h-1 bg-gradient-to-r from-[#d53f8c] to-[#805ad5] rounded top-1/2 transform -translate-y-1/2"
                        style={{
                          left: `${calculatePercentage(filters.minPrice, 0, 5000000)}%`,
                          width: `${calculatePercentage(filters.maxPrice, 0, 5000000) - calculatePercentage(filters.minPrice, 0, 5000000)}%`
                        }}
                      ></div>
                      {/* Min Thumb */}
                       <div
                        className="absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full cursor-pointer shadow-md hover:shadow-lg top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `calc(${calculatePercentage(filters.minPrice, 0, 5000000)}%)`,
                          zIndex: 10
                        }}
                        // onMouseDown logic remains similar, but updates minPrice via handlePriceRangeChange
                        onMouseDown={(e) => { /* ... Slider logic ... */ }}
                      ></div>
                      {/* Max Thumb */}
                      <div
                        className="absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full cursor-pointer shadow-md hover:shadow-lg top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `calc(${calculatePercentage(filters.maxPrice, 0, 5000000)}%)`,
                          zIndex: 20
                        }}
                         // onMouseDown logic remains similar, but updates maxPrice via handlePriceRangeChange
                        onMouseDown={(e) => { /* ... Slider logic ... */ }}
                      ></div>
                    </div>

                     {/* Price Labels - Updated positioning */}
                     <div className="relative mt-2 flex justify-between text-xs">
                        <span>{formatPrice(filters.minPrice ?? 0)}</span>
                        <span>{formatPrice(filters.maxPrice ?? 5000000)}</span>
                    </div>


                    {/* Popular Price Ranges - Updated onClick */}
                    <div className="mt-8">
                      <h4 className="text-sm font-medium mb-2">Mức giá phổ biến</h4>
                      <div className="space-y-2">
                        {popularPriceRanges.map((range, idx) => (
                          <div
                            key={idx}
                            className={`text-sm py-1 px-2 rounded cursor-pointer ${
                              filters.minPrice === range.min && filters.maxPrice === range.max
                                ? 'bg-[#fdf2f8] text-[#d53f8c]'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handlePopularPriceRangeClick(
                                range.min === 0 ? undefined : range.min,
                                range.max === 5000000 ? undefined : range.max
                            )}
                          >
                            {range.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Removed Color and Rating sections */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Removed Ad Banner */}
    </div>
  );
};

export default ShopFilters;
