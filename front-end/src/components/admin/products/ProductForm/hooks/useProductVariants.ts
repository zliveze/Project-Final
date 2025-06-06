import { useState, useCallback } from 'react';
import { ProductFormData, ProductVariant, ProductImage } from '../types';

// Define the extended type within the hook or import if defined elsewhere
type ExtendedProductVariant = Omit<ProductVariant, 'images' | 'name'> & {
  name?: string;
  images?: (string | ProductImage)[];
  combinations?: Array<{
    combinationId?: string;
    attributes: Record<string, string>;
    price?: number;
    additionalPrice?: number;
  }>;
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
  images: [],
  combinations: []
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
  const handleOpenEditVariant = useCallback((variantToEdit: ProductVariant) => {
    // Convert ProductVariant to ExtendedProductVariant for internal form state
    const { images, name, ...restOfVariant } = variantToEdit;
    const extendedVariantData: ExtendedProductVariant = {
      ...restOfVariant,
      name: name || '', // Ensure name is string, fallback if ProductVariant.name is optional
      images: images ? [...images] : [], // ProductImage[] is assignable to (string | ProductImage)[]
    };
    setCurrentVariantData(extendedVariantData);
    setEditingVariant(extendedVariantData); // Store the original variant (now extended) being edited
    setShowVariantForm(true);
  }, []);

  // Đóng form và reset state
  const handleCancelVariant = useCallback(() => { // Renamed to match VariantForm prop expectation
    setShowVariantForm(false);
    setEditingVariant(null);
    setCurrentVariantData(null); // Clear the form data
  }, []);

  // Handler for input changes within the VariantForm
  const handleVariantChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          // Lưu lại giá trị cũ để so sánh
          const oldValues = (currentOptions[optionKey] as string[] | undefined) || [];

          // Xử lý giá trị mới
          const arrayValue: string[] = typeof parsedValue === 'string'
            ? parsedValue.split(',').map(item => item.trim()).filter(item => item !== '')
            : (Array.isArray(parsedValue) ? parsedValue : []);


          // Tạo options mới với giá trị mới
          const newOptions = {
            ...currentOptions,
            [optionKey]: arrayValue
          };

          // Nếu có sự thay đổi trong shades hoặc sizes, cập nhật lại combinations
          if (JSON.stringify([...oldValues].sort()) !== JSON.stringify([...arrayValue].sort())) {
            console.log(`Phát hiện thay đổi trong ${optionKey}. Cập nhật lại tổ hợp.`);

            // Lưu lại các tổ hợp hiện tại
            const existingCombinations = prev.combinations || [];

            // Tạo tổ hợp mới dựa trên options mới
            const newCombinations = generateCombinations(
              newOptions.shades || [],
              newOptions.sizes || [],
              existingCombinations
            );

            return {
              ...prev,
              options: newOptions,
              combinations: newCombinations
            };
          }

          return {
            ...prev,
            options: newOptions
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
      // Handle combinations
      else if (name === 'combinations') {
        // Ensure parsedValue is an array before assigning
        const combinationsValue = Array.isArray(parsedValue) ? parsedValue : prev.combinations || [];
        return {
          ...prev,
          combinations: combinationsValue
        };
      }
      // Handle top-level properties
      return { ...prev, [name]: parsedValue };
    });
  }, []);

  // Hàm tạo tổ hợp từ shades và sizes
  const generateCombinations = (shades: string[], sizes: string[], existingCombinations: Array<{ combinationId?: string; attributes: Record<string, string>; price?: number; additionalPrice?: number; }> = []) => {
    const newCombinations: Array<{ combinationId?: string; attributes: Record<string, string>; price?: number; additionalPrice?: number; }> = [];

    // Nếu có cả shades và sizes, tạo tổ hợp từ cả hai
    if (shades.length > 0 && sizes.length > 0) {
      for (const shade of shades) {
        for (const size of sizes) {
          // Tìm tổ hợp tương ứng trong các tổ hợp hiện tại (nếu có)
          const existingCombination = existingCombinations.find(c =>
            c.attributes && c.attributes.shade === shade && c.attributes.size === size
          );

          if (existingCombination) {
            // Sử dụng lại tổ hợp hiện tại
            newCombinations.push(existingCombination);
          } else {
            // Tạo tổ hợp mới
            newCombinations.push({
              combinationId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              attributes: { shade, size },
              price: 0,
              additionalPrice: 0
            });
          }
        }
      }
    }
    // Nếu chỉ có shades, tạo tổ hợp từ shades
    else if (shades.length > 0) {
      for (const shade of shades) {
        // Tìm tổ hợp tương ứng trong các tổ hợp hiện tại (nếu có)
        const existingCombination = existingCombinations.find(c =>
          c.attributes && c.attributes.shade === shade && !c.attributes.size
        );

        if (existingCombination) {
          // Sử dụng lại tổ hợp hiện tại
          newCombinations.push(existingCombination);
        } else {
          // Tạo tổ hợp mới
          newCombinations.push({
            combinationId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            attributes: { shade },
            price: 0,
            additionalPrice: 0
          });
        }
      }
    }
    // Nếu chỉ có sizes, tạo tổ hợp từ sizes
    else if (sizes.length > 0) {
      for (const size of sizes) {
        // Tìm tổ hợp tương ứng trong các tổ hợp hiện tại (nếu có)
        const existingCombination = existingCombinations.find(c =>
          c.attributes && c.attributes.size === size && !c.attributes.shade
        );

        if (existingCombination) {
          // Sử dụng lại tổ hợp hiện tại
          newCombinations.push(existingCombination);
        } else {
          // Tạo tổ hợp mới
          newCombinations.push({
            combinationId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            attributes: { size },
            price: 0,
            additionalPrice: 0
          });
        }
      }
    }

    return newCombinations;
  };

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
    // Nếu có publicId thì dùng publicId, nếu không thì dùng id
    const reliableIdentifier = imageObject.publicId || imageObject.id;
    if (!reliableIdentifier) {
      console.warn(`[useProductVariants] Found image object for ${identifier} lacks both publicId and id.`);
      return;
    }

    // Create a clean copy of the image object with only necessary properties
    const cleanImageObject = {
      id: imageObject.id,
      publicId: imageObject.publicId,
      url: imageObject.url,
      alt: imageObject.alt || '',
      preview: imageObject.preview || imageObject.url
    };

    setCurrentVariantData(prev => {
      if (!prev) return null;

      // Ensure prev.images is always an array
      const currentImages = Array.isArray(prev.images) ? [...prev.images] : [];

      // Check if the image already exists in the array - improved matching
      const existingIndex = currentImages.findIndex(img => {
        // If it's a string identifier
        if (typeof img === 'string') {
          return img === reliableIdentifier;
        }
        // If it's an object with publicId or id
        else if (typeof img === 'object' && img !== null) {
          // Check by ID
          if ((img.publicId && img.publicId === imageObject.publicId) ||
              (img.id && img.id === imageObject.id)) {
            return true;
          }
          // Check by URL
          if (img.url && imageObject.url && img.url === imageObject.url) {
            return true;
          }
        }
        return false;
      });

      // If image already exists, remove it (toggle off)
      if (existingIndex !== -1) {
        const updatedImages = [...currentImages];
        updatedImages.splice(existingIndex, 1);
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

          // Check if this image is used by another variant - improved matching
          return (variant.images || []).some(variantImage => {
            // If it's a string identifier
            if (typeof variantImage === 'string') {
              return variantImage === reliableIdentifier;
            }
            // If it's an object with publicId or id
            else if (typeof variantImage === 'object' && variantImage !== null) {
              // Check by ID
              if ((variantImage.publicId && variantImage.publicId === imageObject.publicId) ||
                  (variantImage.id && variantImage.id === imageObject.id)) {
                return true;
              }
              // Check by URL
              if (variantImage.url && imageObject.url && variantImage.url === imageObject.url) {
                return true;
              }
            }
            return false;
          });
        });

        // If image is already used by another variant, don't allow selection
        if (isUsedByOtherVariant) {
          return prev; // Return unchanged state
        }

        // Otherwise add it (toggle on) - Store the clean image object
        const updatedImages = [...currentImages, cleanImageObject];
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
      // For saving to the backend, we want to store full image objects with all necessary properties
      // This ensures compatibility with the backend and prevents the temp-id issue
      const processedImages: ProductImage[] = [];

      // Process each image
      finalVariantData.images.forEach((img: string | ProductImage) => {
        // If it's already a full image object with url
        if (typeof img === 'object' && img !== null && 'url' in img && img.url) {
          // Make sure it has all required properties
          const processedImage: ProductImage = {
            url: img.url,
            alt: img.alt || '',
            publicId: img.publicId || img.id || '',
            id: img.id || img.publicId || '',
            isPrimary: img.isPrimary || false
          };
          processedImages.push(processedImage);
        }
        // If it's a string identifier
        else if (typeof img === 'string') {
          // Find the corresponding full image object in allProductImages
          const matchingImage = allProductImages.find(productImg => {
            // Try exact match first
            if (productImg.publicId === img || productImg.id === img) {
              return true;
            }

            // Try URL match if img looks like a URL
            if ((img.startsWith('http') || img.startsWith('/')) &&
                productImg.url === img) {
              return true;
            }

            return false;
          });

          if (matchingImage) {
            // Use the full image object
            const processedImage: ProductImage = {
              url: matchingImage.url,
              alt: matchingImage.alt || '',
              publicId: matchingImage.publicId || matchingImage.id || '',
              id: matchingImage.id || matchingImage.publicId || '',
              isPrimary: matchingImage.isPrimary || false
            };
            processedImages.push(processedImage);
          }
        }
      });

      // Replace the images array with the processed full image objects
      finalVariantData.images = processedImages;
    }

    try {
      // Cast finalVariantData to ProductVariant to satisfy TypeScript
      const typedVariantData = finalVariantData as unknown as ProductVariant;

      if (editingVariant) {
        // Editing existing: Replace in formData.variants
        const updatedVariants = (formData.variants || []).map(v =>
          v.variantId === editingVariant.variantId ? typedVariantData : v
        );

        // Xử lý khi cập nhật biến thể đã tồn tại
        // Tìm biến thể cũ để so sánh
        const oldVariant = formData.variants?.find(v => v.variantId === editingVariant.variantId);

        if (oldVariant) {
          // Lấy danh sách các tổ hợp cũ
          const oldCombinations = oldVariant.combinations || [];
          // Lấy danh sách các tổ hợp mới
          const newCombinations = typedVariantData.combinations || [];

          // Tìm các tổ hợp đã bị xóa
          const oldCombinationIds = oldCombinations.map(c => c.combinationId?.toString());
          const newCombinationIds = newCombinations.map(c => c.combinationId?.toString());

          // Lọc ra các combinationId đã bị xóa
          const removedCombinationIds = oldCombinationIds.filter(id =>
            id && !newCombinationIds.includes(id)
          );

          if (removedCombinationIds.length > 0) {
            console.log(`Phát hiện ${removedCombinationIds.length} tổ hợp đã bị xóa. Cập nhật tồn kho.`);

            // Lọc ra các mục tồn kho tổ hợp còn lại (loại bỏ các mục của tổ hợp bị xóa)
            const updatedCombinationInventory = (formData.combinationInventory || []).filter(
              item => !removedCombinationIds.includes(item.combinationId?.toString())
            );

            // Cập nhật formData với tồn kho tổ hợp đã được cập nhật
            setFormData(prev => ({
              ...prev,
              variants: updatedVariants,
              combinationInventory: updatedCombinationInventory
            }));

            return; // Đã cập nhật formData, không cần thực hiện setFormData bên dưới nữa
          }
        }

        // Nếu không có tổ hợp nào bị xóa, cập nhật formData bình thường
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
  }, [currentVariantData, editingVariant, formData.variants, formData.combinationInventory, setFormData, handleCancelVariant, allProductImages]); // Added dependencies

  // Xóa biến thể
  const handleDeleteVariant = useCallback((variantId: string) => {
    // Nếu đang chỉnh sửa biến thể này, đóng form
    if (editingVariant && editingVariant.variantId === variantId) {
      handleCancelVariant(); // Use the correct cancel handler
    }

    // Tìm biến thể cần xóa để lấy thông tin về các tổ hợp
    const variantToDelete = formData.variants?.find(v => v.variantId === variantId);
    const combinationIds = variantToDelete?.combinations?.map(c => c.combinationId) || [];

    // Lọc ra các biến thể còn lại
    const updatedVariants = (formData.variants || []).filter(
      variant => variant.variantId !== variantId
    );

    // Lọc ra các mục tồn kho biến thể còn lại (loại bỏ các mục của biến thể bị xóa)
    const updatedVariantInventory = (formData.variantInventory || []).filter(
      item => item.variantId !== variantId
    );

    // Lọc ra các mục tồn kho tổ hợp còn lại (loại bỏ các mục của biến thể bị xóa)
    const updatedCombinationInventory = (formData.combinationInventory || []).filter(
      item => item.variantId !== variantId || !combinationIds.includes(item.combinationId)
    );

    // Cập nhật lại số lượng tồn kho của các chi nhánh
    const updatedInventory = [...(formData.inventory || [])];

    // Tạo Map để theo dõi các chi nhánh cần cập nhật
    const branchesToUpdate = new Map<string, boolean>();

    // Đánh dấu các chi nhánh có biến thể bị xóa
    (formData.variantInventory || []).forEach(item => {
      if (item.variantId === variantId) {
        branchesToUpdate.set(item.branchId, true);
      }
    });

    // Cập nhật số lượng tồn kho cho từng chi nhánh
    branchesToUpdate.forEach((_, branchId) => {
      const branchIndex = updatedInventory.findIndex(item => item.branchId === branchId);

      if (branchIndex !== -1) {
        // Tính tổng số lượng từ các biến thể còn lại trong chi nhánh
        const remainingVariantInventory = updatedVariantInventory.filter(
          item => item.branchId === branchId
        );

        const newBranchTotal = remainingVariantInventory.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );

        // Cập nhật số lượng mới cho chi nhánh
        updatedInventory[branchIndex].quantity = newBranchTotal;
      }
    });

    setFormData(prev => {
      // Nếu đã xóa biến thể cuối cùng, xóa tất cả tồn kho biến thể và tổ hợp
      if (updatedVariants.length === 0) {
        return {
          ...prev,
          variants: updatedVariants,
          variantInventory: [],
          combinationInventory: [],
          inventory: updatedInventory
        };
      }

      return {
        ...prev,
        variants: updatedVariants,
        variantInventory: updatedVariantInventory,
        combinationInventory: updatedCombinationInventory,
        inventory: updatedInventory
      };
    });
  }, [editingVariant, formData.variants, formData.variantInventory, formData.combinationInventory, formData.inventory, handleCancelVariant, setFormData]); // Updated dependencies

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
