import React, { useState, useRef, useEffect } from 'react';
import { FaFilter, FaChevronDown, FaChevronUp, FaGift, FaPercent, FaShippingFast, FaStar, FaHeart, FaRegStar } from 'react-icons/fa';
import { IoMdColorPalette } from 'react-icons/io';
import { GiMilkCarton } from 'react-icons/gi';
import { TbBottle } from 'react-icons/tb';
import Image from 'next/image';

interface FilterSection {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  type: 'checkbox' | 'range' | 'radio' | 'color' | 'rating';
  options?: { id: string; label: string; color?: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface ShopFiltersProps {
  filters: {
    categories: string[];
    brands: string[];
    priceRange: number[];
    skinType: string[];
    concerns: string[];
    sortBy: string;
    rating: number;
    hasPromotion: boolean;
    hasFreeShipping: boolean;
    hasGifts: boolean;
    colors: string[];
    volume: string[];
  };
  onFilterChange: (newFilters: any) => void;
}

const ShopFilters: React.FC<ShopFiltersProps> = ({ filters, onFilterChange }) => {
  const [minPriceInput, setMinPriceInput] = useState<string>(filters.priceRange[0].toString());
  const [maxPriceInput, setMaxPriceInput] = useState<string>(filters.priceRange[1].toString());
  const [sections, setSections] = useState<FilterSection[]>([
    {
      title: 'Danh mục',
      icon: <FaFilter />,
      isOpen: true,
      type: 'checkbox',
      options: [
        { id: 'skincare', label: 'Chăm sóc da' },
        { id: 'makeup', label: 'Trang điểm' },
        { id: 'haircare', label: 'Chăm sóc tóc' },
        { id: 'bodycare', label: 'Chăm sóc cơ thể' },
        { id: 'fragrance', label: 'Nước hoa' },
        { id: 'tools', label: 'Dụng cụ làm đẹp' },
        { id: 'sets', label: 'Bộ sản phẩm' }
      ]
    },
    {
      title: 'Thương hiệu',
      icon: <FaHeart />,
      isOpen: true,
      type: 'checkbox',
      options: [
        { id: 'brand1', label: 'Innisfree' },
        { id: 'brand2', label: 'The Face Shop' },
        { id: 'brand3', label: 'Laneige' },
        { id: 'brand4', label: 'Sulwhasoo' },
        { id: 'brand5', label: 'Mamonde' },
        { id: 'brand6', label: 'Etude House' },
        { id: 'brand7', label: 'Missha' },
        { id: 'brand8', label: 'Xem thêm...' }
      ]
    },
    {
      title: 'Khoảng giá',
      icon: <FaPercent />,
      isOpen: true,
      type: 'range',
      min: 0,
      max: 5000000,
      step: 100000
    },
    {
      title: 'Loại da',
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
    {
      title: 'Màu sắc',
      icon: <IoMdColorPalette />,
      isOpen: true,
      type: 'color',
      options: [
        { id: 'red', label: 'Đỏ', color: '#e53e3e' },
        { id: 'pink', label: 'Hồng', color: '#ed64a6' },
        { id: 'orange', label: 'Cam', color: '#ed8936' },
        { id: 'yellow', label: 'Vàng', color: '#ecc94b' },
        { id: 'green', label: 'Xanh lá', color: '#48bb78' },
        { id: 'blue', label: 'Xanh dương', color: '#4299e1' },
        { id: 'purple', label: 'Tím', color: '#9f7aea' },
        { id: 'black', label: 'Đen', color: '#1a202c' },
        { id: 'white', label: 'Trắng', color: '#ffffff' }
      ]
    },
    {
      title: 'Đánh giá',
      icon: <FaStar />,
      isOpen: true,
      type: 'rating',
      options: [
        { id: '5', label: '5 sao' },
        { id: '4', label: '4 sao trở lên' },
        { id: '3', label: '3 sao trở lên' },
        { id: '2', label: '2 sao trở lên' },
        { id: '1', label: '1 sao trở lên' }
      ]
    },
    {
      title: 'Dung tích',
      icon: <TbBottle />,
      isOpen: true,
      type: 'checkbox',
      options: [
        { id: 'mini', label: 'Mini (dưới 30ml)' },
        { id: 'small', label: 'Nhỏ (30-50ml)' },
        { id: 'medium', label: 'Vừa (50-100ml)' },
        { id: 'large', label: 'Lớn (100-200ml)' },
        { id: 'xlarge', label: 'Rất lớn (trên 200ml)' }
      ]
    }
  ]);

  // Giữ lại khoảng giá đã chọn vào lần render trước
  const prevMinPrice = useRef(filters.priceRange[0]);
  const prevMaxPrice = useRef(filters.priceRange[1]);

  // Mức giá phổ biến
  const popularPriceRanges = [
    { min: 0, max: 150000, label: 'Dưới 150.000đ' },
    { min: 150000, max: 300000, label: '150.000đ - 300.000đ' },
    { min: 300000, max: 500000, label: '300.000đ - 500.000đ' },
    { min: 500000, max: 1000000, label: '500.000đ - 1.000.000đ' },
    { min: 1000000, max: 5000000, label: 'Trên 1.000.000đ' }
  ];

  // Cập nhật giá trị input khi filters thay đổi
  useEffect(() => {
    setMinPriceInput(filters.priceRange[0].toString());
    setMaxPriceInput(filters.priceRange[1].toString());
  }, [filters.priceRange]);

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].isOpen = !newSections[index].isOpen;
    setSections(newSections);
  };

  const handleCheckboxChange = (sectionTitle: string, optionId: string, checked: boolean) => {
    let newFilters = { ...filters };
    
    switch (sectionTitle) {
      case 'Danh mục':
        if (checked) {
          newFilters.categories = [...filters.categories, optionId];
        } else {
          newFilters.categories = filters.categories.filter(id => id !== optionId);
        }
        break;
      case 'Thương hiệu':
        if (checked) {
          newFilters.brands = [...filters.brands, optionId];
        } else {
          newFilters.brands = filters.brands.filter(id => id !== optionId);
        }
        break;
      case 'Loại da':
        if (checked) {
          newFilters.skinType = [...filters.skinType, optionId];
        } else {
          newFilters.skinType = filters.skinType.filter(id => id !== optionId);
        }
        break;
      case 'Vấn đề da':
        if (checked) {
          newFilters.concerns = [...filters.concerns, optionId];
        } else {
          newFilters.concerns = filters.concerns.filter(id => id !== optionId);
        }
        break;
      case 'Màu sắc':
        if (checked) {
          newFilters.colors = [...(filters.colors || []), optionId];
        } else {
          newFilters.colors = (filters.colors || []).filter(id => id !== optionId);
        }
        break;
      case 'Dung tích':
        if (checked) {
          newFilters.volume = [...(filters.volume || []), optionId];
        } else {
          newFilters.volume = (filters.volume || []).filter(id => id !== optionId);
        }
        break;
    }
    
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (values: number[]) => {
    onFilterChange({ priceRange: values });
  };

  const handleMinPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinPriceInput(e.target.value);
  };

  const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPriceInput(e.target.value);
  };

