import React, { useEffect } from 'react';
import { ProductFormData } from '../types';

interface CosmeticInfoTabProps {
  formData: ProductFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleConcernsChange: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Thông tin mỹ phẩm</h3>

      {/* Loại da */}
      <div className="space-y-2">
        <label htmlFor="skinType" className="block text-sm font-medium text-gray-700">
          Loại da phù hợp
        </label>
        {!isViewMode ? (
          <select
            id="skinType"
            name="cosmetic_info.skinType"
            multiple
            value={formData.cosmetic_info?.skinType || []}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              const currentInfo = formData.cosmetic_info || {};

              handleInputChange({
                target: {
                  name: 'cosmetic_info.skinType',
                  value: selectedOptions
                }
              } as any);
            }}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            size={5}
          >
            <option value="normal">Da thường</option>
            <option value="dry">Da khô</option>
            <option value="oily">Da dầu</option>
            <option value="combination">Da hỗn hợp</option>
            <option value="sensitive">Da nhạy cảm</option>
            <option value="all">Mọi loại da</option>
          </select>
        ) : (
          <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-sm">
            {formData.cosmetic_info?.skinType && formData.cosmetic_info.skinType.length > 0 ? (
              <ul className="list-disc pl-5">
                {formData.cosmetic_info.skinType.map((type, index) => {
                  let skinTypeName = '';
                  switch (type) {
                    case 'normal': skinTypeName = 'Da thường'; break;
                    case 'dry': skinTypeName = 'Da khô'; break;
                    case 'oily': skinTypeName = 'Da dầu'; break;
                    case 'combination': skinTypeName = 'Da hỗn hợp'; break;
                    case 'sensitive': skinTypeName = 'Da nhạy cảm'; break;
                    case 'all': skinTypeName = 'Mọi loại da'; break;
                    default: skinTypeName = type;
                  }
                  return <li key={index}>{skinTypeName}</li>;
                })}
              </ul>
            ) : (
              <span className="text-gray-500">Không có loại da được chọn</span>
            )}
          </div>
        )}
        {!isViewMode && <p className="text-xs text-gray-500 mt-1">Giữ Ctrl để chọn nhiều loại da</p>}
      </div>

      {/* Vấn đề da */}
      <div className="space-y-2">
        <label htmlFor="concerns" className="block text-sm font-medium text-gray-700">
          Vấn đề da đặc trị
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                id="concerns"
                placeholder="Nhập vấn đề da và nhấn Enter"
                onKeyDown={handleConcernsChange}
                className="focus:ring-pink-500 focus:border-pink-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.map((concern, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {concern}
                  <button
                    type="button"
                    onClick={() => removeConcern(index)}
                    className="ml-1 inline-flex text-blue-400 hover:text-blue-600"
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
            {formData.cosmetic_info?.concerns && formData.cosmetic_info.concerns.length > 0 ? (
              formData.cosmetic_info.concerns.map((concern, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {concern}
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