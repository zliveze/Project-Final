import React from 'react';
import { FiTag } from 'react-icons/fi';
import { ProductFormData } from '../types';

interface BasicInfoTabProps {
  formData: ProductFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsChange: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleMultiSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  removeTag: (tag: string) => void;
  isViewMode?: boolean;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

/**
 * Component tab thông tin cơ bản của sản phẩm
 */
const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  handleInputChange,
  handleCheckboxChange,
  handleTagsChange,
  handleMultiSelectChange,
  removeTag,
  isViewMode = false,
  brands,
  categories
}) => {
  return (
    <div className="space-y-6">
      {/* Thông tin chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tên sản phẩm */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="Nhập tên sản phẩm"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
          />
        </div>

        {/* SKU */}
        <div className="space-y-2">
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            Mã sản phẩm (SKU) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="Nhập mã sản phẩm"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="URL-friendly tên sản phẩm"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500">Tự động tạo từ tên sản phẩm, có thể chỉnh sửa.</p>
        </div>

        {/* Trạng thái */}
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            disabled={isViewMode}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="active">Đang bán</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="discontinued">Ngừng kinh doanh</option>
          </select>
        </div>

        {/* Giá gốc */}
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Giá gốc (VNĐ)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="1000"
              className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
              placeholder="0"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₫</span>
            </div>
          </div>
        </div>

        {/* Giá bán */}
        <div className="space-y-2">
          <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700">
            Giá bán (VNĐ)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="currentPrice"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="1000"
              className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
              placeholder="0"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₫</span>
            </div>
          </div>
        </div>

        {/* Thương hiệu */}
        <div className="space-y-2">
          <label htmlFor="brandId" className="block text-sm font-medium text-gray-700">
            Thương hiệu <span className="text-red-500">*</span>
          </label>
          <select
            id="brandId"
            name="brandId"
            value={formData.brandId}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Chọn thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Danh mục */}
        <div className="space-y-2">
          <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700">
            Danh mục
          </label>
          {!isViewMode ? (
            <select
              id="categoryIds"
              name="categoryIds"
              multiple
              value={formData.categoryIds}
              onChange={handleMultiSelectChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
              size={4}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-sm">
              {formData.categoryIds.length > 0 ? (
                <ul className="list-disc pl-5">
                  {formData.categoryIds.map((id) => {
                    const category = categories.find((c) => c.id === id);
                    return <li key={id}>{category ? category.name : id}</li>;
                  })}
                </ul>
              ) : (
                <span className="text-gray-500">Không có danh mục nào được chọn</span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500">Giữ Ctrl để chọn nhiều danh mục.</p>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label htmlFor="tags-input" className="block text-sm font-medium text-gray-700">
          Tags/Nhãn
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="flex items-center">
              <div className="relative rounded-md shadow-sm flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="tags-input"
                  placeholder="Thêm tag và nhấn Enter"
                  onKeyDown={handleTagsChange}
                  className="focus:ring-pink-500 focus:border-pink-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 inline-flex text-pink-400 hover:text-pink-600 focus:outline-none"
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
            {formData.tags.length > 0 ? (
              formData.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">Không có tag nào</span>
            )}
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">Đánh dấu sản phẩm</span>
        <div className="mt-2 flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              id="isBestSeller"
              name="flags.isBestSeller"
              type="checkbox"
              checked={formData.flags.isBestSeller}
              onChange={handleCheckboxChange}
              disabled={isViewMode}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="isBestSeller" className="ml-2 block text-sm text-gray-700">
              Sản phẩm bán chạy
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="isNew"
              name="flags.isNew"
              type="checkbox"
              checked={formData.flags.isNew}
              onChange={handleCheckboxChange}
              disabled={isViewMode}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="isNew" className="ml-2 block text-sm text-gray-700">
              Sản phẩm mới
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="isOnSale"
              name="flags.isOnSale"
              type="checkbox"
              checked={formData.flags.isOnSale}
              onChange={handleCheckboxChange}
              disabled={isViewMode}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="isOnSale" className="ml-2 block text-sm text-gray-700">
              Đang giảm giá
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab; 