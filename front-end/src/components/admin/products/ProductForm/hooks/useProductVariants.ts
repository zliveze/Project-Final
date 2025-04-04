import { useState, useCallback } from 'react';
import { ProductFormData, ProductVariant, ProductImage } from '../types';

// Helper to create a default empty variant structure
const createDefaultVariant = (): ProductVariant => ({
  variantId: `new-${Date.now()}`, // Temporary ID for new variant
  name: '',
  sku: '',
  price: 0,
  options: { color: '', shade: '', size: '' },
  images: [] // Initialize as empty string array
});

/**
 * Hook quản lý biến thể sản phẩm (Refactored for inline form)
 */
export const useProductVariants = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) => {
  const [showVariantForm, setShowVariantForm] = useState(false); // Renamed state
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null); // Stores the original variant being edited
  const [currentVariantData, setCurrentVariantData] = useState<ProductVariant | null>(null); // Holds data for the inline form
  const [isVariantProcessing, setIsVariantProcessing] = useState(false);

  // Mở form để thêm biến thể mới
  const handleOpenAddVariant = useCallback(() => {
    setCurrentVariantData(createDefaultVariant());
    setEditingVariant(null); // Indicate it's a new variant
    setShowVariantForm(true);
  }, []);

  // Mở form để chỉnh sửa biến thể
  const handleOpenEditVariant = useCallback((variant: ProductVariant) => {
    setCurrentVariantData({ ...variant }); // Load existing data into the form state
    setEditingVariant(variant); // Store the original variant being edited
    setShowVariantForm(true);
  }, []);

  // Đóng form và reset state
  const handleCancelVariant = useCallback(() => { // Renamed to match VariantForm prop expectation
    setShowVariantForm(false);
    setEditingVariant(null);
    setCurrentVariantData(null); // Clear the form data
  }, []);

  // Handler for input changes within the VariantForm
  const handleVariantChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle potential number conversion, default to 0 if parsing fails
    const parsedValue = type === 'number' ? (parseFloat(value) || 0) : value;

    setCurrentVariantData(prev => {
      if (!prev) return null;

      // Handle nested options
      if (name.startsWith('options.')) {
        const optionKey = name.split('.')[1] as keyof ProductVariant['options'];
        // Ensure options object exists
        const currentOptions = prev.options || { color: '', shade: '', size: '' };
        return {
          ...prev,
          options: {
            ...currentOptions,
            [optionKey]: parsedValue
          }
        };
      }
      // Handle top-level properties
      return { ...prev, [name]: parsedValue };
    });
  }, []);

  // Handler for selecting/deselecting images in VariantForm (stores only IDs)
  const handleVariantImageSelect = useCallback((imageId: string) => {
    setCurrentVariantData(prev => {
      if (!prev) return null;
      
      const currentImageIds = prev.images || []; // Already string[]
      const imageIndex = currentImageIds.indexOf(imageId);
      let updatedImageIds: string[];

      if (imageIndex > -1) {
        // Image ID exists, remove it
        updatedImageIds = currentImageIds.filter(id => id !== imageId);
      } else {
        // Image ID doesn't exist, add it
        updatedImageIds = [...currentImageIds, imageId];
      }
      return { ...prev, images: updatedImageIds };
    });
  }, []); // No dependency needed now

  // Lưu biến thể (sử dụng currentVariantData)
  const handleSaveVariant = useCallback(() => { // No argument needed now
    if (!currentVariantData) return; // Should not happen if form is visible

    setIsVariantProcessing(true);

    // Basic validation (example: ensure name exists)
    if (!currentVariantData.name?.trim()) {
        alert('Vui lòng nhập tên biến thể.');
        setIsVariantProcessing(false);
        return; // Add missing return statement
    }

    // No need to sanitize images, currentVariantData.images is already string[]
    const finalVariantData = { ...currentVariantData };

    try { // Ensure try block is correctly structured
      if (editingVariant) {
        // Editing existing: Replace in formData.variants
        const updatedVariants = formData.variants.map(v =>
          v.variantId === editingVariant.variantId ? finalVariantData : v
        );
        setFormData(prev => ({ ...prev, variants: updatedVariants }));
      } else {
        // Adding new: Append to formData.variants
        setFormData(prev => ({
          ...prev,
          variants: [...(prev.variants || []), finalVariantData]
        }));
      }
      handleCancelVariant(); // Close form on success
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Đã xảy ra lỗi khi lưu biến thể.'); // Inform user
    } finally {
      setIsVariantProcessing(false);
    }
  }, [currentVariantData, editingVariant, formData.variants, setFormData, handleCancelVariant]);

  // Xóa biến thể
  const handleDeleteVariant = useCallback((variantId: string) => {
    // Nếu đang chỉnh sửa biến thể này, đóng form
    if (editingVariant && editingVariant.variantId === variantId) {
      handleCancelVariant(); // Use the correct cancel handler
    }

    const updatedVariants = (formData.variants || []).filter(
      variant => variant.variantId !== variantId
    );
    
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
  }, [editingVariant, formData.variants, handleCancelVariant, setFormData]); // Use handleCancelVariant here

  // Note: handleAddVariantImage and handleRemoveVariantImage are no longer needed
  // as image selection is handled directly by handleVariantImageSelect updating currentVariantData

  return {
    showVariantForm, // Renamed state
    editingVariant, // Still useful to know if editing vs adding
    currentVariantData, // The data for the form
    isVariantProcessing,
    handleOpenAddVariant,
    handleOpenEditVariant,
    handleCancelVariant, // Renamed close handler
    handleSaveVariant, // Updated save handler
    handleDeleteVariant,
    // Add the new handlers needed by VariantForm:
    handleVariantChange,
    handleVariantImageSelect,
  };
};

export default useProductVariants;
