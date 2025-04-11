import { useState, useCallback } from 'react';
import { ProductFormData, ProductVariant, ProductImage } from '../types';

// Define the extended type within the hook or import if defined elsewhere
type ExtendedProductVariant = Omit<ProductVariant, 'images' | 'name'> & {
  name?: string;
  images?: (string | ProductImage)[];
};

// Helper to create a default empty variant structure using the extended type
const createDefaultVariant = (): ExtendedProductVariant => ({
  variantId: `new-${Date.now()}`, // Temporary ID for new variant
  name: '', // Add default name field
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

  // Handler for selecting/deselecting images in VariantForm
  // Accepts either publicId or id and toggles selection
  const handleVariantImageSelect = useCallback((identifier: string) => {
    if (!identifier) {
      console.warn(`[useProductVariants] Empty identifier provided to handleVariantImageSelect`);
      return;
    }

    // Find the full image object using either publicId or id
    const imageObject = allProductImages.find(img =>
      img.publicId === identifier || img.id === identifier
    );

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

    // Log for debugging
    console.log(`[useProductVariants] Processing image selection:`, {
      identifier,
      reliableIdentifier,
      imageObject
    });

    setCurrentVariantData(prev => {
      if (!prev) return null;

      // Ensure prev.images is always an array
      const currentImages = Array.isArray(prev.images) ? [...prev.images] : [];
      console.log('Current variant images before update:', currentImages);

      // Check if the image already exists in the array
      const existingIndex = currentImages.findIndex(img => {
        if (typeof img === 'string') {
          return img === reliableIdentifier;
        } else if (typeof img === 'object' && img !== null) {
          return (img.publicId || img.id) === reliableIdentifier;
        }
        return false;
      });

      // If image already exists, remove it (toggle off)
      if (existingIndex !== -1) {
        const updatedImages = [...currentImages];
        updatedImages.splice(existingIndex, 1);
        console.log(`[useProductVariants] Removing image ${reliableIdentifier}`);
        console.log('Updated variant images:', updatedImages);
        return { ...prev, images: updatedImages };
      }
      // Otherwise check if this image is already used by another variant
      else {
        // Check if this image is already used by another variant
        const isUsedByOtherVariant = formData.variants?.some(variant => {
          // Skip the current variant being edited
          if (prev.variantId && variant.variantId === prev.variantId) {
            return false;
          }

          // Check if this image is used by another variant
          return (variant.images || []).some(variantImage => {
            // If variantImage is a string (publicId or id)
            if (typeof variantImage === 'string') {
              return variantImage === reliableIdentifier;
            }
            // If variantImage is an object with publicId or id
            if (typeof variantImage === 'object' && variantImage !== null) {
              const variantImageId = variantImage.publicId || variantImage.id;
              return variantImageId === reliableIdentifier;
            }
            return false;
          });
        });

        // If image is already used by another variant, don't allow selection
        if (isUsedByOtherVariant) {
          console.log(`[useProductVariants] Image ${reliableIdentifier} is already used by another variant. Selection prevented.`);
          return prev; // Return unchanged state
        }

        // Otherwise add it (toggle on) - Store just the identifier string
        const imageIdentifier = imageObject.publicId || imageObject.id;
        if (!imageIdentifier) return prev; // Skip if no valid identifier

        const updatedImages = [...currentImages, imageIdentifier];
        console.log(`[useProductVariants] Adding image identifier: ${imageIdentifier}`);
        console.log('Updated variant images:', updatedImages);
        return { ...prev, images: updatedImages };
      }
    });
  }, [allProductImages, formData.variants]); // Add formData.variants as a dependency

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

    // Process images to ensure they have the correct format for saving
    if (finalVariantData.images && Array.isArray(finalVariantData.images)) {
      // For saving to the backend, we want to store just the publicId or id as strings
      // This ensures compatibility with the backend and prevents the temp-id issue
      const processedImages: string[] = [];

      console.log('Processing variant images for saving:', finalVariantData.images);

      // Process each image
      finalVariantData.images.forEach((img: any) => {
        // If it's already a string
        if (typeof img === 'string') {
          // If it's a temporary ID that starts with 'temp-', we need to find the real image
          if (img.startsWith('temp-')) {
            // Find the corresponding image in allProductImages
            // First try exact match
            let realImage = allProductImages.find(productImg =>
              productImg.id === img ||
              (typeof productImg.id === 'string' && productImg.id === img)
            );

            // If no exact match, try partial match
            if (!realImage) {
              realImage = allProductImages.find(productImg =>
                (typeof productImg.id === 'string' && typeof img === 'string' &&
                 (productImg.id.includes(img) || img.includes(productImg.id)))
              );

              if (realImage) {
                console.log(`Found partial ID match: ${img} ~ ${realImage.id}`);
              }
            }

            if (realImage && realImage.publicId) {
              processedImages.push(realImage.publicId);
              console.log(`Converted temp ID ${img} to publicId ${realImage.publicId}`);
            } else {
              // Try to find by matching with product images by publicId
              const matchingImage = allProductImages.find(productImg => {
                // Try exact publicId match
                if (productImg.publicId === img) {
                  return true;
                }

                // Try partial match with publicId
                if (typeof img === 'string' && typeof productImg.publicId === 'string') {
                  return productImg.publicId.includes(img) || img.includes(productImg.publicId);
                }
                return false;
              });

              if (matchingImage && matchingImage.publicId) {
                processedImages.push(matchingImage.publicId);
                console.log(`Found matching image for ${img}: ${matchingImage.publicId}`);
              } else {
                // Last resort: just use the string as is
                console.warn(`Could not find real image for ID ${img}, using as-is`);
                processedImages.push(img);
              }
            }
          } else {
            // It's already a valid ID (publicId or id), keep it
            processedImages.push(img);
            console.log(`Using existing image ID: ${img}`);
          }
        }
        // If it's an object with publicId or id
        else if (typeof img === 'object' && img !== null) {
          const imageId = img.publicId || img.id;
          if (imageId) {
            processedImages.push(imageId);
            console.log(`Using image ID from object: ${imageId}`);
          }
        }
      });

      // Replace the images array with just the string IDs
      finalVariantData.images = processedImages as any;
      console.log('Final processed variant images:', processedImages);
    }

    try {
      // Cast finalVariantData to ProductVariant to satisfy TypeScript
      const typedVariantData = finalVariantData as unknown as ProductVariant;

      if (editingVariant) {
        // Editing existing: Replace in formData.variants
        const updatedVariants = (formData.variants || []).map(v =>
          v.variantId === editingVariant.variantId ? typedVariantData : v
        );
        setFormData(prev => ({ ...prev, variants: updatedVariants }));
      } else {
        // Adding new: Append to formData.variants
        setFormData(prev => ({
          ...prev,
          variants: [...(prev.variants || []), typedVariantData]
        }));
      }
      handleCancelVariant(); // Close form on success
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Đã xảy ra lỗi khi lưu biến thể.'); // Inform user
    } finally {
      setIsVariantProcessing(false);
    }
  }, [currentVariantData, editingVariant, formData.variants, setFormData, handleCancelVariant, allProductImages]); // Added allProductImages

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
