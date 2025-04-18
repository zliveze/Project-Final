import React from 'react';
import { Edit, Trash2, AlertCircle, Tag } from 'lucide-react';
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
  // Debug log to check variant and image data (only when needed)
  // Removed to prevent excessive logging

  if (!variants || variants.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Tag className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
          <p>Chưa có biến thể nào được thêm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên biến thể
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã SKU
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tùy chọn
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hình ảnh
              </th>
              {!isViewMode && (
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {variants.map((variant, idx) => (
            <tr
              key={variant.variantId || idx}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {variant.name || `Biến thể ${idx + 1}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {variant.sku ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {variant.sku}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-wrap gap-1.5">
                  {variant.options.color && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700">
                      Màu: {variant.options.color}
                    </span>
                  )}
                  {variant.options.shades && variant.options.shades.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                      Tông: {variant.options.shades.join(', ')}
                    </span>
                  )}
                  {variant.options.sizes && variant.options.sizes.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      Kích thước: {variant.options.sizes.join(', ')}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <span className="text-pink-600">{variant.price.toLocaleString()} ₫</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-1.5">
                  {variant.images && variant.images.length > 0 ? (
                    variant.images.map((imageIdOrObj, imgIdx) => {
                      // Direct display if the image object has a URL
                      if (typeof imageIdOrObj === 'object' && imageIdOrObj !== null && imageIdOrObj.url) {
                        return (
                          <img
                            key={imgIdx}
                            src={imageIdOrObj.url}
                            alt={imageIdOrObj.alt || `Variant ${variant.name || idx + 1} image ${imgIdx + 1}`}
                            className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm hover:border-pink-300 transition-colors duration-200"
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
                            className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm hover:border-pink-300 transition-colors duration-200"
                          />
                        );
                      }

                      // Extract ID from string or object
                      const imageId = typeof imageIdOrObj === 'string'
                        ? imageIdOrObj
                        : (imageIdOrObj?.id || imageIdOrObj?.publicId || imageIdOrObj?._id);

                      // Find matching image in product images - improved matching logic
                      const matchingImage = images.find(img => {
                        // Try exact match first with all possible ID fields
                        if (img.id === imageId || img.publicId === imageId || img._id === imageId) {
                          return true;
                        }

                        // Try partial match if both are strings
                        if (typeof imageId === 'string' && imageId) {
                          const imgIdStr = String(img.id || img.publicId || img._id || '');
                          if (!imgIdStr) return false;

                          // Check if either string contains the other
                          const isPartialMatch = imgIdStr.includes(imageId) ||
                                               (imageId.length > 5 && imageId.includes(imgIdStr));

                          if (isPartialMatch) return true;

                          // Try matching by URL if available
                          if (img.url && typeof img.url === 'string') {
                            // Extract filename from URL
                            const urlParts = img.url.split('/');
                            const filename = urlParts[urlParts.length - 1];
                            if (filename && (filename.includes(imageId) || imageId.includes(filename))) {
                              return true;
                            }
                          }
                        }

                        return false;
                      });

                      if (matchingImage) {
                        return (
                          <img
                            key={imgIdx}
                            src={matchingImage.preview || matchingImage.url}
                            alt={matchingImage.alt || `Variant ${variant.name || idx + 1} image ${imgIdx + 1}`}
                            className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm hover:border-pink-300 transition-colors duration-200"
                          />
                        );
                      }

                      // Try to find image in the variant's own images array if it's an object
                      if (typeof imageIdOrObj === 'object' && imageIdOrObj !== null) {
                        // Try to extract any URL-like property
                        const possibleUrls = ['preview', 'src', 'source', 'path', 'link'];
                        for (const prop of possibleUrls) {
                          if (imageIdOrObj[prop] && typeof imageIdOrObj[prop] === 'string' &&
                             (imageIdOrObj[prop].startsWith('http') || imageIdOrObj[prop].startsWith('/'))) {
                            return (
                              <img
                                key={imgIdx}
                                src={imageIdOrObj[prop]}
                                alt={`Variant ${variant.name || idx + 1} image ${imgIdx + 1}`}
                                className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm hover:border-pink-300 transition-colors duration-200"
                              />
                            );
                          }
                        }
                      }

                      // Fallback: display a more informative placeholder
                      return (
                        <div
                          key={imgIdx}
                          className="w-10 h-10 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-xs text-gray-500 relative group shadow-sm"
                          title={`Image ID: ${imageId} not found`}
                        >
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          {/* Show image ID on hover */}
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-1 whitespace-nowrap z-10 shadow-lg">
                            ID: {imageId?.substring(0, 10)}...
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-gray-400 italic py-1">Không có hình ảnh</span>
                  )}
                </div>
              </td>
              {!isViewMode && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => handleEditVariant(variant)}
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 mr-1"
                    aria-label={`Sửa biến thể ${variant.name || idx + 1}`}
                  >
                    <Edit className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => variant.variantId && handleRemoveVariant(variant.variantId)}
                    disabled={!variant.variantId}
                    className={`inline-flex items-center p-1.5 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${!variant.variantId ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 focus:ring-red-500'}`}
                    aria-label={`Xóa biến thể ${variant.name || idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default VariantList;