  const handlePriceInputBlur = () => {
    let min = parseInt(minPriceInput) || 0;
    let max = parseInt(maxPriceInput) || 5000000;
    
    // Đảm bảo min <= max
    if (min > max) {
      [min, max] = [max, min];
    }
    
    // Đảm bảo giá trị nằm trong khoảng cho phép
    min = Math.max(0, Math.min(min, 5000000));
    max = Math.max(0, Math.min(max, 5000000));
    
    handlePriceRangeChange([min, max]);
  };

  const handlePopularPriceRangeClick = (min: number, max: number) => {
    onFilterChange({ priceRange: [min, max] });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ rating });
  };

  const handlePromotionChange = (type: 'hasPromotion' | 'hasFreeShipping' | 'hasGifts', checked: boolean) => {
    onFilterChange({ [type]: checked });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Tính toán phần trăm cho thanh trượt
  const calculatePercentage = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FaFilter className="mr-2" /> Bộ lọc
        </h2>
        <button 
          className="text-sm text-[#306E51] hover:underline"
          onClick={() => onFilterChange({
            categories: [],
            brands: [],
            priceRange: [0, 5000000],
            skinType: [],
            concerns: [],
            sortBy: 'popularity',
            rating: 0,
            hasPromotion: false,
            hasFreeShipping: false,
            hasGifts: false,
            colors: [],
            volume: []
          })}
        >
          Xóa tất cả
        </button>
      </div>

      {/* Khuyến mãi đặc biệt */}
      <div className="mb-6 bg-gradient-to-r from-[#fdf2f8] to-[#f5f3ff] p-3 rounded-lg">
        <h3 className="font-medium text-[#d53f8c] mb-2">Khuyến mãi đặc biệt</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasPromotion"
              className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
              checked={filters.hasPromotion || false}
              onChange={(e) => handlePromotionChange('hasPromotion', e.target.checked)}
            />
            <label htmlFor="hasPromotion" className="text-sm flex items-center">
              <FaPercent className="mr-1 text-red-500" /> Đang giảm giá
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasFreeShipping"
              className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
              checked={filters.hasFreeShipping || false}
              onChange={(e) => handlePromotionChange('hasFreeShipping', e.target.checked)}
            />
            <label htmlFor="hasFreeShipping" className="text-sm flex items-center">
              <FaShippingFast className="mr-1 text-green-500" /> Miễn phí vận chuyển
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasGifts"
              className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
              checked={filters.hasGifts || false}
              onChange={(e) => handlePromotionChange('hasGifts', e.target.checked)}
            />
            <label htmlFor="hasGifts" className="text-sm flex items-center">
              <FaGift className="mr-1 text-pink-500" /> Có quà tặng kèm
            </label>
          </div>
        </div>
      </div>

      {/* Thương hiệu nổi bật */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Thương hiệu nổi bật</h3>
        <div className="grid grid-cols-3 gap-2">
          {['Innisfree', 'Laneige', 'Sulwhasoo', 'Missha', 'Etude', 'Mamonde'].map((brand, index) => (
            <div 
              key={index} 
              className="border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer hover:border-[#d53f8c] hover:bg-[#fdf2f8] transition-colors"
              onClick={() => {
                const brandId = `brand${index + 1}`;
                const isSelected = filters.brands.includes(brandId);
                handleCheckboxChange('Thương hiệu', brandId, !isSelected);
              }}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full mb-1 flex items-center justify-center text-xs font-bold">
                {brand.substring(0, 2)}
              </div>
              <span className="text-xs text-center">{brand}</span>
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
                          id={option.id}
                          className="mr-2 text-[#d53f8c] focus:ring-[#d53f8c]"
                          checked={
                            section.title === 'Danh mục' ? filters.categories.includes(option.id) :
                            section.title === 'Thương hiệu' ? filters.brands.includes(option.id) :
                            section.title === 'Loại da' ? filters.skinType.includes(option.id) :
                            section.title === 'Vấn đề da' ? filters.concerns.includes(option.id) :
                            section.title === 'Màu sắc' ? (filters.colors || []).includes(option.id) :
                            section.title === 'Dung tích' ? (filters.volume || []).includes(option.id) : false
                          }
                          onChange={(e) => handleCheckboxChange(section.title, option.id, e.target.checked)}
                        />
                        <label htmlFor={option.id} className="text-sm">{option.label}</label>
                      </div>
                    ))}
                  </div>
                )}
                
                {section.type === 'range' && (
                  <div className="mt-4">
                    {/* Nhập khoảng giá trực tiếp */}
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
                    
                    {/* Thanh trượt khoảng giá với hai nút điều chỉnh */}
                    <div className="relative mt-8 mb-6">
                      {/* Thanh nền */}
                      <div className="absolute top-2.5 h-1 w-full bg-gray-200 rounded"></div>
                      
                      {/* Thanh giá trị đã chọn */}
                      <div 
                        className="absolute h-1 bg-gradient-to-r from-[#d53f8c] to-[#805ad5] rounded"
                        style={{
                          left: `${calculatePercentage(filters.priceRange[0], 0, 5000000)}%`,
                          width: `${calculatePercentage(filters.priceRange[1] - filters.priceRange[0], 0, 5000000)}%`
                        }}
                      ></div>
                      
                      {/* Nút điều chỉnh giá trị tối thiểu */}
                      <div 
                        className="absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full cursor-pointer shadow-md hover:shadow-lg"
                        style={{ 
                          left: `calc(${calculatePercentage(filters.priceRange[0], 0, 5000000)}% - 10px)`,
                          top: '0px',
                          zIndex: 10
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          
                          const sliderRect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (!sliderRect) return;
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            if (!sliderRect) return;
                            
                            const newPosition = (moveEvent.clientX - sliderRect.left) / sliderRect.width;
                            const newValue = Math.max(0, Math.min(1, newPosition)) * 5000000;
                            const roundedValue = Math.round(newValue / 10000) * 10000;
                            
                            if (roundedValue <= filters.priceRange[1]) {
                              handlePriceRangeChange([roundedValue, filters.priceRange[1]]);
                            }
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      ></div>
                      
                      {/* Nút điều chỉnh giá trị tối đa */}
                      <div 
                        className="absolute w-5 h-5 bg-white border-2 border-[#d53f8c] rounded-full cursor-pointer shadow-md hover:shadow-lg"
                        style={{ 
                          left: `calc(${calculatePercentage(filters.priceRange[1], 0, 5000000)}% - 10px)`,
                          top: '0px',
                          zIndex: 20
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          
                          const sliderRect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (!sliderRect) return;
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            if (!sliderRect) return;
                            
                            const newPosition = (moveEvent.clientX - sliderRect.left) / sliderRect.width;
                            const newValue = Math.max(0, Math.min(1, newPosition)) * 5000000;
                            const roundedValue = Math.round(newValue / 10000) * 10000;
                            
                            if (roundedValue >= filters.priceRange[0]) {
                              handlePriceRangeChange([filters.priceRange[0], roundedValue]);
                            }
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      ></div>
                      
                      {/* Hiển thị giá trị đã chọn */}
                      <div className="relative pt-6">
                        <div 
                          className="absolute text-xs bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white px-2 py-1 rounded -translate-x-1/2"
                          style={{ left: `${calculatePercentage(filters.priceRange[0], 0, 5000000)}%` }}
                        >
                          {formatPrice(filters.priceRange[0]).replace('₫', '')}
                        </div>
                        <div 
                          className="absolute text-xs bg-gradient-to-r from-[#d53f8c] to-[#805ad5] text-white px-2 py-1 rounded -translate-x-1/2"
                          style={{ left: `${calculatePercentage(filters.priceRange[1], 0, 5000000)}%` }}
                        >
                          {formatPrice(filters.priceRange[1]).replace('₫', '')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Các mức giá phổ biến */}
                    <div className="mt-8">
                      <h4 className="text-sm font-medium mb-2">Mức giá phổ biến</h4>
                      <div className="space-y-2">
                        {popularPriceRanges.map((range, idx) => (
                          <div 
                            key={idx}
                            className={`text-sm py-1 px-2 rounded cursor-pointer ${
                              filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                                ? 'bg-[#fdf2f8] text-[#d53f8c]'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handlePopularPriceRangeClick(range.min, range.max)}
                          >
                            {range.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.type === 'color' && section.options && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {section.options.map(option => (
                      <div 
                        key={option.id} 
                        className="flex flex-col items-center"
                        onClick={() => handleCheckboxChange(section.title, option.id, !(filters.colors || []).includes(option.id))}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full cursor-pointer border-2 ${(filters.colors || []).includes(option.id) ? 'border-[#d53f8c]' : 'border-gray-300'}`}
                          style={{ backgroundColor: option.color }}
                        >
                          {(filters.colors || []).includes(option.id) && (
                            <div className="flex items-center justify-center h-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="text-xs mt-1">{option.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'rating' && (
                  <div className="space-y-2 mt-2">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div 
                        key={rating} 
                        className={`flex items-center p-2 rounded cursor-pointer ${filters.rating === rating ? 'bg-[#fdf2f8]' : 'hover:bg-gray-50'}`}
                        onClick={() => handleRatingChange(rating)}
                      >
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>
                              {i < rating ? (
                                <FaStar className="text-yellow-400 w-4 h-4" />
                              ) : (
                                <FaRegStar className="text-gray-300 w-4 h-4" />
                              )}
                            </span>
                          ))}
                        </div>
                        <span className="text-sm">{rating === 1 ? '1 sao trở lên' : `${rating} sao trở lên`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Banner quảng cáo */}
      <div className="mt-6">
        <div className="relative overflow-hidden rounded-lg">
          <div className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] p-4 text-white rounded-lg">
            <h3 className="font-bold text-lg mb-1">Ưu đãi đặc biệt</h3>
            <p className="text-sm mb-2">Giảm thêm 10% cho đơn hàng từ 500K</p>
            <button className="bg-white text-[#d53f8c] px-3 py-1 rounded text-sm font-medium hover:bg-[#fdf2f8] transition-colors">
              Xem ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopFilters; 