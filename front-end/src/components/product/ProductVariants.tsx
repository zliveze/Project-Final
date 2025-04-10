import React, { useState, useEffect } from 'react';
import { RadioGroup } from '@headlessui/react';

interface VariantOption {
  color?: string;
  shades?: string[]; // Changed from shade?: string
  sizes?: string[];  // Changed from size?: string
}

export interface Variant {
  variantId: string;
  sku: string;
  options: VariantOption;
  price: number;
  images?: string[];
}

interface ProductVariantsProps {
  variants: Variant[];
  selectedVariant: Variant | null;
  onSelectVariant: (variant: Variant) => void;
}

// Hàm phân tích chuỗi màu thành tên và mã màu
const parseColorString = (colorString?: string): { name: string, code: string } => {
  if (!colorString) return { name: '', code: '' };
  
  // Màu có định dạng "Tên màu "#mã-màu""
  const regex = /^(.*?)(?:\s*"(#[0-9a-fA-F]{6})")?$/;
  const match = colorString.match(regex);
  
  if (match) {
    // match[1] sẽ luôn là tên màu
    // match[2] sẽ là mã màu nếu có, undefined nếu không có
    return { 
      name: match[1].trim(), 
      code: match[2] || '' 
    };
  }
  
  return { name: colorString, code: '' };
};

