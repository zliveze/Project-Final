import React from 'react';
import { useProductImages } from '../hooks/useProductImages';
import { FiUpload, FiImage } from 'react-icons/fi';
import { ProductFormData } from '../types';
import ImageList from '../components/ImageList';

// Interface cho ImagesTab props
interface ImagesTabProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

/**
 * Tab quản lý hình ảnh sản phẩm
 */
const ImagesTab: React.FC<ImagesTabProps> = ({ formData, setFormData }) => {
  // Sử dụng hook để quản lý hình ảnh
  const {
    fileInputRef,
    dragOver,
    isUploading,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveImage,
    handleSetPrimaryImage,
    handleImageAltChange
  } = useProductImages(formData, setFormData);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Hình ảnh sản phẩm</h3>
      
      {/* Khu vực upload hình ảnh */}
      <div
        className={`border-2 ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'
        } rounded-lg p-8 text-center`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <FiImage className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-gray-700">
            <label
              htmlFor="product-images"
              className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500"
            >
              <span>Tải lên hình ảnh</span>
              <input
                id="product-images"
                type="file"
                ref={fileInputRef}
                className="sr-only"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            <p className="pl-1 text-gray-500">hoặc kéo và thả</p>
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF tối đa 10MB
          </p>
        </div>
      </div>

      {/* Danh sách hình ảnh đã tải lên */}
      <div className="mt-4">
        <h4 className="text-md font-medium text-gray-700 mb-2">Hình ảnh đã tải lên</h4>
        <ImageList
          images={formData.images || []}
          onRemove={handleRemoveImage}
          onSetPrimary={handleSetPrimaryImage}
          onAltChange={handleImageAltChange}
          isUploading={isUploading}
        />
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
        <h5 className="text-sm font-medium text-yellow-800">Lưu ý:</h5>
        <ul className="list-disc text-sm text-yellow-700 ml-5 mt-1">
          <li>Hình ảnh đầu tiên sẽ được chọn làm ảnh đại diện</li>
          <li>Bạn có thể kéo và thả để tải lên nhiều hình ảnh cùng lúc</li>
          <li>Nên sử dụng hình ảnh có tỷ lệ 1:1 để hiển thị tốt nhất</li>
          <li>Nếu sản phẩm chưa được lưu, hình ảnh sẽ được tải lên sau khi lưu sản phẩm</li>
        </ul>
      </div>
    </div>
  );
};

export default ImagesTab; 