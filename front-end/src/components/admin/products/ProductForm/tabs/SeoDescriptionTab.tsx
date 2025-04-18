import React from 'react';
import { ProductFormData } from '../types';
import { FiInfo, FiSearch, FiTag, FiType, FiAlignLeft, FiEye } from 'react-icons/fi';

interface SeoDescriptionTabProps {
  formData: ProductFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSeoKeywordsChange: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  removeSeoKeyword: (index: number) => void;
  isViewMode?: boolean;
}

/**
 * Component tab quản lý SEO và mô tả sản phẩm
 */
const SeoDescriptionTab: React.FC<SeoDescriptionTabProps> = ({
  formData,
  handleInputChange,
  handleSeoKeywordsChange,
  removeSeoKeyword,
  isViewMode = false
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-2 border-b pb-4 mb-6">
        <FiInfo className="text-pink-500" size={20} />
        <h2 className="text-lg font-medium">SEO & Mô tả sản phẩm</h2>
      </div>

      {/* Mô tả ngắn */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <FiAlignLeft className="text-pink-500" />
          <label htmlFor="description.short" className="block text-sm font-medium">
            Mô tả ngắn <span className="text-red-500">*</span>
          </label>
        </div>
        <textarea
          id="description.short"
          name="description.short"
          rows={3}
          value={formData.description.short}
          onChange={handleInputChange}
          required
          disabled={isViewMode}
          placeholder="Nhập mô tả ngắn về sản phẩm (tối đa 160 ký tự)"
          maxLength={160}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50 disabled:bg-gray-50 transition-all"
        ></textarea>
        <div className="flex justify-end mt-2">
          <span className={`text-xs ${formData.description.short.length > 140 ? 'text-orange-500' : 'text-gray-500'}`}>
            {formData.description.short.length}/160 ký tự
          </span>
        </div>
      </div>

      {/* Mô tả đầy đủ */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <FiType className="text-pink-500" />
          <label htmlFor="description.full" className="block text-sm font-medium">
            Mô tả đầy đủ
          </label>
        </div>
        <textarea
          id="description.full"
          name="description.full"
          rows={8}
          value={formData.description.full}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Nhập mô tả chi tiết về sản phẩm"
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50 disabled:bg-gray-50 transition-all"
        ></textarea>
        <p className="text-xs text-gray-500 mt-2 flex items-center">
          <FiInfo className="mr-1" size={12} />
          Hỗ trợ định dạng Markdown cơ bản
        </p>
      </div>

      {/* SEO Fields */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <FiSearch className="text-pink-500" />
          <h3 className="text-sm font-medium">Thông tin SEO</h3>
        </div>

        {/* SEO - Meta Title */}
        <div className="mb-4">
          <label htmlFor="seo.metaTitle" className="block text-sm font-medium mb-2">
            Tiêu đề (Meta Title)
          </label>
          <input
            type="text"
            id="seo.metaTitle"
            name="seo.metaTitle"
            value={formData.seo?.metaTitle || ''}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Tiêu đề hiển thị trên kết quả tìm kiếm"
            maxLength={60}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50 disabled:bg-gray-50 transition-all"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${(formData.seo?.metaTitle || '').length > 50 ? 'text-orange-500' : 'text-gray-500'}`}>
              {(formData.seo?.metaTitle || '').length}/60 ký tự
            </span>
          </div>
        </div>

        {/* SEO - Meta Description */}
        <div className="mb-4">
          <label htmlFor="seo.metaDescription" className="block text-sm font-medium mb-2">
            Mô tả (Meta Description)
          </label>
          <textarea
            id="seo.metaDescription"
            name="seo.metaDescription"
            rows={3}
            value={formData.seo?.metaDescription || ''}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Mô tả hiển thị trên kết quả tìm kiếm"
            maxLength={160}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50 disabled:bg-gray-50 transition-all"
          ></textarea>
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${(formData.seo?.metaDescription || '').length > 140 ? 'text-orange-500' : 'text-gray-500'}`}>
              {(formData.seo?.metaDescription || '').length}/160 ký tự
            </span>
          </div>
        </div>

        {/* SEO - Keywords */}
        <div>
          <label htmlFor="seo-keywords" className="text-sm font-medium mb-2 flex items-center">
            <FiTag className="mr-1.5 text-gray-500" size={14} />
            Từ khóa (Keywords)
          </label>
          {!isViewMode ? (
            <div>
              <input
                type="text"
                id="seo-keywords"
                placeholder="Nhập từ khóa và nhấn Enter"
                onKeyDown={handleSeoKeywordsChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50 transition-all"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(formData.seo?.keywords || []).length > 0 ? (
                  (formData.seo?.keywords || []).map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeSeoKeyword(index)}
                        className="ml-1.5 text-pink-400 hover:text-pink-600 focus:outline-none"
                      >
                        <span className="sr-only">Xóa</span>
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">Chưa có từ khóa nào được thêm</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(formData.seo?.keywords || []).length > 0 ? (
                (formData.seo?.keywords || []).map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Không có từ khóa</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gợi ý SEO */}
        <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border border-blue-200 border-l-blue-400">
          <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
            <FiInfo className="mr-2" />
            Gợi ý SEO hiệu quả
          </h3>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2"></span>
              <span>Meta Title nên chứa từ khóa chính và tên thương hiệu</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2"></span>
              <span>Meta Description nên mô tả ngắn gọn lợi ích chính của sản phẩm</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2"></span>
              <span>Thêm các từ khóa liên quan đến công dụng và thành phần nổi bật</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2"></span>
              <span>Sử dụng khoảng 5-10 từ khóa có liên quan chặt chẽ với sản phẩm</span>
            </li>
          </ul>
        </div>

        {/* SEO Preview */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <FiEye className="mr-2 text-pink-500" />
            Xem trước kết quả tìm kiếm
          </h3>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg text-blue-600 font-medium truncate hover:underline cursor-pointer">
              {formData.seo?.metaTitle || formData.name || 'Tiêu đề sản phẩm'}
            </div>
            <div className="text-sm text-green-600 truncate mt-1">
              yumin-cosmetics.com/products/{formData.slug || 'product-name'}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2 mt-1">
              {formData.seo?.metaDescription || formData.description.short || 'Mô tả sản phẩm sẽ hiển thị ở đây...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoDescriptionTab;