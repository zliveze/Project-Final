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
  }, [formData.brandId, currentBrand]);

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
        } as React.ChangeEvent<HTMLSelectElement>);
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
  const handleSelectSkinType = (skinType: string) => {
    const currentSkinTypes = formData.cosmetic_info?.skinType || [];
    if (!currentSkinTypes.includes(skinType)) {
      handleInputChange({
        target: {
          name: 'cosmetic_info.skinType',
          value: [...currentSkinTypes, skinType]
        }
      } as React.ChangeEvent<HTMLSelectElement>);
    }
    setShowSkinTypeDropdown(false);
  };

  // Xử lý chọn vấn đề da từ danh sách
  const handleSelectConcern = (concern: string) => {
    const currentConcerns = formData.cosmetic_info?.concerns || [];
    if (!currentConcerns.includes(concern)) {
      handleConcernsChange([...currentConcerns, concern]);
    }
    setShowConcernDropdown(false);
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
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Thông tin mỹ phẩm</h3>

      {/* Loại da */}
      <div className="space-y-2">
        <label htmlFor="skinType" className="block text-sm font-medium text-gray-700 flex items-center">
          <Droplet className="h-4 w-4 mr-1.5 text-blue-500" strokeWidth={1.5} />
          Loại da phù hợp
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="relative" ref={skinTypeDropdownRef}>
              <div
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer"
                onClick={() => setShowSkinTypeDropdown(!showSkinTypeDropdown)}
              >
                <span className="text-sm text-gray-500 flex-grow">
                  {formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.length > 0
                    ? `${formData.cosmetic_info.skinType.length} loại da được chọn`
                    : 'Chọn loại da phù hợp'}
                </span>
                <PlusCircle className="h-5 w-5 text-pink-500" />
              </div>

              {showSkinTypeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">Loại da phổ biến</div>
                    <div className="grid grid-cols-2 gap-1">
                      {skinTypes.map((type) => {
                        const isSelected = formData.cosmetic_info?.skinType?.includes(type.id);
                        return (
                          <div
                            key={type.id}
                            className={`text-sm p-2 rounded-md cursor-pointer ${isSelected ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-100'}`}
                            onClick={() => handleSelectSkinType(type.id)}
                          >
                            {type.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Thêm loại da tùy chỉnh</div>
                    <div className="flex">
                      <input
                        type="text"
                        value={customSkinType}
                        onChange={(e) => setCustomSkinType(e.target.value)}
                        placeholder="Nhập loại da khác..."
                        className="flex-grow border border-gray-300 rounded-l-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkinType();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSkinType}
                        className="bg-pink-500 text-white px-3 py-1.5 rounded-r-md text-sm hover:bg-pink-600 focus:outline-none"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hiển thị các loại da đã chọn */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.map((type, index) => {
                // Tìm label tương ứng từ danh sách có sẵn
                const skinTypeObj = skinTypes.find(item => item.id === type);
                const label = skinTypeObj ? skinTypeObj.label : type;

                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkinType(index)}
                      className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-sm">
            {formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.cosmetic_info.skinType.map((type, index) => {
                  // Tìm label tương ứng từ danh sách có sẵn
                  const skinTypeObj = skinTypes.find(item => item.id === type);
                  const label = skinTypeObj ? skinTypeObj.label : type;

                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-gray-500">Không có loại da được chọn</span>
            )}
          </div>
        )}
      </div>

      {/* Vấn đề da */}
      <div className="space-y-2">
        <label htmlFor="concerns" className="block text-sm font-medium text-gray-700 flex items-center">
          <Tag className="h-4 w-4 mr-1.5 text-purple-500" strokeWidth={1.5} />
          Vấn đề da đặc trị
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="relative" ref={concernDropdownRef}>
              <div
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer"
                onClick={() => setShowConcernDropdown(!showConcernDropdown)}
              >
                <span className="text-sm text-gray-500 flex-grow">
                  {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.length > 0
                    ? `${formData.cosmetic_info.concerns.length} vấn đề da được chọn`
                    : 'Chọn vấn đề da đặc trị'}
                </span>
                <PlusCircle className="h-5 w-5 text-pink-500" />
              </div>

              {showConcernDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">Vấn đề da phổ biến</div>
                    <div className="grid grid-cols-2 gap-1">
                      {skinConcerns.map((concern) => {
                        const isSelected = formData.cosmetic_info?.concerns?.includes(concern.id);
                        return (
                          <div
                            key={concern.id}
                            className={`text-sm p-2 rounded-md cursor-pointer ${isSelected ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-100'}`}
                            onClick={() => handleSelectConcern(concern.id)}
                          >
                            {concern.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Thêm vấn đề da tùy chỉnh</div>
                    <div className="flex">
                      <input
                        type="text"
                        value={customConcern}
                        onChange={(e) => setCustomConcern(e.target.value)}
                        placeholder="Nhập vấn đề da khác..."
                        className="flex-grow border border-gray-300 rounded-l-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomConcern();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomConcern}
                        className="bg-pink-500 text-white px-3 py-1.5 rounded-r-md text-sm hover:bg-pink-600 focus:outline-none"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hiển thị các vấn đề da đã chọn */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.map((concern, index) => {
                // Tìm label tương ứng từ danh sách có sẵn
                const concernObj = skinConcerns.find(item => item.id === concern);
                const label = concernObj ? concernObj.label : concern;

                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => removeConcern(index)}
                      className="ml-1.5 inline-flex text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.length > 0 ? (
              formData.cosmetic_info.concerns.map((concern, index) => {
                // Tìm label tương ứng từ danh sách có sẵn
                const concernObj = skinConcerns.find(item => item.id === concern);
                const label = concernObj ? concernObj.label : concern;

                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {label}
                  </span>
                );
              })
            ) : (
              <span className="text-sm text-gray-500">Không có vấn đề da được chỉ định</span>
            )}
          </div>
        )}
      </div>

      {/* Thành phần */}
      <div className="space-y-2">
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
          Thành phần nổi bật
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                id="ingredients"
                placeholder="Nhập thành phần và nhấn Enter"
                onKeyDown={handleIngredientsChange}
                className="focus:ring-pink-500 focus:border-pink-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
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
                    className="ml-1 inline-flex text-green-400 hover:text-green-600"
                  >
                    <span className="sr-only">Xóa</span>
                    ×
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
          <label htmlFor="volume.value" className="block text-sm font-medium text-gray-700">
            Dung tích
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="volume.value"
              name="cosmetic_info.volume.value"
              value={formData.cosmetic_info?.volume?.value || 0}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="1"
              className="focus:ring-pink-500 focus:border-pink-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 disabled:bg-gray-100"
            />
            <select
              id="volume.unit"
              name="cosmetic_info.volume.unit"
              value={formData.cosmetic_info?.volume?.unit || 'ml'}
              onChange={handleInputChange}
              disabled={isViewMode}
              className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm disabled:bg-gray-100"
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
          <label htmlFor="madeIn" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 focus:ring-pink-500 focus:border-pink-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
            />
            {currentBrand?.origin && formData.cosmetic_info?.madeIn !== currentBrand.origin && (
              <div className="mt-1 text-xs text-gray-500">
                Gợi ý từ thương hiệu: {currentBrand.origin}
              </div>
            )}
          </div>
        </div>

        {/* Hạn sử dụng */}
        <div className="space-y-2">
          <label htmlFor="expiry.shelf" className="block text-sm font-medium text-gray-700">
            Hạn sử dụng (tháng)
          </label>
          <input
            type="number"
            id="expiry.shelf"
            name="cosmetic_info.expiry.shelf"
            value={formData.cosmetic_info?.expiry?.shelf || 0}
            onChange={handleInputChange}
            disabled={isViewMode}
            min="0"
            className="mt-1 focus:ring-pink-500 focus:border-pink-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* Hạn sau khi mở */}
        <div className="space-y-2">
          <label htmlFor="expiry.afterOpening" className="block text-sm font-medium text-gray-700">
            Hạn sau khi mở (tháng)
          </label>
          <input
            type="number"
            id="expiry.afterOpening"
            name="cosmetic_info.expiry.afterOpening"
            value={formData.cosmetic_info?.expiry?.afterOpening || 0}
            onChange={handleInputChange}
            disabled={isViewMode}
            min="0"
            className="mt-1 focus:ring-pink-500 focus:border-pink-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Hướng dẫn sử dụng */}
      <div className="space-y-2">
        <label htmlFor="usage" className="block text-sm font-medium text-gray-700">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
      </div>
    </div>
  );
};

export default CosmeticInfoTab;