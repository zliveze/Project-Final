import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { ProductFormData, ProductVariant } from '../types';

// Import các component con
import ImageUploader from '../components/ImageUploader';
import ImageList from '../components/ImageList';
import VariantForm from '../components/VariantForm';
import VariantList from '../components/VariantList';

interface ImagesAndVariantsTabProps {
  formData: ProductFormData;
  isViewMode?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement> | React.MutableRefObject<HTMLInputElement | null>;
  dragOver: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleRemoveImage: (imageId: string) => void;
  handleSetPrimaryImage: (imageId: string) => void;
  handleImageAltChange: (imageId: string, alt: string) => void;
  showVariantForm: boolean;
  currentVariant: ProductVariant;
  editingVariantIndex: number | null;
  handleAddVariant: () => void;
  handleEditVariant: (index: number) => void;
  handleRemoveVariant: (index: number) => void;
  handleVariantChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleVariantImageSelect: (imageId: string) => void;
  handleSaveVariant: () => void;
  handleCancelVariant: () => void;
}

/**
 * Component tab quản lý hình ảnh và biến thể sản phẩm
 */
const ImagesAndVariantsTab: React.FC<ImagesAndVariantsTabProps> = ({
  formData,
  isViewMode = false,
  fileInputRef,
  dragOver,
  handleImageUpload,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleRemoveImage,
  handleSetPrimaryImage,
  handleImageAltChange,
  showVariantForm,
  currentVariant,
  editingVariantIndex,
  handleAddVariant,
  handleEditVariant,
  handleRemoveVariant,
  handleVariantChange,
  handleVariantImageSelect,
  handleSaveVariant,
  handleCancelVariant
}) => {
  return (
    <div className="space-y-8">
      {/* Quản lý hình ảnh */}
      <div>
        <h3 className="text-lg font-medium mb-4">Hình ảnh sản phẩm</h3>
        
        {/* Khu vực tải lên hình ảnh */}
        {!isViewMode && (
          <ImageUploader
            dragOver={dragOver}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
          />
        )}
        
        {/* Hiển thị danh sách hình ảnh */}
        <ImageList
          images={formData.images}
          productName={formData.name}
          isViewMode={isViewMode}
          handleRemoveImage={handleRemoveImage}
          handleSetPrimaryImage={handleSetPrimaryImage}
          handleImageAltChange={handleImageAltChange}
        />
      </div>
      
      {/* Quản lý biến thể */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Biến thể sản phẩm</h3>
          {!isViewMode && !showVariantForm && (
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiPlus className="mr-1" /> Thêm biến thể
            </button>
          )}
        </div>
        
        {/* Form thêm/sửa biến thể */}
        {showVariantForm && !isViewMode && (
          <VariantForm
            currentVariant={currentVariant}
            editingVariantIndex={editingVariantIndex}
            images={formData.images}
            handleVariantChange={handleVariantChange}
            handleVariantImageSelect={handleVariantImageSelect}
            handleSaveVariant={handleSaveVariant}
            handleCancelVariant={handleCancelVariant}
          />
        )}
        
        {/* Danh sách biến thể */}
        <VariantList
          variants={formData.variants}
          images={formData.images}
          isViewMode={isViewMode}
          handleEditVariant={handleEditVariant}
          handleRemoveVariant={handleRemoveVariant}
        />
      </div>
    </div>
  );
};

export default ImagesAndVariantsTab; 