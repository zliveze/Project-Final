import React, { useEffect } from 'react';
import { FiTag } from 'react-icons/fi';
import { ProductFormData } from '../types';
import Select, { SingleValue, MultiValue } from 'react-select';

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

// Interface cho react-select options
interface SelectOption {
  value: string;
  label: string;
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
  // Kiểm tra và xác thực dữ liệu form
  useEffect(() => {
    // Bỏ qua kiểm tra nếu không có dữ liệu brands hoặc categories
    if (!brands || brands.length === 0) return;

    // Kiểm tra thương hiệu và danh mục hợp lệ một cách im lặng (không log)
    if (formData.brandId) {
      // const brandExists = brands.some(brand => brand.id === formData.brandId); // Unused
      // Không log cảnh báo, chỉ kiểm tra cho giao diện
    }

    if (formData.categoryIds && formData.categoryIds.length > 0) {
      formData.categoryIds.forEach(() => {
        // const categoryExists = categories.some(cat => cat.id === catId); // Unused
        // Không log cảnh báo, chỉ kiểm tra cho giao diện
      });
    }
  }, [formData.brandId, brands, formData.categoryIds, categories]);

  // Tìm thương hiệu hiện tại dựa trên brandId
  const currentBrand = brands.find(brand => brand.id === formData.brandId);

  // Tìm các danh mục hiện tại không tồn tại trong danh sách danh mục
  const missingCategories = formData.categoryIds
    ? formData.categoryIds.filter(catId => !categories.some(cat => cat.id === catId))
      .map(catId => ({ id: catId, name: `ID: ${catId} (Không tìm thấy)` }))
    : [];



  // Chuyển đổi brands sang định dạng options cho react-select
  const brandOptions = brands.map(brand => ({
    value: brand.id,
    label: brand.name
  }));

  // Thêm option cho thương hiệu hiện tại nếu không tồn tại trong danh sách
  if (formData.brandId && !brands.some(brand => brand.id === formData.brandId)) {
    brandOptions.push({
      value: formData.brandId,
      label: `${formData.brandId} (Không tìm thấy thương hiệu)`
    });
  }

  // Chuyển đổi categories sang định dạng options cho react-select
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  // Thêm options cho các danh mục không tồn tại
  missingCategories.forEach(category => {
    categoryOptions.push({
      value: category.id,
      label: category.name
    });
  });

