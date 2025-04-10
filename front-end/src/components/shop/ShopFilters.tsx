import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'; // Add useMemo
import { FaFilter, FaChevronDown, FaChevronUp, FaGift, FaPercent, FaStar, FaHeart, FaRegStar, FaSearch } from 'react-icons/fa';
// Removed IoMdColorPalette, FaShippingFast as they are no longer used
import { GiMilkCarton } from 'react-icons/gi';
import { TbBottle } from 'react-icons/tb';
// Import the new filter type
import { ShopProductFilters, useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { useCategories } from '@/contexts/user/categories/CategoryContext'; // Import Category context hook mới
import { useBrands } from '@/contexts/user/brands/BrandContext'; // Import Brand context hook mới

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
  const { categories, loading: loadingCategories } = useCategories(); // Use categories
  const { brands, loading: loadingBrands } = useBrands(); // Use brands
  const { skinTypeOptions, concernOptions, fetchSkinTypeOptions, fetchConcernOptions } = useShopProduct(); // Get skin type and concern options from context

  // No need for helper functions as we're using the raw data directly

  // Define sections with mapping to new filter keys
  // Use useMemo to prevent re-calculating sections on every render unless dependencies change
  const sections = useMemo<FilterSection[]>(() => [
    {
      title: 'Danh mục',
      filterKey: 'categoryId', // Map to categoryId
      icon: <FaFilter />,
      isOpen: true,
      type: 'checkbox',
      options: categories ? categories.map((cat: any) => ({
        id: cat._id || `cat-${cat.name}`,
        label: cat.name
      })) : []
    },
    {
      title: 'Thương hiệu',
      filterKey: 'brandId', // Map to brandId
      icon: <FaHeart />,
      isOpen: true,
      type: 'checkbox',
      options: brands ? brands.map((brand: any) => ({
        id: brand.id || `brand-${brand.name}`,
        label: brand.name
      })) : []
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
      options: skinTypeOptions.length > 0 ? skinTypeOptions : [
        { id: 'skibidi', label: 'skibidi' },
        { id: 'dumb bitch', label: 'dumb bitch' }
      ]
    },
    {
      title: 'Vấn đề da',
      filterKey: 'concerns', // Map to concerns (string)
      icon: <TbBottle />,
      isOpen: true,
      type: 'checkbox',
      options: concernOptions.length > 0 ? concernOptions : [
        { id: 'ugly', label: 'ugly' },
        { id: 'too fat', label: 'too fat' }
      ]
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [categories, brands, skinTypeOptions, concernOptions]); // Added skinTypeOptions and concernOptions to dependencies

  const [sectionsState, setSectionsState] = useState<FilterSection[]>(sections); // Local state for open/close

  // Update local sections state when base sections change (e.g., data loaded)
  useEffect(() => {
    console.log('Categories loaded:', categories.length);
    console.log('Brands loaded:', brands.length);
    console.log('Skin types loaded:', skinTypeOptions.length);
    console.log('DETAILED SKIN TYPES:', JSON.stringify(skinTypeOptions));
    console.log('Concerns loaded:', concernOptions.length);
    console.log('DETAILED CONCERNS:', JSON.stringify(concernOptions));
    console.log('Current filters:', filters);

    // Fetch skin types and concerns if they're not loaded yet
    if (skinTypeOptions.length === 0) {
      fetchSkinTypeOptions();
    }
    if (concernOptions.length === 0) {
      fetchConcernOptions();
    }

    if (categories.length > 0 || brands.length > 0) {
      // Cập nhật chỉ khi có dữ liệu danh mục hoặc thương hiệu
      const newSections: FilterSection[] = [
        {
          title: 'Danh mục',
          filterKey: 'categoryId' as const,
          icon: <FaFilter />,
          isOpen: true,
          type: 'checkbox' as const,
          options: categories.map((cat: any) => ({
            id: cat._id || `cat-${cat.name}`,
            label: cat.name
          }))
        },
        {
          title: 'Thương hiệu',
          filterKey: 'brandId' as const,
          icon: <FaHeart />,
          isOpen: true,
          type: 'checkbox' as const,
          options: brands.map((brand: any) => ({
            id: brand.id || `brand-${brand.name}`,
            label: brand.name
          }))
        },
        // Giữ nguyên các mục khác từ sections ban đầu
        ...sections.slice(2)
      ];

      // Cập nhật sectionsState với trạng thái mở đóng từ state trước
      setSectionsState(prev => {
        return newSections.map((sec, index) => ({
          ...sec,
          isOpen: prev[index]?.isOpen ?? sec.isOpen
        }));
      });
    }
  }, [categories, brands, sections, skinTypeOptions, concernOptions, fetchSkinTypeOptions, fetchConcernOptions]);


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
      // Single select for category and brand
      newFilterValue = checked ? optionId : undefined;

      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Setting ${filterKey} to:`, newFilterValue, typeof newFilterValue);
      }

      // Tạo một object mới với giá trị cần update
      const updateObj = { [filterKey]: newFilterValue };

      // Gọi callback update filter
      onFilterChange(updateObj);
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
    // Chỉ log trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Promotion change: ${type} - ${checked}`);
    }
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
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    // Thực hiện reset filters
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
      // Thêm các trường khác nếu cần
      eventId: undefined,
      campaignId: undefined,
    });

    // Reset các trạng thái local nếu cần
    setSearchTerm(''); // Reset local search term state as well
    setMinPriceInput('0');
    setMaxPriceInput('5000000');

    // Cập nhật URL để xóa các tham số query liên quan
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const pathname = url.pathname;
      // Sử dụng window.history để thay đổi URL mà không refresh trang
      window.history.replaceState({}, '', pathname);
    }
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
          onKeyDown={handleSearchKeyDown}
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
            <div className="flex items-center cursor-pointer w-full" onClick={() => handlePromotionChange('isOnSale', !filters.isOnSale)}>
              <input
                type="checkbox"
                id="isOnSale"
                className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c] cursor-pointer h-4 w-4"
                checked={filters.isOnSale || false}
                onChange={(e) => handlePromotionChange('isOnSale', e.target.checked)}
              />
              <label htmlFor="isOnSale" className="text-sm flex items-center cursor-pointer flex-grow">
                <FaPercent className="mr-1 text-red-500" /> Đang giảm giá
              </label>
            </div>
          </div>
          {/* Removed Free Shipping */}
          <div className="flex items-center">
            <div className="flex items-center cursor-pointer w-full" onClick={() => handlePromotionChange('hasGifts', !filters.hasGifts)}>
              <input
                type="checkbox"
                id="hasGifts"
                className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c] cursor-pointer h-4 w-4"
                checked={filters.hasGifts || false}
                onChange={(e) => handlePromotionChange('hasGifts', e.target.checked)}
              />
              <label htmlFor="hasGifts" className="text-sm flex items-center cursor-pointer flex-grow">
                <FaGift className="mr-1 text-pink-500" /> Có quà tặng kèm
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Thương hiệu nổi bật - Sử dụng dữ liệu từ BrandContext */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Thương hiệu nổi bật</h3>
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
          ) : brands.slice(0, 6).map((brand: any, brandIndex) => (
            <div
              key={`brand-featured-${brand.id || brandIndex}`}
              className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                filters.brandId === brand.id ? 'border-[#d53f8c] bg-[#fdf2f8]' : 'hover:border-[#d53f8c] hover:bg-gray-50'
              }`}
              onClick={() => {
                console.log('Clicked brand:', brand.name, brand.id);
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
        {sectionsState.map((section, index) => ( // Use sectionsState here
          <div key={`section-${section.title}-${index}`} className="border-b pb-3">
            <div
              className="flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection(index)} // Use sectionsState index
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
                    {/* Add loading indicator */}
                    {(section.filterKey === 'categoryId' && loadingCategories) || (section.filterKey === 'brandId' && loadingBrands) ? (
                      <div className="text-sm text-gray-500">Đang tải...</div>
                    ) : section.options.length === 0 ? (
                      <div className="text-sm text-gray-500">Không có dữ liệu.</div>
                    ) : (
                      section.options.map((option, optionIndex) => {
                        // Debug - Thêm log hiển thị trạng thái tích
                        const isChecked =
                          section.filterKey === 'categoryId' ? filters.categoryId === option.id :
                          section.filterKey === 'brandId' ? filters.brandId === option.id :
                          section.filterKey === 'skinTypes' ? (filters.skinTypes?.split(',') || []).includes(option.id) :
                          section.filterKey === 'concerns' ? (filters.concerns?.split(',') || []).includes(option.id) :
                          false;

                        // Remove excessive logging for production
                        // Only log in development mode if needed
                        /*
                        if (process.env.NODE_ENV === 'development' && section.filterKey === 'categoryId') {
                          console.log(`Category option: ${option.label} (${option.id}) - checked: ${isChecked}`);
                          console.log(`Current categoryId in filters: ${filters.categoryId}`);
                        }
                        */

                        return (
                          <div key={`${section.filterKey}-${option.id || optionIndex}`} className="flex items-center py-1.5">
                            <div className="flex items-center w-full cursor-pointer">
                              <input
                                type="checkbox"
                                id={`${section.filterKey}-${option.id || optionIndex}-input`}
                                className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c] cursor-pointer h-4 w-4"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(section.filterKey as keyof ShopProductFilters, option.id, e.target.checked)}
                              />
                              <label
                                htmlFor={`${section.filterKey}-${option.id || optionIndex}-input`}
                                className="text-sm cursor-pointer flex-grow"
                                onClick={(e) => {
                                  e.preventDefault(); // Ngăn chặn hành vi mặc định của label

                                  // Đảm bảo click vào label sẽ kích hoạt cùng sự kiện với checkbox
                                  const isChecked =
                                    section.filterKey === 'categoryId' ? filters.categoryId !== option.id :
                                    section.filterKey === 'brandId' ? filters.brandId !== option.id :
                                    section.filterKey === 'skinTypes' ? !(filters.skinTypes?.split(',') || []).includes(option.id) :
                                    section.filterKey === 'concerns' ? !(filters.concerns?.split(',') || []).includes(option.id) :
                                    true;

                                  handleCheckboxChange(section.filterKey as keyof ShopProductFilters, option.id, isChecked);
                                }}
                              >
                                {option.label}
                              </label>
                            </div>
                          </div>
                        );
                      })
                    )}
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
                        // Simplified slider logic for min price
                        onMouseDown={() => {
                          // Set min price to a reasonable value when clicked
                          const newMinPrice = Math.max(0, (filters.minPrice || 0) - 50000);
                          handlePriceRangeChange([newMinPrice, filters.maxPrice]);
                        }}
                      ></div>
                      {/* Max Thumb */}
                      <div
                        className="absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full cursor-pointer shadow-md hover:shadow-lg top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `calc(${calculatePercentage(filters.maxPrice, 0, 5000000)}%)`,
                          zIndex: 20
                        }}
                        // Simplified slider logic for max price
                        onMouseDown={() => {
                          // Set max price to a reasonable value when clicked
                          const newMaxPrice = Math.min(5000000, (filters.maxPrice || 5000000) + 50000);
                          handlePriceRangeChange([filters.minPrice, newMaxPrice]);
                        }}
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
                            key={`price-range-${idx}-${range.min || 0}-${range.max || 5000000}`}
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
