import React from 'react';
import { FiTrash2, FiCheck } from 'react-icons/fi';
import { ProductImage } from '../types';

interface ImageListProps {
  images: ProductImage[];
  productName: string;
  isViewMode?: boolean;
  handleRemoveImage: (imageId: string) => void;
  handleSetPrimaryImage: (imageId: string) => void;
  handleImageAltChange: (imageId: string, alt: string) => void;
}

/**
 * Component hiển thị danh sách hình ảnh sản phẩm
 */
const ImageList: React.FC<ImageListProps> = ({
  images,
  productName,
  isViewMode = false,
  handleRemoveImage,
  handleSetPrimaryImage,
  handleImageAltChange
}) => {
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Chưa có hình ảnh nào được tải lên
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
      {images.map((image, index) => (
        <div key={index} className="relative group border rounded-md p-2 hover:shadow-sm">
          <div className="aspect-w-1 aspect-h-1 mb-2">
            <img 
              src={image.preview || image.url} 
              alt={image.alt || `Sản phẩm ${productName} - ${index + 1}`}
              className="object-cover rounded"
            />
          </div>
          
          {!isViewMode && (
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id || '')}
                className="text-red-500 hover:text-red-700"
                title="Xóa hình ảnh"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => handleSetPrimaryImage(image.id || '')}
                className={`${image.isPrimary ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                title={image.isPrimary ? "Hình ảnh chính" : "Đặt làm hình ảnh chính"}
                disabled={image.isPrimary}
              >
                <FiCheck className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {image.isPrimary && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
              Chính
            </div>
          )}
          
          {!isViewMode ? (
            <input
              type="text"
              value={image.alt || ''}
              onChange={(e) => handleImageAltChange(image.id || '', e.target.value)}
              placeholder="Mô tả hình ảnh"
              className="mt-1 block w-full text-xs border-gray-300 rounded"
            />
          ) : (
            <p className="text-xs text-gray-500 truncate mt-1">{image.alt || 'Không có mô tả'}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageList; 