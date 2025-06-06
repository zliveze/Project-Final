import React, { useEffect, useState, useRef } from 'react';
import { ProductFormData } from '../types';
import { skinTypes, skinConcerns } from '@/data/skinData';
import { PlusCircle, X, Tag, Droplet } from 'lucide-react';

interface CosmeticInfoTabProps {
  formData: ProductFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleConcernsChange: (concerns: string[]) => void;
  handleIngredientsChange: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  removeConcern: (index: number) => void;
  removeIngredient: (index: number) => void;
  isViewMode?: boolean;
  brands: { id: string; name: string; origin?: string }[];
}

/**
 * Component tab thông tin mỹ phẩm
 */
const CosmeticInfoTab: React.FC<CosmeticInfoTabProps> = ({
  formData,
  handleInputChange,
  handleConcernsChange,
  handleIngredientsChange,
  removeConcern,
  removeIngredient,
  isViewMode = false,
  brands
}) => {
  // State cho input tùy chỉnh
  const [customSkinType, setCustomSkinType] = useState<string>('');
  const [customConcern, setCustomConcern] = useState<string>('');
  const [showSkinTypeDropdown, setShowSkinTypeDropdown] = useState<boolean>(false);
  const [showConcernDropdown, setShowConcernDropdown] = useState<boolean>(false);

  // Refs cho dropdowns
  const skinTypeDropdownRef = useRef<HTMLDivElement>(null);
  const concernDropdownRef = useRef<HTMLDivElement>(null);

  // Tìm thương hiệu hiện tại dựa trên brandId
  const currentBrand = brands.find(brand => brand.id === formData.brandId);

  // Tự động cập nhật trường xuất xứ khi thương hiệu thay đổi
  useEffect(() => {
    if (currentBrand?.origin && !formData.cosmetic_info?.madeIn) {
      // Chỉ tự động điền nếu trường madeIn đang trống
      handleInputChange({
        target: {
          name: 'cosmetic_info.madeIn',
          value: currentBrand.origin
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [formData.brandId, currentBrand, formData.cosmetic_info?.madeIn, handleInputChange]);

  // Xử lý click bên ngoài dropdown để đóng
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skinTypeDropdownRef.current && !skinTypeDropdownRef.current.contains(event.target as Node)) {
        setShowSkinTypeDropdown(false);
      }
      if (concernDropdownRef.current && !concernDropdownRef.current.contains(event.target as Node)) {
        setShowConcernDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Xử lý thêm loại da tùy chỉnh
  const handleAddCustomSkinType = () => {
    if (customSkinType.trim()) {
      const currentSkinTypes = formData.cosmetic_info?.skinType || [];
      if (!currentSkinTypes.includes(customSkinType.trim())) {
       handleInputChange({
         target: {
           name: 'cosmetic_info.skinType',
           value: [...currentSkinTypes, customSkinType.trim()]
         }
       } as unknown as React.ChangeEvent<HTMLInputElement>); // Updated cast
      }
      setCustomSkinType('');
    }
  };

  // Xử lý thêm vấn đề da tùy chỉnh
  const handleAddCustomConcern = () => {
    if (customConcern.trim()) {
      const currentConcerns = formData.cosmetic_info?.concerns || [];
      if (!currentConcerns.includes(customConcern.trim())) {
        handleConcernsChange([...currentConcerns, customConcern.trim()]);
      }
      setCustomConcern('');
    }
  };

  // Xử lý chọn loại da từ danh sách
  const handleSelectSkinType = (skinTypeId: string) => {
    const selectedSkinType = skinTypes.find(type => type.id === skinTypeId);
    if (!selectedSkinType) return; // Không tìm thấy loại da

    const skinTypeLabel = selectedSkinType.label; // Lấy label thay vì id
    const currentSkinTypes = formData.cosmetic_info?.skinType || [];

    // Nếu đã chọn thì bỏ chọn, nếu chưa chọn thì thêm vào
    if (currentSkinTypes.includes(skinTypeLabel)) {
      handleInputChange({
        target: {
           name: 'cosmetic_info.skinType',
           value: currentSkinTypes.filter(type => type !== skinTypeLabel)
         }
       } as unknown as React.ChangeEvent<HTMLInputElement>);
    } else {
      handleInputChange({
        target: {
           name: 'cosmetic_info.skinType',
           value: [...currentSkinTypes, skinTypeLabel] // Thêm label vào mảng
         }
       } as unknown as React.ChangeEvent<HTMLInputElement>); // Updated cast for manual event
    }
    // Không đóng dropdown sau khi chọn để người dùng có thể chọn nhiều loại da
  };

  // Xử lý chọn vấn đề da từ danh sách
  const handleSelectConcern = (concernId: string) => {
    const selectedConcern = skinConcerns.find(concern => concern.id === concernId);
    if (!selectedConcern) return; // Không tìm thấy vấn đề da

    const concernLabel = selectedConcern.label; // Lấy label thay vì id
    const currentConcerns = formData.cosmetic_info?.concerns || [];

    // Nếu đã chọn thì bỏ chọn, nếu chưa chọn thì thêm vào
    if (currentConcerns.includes(concernLabel)) {
      handleConcernsChange(currentConcerns.filter(concern => concern !== concernLabel));
    } else {
      handleConcernsChange([...currentConcerns, concernLabel]); // Thêm label vào mảng
    }
    // Không đóng dropdown sau khi chọn để người dùng có thể chọn nhiều vấn đề da
  };

  // Xử lý xóa loại da
  const handleRemoveSkinType = (index: number) => {
    const currentSkinTypes = [...(formData.cosmetic_info?.skinType || [])];
    currentSkinTypes.splice(index, 1);
       handleInputChange({
         target: {
           name: 'cosmetic_info.skinType',
           value: currentSkinTypes
         }
       } as unknown as React.ChangeEvent<HTMLInputElement>); // Updated cast for manual event
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Thông tin mỹ phẩm</h3>

      {/* Loại da */}
      <div className="space-y-2">
        <label htmlFor="skinType" className="text-sm font-medium text-gray-700 flex items-center">
          <Droplet className="h-4 w-4 mr-1.5 text-blue-500" strokeWidth={1.5} />
          Loại da phù hợp
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="relative" ref={skinTypeDropdownRef}>
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <input
                  type="text"
                  value={customSkinType}
                  onChange={(e) => setCustomSkinType(e.target.value)}
                  placeholder={formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.length > 0
                    ? `${formData.cosmetic_info.skinType.length} loại da được chọn`
                    : 'Nhập loại da phù hợp...'}
                  className="flex-grow border-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 rounded-l-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customSkinType.trim()) {
                      e.preventDefault();
                      handleAddCustomSkinType();
                    }
                  }}
                />
                <div
                  className="px-2 py-2 cursor-pointer"
                  onClick={() => setShowSkinTypeDropdown(!showSkinTypeDropdown)}
                >
                  <PlusCircle className="h-5 w-5 text-pink-500" />
                </div>
              </div>

              {showSkinTypeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">Loại da phổ biến</div>
                    <div className="grid grid-cols-2 gap-1">
                      {skinTypes.map((type) => {
                        const isSelected = formData.cosmetic_info?.skinType?.includes(type.label);
                        return (
                          <div
                            key={type.id}
                            className={`text-sm p-2 rounded-md cursor-pointer flex items-center ${isSelected ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-100'}`}
                            onClick={() => handleSelectSkinType(type.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              className="mr-2 h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                              onChange={() => {}} // Xử lý thông qua onClick của div cha
                            />
                            {type.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-2 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSkinTypeDropdown(false)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-200 focus:outline-none"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hiển thị các loại da đã chọn */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.map((skinTypeName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skinTypeName} {/* Hiển thị trực tiếp tên */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkinType(index)}
                      className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-sm">
            {formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.cosmetic_info.skinType.map((skinTypeName, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {skinTypeName} {/* Hiển thị trực tiếp tên */}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">Không có loại da được chọn</span>
            )}
          </div>
        )}
      </div>

      {/* Vấn đề da */}
      <div className="space-y-2">
        <label htmlFor="concerns" className="text-sm font-medium text-gray-700 flex items-center">
          <Tag className="h-4 w-4 mr-1.5 text-purple-500" strokeWidth={1.5} />
          Vấn đề da đặc trị
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="relative" ref={concernDropdownRef}>
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <input
                  type="text"
                  value={customConcern}
                  onChange={(e) => setCustomConcern(e.target.value)}
                  placeholder={formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.length > 0
                    ? `${formData.cosmetic_info.concerns.length} vấn đề da được chọn`
                    : 'Nhập vấn đề da đặc trị...'}
                  className="flex-grow border-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 rounded-l-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customConcern.trim()) {
                      e.preventDefault();
                      handleAddCustomConcern();
                    }
                  }}
                />
                <div
                  className="px-2 py-2 cursor-pointer"
                  onClick={() => setShowConcernDropdown(!showConcernDropdown)}
                >
                  <PlusCircle className="h-5 w-5 text-pink-500" />
                </div>
              </div>

              {showConcernDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">Vấn đề da phổ biến</div>
                    <div className="grid grid-cols-2 gap-1">
                      {skinConcerns.map((concern) => {
                        const isSelected = formData.cosmetic_info?.concerns?.includes(concern.label);
                        return (
                          <div
                            key={concern.id}
                            className={`text-sm p-2 rounded-md cursor-pointer flex items-center ${isSelected ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-100'}`}
                            onClick={() => handleSelectConcern(concern.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              className="mr-2 h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                              onChange={() => {}} // Xử lý thông qua onClick của div cha
                            />
                            {concern.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-2 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowConcernDropdown(false)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-200 focus:outline-none"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hiển thị các vấn đề da đã chọn */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.map((concernName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {concernName} {/* Hiển thị trực tiếp tên */}
                    <button
                      type="button"
                      onClick={() => removeConcern(index)}
                      className="ml-1.5 inline-flex text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.length > 0 ? (
              formData.cosmetic_info.concerns.map((concernName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {concernName} {/* Hiển thị trực tiếp tên */}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">Không có vấn đề da được chỉ định</span>
            )}
          </div>
        )}
      </div>

      {/* Thành phần */}
      <div className="space-y-2">
        <label htmlFor="ingredients" className="text-sm font-medium text-gray-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Thành phần nổi bật
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="flex items-center border border-gray-300 rounded-md bg-white">
              <input
                type="text"
                id="ingredients"
                placeholder="Nhập thành phần và nhấn Enter"
                onKeyDown={handleIngredientsChange}
                className="flex-grow border-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 rounded-md"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cosmetic_info?.ingredients && formData.cosmetic_info.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="ml-1.5 inline-flex text-green-400 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.cosmetic_info?.ingredients && formData.cosmetic_info.ingredients.length > 0 ? (
              formData.cosmetic_info.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {ingredient}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">Không có thành phần nổi bật được liệt kê</span>
            )}
          </div>
        )}
      </div>

      {/* Dung tích */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="volume.value" className="text-sm font-medium text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Dung tích
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="volume.value"
              name="cosmetic_info.volume.value"
              // Use ?? '' to show empty string for null/undefined, but 0 for 0
              value={formData.cosmetic_info?.volume?.value ?? ''}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="1"
              className="focus:ring-pink-500 focus:border-pink-500 flex-1 block w-full rounded-l-md sm:text-sm border-gray-300 disabled:bg-gray-100 px-3 py-2"
            />
            <select
              id="volume.unit"
              name="cosmetic_info.volume.unit"
              value={formData.cosmetic_info?.volume?.unit || 'ml'}
              onChange={handleInputChange}
              disabled={isViewMode}
              className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="oz">oz</option>
              <option value="fl oz">fl oz</option>
            </select>
          </div>
        </div>

        {/* Xuất xứ */}
        <div className="space-y-2">
          <label htmlFor="madeIn" className="text-sm font-medium text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Xuất xứ
            {currentBrand?.origin && !formData.cosmetic_info?.madeIn && (
              <span className="ml-1 text-xs text-pink-500">(Tự động từ thương hiệu)</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              id="madeIn"
              name="cosmetic_info.madeIn"
              value={formData.cosmetic_info?.madeIn || ''}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder={currentBrand?.origin ? `${currentBrand.origin} (từ thương hiệu)` : "Quốc gia sản xuất"}
              className="mt-1 focus:ring-pink-500 focus:border-pink-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md disabled:bg-gray-100"
            />
            {currentBrand?.origin && formData.cosmetic_info?.madeIn !== currentBrand.origin && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gợi ý từ thương hiệu: {currentBrand.origin}
              </div>
            )}
          </div>
        </div>

        {/* Hạn sử dụng */}
        <div className="space-y-2">
          <label htmlFor="expiry.shelf" className="text-sm font-medium text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Hạn sử dụng (tháng)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="expiry.shelf"
              name="cosmetic_info.expiry.shelf"
              // Use ?? '' to show empty string for null/undefined, but 0 for 0
              value={formData.cosmetic_info?.expiry?.shelf ?? ''}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              className="focus:ring-pink-500 focus:border-pink-500 flex-1 block w-full rounded-l-md sm:text-sm border-gray-300 disabled:bg-gray-100 px-3 py-2"
            />
            <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              tháng
            </span>
          </div>
        </div>

        {/* Hạn sau khi mở */}
        <div className="space-y-2">
          <label htmlFor="expiry.afterOpening" className="text-sm font-medium text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Hạn sau khi mở (tháng)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="expiry.afterOpening"
              name="cosmetic_info.expiry.afterOpening"
              // Use ?? '' to show empty string for null/undefined, but 0 for 0
              value={formData.cosmetic_info?.expiry?.afterOpening ?? ''}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              className="focus:ring-pink-500 focus:border-pink-500 flex-1 block w-full rounded-l-md sm:text-sm border-gray-300 disabled:bg-gray-100 px-3 py-2"
            />
            <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              tháng
            </span>
          </div>
        </div>
      </div>

      {/* Hướng dẫn sử dụng */}
      <div className="space-y-2">
        <label htmlFor="usage" className="text-sm font-medium text-gray-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Hướng dẫn sử dụng
        </label>
        <textarea
          id="usage"
          name="cosmetic_info.usage"
          rows={4}
          value={formData.cosmetic_info?.usage || ''}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Nhập hướng dẫn sử dụng sản phẩm..."
          className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
      </div>
    </div>
  );
};

export default CosmeticInfoTab;
