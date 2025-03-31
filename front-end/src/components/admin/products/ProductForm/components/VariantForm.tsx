import React from 'react';
import { ProductVariant, ProductImage } from '../types';

interface VariantFormProps {
  currentVariant: ProductVariant;
  editingVariantIndex: number | null;
  images: ProductImage[];
  handleVariantChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleVariantImageSelect: (imageId: string) => void;
  handleSaveVariant: () => void;
  handleCancelVariant: () => void;
}

/**
 * Component form thêm/sửa biến thể sản phẩm
 */
const VariantForm: React.FC<VariantFormProps> = ({
  currentVariant,
  editingVariantIndex,
  images,
  handleVariantChange,
  handleVariantImageSelect,
  handleSaveVariant,
  handleCancelVariant
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
      <h4 className="text-sm font-medium mb-4">{editingVariantIndex !== null ? 'Sửa biến thể' : 'Thêm biến thể mới'}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Tên biến thể */}
        <div>
          <label htmlFor="variant-name" className="block text-sm font-medium text-gray-700">
            Tên biến thể <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="variant-name"
            name="name"
            value={currentVariant.name}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            required
          />
        </div>
        
        {/* SKU */}
        <div>
          <label htmlFor="variant-sku" className="block text-sm font-medium text-gray-700">
            Mã SKU
          </label>
          <input
            type="text"
            id="variant-sku"
            name="sku"
            value={currentVariant.sku || ''}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
        
        {/* Giá */}
        <div>
          <label htmlFor="variant-price" className="block text-sm font-medium text-gray-700">
            Giá
          </label>
          <input
            type="number"
            id="variant-price"
            name="price"
            value={currentVariant.price}
            onChange={handleVariantChange}
            min="0"
            step="1000"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
        
        {/* Màu sắc */}
        <div>
          <label htmlFor="variant-color" className="block text-sm font-medium text-gray-700">
            Màu sắc
          </label>
          <input
            type="text"
            id="variant-color"
            name="options.color"
            value={currentVariant.options.color}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
        
        {/* Tông màu */}
        <div>
          <label htmlFor="variant-shade" className="block text-sm font-medium text-gray-700">
            Tông màu
          </label>
          <input
            type="text"
            id="variant-shade"
            name="options.shade"
            value={currentVariant.options.shade}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
        
        {/* Kích thước */}
        <div>
          <label htmlFor="variant-size" className="block text-sm font-medium text-gray-700">
            Kích thước
          </label>
          <input
            type="text"
            id="variant-size"
            name="options.size"
            value={currentVariant.options.size}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Chọn hình ảnh cho biến thể */}
      {images && images.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh của biến thể
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {images.map((image, idx) => (
              <div 
                key={idx} 
                className={`border rounded-md cursor-pointer p-1 ${
                  currentVariant.images.includes(image.id || '') ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200'
                }`}
                onClick={() => handleVariantImageSelect(image.id || '')}
              >
                <img 
                  src={image.preview || image.url} 
                  alt={image.alt} 
                  className="w-full h-16 object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Nút điều khiển */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={handleCancelVariant}
          className="py-1 px-3 border border-gray-300 rounded-md text-sm leading-4 font-medium text-gray-700 hover:bg-gray-100"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSaveVariant}
          className="py-1 px-3 border border-transparent rounded-md text-sm leading-4 font-medium text-white bg-pink-600 hover:bg-pink-700"
        >
          {editingVariantIndex !== null ? 'Cập nhật' : 'Thêm'}
        </button>
      </div>
    </div>
  );
};

export default VariantForm; 