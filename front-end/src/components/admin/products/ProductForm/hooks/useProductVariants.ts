import { useState, useCallback } from 'react';
import { ProductFormData, ProductVariant, ProductImage } from '../types';

// Define the extended type within the hook or import if defined elsewhere
type ExtendedProductVariant = ProductVariant & { name?: string };

// Helper to create a default empty variant structure using the extended type
const createDefaultVariant = (): ExtendedProductVariant => ({
  variantId: `new-${Date.now()}`, // Temporary ID for new variant
  sku: '',
  price: 0,
  options: { 
    color: '',
    shades: [],
    sizes: []
  },
  images: []
});

/**
 * Hook quản lý biến thể sản phẩm (Refactored for inline form)
 */
export const useProductVariants = (
  formData: ProductFormData,
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>,
  allProductImages: ProductImage[] // Add all product images as an argument
) => {
  const [showVariantForm, setShowVariantForm] = useState(false); // Renamed state
  // Use ExtendedProductVariant for state that includes the name
  const [editingVariant, setEditingVariant] = useState<ExtendedProductVariant | null>(null); // Stores the original variant being edited
  const [currentVariantData, setCurrentVariantData] = useState<ExtendedProductVariant | null>(null); // Holds data for the inline form
  const [isVariantProcessing, setIsVariantProcessing] = useState(false);

  // Mở form để thêm biến thể mới
  const handleOpenAddVariant = useCallback(() => {
    setCurrentVariantData(createDefaultVariant());
    setEditingVariant(null); // Indicate it's a new variant
    setShowVariantForm(true);
  }, []);

  // Mở form để chỉnh sửa biến thể
  const handleOpenEditVariant = useCallback((variant: ExtendedProductVariant) => { // Expect ExtendedProductVariant
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
        const optionKey = name.split('.')[1];
        // Ensure options object exists
        const currentOptions = prev.options || { color: '', shades: [], sizes: [] };
        
        // Handle arrays for shades and sizes (convert comma-separated string to array)
        if (optionKey === 'shades' || optionKey === 'sizes') {
          const arrayValue = typeof parsedValue === 'string' 
            ? parsedValue.split(',').map(item => item.trim()).filter(item => item !== '')
            : parsedValue;
            
          return {
            ...prev,
            options: {
              ...currentOptions,
              [optionKey]: arrayValue
            }
          };
        }
        
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

  // Handler for selecting/deselecting images in VariantForm (stores full image objects)
  // Now accepts either publicId or id
  const handleVariantImageSelect = useCallback((identifier: string) => {
    // Find the full image object using either publicId or id
    const imageObject = allProductImages.find(img => img.publicId === identifier || img.id === identifier);
    
    if (!imageObject) {
      console.warn(`[useProductVariants] Image with identifier ${identifier} not found in allProductImages.`);
      return; 
    }
    
    // Use a reliable identifier from the found object for comparisons (prefer publicId)
    const reliableIdentifier = imageObject.publicId || imageObject.id;
    if (!reliableIdentifier) {
        console.warn(`[useProductVariants] Found image object for ${identifier} lacks both publicId and id.`);
        return;
    }

    setCurrentVariantData(prev => {
      if (!prev) return null;
      
      // Ensure prev.images is always an array of ProductImage objects
      const currentImageObjects = (Array.isArray(prev.images) ? prev.images : [])
        .map(imgOrId => {
          // If it's an ID/publicId string, find the corresponding object
          if (typeof imgOrId === 'string') { 
            return allProductImages.find(img => img.publicId === imgOrId || img.id === imgOrId);
          }
          // If it's already an object (potentially missing id/publicId if old data), keep it
          if (typeof imgOrId === 'object' && imgOrId !== null) {
            return imgOrId;
          }
          return undefined; // Invalid data
        })
        .filter((img): img is ProductImage => img !== null && img !== undefined); // Filter out invalid entries

      // Check if the image object already exists using the reliable identifier
      const exists = currentImageObjects.some(img => (img.publicId || img.id) === reliableIdentifier);
      
      if (exists) {
        // Remove the image object by filtering based on the reliable identifier
        const updatedImages = currentImageObjects.filter(img => (img.publicId || img.id) !== reliableIdentifier);
        // console.log(`[useProductVariants] Removing image ${reliableIdentifier}. New images:`, updatedImages);
        return { ...prev, images: updatedImages };
      } else {
        // Add the full image object
        const updatedImages = [...currentImageObjects, imageObject];
        // console.log(`[useProductVariants] Adding image ${reliableIdentifier}. New images:`, updatedImages);
        return { ...prev, images: updatedImages };
      }
    });
  }, [allProductImages]); // Add allProductImages as a dependency

  // Lưu biến thể (sử dụng currentVariantData)
  const handleSaveVariant = useCallback(() => { // No argument needed now
    if (!currentVariantData) return; // Should not happen if form is visible

    setIsVariantProcessing(true);

    // Basic validation (ensure name exists)
    if (!currentVariantData.name) {
        alert('Vui lòng nhập tên biến thể.');
        setIsVariantProcessing(false);
        return;
    }

    // Make a clean copy of currentVariantData
    const finalVariantData = { ...currentVariantData };

    try {
      if (editingVariant) {
        // Editing existing: Replace in formData.variants
        const updatedVariants = (formData.variants || []).map(v =>
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
  }, [currentVariantData, editingVariant, formData.variants, setFormData, handleCancelVariant]); // Keep dependencies as they were

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
