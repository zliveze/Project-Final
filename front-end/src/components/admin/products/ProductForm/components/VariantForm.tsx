import React, { useState, useEffect, useRef } from 'react';
import { FiCheck } from 'react-icons/fi'; // Import check icon
import { ProductVariant, ProductImage } from '../types';

// Mở rộng interface ProductVariant để thêm trường name
type ExtendedProductVariant = ProductVariant & {
  name?: string;
};

interface VariantFormProps {
  currentVariant: ExtendedProductVariant;
  editingVariantIndex: number | null;
  images: ProductImage[];
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
    const processedArray = inputValue.split(',').map(s => s.trim()).filter(s => s);
    // Create a synthetic event that matches the expected structure for handleVariantChange
    const syntheticEvent = {
      target: {
        name: inputName,
        value: processedArray // Pass the processed array directly
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>; // Use InputElement type assertion as handleVariantChange expects it
    handleVariantChange(syntheticEvent);
  };


  return (
    <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
      <h4 className="text-sm font-medium mb-4">{editingVariantIndex !== null ? 'Sửa biến thể' : 'Thêm biến thể mới'}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Tên biến thể */}
        <div>
          <label htmlFor="variant-name" className="block text-sm font-medium text-gray-700">
            Tên biến thể <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="variant-name"
            name="name"
            value={currentVariant.name || ''}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            required
          />
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="variant-sku" className="block text-sm font-medium text-gray-700">
            Mã SKU
          </label>
          <input
            type="text"
            id="variant-sku"
            name="sku"
            value={currentVariant.sku || ''}
            onChange={handleVariantChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>

        {/* Giá */}
        <div>
          <label htmlFor="variant-price" className="block text-sm font-medium text-gray-700">
            Giá
          </label>
          <input
            type="number"
            id="variant-price"
            name="price"
            value={currentVariant.price}
            onChange={handleVariantChange}
            min="0"
            step="1000"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>

        {/* Màu sắc - sử dụng color picker + tên màu */}
        <div>
          <label htmlFor="variant-color-name" className="block text-sm font-medium text-gray-700">
            Tên màu
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="variant-color-name"
              ref={colorInputRef}
              value={colorName}
              onChange={handleColorNameChange}
              onBlur={updateColorCombination}
              placeholder="Ví dụ: Đỏ, Xanh navy, Hồng cánh sen,..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            />
            <div className="mt-1 flex items-center">
              <input
                type="color"
                id="variant-color-code"
                value={colorCode}
                onChange={handleColorCodeChange}
                onBlur={updateColorCombination}
                className="h-9 w-12 border-gray-300 p-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {colorName && (
              <>
                <p>Tên màu đang nhập: "{colorName}"</p>
                <p>Định dạng lưu: {colorName && colorCode ? `${colorName} "${colorCode}"` : ''}</p>
              </>
            )}
          </div>
        </div>

        {/* Tông màu (Multiple) - Sử dụng textarea thay vì input */}
        <div>
          <label htmlFor="variant-shades" className="block text-sm font-medium text-gray-700">
            Tông màu (cách nhau bởi dấu phẩy)
          </label>
          <textarea
            id="variant-shades"
            name="shades" // Keep name for potential future use, but rely on onBlur
            value={shadesInput} // Use local state for value
            onChange={(e) => setShadesInput(e.target.value)} // Only update local state on change
            onBlur={() => handleMultiOptionBlur('options.shades', shadesInput)} // Process and update main state on blur
            placeholder="Ví dụ: Nude, Cam đất, Hồng đào"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            rows={2}
          />
        </div>

        {/* Kích thước (Multiple) - Sử dụng textarea thay vì input */}
        <div>
          <label htmlFor="variant-sizes" className="block text-sm font-medium text-gray-700">
            Kích thước (cách nhau bởi dấu phẩy)
          </label>
          <textarea
            id="variant-sizes"
            name="sizes" // Keep name for potential future use, but rely on onBlur
            value={sizesInput} // Use local state for value
            onChange={(e) => setSizesInput(e.target.value)} // Only update local state on change
            onBlur={() => handleMultiOptionBlur('options.sizes', sizesInput)} // Process and update main state on blur
            placeholder="Ví dụ: 5ml, 15ml, Full size"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            rows={2}
          />
        </div>
      </div>

      {/* Chọn hình ảnh cho biến thể */}
      {images && images.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh của biến thể
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
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

              // Check selection using publicId or id as the identifier
              const isSelected = (currentVariant.images || []).some(variantImage => {
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

              console.log(`[VariantForm] Image ${imageKey}, isSelected: ${isSelected}, isUsedByOtherVariant: ${isUsedByOtherVariant}`, {
                imageId: image.id,
                imagePublicId: image.publicId,
                variantImages: currentVariant.images
              });

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
                  className={`relative border rounded-md ${isUsedByOtherVariant && !isSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} p-1 group transition-all duration-200 ${
                    isSelected
                      ? 'border-pink-500 ring-2 ring-pink-500 shadow-md transform scale-105'
                      : isUsedByOtherVariant
                        ? 'border-gray-300 bg-gray-100'
                        : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                  }`}
                  onClick={() => {
                    // Only allow selection if not used by another variant or already selected
                    if (!isUsedByOtherVariant || isSelected) {
                      console.log(`Selecting image: ${imageIdentifier}`);
                      handleVariantImageSelect(imageIdentifier || '');
                    } else {
                      console.log(`Image ${imageIdentifier} is already used by another variant`);
                    }
                  }}
                >
                  <div className="relative">
                    {/* The actual image */}
                    <img
                      src={imageSrc}
                      alt={image.alt || `Variant Image ${idx}`}
                      className="w-full h-16 object-cover rounded transition-all"
                      onError={() => {
                        console.error("Image failed to load:", image.url || image.preview);
                      }}
                    />

                    {/* Selection indicator - checkmark or used by other variant indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-pink-500 rounded-full p-0.5 shadow-sm z-10">
                        <FiCheck className="text-white w-4 h-4" />
                      </div>
                    )}
                    {isUsedByOtherVariant && !isSelected && (
                      <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
                        <span className="text-xs text-gray-700 font-medium px-1 py-0.5 bg-white bg-opacity-75 rounded">
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

      {/* Nút điều khiển */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={handleCancelVariant}
          className="py-1 px-3 border border-gray-300 rounded-md text-sm leading-4 font-medium text-gray-700 hover:bg-gray-100"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSaveVariant}
          className="py-1 px-3 border border-transparent rounded-md text-sm leading-4 font-medium text-white bg-pink-600 hover:bg-pink-700"
        >
          {editingVariantIndex !== null ? 'Cập nhật' : 'Thêm'}
        </button>
      </div>
    </div>
  );
};

export default VariantForm;
