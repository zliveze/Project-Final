import React from 'react'; // Ensure React is imported
import { FiPlus } from 'react-icons/fi';
import { ProductFormData, ProductVariant, ProductImage } from '../types'; // Add ProductImage

// Import các component con
import ImageUploader from '../components/ImageUploader';
import ImageList from '../components/ImageList';
import VariantList from '../components/VariantList';
import VariantForm from '../components/VariantForm'; // Import VariantForm

// Define a local type for the variant data used within this tab, compatible with ExtendedProductVariant
type TabProductVariant = Omit<ProductVariant, 'images' | 'name'> & {
  name?: string;
  images?: (string | ProductImage)[]; // Use ProductImage here
  combinations?: Array<{
    combinationId?: string;
    attributes: Record<string, string>;
    price?: number;
    additionalPrice?: number;
  }>;
};

interface ImagesAndVariantsTabProps {
  formData: ProductFormData; // Keep formData for images and variants list
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

  // Props from the refactored useProductVariants hook
  showVariantForm: boolean;
  editingVariant: TabProductVariant | null; // Use TabProductVariant
  currentVariantData: TabProductVariant | null; // Use TabProductVariant
  isVariantProcessing: boolean;
  handleOpenAddVariant: () => void;
  handleOpenEditVariant: (variant: ProductVariant) => void;
  handleCancelVariant: () => void; // Renamed close handler
  handleSaveVariant: () => void; // Updated save handler
  handleDeleteVariant: (variantId: string) => void;
  handleVariantChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; // New handler - Added HTMLTextAreaElement
  handleVariantImageSelect: (imageId: string) => void; // New handler
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
  // Destructure all the new props from the hook
  showVariantForm,
  editingVariant,
  currentVariantData,
  // isVariantProcessing, // Removed as it's not used in this tab directly
  handleOpenAddVariant,
  handleOpenEditVariant,
  handleCancelVariant,
  handleSaveVariant,
  handleDeleteVariant,
  handleVariantChange,
  handleVariantImageSelect
}) => {
  // Determine if we are editing based on editingVariant prop
  const editingVariantIndex = editingVariant && formData.variants ?
    formData.variants.findIndex(v => v.variantId === editingVariant.variantId) : null;

  // Debug log to check data in view mode
  if (isViewMode) {
    console.log('ImagesAndVariantsTab - View Mode Data:', {
      images: formData.images || [],
      variants: formData.variants || []
    });
  }

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
          images={formData.images || []}
          productName={formData.name}
          isViewMode={isViewMode}
          handleRemoveImage={handleRemoveImage}
          handleSetPrimaryImage={handleSetPrimaryImage}
          handleImageAltChange={handleImageAltChange}
        />
      </div>

      {/* Quản lý biến thể */}
      {/* Quản lý biến thể */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Biến thể sản phẩm</h3>
          {!isViewMode && ( // Button always visible if not in view mode
            <button
              type="button"
              onClick={handleOpenAddVariant} // Use the correct handler
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiPlus className="mr-1" /> Thêm biến thể
            </button>
          )}
        </div>

        {/* Conditionally render the inline VariantForm */}
        {showVariantForm && currentVariantData && !isViewMode && (
          <VariantForm
            // Pass props expected by VariantForm
            currentVariant={currentVariantData} // Pass the form's current data
            editingVariantIndex={editingVariantIndex} // Pass the index or null
            images={formData.images || []} // Pass all product images for selection
            allVariants={formData.variants || []} // Pass all variants to check which images are already used
            handleVariantChange={handleVariantChange}
            handleVariantImageSelect={handleVariantImageSelect}
            handleSaveVariant={handleSaveVariant}
            handleCancelVariant={handleCancelVariant}
            // Consider adding isLoading prop to VariantForm if needed for button state
          />
        )}

        {/* Danh sách biến thể */}
        <VariantList
          variants={formData.variants || []}
          images={formData.images || []} // Pass images if VariantList needs them for display
          isViewMode={isViewMode}
          handleEditVariant={handleOpenEditVariant} // Pass the correct edit handler
          handleRemoveVariant={handleDeleteVariant} // Pass the correct remove handler
        />
      </div>
    </div>
  );
};

export default ImagesAndVariantsTab;