const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants = [],
  selectedVariant,
  onSelectVariant,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<{ color?: string; size?: string; shade?: string }>({});

  // Initialize/Update selectedOptions based on selectedVariant prop or first variant
  useEffect(() => {
    if (selectedVariant) {
      // If a variant is selected externally, try to populate options
      setSelectedOptions({
        color: selectedVariant.options?.color,
        size: selectedVariant.options?.sizes?.[0], // Default to first size/shade of the variant
        shade: selectedVariant.options?.shades?.[0],
      });
    } else if (!selectedOptions.color && variants.length > 0) {
      // If no color is selected yet, default to the first variant's options
      const firstVariant = variants[0];
      setSelectedOptions({
        color: firstVariant.options?.color,
        size: firstVariant.options?.sizes?.[0],
        shade: firstVariant.options?.shades?.[0],
      });
    }
  }, [selectedVariant, variants]); // Rerun if selectedVariant changes externally


  // Find and select the corresponding variant when options change
  useEffect(() => {
    const { color, size, shade } = selectedOptions;
    
    // Only attempt to find a variant if all necessary options are selected
    // Adjust this condition based on which options actually define a unique variant
    if (color && size && shade) {
       const matchingVariant = variants.find(v => 
         v.options?.color === color &&
         v.options?.sizes?.includes(size) &&
         v.options?.shades?.includes(shade)
       );

       if (matchingVariant && matchingVariant.variantId !== selectedVariant?.variantId) {
         onSelectVariant(matchingVariant);
       }
       // Optional: Handle case where the combination is invalid (no matchingVariant)
       // else if (!matchingVariant && selectedVariant) {
       //   // Maybe revert selection or show an error?
       // }
    } else if (color && (size || shade)) { 
        // Handle cases where only color+size or color+shade might be enough
        // Or if only color defines the variant (if sizes/shades are just attributes)
        // This part depends heavily on how variants are uniquely identified
        const partiallyMatchingVariant = variants.find(v => 
            v.options?.color === color &&
            (!size || v.options?.sizes?.includes(size)) &&
            (!shade || v.options?.shades?.includes(shade))
        );
         if (partiallyMatchingVariant && partiallyMatchingVariant.variantId !== selectedVariant?.variantId) {
             onSelectVariant(partiallyMatchingVariant);
         }
    }

  }, [selectedOptions, variants, onSelectVariant, selectedVariant]);


  // --- Available Options Calculation ---

  // All unique colors available across all variants
  const availableColors = [...new Set(variants.flatMap(v => v.options?.color ? [v.options.color] : []))];

  // Variants matching the currently selected color
  const variantsForSelectedColor = selectedOptions.color
    ? variants.filter(v => v.options?.color === selectedOptions.color)
    : [];

  // Available sizes for the selected color
  const availableSizes = [...new Set(variantsForSelectedColor.flatMap(v => v.options?.sizes || []))];

  // Available shades for the selected color
  const availableShades = [...new Set(variantsForSelectedColor.flatMap(v => v.options?.shades || []))];


  // --- Check Option Validity ---

  // Check if a specific size is part of *any* variant matching the selected color and shade
  const isSizeValid = (size: string): boolean => {
    if (!selectedOptions.color) return false; // Need color selected
    return variants.some(v => 
      v.options?.color === selectedOptions.color &&
      v.options?.sizes?.includes(size) &&
      (!selectedOptions.shade || v.options?.shades?.includes(selectedOptions.shade)) // Check against selected shade if present
    );
  };

  // Check if a specific shade is part of *any* variant matching the selected color and size
  const isShadeValid = (shade: string): boolean => {
     if (!selectedOptions.color) return false; // Need color selected
     return variants.some(v => 
       v.options?.color === selectedOptions.color &&
       v.options?.shades?.includes(shade) &&
       (!selectedOptions.size || v.options?.sizes?.includes(selectedOptions.size)) // Check against selected size if present
     );
  };


  // --- Selection Handlers ---

  const handleColorSelect = (color: string) => {
    // Reset size and shade when color changes
    setSelectedOptions({ color: color, size: undefined, shade: undefined });
    // Auto-select first valid size/shade for the new color?
    const firstVariantOfColor = variants.find(v => v.options?.color === color);
    if (firstVariantOfColor) {
        setSelectedOptions({
            color: color,
            size: firstVariantOfColor.options?.sizes?.[0],
            shade: firstVariantOfColor.options?.shades?.[0]
        });
    }
  };

  const handleSizeSelect = (size: string) => {
     setSelectedOptions(prev => ({ ...prev, size: size }));
     // Optional: Check if current shade is still valid with new size, reset if not
     if (selectedOptions.shade && !isShadeValid(selectedOptions.shade)) {
        // This check needs refinement based on the exact logic desired
        // For now, we let the useEffect handle finding the variant
     }
  };

  const handleShadeSelect = (shade: string) => {
    setSelectedOptions(prev => ({ ...prev, shade: shade }));
     // Optional: Check if current size is still valid with new shade, reset if not
     if (selectedOptions.size && !isSizeValid(selectedOptions.size)) {
        // This check needs refinement
     }
  };


  // --- Component Render ---

  // Kiểm tra xem có variant nào không
  if (!variants || variants.length === 0) {
    return null;
  }

  // Determine if any options exist at all
  const hasAnyOptions = availableColors.length > 0 || availableSizes.length > 0 || availableShades.length > 0;
  if (!hasAnyOptions) {
    return null; // Render nothing if no variants have any options
  }

  return (
    <div className="space-y-6">

      {/* Màu sắc */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Màu sắc</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const { name, code } = parseColorString(color);
              return (
                <button
                  key={color}
                  onClick={() => color && handleColorSelect(color)}
                  className={`
                    h-10 rounded-md border-2 flex items-center px-2
                    ${selectedOptions.color === color 
                      ? 'border-[#d53f8c] ring-2 ring-[#d53f8c] ring-opacity-30' 
                      : 'border-gray-300'
                    }
                  `}
                  title={color}
                >
                  {code ? (
                    <span 
                      className="h-6 w-6 rounded-full mr-2" 
                      style={{ backgroundColor: code }}
                    />
                  ) : (
                    <span 
                      className="h-6 w-6 rounded-full mr-2 bg-gray-200 flex items-center justify-center text-xs"
                      title="Mã màu không hợp lệ"
                    >
                      ?
                    </span>
                  )}
                  <span className="text-xs font-medium">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kích thước */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Dung tích</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeSelect(size)}
                disabled={!isSizeValid(size)} // Disable if not valid for current color/shade selection
                className={`
                  px-3 py-1 border rounded-md text-sm transition-colors duration-150
                  ${selectedOptions.size === size
                    ? 'border-[#d53f8c] bg-[#fdf2f8] text-[#d53f8c]' // Selected style
                    : isSizeValid(size)
                      ? 'border-gray-300 text-gray-700 hover:border-gray-400' // Available style
                      : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' // Disabled style
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone màu (cho son, phấn) */}
      {availableShades.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tone màu</h3>
          <div className="flex flex-wrap gap-2">
            {availableShades.map((shade) => (
              <button
                key={shade}
                onClick={() => handleShadeSelect(shade)}
                disabled={!isShadeValid(shade)} // Disable if not valid for current color/size selection
                className={`
                  px-3 py-1 border rounded-md text-sm transition-colors duration-150
                  ${selectedOptions.shade === shade
                    ? 'border-[#d53f8c] bg-[#fdf2f8] text-[#d53f8c]' // Selected style
                    : isShadeValid(shade)
                      ? 'border-gray-300 text-gray-700 hover:border-gray-400' // Available style
                      : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' // Disabled style
                  }
                `}
              >
                {shade}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;
