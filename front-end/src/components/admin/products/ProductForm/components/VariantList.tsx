import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { ProductVariant, ProductImage } from '../types';

interface VariantListProps {
  variants: ProductVariant[];
  images: ProductImage[];
  isViewMode?: boolean;
  handleEditVariant: (index: number) => void;
  handleRemoveVariant: (index: number) => void;
}

/**
 * Component hiển thị danh sách biến thể sản phẩm
 */
const VariantList: React.FC<VariantListProps> = ({
  variants,
  images,
  isViewMode = false,
  handleEditVariant,
  handleRemoveVariant
}) => {
  if (!variants || variants.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
        Chưa có biến thể nào được thêm
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên biến thể
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mã SKU
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tùy chọn
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Giá
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hình ảnh
            </th>
            {!isViewMode && (
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {variants.map((variant, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {variant.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {variant.sku || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>
                  {variant.options.color && <span className="inline-block mr-2">Màu: {variant.options.color}</span>}
                  {variant.options.shade && <span className="inline-block mr-2">Tông: {variant.options.shade}</span>}
                  {variant.options.size && <span className="inline-block">Kích thước: {variant.options.size}</span>}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {variant.price.toLocaleString()} ₫
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-1">
                  {variant.images && variant.images.map((imageId, imgIdx) => {
                    const image = images.find(img => img.id === imageId);
                    return image ? (
                      <img 
                        key={imgIdx} 
                        src={image.preview || image.url} 
                        alt={image.alt} 
                        className="w-8 h-8 object-cover rounded border border-gray-200"
                      />
                    ) : null;
                  })}
                  {(!variant.images || variant.images.length === 0) && (
                    <span className="text-xs italic">Không có hình ảnh</span>
                  )}
                </div>
              </td>
              {!isViewMode && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => handleEditVariant(idx)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <FiEdit className="inline w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 className="inline w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VariantList; 