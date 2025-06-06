import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, Plus, Palette, Layers, ImagePlus } from 'lucide-react';
import { ProductVariant, ProductImage as OriginalProductImage } from '../types'; // Renamed to OriginalProductImage

// Mở rộng interface ProductVariant để thêm trường name và cho phép images là (string | OriginalProductImage)[]
type ExtendedProductVariant = Omit<ProductVariant, 'images'> & {
  name?: string;
  images?: (string | OriginalProductImage)[];
};

interface VariantFormProps {
  currentVariant: ExtendedProductVariant;
  editingVariantIndex: number | null;
  images: OriginalProductImage[];
  allVariants: ProductVariant[]; // Add all variants to check which images are already used
  handleVariantChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; // Allow TextAreaEvent
  handleVariantImageSelect: (imageId: string) => void;
  handleSaveVariant: () => void;
  handleCancelVariant: () => void;
}

/**
 * Component form thêm/sửa biến thể sản phẩm
 */
const VariantForm: React.FC<VariantFormProps> = ({
  currentVariant,
  editingVariantIndex,
  images,
  allVariants,
  handleVariantChange,
  handleVariantImageSelect,
  handleSaveVariant,
  handleCancelVariant
}) => {
  // State lưu trữ tên màu và mã màu
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('#ffffff');
  // State for raw input of shades and sizes
  const [shadesInput, setShadesInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');

  // State for combinations
  const [showCombinations, setShowCombinations] = useState(false);
  const [combinations, setCombinations] = useState<Array<{
    id: string;
    attributes: Record<string, string>;
    price: number;
    additionalPrice: number;
  }>>([]);

  // Ref để lưu giá trị thực tế của input
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Cập nhật state khi currentVariant thay đổi
  useEffect(() => {
    if (currentVariant.options?.color) {
      const colorParts = parseColorString(currentVariant.options.color);
      setColorName(colorParts.name || '');
      setColorCode(colorParts.code || '#ffffff');
    } else {
      setColorName('');
      setColorCode('#ffffff');
    }
    // Sync local input states with currentVariant
    setShadesInput(Array.isArray(currentVariant.options?.shades) ? currentVariant.options.shades.join(', ') : '');
    setSizesInput(Array.isArray(currentVariant.options?.sizes) ? currentVariant.options.sizes.join(', ') : '');

    // Sync combinations
    if (Array.isArray(currentVariant.combinations) && currentVariant.combinations.length > 0) {
      setCombinations(currentVariant.combinations.map(combo => ({
        id: combo.combinationId || `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        attributes: combo.attributes || {},
        price: combo.price || currentVariant.price || 0,
        additionalPrice: combo.additionalPrice || 0
      })));
      setShowCombinations(true);
    } else {
      setCombinations([]);
      setShowCombinations(false);
    }
  }, [currentVariant]);

  // Hàm tách chuỗi màu thành tên và mã màu
  const parseColorString = (colorString: string): { name: string, code: string } => {
    if (!colorString) return { name: '', code: '' };

    // Màu có định dạng "Tên màu #mã-màu"
    const regex = /^(.*?)\s*"(#[0-9a-fA-F]{6})"$/;
    const match = colorString.match(regex);

    if (match && match.length === 3) {
      return { name: match[1].trim(), code: match[2] };
    }

    return { name: colorString, code: '#ffffff' };
  };

  // Hàm cập nhật tên màu
  const handleColorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setColorName(newName);
  };

  // Hàm cập nhật mã màu
  const handleColorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value;
    setColorCode(newCode);
  };

  // Hàm cập nhật màu sắc kết hợp
  const updateColorCombination = () => {
    // Lấy giá trị trực tiếp từ input qua ref nếu có
    const inputValue = colorInputRef.current ? colorInputRef.current.value : colorName;
    const formattedName = inputValue.trim();

    // Tạo chuỗi kết hợp
    const combinedColor = formattedName ? `${formattedName} "${colorCode}"` : `"${colorCode}"`;

    // Tạo event object
    const event = {
      target: {
        name: 'options.color',
        value: combinedColor
      }
    } as React.ChangeEvent<HTMLInputElement>;

    // Gọi handler
    handleVariantChange(event);
  };

  // Handler for processing shades/sizes on blur
  const handleMultiOptionBlur = (
    inputName: 'options.shades' | 'options.sizes',
    inputValue: string
  ) => {
    // Lưu lại giá trị cũ để so sánh
    const oldValues = inputName === 'options.shades'
      ? Array.isArray(currentVariant.options?.shades) ? currentVariant.options.shades : []
      : Array.isArray(currentVariant.options?.sizes) ? currentVariant.options.sizes : [];

    // Xử lý giá trị mới
    const processedArray = inputValue.split(',').map(s => s.trim()).filter(s => s);

    // Create a synthetic event that matches the expected structure for handleVariantChange
    const syntheticEvent = {
      target: {
        name: inputName,
        value: processedArray // Pass the processed array directly
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>; // Use InputElement type assertion as handleVariantChange expects it
    handleVariantChange(syntheticEvent);

    // Kiểm tra xem có sự thay đổi không
    if (JSON.stringify(oldValues.sort()) !== JSON.stringify(processedArray.sort())) {
      console.log(`Phát hiện thay đổi trong ${inputName}. Cập nhật lại tổ hợp.`);

      // Generate combinations if both shades and sizes have values
      if (inputName === 'options.shades' || inputName === 'options.sizes') {
        const shades = inputName === 'options.shades' ? processedArray :
                      Array.isArray(currentVariant.options?.shades) ? currentVariant.options.shades : [];
        const sizes = inputName === 'options.sizes' ? processedArray :
                     Array.isArray(currentVariant.options?.sizes) ? currentVariant.options.sizes : [];

        if (shades.length > 0 || sizes.length > 0) {
          generateCombinations(shades, sizes);
        }
      }
    }
  };

  // Generate combinations from shades and sizes
  const generateCombinations = (shades: string[], sizes: string[]) => {
    const newCombinations: Array<{
      id: string;
      attributes: Record<string, string>;
      price: number;
      additionalPrice: number;
    }> = [];

    // If both shades and sizes exist, create combinations of both
    if (shades.length > 0 && sizes.length > 0) {
      for (const shade of shades) {
        for (const size of sizes) {
          // Check if this combination already exists
          const existingCombo = combinations.find(c =>
            c.attributes.shade === shade && c.attributes.size === size
          );

          if (existingCombo) {
            newCombinations.push(existingCombo);
          } else {
            newCombinations.push({
              id: `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              attributes: { shade, size },
              price: currentVariant.price || 0,
              additionalPrice: 0
            });
          }
        }
      }
    }
    // If only shades exist
    else if (shades.length > 0) {
      for (const shade of shades) {
        // Check if this combination already exists
        const existingCombo = combinations.find(c =>
          c.attributes.shade === shade && !c.attributes.size
        );

        if (existingCombo) {
          newCombinations.push(existingCombo);
        } else {
          newCombinations.push({
            id: `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            attributes: { shade },
            price: currentVariant.price || 0,
            additionalPrice: 0
          });
        }
      }
    }
    // If only sizes exist
    else if (sizes.length > 0) {
      for (const size of sizes) {
        // Check if this combination already exists
        const existingCombo = combinations.find(c =>
          c.attributes.size === size && !c.attributes.shade
        );

        if (existingCombo) {
          newCombinations.push(existingCombo);
        } else {
          newCombinations.push({
            id: `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            attributes: { size },
            price: currentVariant.price || 0,
            additionalPrice: 0
          });
        }
      }
    }

    setCombinations(newCombinations);
    setShowCombinations(newCombinations.length > 0);

    // Update the currentVariant with the new combinations
    const syntheticEvent = {
      target: {
        name: 'combinations',
        value: newCombinations.map(combo => ({
          combinationId: combo.id,
          attributes: combo.attributes,
          price: combo.price,
          additionalPrice: combo.additionalPrice
        }))
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleVariantChange(syntheticEvent);
  };

  // Handle combination price change
  const handleCombinationPriceChange = (id: string, value: number) => {
    const updatedCombinations = combinations.map(combo => {
      if (combo.id === id) {
        return { ...combo, price: value };
      }
      return combo;
    });

    setCombinations(updatedCombinations);

    // Update the currentVariant with the new combinations
    const syntheticEvent = {
      target: {
        name: 'combinations',
        value: updatedCombinations.map(combo => ({
          combinationId: combo.id,
          attributes: combo.attributes,
          price: combo.price,
          additionalPrice: combo.additionalPrice
        }))
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleVariantChange(syntheticEvent);
  };

  // Handle combination additional price change
  const handleCombinationAdditionalPriceChange = (id: string, value: number) => {
    const updatedCombinations = combinations.map(combo => {
      if (combo.id === id) {
        return { ...combo, additionalPrice: value };
      }
      return combo;
    });

    setCombinations(updatedCombinations);

    // Update the currentVariant with the new combinations
    const syntheticEvent = {
      target: {
        name: 'combinations',
        value: updatedCombinations.map(combo => ({
          combinationId: combo.id,
          attributes: combo.attributes,
          price: combo.price,
          additionalPrice: combo.additionalPrice
        }))
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleVariantChange(syntheticEvent);
  };


  return (
    <div className="bg-white p-5 rounded-lg shadow-sm mb-4 border border-gray-100">
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h4 className="text-lg font-medium text-gray-800">{editingVariantIndex !== null ? 'Sửa biến thể' : 'Thêm biến thể mới'}</h4>
        <p className="text-sm text-gray-500 mt-1">Nhập thông tin chi tiết cho biến thể sản phẩm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
        {/* Tên biến thể */}
        <div className="space-y-1.5">
          <label htmlFor="variant-name" className="block text-sm font-medium text-gray-700">
            Tên biến thể <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="variant-name"
            name="name"
            value={currentVariant.name || ''}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
            placeholder="Nhập tên biến thể"
            required
          />
        </div>

        {/* SKU */}
        <div className="space-y-1.5">
          <label htmlFor="variant-sku" className="block text-sm font-medium text-gray-700">
            Mã SKU
          </label>
          <input
            type="text"
            id="variant-sku"
            name="sku"
            value={currentVariant.sku || ''}
            onChange={handleVariantChange}
            placeholder="Nhập mã SKU cho biến thể"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
          />
        </div>

        {/* Giá */}
        <div className="space-y-1.5">
          <label htmlFor="variant-price" className="block text-sm font-medium text-gray-700">
            Giá (VNĐ)
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="number"
              id="variant-price"
              name="price"
              value={currentVariant.price}
              onChange={handleVariantChange}
              min="0"
              step="1000"
              placeholder="0"
              className="block w-full rounded-md border border-gray-300 pl-7 pr-12 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₫</span>
            </div>
          </div>
        </div>

        {/* Màu sắc - sử dụng color picker + tên màu */}
        <div className="space-y-1.5">
          <label htmlFor="variant-color-name" className="flex items-center text-sm font-medium text-gray-700">
            <Palette className="h-4 w-4 mr-1.5 text-pink-500" strokeWidth={1.5} />
            Tên màu
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <input
                type="text"
                id="variant-color-name"
                ref={colorInputRef}
                value={colorName}
                onChange={handleColorNameChange}
                onBlur={updateColorCombination}
                placeholder="Ví dụ: Đỏ, Xanh navy, Hồng cánh sen,..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
              />
            </div>
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="color"
                  id="variant-color-code"
                  value={colorCode}
                  onChange={handleColorCodeChange}
                  onBlur={updateColorCombination}
                  className="h-10 w-14 rounded-md border border-gray-300 p-0 cursor-pointer shadow-sm"
                />
              </div>
            </div>
          </div>
          {colorName && (
            <div className="flex items-center mt-2 bg-gray-50 rounded-md p-2 border border-gray-100">
              <div
                className="h-4 w-4 rounded-full mr-2 border border-gray-200 shadow-sm"
                style={{ backgroundColor: colorCode }}
              ></div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">{colorName}</span>
                <span className="text-gray-400 ml-1.5">{colorCode}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tông màu (Multiple) - Sử dụng textarea thay vì input */}
        <div className="space-y-1.5">
          <label htmlFor="variant-shades" className="flex items-center text-sm font-medium text-gray-700">
            <Layers className="h-4 w-4 mr-1.5 text-purple-500" strokeWidth={1.5} />
            Tông màu
          </label>
          <textarea
            id="variant-shades"
            name="shades"
            value={shadesInput}
            onChange={(e) => setShadesInput(e.target.value)}
            onBlur={() => handleMultiOptionBlur('options.shades', shadesInput)}
            placeholder="Ví dụ: Nude, Cam đất, Hồng đào"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
            rows={2}
          />
          <p className="text-xs text-gray-500">Các tông màu cách nhau bởi dấu phẩy</p>
          {Array.isArray(currentVariant.options?.shades) && currentVariant.options.shades.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentVariant.options.shades.map((shade, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                  {shade}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Kích thước (Multiple) - Sử dụng textarea thay vì input */}
        <div className="space-y-1.5">
          <label htmlFor="variant-sizes" className="flex items-center text-sm font-medium text-gray-700">
            <Layers className="h-4 w-4 mr-1.5 text-blue-500" strokeWidth={1.5} />
            Kích thước
          </label>
          <textarea
            id="variant-sizes"
            name="sizes"
            value={sizesInput}
            onChange={(e) => setSizesInput(e.target.value)}
            onBlur={() => handleMultiOptionBlur('options.sizes', sizesInput)}
            placeholder="Ví dụ: 5ml, 15ml, Full size"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
            rows={2}
          />
          <p className="text-xs text-gray-500">Các kích thước cách nhau bởi dấu phẩy</p>
          {Array.isArray(currentVariant.options?.sizes) && currentVariant.options.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentVariant.options.sizes.map((size, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {size}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chọn hình ảnh cho biến thể */}
      {images && images.length > 0 && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
            <ImagePlus className="h-4 w-4 mr-1.5 text-pink-500" strokeWidth={1.5} />
            Hình ảnh của biến thể
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((image, idx) => {
              // Use publicId as a more reliable key if available, fallback to id or index
              const imageKey = image.publicId || image.id || `image-${idx}`;

              // --- DEBUGGING V2 ---
              // console.log(`[VariantForm V2] Rendering Image Key: ${imageKey}`, {
              //   id: image.id,
              //   publicId: image.publicId,
              //   url: image.url,
              //   preview: image.preview
              // });
              // console.log(`[VariantForm V2] Current Variant Images State:`, JSON.stringify(currentVariant.images)); // Stringify for better object view
              // --- END DEBUGGING ---

              // Get reliable identifiers for comparison
              const imageIdentifier = image.publicId || image.id;

              // Simplified check for image selection to avoid TypeScript errors
              const isSelected = (currentVariant.images || []).some(variantImage => {
                // If variantImage is a string (publicId or id)
                if (typeof variantImage === 'string') {
                  // Exact match
                  return variantImage === imageIdentifier;
                }

                // If variantImage is an object with publicId or id
                if (typeof variantImage === 'object' && variantImage !== null) {
                  const variantImageId = variantImage.publicId || variantImage.id;

                  // Exact match with ID
                  if (variantImageId === imageIdentifier) return true;

                  // Check URL match
                  if (variantImage.url && image.url && variantImage.url === image.url) {
                    return true;
                  }

                  return false;
                }
                return false;
              });

              // Additional check - compare with image object directly
              let matchByObject = false;
              if (!isSelected && currentVariant.images) {
                // Try to find a match by comparing the actual image objects
                matchByObject = currentVariant.images.some(img => {
                  if (typeof img === 'object' && img !== null) {
                    // Compare by URL
                    if (img.url && image.url && img.url === image.url) return true;
                    // Compare by ID
                    if ((img.id && image.id && img.id === image.id) ||
                        (img.publicId && image.publicId && img.publicId === image.publicId)) {
                      return true;
                    }
                  }
                  return false;
                });

                if (matchByObject) {
                  console.log(`Found match by object comparison for image: ${imageIdentifier}`);
                }
              }

              // Combine both checks
              const finalIsSelected = isSelected || matchByObject;

              // Check if this image is already used by another variant
              const isUsedByOtherVariant = allVariants.some(variant => {
                // Skip the current variant being edited
                if (currentVariant.variantId && variant.variantId === currentVariant.variantId) {
                  return false;
                }

                // Check if this image is used by another variant
                return (variant.images || []).some(variantImage => {
                  // If variantImage is a string (publicId or id)
                  if (typeof variantImage === 'string') {
                    return variantImage === imageIdentifier;
                  }
                  // If variantImage is an object with publicId or id
                  if (typeof variantImage === 'object' && variantImage !== null) {
                    const variantImageId = variantImage.publicId || variantImage.id;
                    return variantImageId === imageIdentifier;
                  }
                  return false;
                });
              });

              // Removed excessive logging to improve performance

              // Determine the correct src, prioritizing url
              const imageSrc = image.url || image.preview;
              // console.log(`[VariantForm V2] Image Key: ${imageKey}, Using src: ${imageSrc || 'NONE'}`); // Log if src is missing

              // If imageSrc is missing, render a placeholder or skip rendering
              if (!imageSrc) {
                 console.warn(`[VariantForm V2] Image Key: ${imageKey} is missing both url and preview. Skipping render.`);
                 return null; // Or render a placeholder div
              }

              return (
                <div
                  key={imageKey}
                  className={`relative border rounded-md ${isUsedByOtherVariant && !finalIsSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} p-1 group transition-all duration-200 ${
                    finalIsSelected
                      ? 'border-pink-500 ring-2 ring-pink-500 shadow-md transform scale-105'
                      : isUsedByOtherVariant
                        ? 'border-gray-300 bg-gray-100'
                        : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                  }`}
                  onClick={() => {
                    // Only allow selection if not used by another variant or already selected
                    if (!isUsedByOtherVariant || finalIsSelected) {
                      console.log(`Selecting image: ${imageIdentifier}`);
                      handleVariantImageSelect(imageIdentifier || '');
                    } else {
                      console.log(`Image ${imageIdentifier} is already used by another variant`);
                    }
                  }}
                >
                  <div className="relative w-full h-16"> {/* Ensure parent has dimensions for layout="fill" */}
                    {/* The actual image */}
                    <Image
                      src={imageSrc || '/placeholder.png'} // Added placeholder for safety
                      alt={image.alt || `Variant Image ${idx}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded transition-all"
                      onError={() => {
                        console.error("Image failed to load:", image.url || image.preview);
                      }}
                    />

                    {/* Selection indicator - checkmark or used by other variant indicator */}
                    {finalIsSelected && (
                      <div className="absolute top-1 right-1 bg-pink-500 rounded-full p-0.5 shadow-sm z-10">
                        <Check className="text-white w-4 h-4" strokeWidth={2} />
                      </div>
                    )}
                    {isUsedByOtherVariant && !finalIsSelected && (
                      <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
                        <span className="text-xs text-gray-700 font-medium px-1.5 py-0.5 bg-white bg-opacity-75 rounded-md shadow-sm">
                          Đã sử dụng
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tổ hợp biến thể */}
      {(Array.isArray(currentVariant.options?.shades) && currentVariant.options.shades.length > 0) ||
       (Array.isArray(currentVariant.options?.sizes) && currentVariant.options.sizes.length > 0) ? (
        <div className="mb-6 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Layers className="h-4 w-4 mr-1.5 text-pink-500" strokeWidth={1.5} />
              Tổ hợp biến thể
            </h4>
            <button
              type="button"
              onClick={() => setShowCombinations(!showCombinations)}
              className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center transition-colors duration-200"
            >
              {showCombinations ? 'Ẩn tổ hợp' : 'Hiển thị tổ hợp'}
            </button>
          </div>

          {showCombinations && combinations.length > 0 && (
            <div className="p-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thuộc tính</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {combinations.map((combo) => (
                      <tr key={combo.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3 pl-4 pr-3 text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(combo.attributes).map(([key, value]) => {
                              // Chọn màu sắc cho từng loại thuộc tính
                              const bgColor = key === 'shade' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700';
                              return (
                                <span key={key} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
                                  {key === 'shade' ? 'Tông:' : 'Kích thước:'} {value}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="relative rounded-md shadow-sm">
                              <input
                                type="number"
                                value={combo.price}
                                onChange={(e) => handleCombinationPriceChange(combo.id, Number(e.target.value))}
                                min="0"
                                step="1000"
                                className="block w-28 rounded-md border border-gray-300 pl-7 py-1.5 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
                              />
                              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">₫</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                <Plus className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                              </div>
                              <input
                                type="number"
                                value={combo.additionalPrice}
                                onChange={(e) => handleCombinationAdditionalPriceChange(combo.id, Number(e.target.value))}
                                min="0"
                                step="1000"
                                className="block w-28 rounded-md border border-gray-300 pl-7 py-1.5 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none sm:text-sm transition-all duration-200"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Nút điều khiển */}
      <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={handleCancelVariant}
          className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-200 shadow-sm"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSaveVariant}
          className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 shadow-sm"
        >
          {editingVariantIndex !== null ? 'Cập nhật biến thể' : 'Thêm biến thể'}
        </button>
      </div>
    </div>
  );
};

export default VariantForm;
