import React from 'react';
import { ProductFormData } from '../types';

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
    <div className="space-y-6">
      <div className="text-lg font-medium mb-4">SEO & Mô tả sản phẩm</div>
      
      {/* Mô tả ngắn */}
      <div className="space-y-2">
        <label htmlFor="description.short" className="block text-sm font-medium text-gray-700">
          Mô tả ngắn <span className="text-red-500">*</span>
        </label>
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
        <p className="text-xs text-gray-500 flex justify-end">
          {formData.description.short.length}/160 ký tự
        </p>
      </div>

      {/* Mô tả đầy đủ */}
      <div className="space-y-2">
        <label htmlFor="description.full" className="block text-sm font-medium text-gray-700">
          Mô tả đầy đủ
        </label>
        <textarea
          id="description.full"
          name="description.full"
          rows={10}
          value={formData.description.full}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Nhập mô tả chi tiết về sản phẩm"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
        <p className="text-xs text-gray-500">
          Hỗ trợ định dạng Markdown cơ bản.
        </p>
      </div>

      {/* SEO - Meta Title */}
      <div className="space-y-2">
        <label htmlFor="seo.metaTitle" className="block text-sm font-medium text-gray-700">
          SEO - Tiêu đề (Meta Title)
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500 flex justify-end">
          {(formData.seo?.metaTitle || '').length}/60 ký tự
        </p>
      </div>

      {/* SEO - Meta Description */}
      <div className="space-y-2">
        <label htmlFor="seo.metaDescription" className="block text-sm font-medium text-gray-700">
          SEO - Mô tả (Meta Description)
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
        <p className="text-xs text-gray-500 flex justify-end">
          {(formData.seo?.metaDescription || '').length}/160 ký tự
        </p>
      </div>

      {/* SEO - Keywords */}
      <div className="space-y-2">
        <label htmlFor="seo-keywords" className="block text-sm font-medium text-gray-700">
          SEO - Từ khóa (Keywords)
        </label>
        {!isViewMode ? (
          <div className="mt-1">
            <input
              type="text"
              id="seo-keywords"
              placeholder="Nhập từ khóa và nhấn Enter"
              onKeyDown={handleSeoKeywordsChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {(formData.seo?.keywords || []).map((keyword: string, index: number) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeSeoKeyword(index)}
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
            {(formData.seo?.keywords || []).length > 0 ? (
              (formData.seo?.keywords || []).map((keyword: string, index: number) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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

      {/* Gợi ý SEO */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Gợi ý SEO hiệu quả:</h3>
        <ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
          <li>Meta Title nên chứa từ khóa chính và tên thương hiệu</li>
          <li>Meta Description nên mô tả ngắn gọn lợi ích chính của sản phẩm</li>
          <li>Thêm các từ khóa liên quan đến công dụng và thành phần nổi bật</li>
          <li>Sử dụng khoảng 5-10 từ khóa có liên quan chặt chẽ với sản phẩm</li>
        </ul>
      </div>

      {/* SEO Preview */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Xem trước kết quả tìm kiếm:</h3>
        <div className="mb-1">
          <div className="text-xl text-blue-700 font-medium truncate">
            {formData.seo?.metaTitle || formData.name || 'Tiêu đề sản phẩm'}
          </div>
          <div className="text-sm text-green-700 truncate">
            www.example.com/products/{formData.slug || 'product-name'}
          </div>
          <div className="text-sm text-gray-700 line-clamp-2">
            {formData.seo?.metaDescription || formData.description.short || 'Mô tả sản phẩm sẽ hiển thị ở đây...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoDescriptionTab; 