  // Xử lý khi thay đổi thương hiệu từ react-select
  const handleBrandChange = (selectedOption: SingleValue<SelectOption>) => {
    if (selectedOption) {
      handleInputChange({
        target: {
          name: 'brandId',
          value: selectedOption.value
        }
      } as React.ChangeEvent<HTMLSelectElement>);
    } else {
      handleInputChange({
        target: {
          name: 'brandId',
          value: ''
        }
      } as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  // Xử lý khi thay đổi danh mục từ react-select
  const handleCategoriesChange = (selectedOptions: MultiValue<SelectOption>) => {
    const selectedValues = selectedOptions.map(option => option.value);

    // Giả lập sự kiện change cho select multiple
    const syntheticEvent = {
      target: {
        name: 'categoryIds',
        options: selectedValues.map(value => ({ selected: true, value }))
      }
    } as unknown as React.ChangeEvent<HTMLSelectElement>;

    handleMultiSelectChange(syntheticEvent);
  };


  return (
    <div className="space-y-6 bg-white p-5 rounded-lg shadow-sm">
      {/* Tiêu đề */}
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-lg font-medium text-gray-800">Thông tin cơ bản</h3>
        <p className="text-sm text-gray-500 mt-1">Nhập các thông tin cơ bản của sản phẩm</p>
      </div>

      {/* Thông tin chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Tên sản phẩm */}
        <div className="space-y-1.5">
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200 disabled:bg-gray-100"
          />
        </div>

        {/* SKU */}
        <div className="space-y-1.5">
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200 disabled:bg-gray-100"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200 disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-400 italic">Tự động tạo từ tên sản phẩm, có thể chỉnh sửa.</p>
        </div>

        {/* Trạng thái */}
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            disabled={isViewMode}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200 disabled:bg-gray-100 appearance-none bg-white"
          >
            <option value="active">Đang bán</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="discontinued">Ngừng kinh doanh</option>
          </select>
        </div>

        {/* Giá gốc */}
        <div className="space-y-1.5">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Giá gốc (VNĐ)
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="1000"
              className="block w-full rounded-md border border-gray-300 pl-7 pr-12 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200 disabled:bg-gray-100"
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
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              id="currentPrice"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="1000"
              className="block w-full rounded-md border border-gray-300 pl-7 pr-12 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200 disabled:bg-gray-100"
              placeholder="0"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₫</span>
            </div>
          </div>
        </div>

        {/* Thương hiệu */}
        <div className="space-y-1.5">
          <label htmlFor="brandId" className="block text-sm font-medium text-gray-700">
            Thương hiệu <span className="text-red-500">*</span>
          </label>
          {!isViewMode ? (
            <>
              <Select
                id="brandId"
                name="brandId"
                value={brandOptions.find(option => option.value === formData.brandId) || null}
                onChange={handleBrandChange}
                options={brandOptions}
                isDisabled={isViewMode}
                placeholder="Chọn thương hiệu"
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
                isSearchable
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? '#d53f8c' : '#e2e8f0',
                    boxShadow: state.isFocused ? '0 0 0 1px #d53f8c' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#d53f8c' : '#cbd5e0',
                    },
                    borderRadius: '0.375rem',
                    minHeight: '38px',
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isSelected ? '#d53f8c' : state.isFocused ? '#fce7f3' : 'white',
                    color: state.isSelected ? 'white' : '#1a202c',
                    '&:hover': {
                      backgroundColor: state.isSelected ? '#d53f8c' : '#fce7f3',
                    },
                  }),
                }}
              />
              {formData.brandId && !currentBrand && (
                <p className="text-xs text-red-500 mt-1">
                  Thương hiệu này không còn tồn tại trong hệ thống hoặc đã bị xóa.
                </p>
              )}
            </>
          ) : (
            <div className="py-2 px-3 bg-gray-100 rounded-md text-sm">
              {currentBrand ? currentBrand.name : formData.brandId ? `${formData.brandId} (Không tìm thấy)` : 'Không có'}
            </div>
          )}
        </div>

        {/* Danh mục */}
        <div className="space-y-1.5">
          <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700">
            Danh mục
          </label>
          {!isViewMode ? (
            <>
              <Select
                id="categoryIds"
                name="categoryIds"
                isMulti
                value={categoryOptions.filter(option => formData.categoryIds?.includes(option.value))}
                onChange={handleCategoriesChange}
                options={categoryOptions}
                isDisabled={isViewMode}
                placeholder="Chọn danh mục"
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
                isSearchable
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? '#d53f8c' : '#e2e8f0',
                    boxShadow: state.isFocused ? '0 0 0 1px #d53f8c' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#d53f8c' : '#cbd5e0',
                    },
                    borderRadius: '0.375rem',
                    minHeight: '38px',
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isSelected ? '#d53f8c' : state.isFocused ? '#fce7f3' : 'white',
                    color: state.isSelected ? 'white' : '#1a202c',
                    '&:hover': {
                      backgroundColor: state.isSelected ? '#d53f8c' : '#fce7f3',
                    },
                  }),
                  multiValue: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: '#fce7f3',
                    borderRadius: '0.25rem',
                  }),
                  multiValueLabel: (baseStyles) => ({
                    ...baseStyles,
                    color: '#d53f8c',
                    fontWeight: 500,
                  }),
                  multiValueRemove: (baseStyles) => ({
                    ...baseStyles,
                    color: '#d53f8c',
                    '&:hover': {
                      backgroundColor: '#d53f8c',
                      color: 'white',
                    },
                  }),
                }}
              />

              {/* Hiển thị cảnh báo nếu có danh mục không tồn tại */}
              {missingCategories.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md px-3 py-1.5 mt-2">
                  <p className="text-xs text-red-500">
                    Có {missingCategories.length} danh mục không còn tồn tại trong hệ thống.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="py-2 px-3 bg-gray-50 rounded-md text-sm border border-gray-200">
              {formData.categoryIds && formData.categoryIds.length > 0 ? (
                <ul className="list-disc pl-4 space-y-0.5">
                  {formData.categoryIds.map((id) => {
                    const category = categories.find((c) => c.id === id);
                    return (
                      <li key={id} className={!category ? "text-red-500" : ""}>
                        {category ? category.name : `ID: ${id} (Không tìm thấy)`}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <span className="text-gray-400 italic">Không có danh mục nào được chọn</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
        <label htmlFor="tags-input" className="block text-sm font-medium text-gray-700">
          Tags/Nhãn
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <div className="flex items-center">
              <div className="relative rounded-md shadow-sm flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="h-4 w-4 text-pink-500" />
                </div>
                <input
                  type="text"
                  id="tags-input"
                  placeholder="Thêm tag và nhấn Enter"
                  onKeyDown={handleTagsChange}
                  className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200 shadow-sm transition-all duration-200 hover:bg-pink-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 inline-flex text-pink-400 hover:text-pink-600 focus:outline-none"
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
            {formData.tags && formData.tags.length > 0 ? (
              formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">Không có tag nào</span>
            )}
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
        <span className="block text-sm font-medium text-gray-700">Đánh dấu sản phẩm</span>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center hover:bg-white py-1.5 px-2 rounded-md transition-colors duration-200">
            <input
              id="isBestSeller"
              name="flags.isBestSeller"
              type="checkbox"
              checked={formData.flags?.isBestSeller || false}
              onChange={handleCheckboxChange}
              disabled={isViewMode}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
            />
            <label htmlFor="isBestSeller" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
              Sản phẩm bán chạy
            </label>
          </div>

          <div className="flex items-center hover:bg-white py-1.5 px-2 rounded-md transition-colors duration-200">
            <input
              id="isNew"
              name="flags.isNew"
              type="checkbox"
              checked={formData.flags?.isNew || false}
              onChange={handleCheckboxChange}
              disabled={isViewMode}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
            />
            <label htmlFor="isNew" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
              Sản phẩm mới
            </label>
          </div>

          <div className="flex items-center hover:bg-white py-1.5 px-2 rounded-md transition-colors duration-200">
            <input
              id="isOnSale"
              name="flags.isOnSale"
              type="checkbox"
              checked={formData.flags?.isOnSale || false}
              onChange={handleCheckboxChange}
              disabled={isViewMode}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
            />
            <label htmlFor="isOnSale" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
              Đang giảm giá
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;
