import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { ProductVariant, ProductImage } from '../types';

interface VariantListProps {
  variants: ProductVariant[];
  images: ProductImage[]; // Keep this to resolve image URLs
  isViewMode?: boolean;
  handleEditVariant: (variant: ProductVariant) => void; // Expects the full variant object
  handleRemoveVariant: (variantId: string) => void; // Expects the variant ID string
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
            // Use variantId if available and non-empty, otherwise fallback to index for key
            <tr key={variant.variantId || idx}> 
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {variant.name || `Biến thể ${idx + 1}`} {/* Fallback name */}
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
                  {/* Map through the array of image IDs in the variant */}
                  {variant.images && variant.images.map((imageId, imgIdx) => { 
                    // Find the corresponding full image object from the main images list
                    const image = images.find(img => img.id === imageId); 
                    return image ? (
                      <img
                        key={imgIdx}
                        src={image.preview || image.url} // Use preview if available (local file), else use stored URL
                        alt={image.alt || `Variant ${variant.name || idx + 1} image ${imgIdx + 1}`} // Fallback alt text
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
                    onClick={() => handleEditVariant(variant)} // Pass the whole variant object
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    aria-label={`Sửa biến thể ${variant.name || idx + 1}`}
                  >
                    <FiEdit className="inline w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    // Pass variantId if available, otherwise handle potential error or disable button
                    onClick={() => variant.variantId && handleRemoveVariant(variant.variantId)} 
                    disabled={!variant.variantId} // Disable if no ID
                    className={`hover:text-red-900 ${!variant.variantId ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                    aria-label={`Xóa biến thể ${variant.name || idx + 1}`}
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
