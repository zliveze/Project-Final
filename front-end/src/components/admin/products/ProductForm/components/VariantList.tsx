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
  // Debug log to check variant and image data (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('VariantList - Data:', {
      variants: variants?.length || 0,
      images: images?.length || 0,
      isViewMode: isViewMode
    });
  }

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
                  {variant.options.shades && variant.options.shades.length > 0 && (
                    <span className="inline-block mr-2">Tông: {variant.options.shades.join(', ')}</span>
                  )}
                  {variant.options.sizes && variant.options.sizes.length > 0 && (
                    <span className="inline-block">Kích thước: {variant.options.sizes.join(', ')}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {variant.price.toLocaleString()} ₫
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-1">
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="hidden">
                      {console.log('Variant images:', variant.images)}
                      {console.log('Product images:', images)}
                    </div>
                  )}

                  {/* Display variant images */}
                  {variant.images && variant.images.length > 0 ? (
                    variant.images.map((imageIdOrObj, imgIdx) => {
                      // Direct display if the image object has a URL
                      if (typeof imageIdOrObj === 'object' && imageIdOrObj !== null && imageIdOrObj.url) {
                        return (
                          <img
                            key={imgIdx}
                            src={imageIdOrObj.url}
                            alt={imageIdOrObj.alt || `Variant ${variant.name || idx + 1} image ${imgIdx + 1}`}
                            className="w-8 h-8 object-cover rounded border border-gray-200"
                          />
                        );
                      }

                      // If it's a string URL
                      if (typeof imageIdOrObj === 'string' &&
                          (imageIdOrObj.startsWith('http') || imageIdOrObj.startsWith('/'))) {
                        return (
                          <img
                            key={imgIdx}
                            src={imageIdOrObj}
                            alt={`Variant ${variant.name || idx + 1} image ${imgIdx + 1}`}
                            className="w-8 h-8 object-cover rounded border border-gray-200"
                          />
                        );
                      }

                      // Extract ID from string or object
                      const imageId = typeof imageIdOrObj === 'string'
                        ? imageIdOrObj
                        : (imageIdOrObj?.id || imageIdOrObj?.publicId || imageIdOrObj?._id);

                      // Find matching image in product images
                      const matchingImage = images.find(img => {
                        // Try exact match first with all possible ID fields
                        if (img.id === imageId || img.publicId === imageId || img._id === imageId) {
                          console.log(`Found exact match for image ID ${imageId}`);
                          return true;
                        }

                        // Try partial match if both are strings
                        if (typeof imageId === 'string') {
                          const imgIdStr = String(img.id || img.publicId || img._id || '');

                          // Check if either string contains the other
                          const isPartialMatch = imgIdStr.includes(imageId) ||
                                               (imageId.length > 5 && imageId.includes(imgIdStr));

                          if (isPartialMatch) {
                            console.log(`Found partial match: ${imageId} ~ ${imgIdStr}`);
                            return true;
                          }
                        }

                        return false;
                      });

                      // Log the result for debugging
                      if (!matchingImage) {
                        console.warn(`No matching image found for ID: ${imageId}`);
                      }

                      if (matchingImage) {
                        return (
                          <img
                            key={imgIdx}
                            src={matchingImage.preview || matchingImage.url}
                            alt={matchingImage.alt || `Variant ${variant.name || idx + 1} image ${imgIdx + 1}`}
                            className="w-8 h-8 object-cover rounded border border-gray-200"
                          />
                        );
                      }

                      // Fallback: display a more informative placeholder
                      return (
                        <div
                          key={imgIdx}
                          className="w-8 h-8 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-500 relative group"
                          title={`Image ID: ${imageId} not found`}
                        >
                          <span className="text-sm">?</span>
                          {/* Show image ID on hover */}
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-1 whitespace-nowrap z-10">
                            ID: {imageId?.substring(0, 10)}...
                          </div>
                        </div>
                      );
                    })
                  ) : (
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
