import React from 'react';
import { FiX, FiStar, FiEdit } from 'react-icons/fi';
import { ProductImage } from '../types';

// Interface for ImageList component props
interface ImageListProps {
  images: ProductImage[];
  onRemove?: (imageId: string) => void;
  onSetPrimary?: (imageId: string) => void;
  onAltChange?: (imageId: string, alt: string) => void;
  isUploading?: boolean;
  isViewMode?: boolean;
  productName?: string;
  handleRemoveImage?: (imageId: string) => void;
  handleSetPrimaryImage?: (imageId: string) => void;
  handleImageAltChange?: (imageId: string, alt: string) => void;
}

/**
 * Component hiển thị danh sách hình ảnh của sản phẩm
 */
const ImageList: React.FC<ImageListProps> = ({
  images = [],
  onRemove,
  onSetPrimary,
  onAltChange,
  isUploading = false,
  isViewMode = false,
  productName = '',
  handleRemoveImage,
  handleSetPrimaryImage,
  handleImageAltChange
}) => {
  // Đảm bảo có ít nhất một handler để tránh lỗi
  const removeImage = handleRemoveImage || onRemove;
  const setPrimaryImage = handleSetPrimaryImage || onSetPrimary;
  const changeAltText = handleImageAltChange || onAltChange;

  if (!images || images.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-md">
        {isUploading ? 'Đang xử lý hình ảnh...' : 'Chưa có hình ảnh nào'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
      {isUploading && (
        <div className="col-span-full p-2 mb-4 bg-yellow-50 text-yellow-700 rounded-md text-center">
          <p>Đang xử lý hình ảnh, vui lòng chờ...</p>
        </div>
      )}
      {images.map((image, index) => (
        <div
          key={index}
          className="relative group border rounded-md p-2 hover:shadow-sm"
        >
          <div className="relative pt-[100%] bg-gray-100">
            <img
              src={image.preview || image.url}
              alt={image.alt || productName || 'Product image'}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {image.isPrimary && (
              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <FiStar size={16} />
              </div>
            )}
          </div>

          {!isViewMode && setPrimaryImage && (
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setPrimaryImage(image.id || '')}
                className="bg-white rounded-full p-1.5 shadow text-yellow-500 hover:text-yellow-600"
                disabled={image.isPrimary}
                title="Đặt làm ảnh đại diện"
              >
                <FiStar size={16} />
              </button>
            </div>
          )}

          {!isViewMode && removeImage && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => removeImage(image.id || '')}
                className="bg-white rounded-full p-1.5 shadow text-red-500 hover:text-red-600"
                title="Xóa hình ảnh"
              >
                <FiX size={16} />
              </button>
            </div>
          )}

          <div className="mt-2">
            <div className="relative">
              {isViewMode ? (
                <div className="w-full text-sm p-1 text-gray-500">
                  {image.alt || 'Không có mô tả'}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={image.alt || ''}
                    onChange={(e) => changeAltText && changeAltText(image.id || '', e.target.value)}
                    className="w-full text-sm p-1 border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Thêm mô tả"
                  />
                  <FiEdit size={12} className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </>
              )}
            </div>
            {image.file && (
              <div className="mt-1 text-xs text-gray-500 italic">
                {image.url ? 'Đã tải lên' : 'Đang chờ lưu sản phẩm...'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageList;