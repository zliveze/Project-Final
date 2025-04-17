import React, { useState, useEffect } from 'react';
import { RadioGroup } from '@headlessui/react';

interface VariantOption {
  color?: string;
  shades?: string[]; // Changed from shade?: string
  sizes?: string[];  // Changed from size?: string
}

export interface VariantCombination {
  combinationId: string;
  attributes: Record<string, string>; // Ví dụ: { shade: 'Đỏ', size: 'Mini' }
  price?: number; // Giá riêng cho tổ hợp
  additionalPrice?: number; // Giá chênh lệch so với biến thể gốc
}

export interface Variant {
  variantId: string;
  sku: string;
  options: VariantOption;
  price: number;
  images?: string[];
  combinations?: VariantCombination[];
}

interface ProductVariantsProps {
  variants: Variant[];
  selectedVariant: Variant | null;
  onSelectVariant: (variant: Variant, combination?: VariantCombination) => void;
  selectedCombination?: VariantCombination | null;
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
  selectedCombination = null,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<{ color?: string; size?: string; shade?: string }>({});
  const [selectedCombinationId, setSelectedCombinationId] = useState<string | null>(selectedCombination?.combinationId || null);

  // Initialize/Update selectedOptions based on selectedVariant prop or first variant
  useEffect(() => {
    if (selectedVariant) {
      // If a variant is selected externally, try to populate options
      setSelectedOptions({
        color: selectedVariant.options?.color,
        size: selectedVariant.options?.sizes?.[0], // Default to first size/shade of the variant
        shade: selectedVariant.options?.shades?.[0],
      });

      // If there's a selected combination, update the selectedCombinationId
      if (selectedCombination) {
        setSelectedCombinationId(selectedCombination.combinationId);
      } else if (selectedVariant.combinations && selectedVariant.combinations.length > 0) {
        // If no combination is selected but the variant has combinations, select the first one
        setSelectedCombinationId(selectedVariant.combinations[0].combinationId);
      } else {
        setSelectedCombinationId(null);
      }
    } else if (!selectedOptions.color && variants.length > 0) {
      // If no color is selected yet, default to the first variant's options
      const firstVariant = variants[0];
      setSelectedOptions({
        color: firstVariant.options?.color,
        size: firstVariant.options?.sizes?.[0],
        shade: firstVariant.options?.shades?.[0],
      });

      // If the first variant has combinations, select the first one
      if (firstVariant.combinations && firstVariant.combinations.length > 0) {
        setSelectedCombinationId(firstVariant.combinations[0].combinationId);
      } else {
        setSelectedCombinationId(null);
      }
    }
  }, [selectedVariant, selectedCombination, variants]); // Rerun if selectedVariant changes externally


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
         // Find matching combination if available
         if (matchingVariant.combinations && matchingVariant.combinations.length > 0) {
           const matchingCombination = matchingVariant.combinations.find(c =>
             c.attributes.shade === shade && c.attributes.size === size
           );

           if (matchingCombination) {
             setSelectedCombinationId(matchingCombination.combinationId);
             onSelectVariant(matchingVariant, matchingCombination);
           } else {
             setSelectedCombinationId(matchingVariant.combinations[0].combinationId);
             onSelectVariant(matchingVariant, matchingVariant.combinations[0]);
           }
         } else {
           setSelectedCombinationId(null);
           onSelectVariant(matchingVariant);
         }
       }
    } else if (color && (size || shade)) {
        // Handle cases where only color+size or color+shade might be enough
        const partiallyMatchingVariant = variants.find(v =>
            v.options?.color === color &&
            (!size || v.options?.sizes?.includes(size)) &&
            (!shade || v.options?.shades?.includes(shade))
        );

        if (partiallyMatchingVariant && partiallyMatchingVariant.variantId !== selectedVariant?.variantId) {
          // Find matching combination if available
          if (partiallyMatchingVariant.combinations && partiallyMatchingVariant.combinations.length > 0) {
            const matchingCombination = partiallyMatchingVariant.combinations.find(c =>
              (!shade || c.attributes.shade === shade) && (!size || c.attributes.size === size)
            );

            if (matchingCombination) {
              setSelectedCombinationId(matchingCombination.combinationId);
              onSelectVariant(partiallyMatchingVariant, matchingCombination);
            } else {
              setSelectedCombinationId(partiallyMatchingVariant.combinations[0].combinationId);
              onSelectVariant(partiallyMatchingVariant, partiallyMatchingVariant.combinations[0]);
            }
          } else {
            setSelectedCombinationId(null);
            onSelectVariant(partiallyMatchingVariant);
          }
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

        // If the variant has combinations, select the first one
        if (firstVariantOfColor.combinations && firstVariantOfColor.combinations.length > 0) {
          setSelectedCombinationId(firstVariantOfColor.combinations[0].combinationId);
          onSelectVariant(firstVariantOfColor, firstVariantOfColor.combinations[0]);
        } else {
          setSelectedCombinationId(null);
          onSelectVariant(firstVariantOfColor);
        }
    }
  };

  const handleSizeSelect = (size: string) => {
     setSelectedOptions(prev => ({ ...prev, size: size }));
     // Find and select the matching variant immediately
     const { color, shade } = selectedOptions;
     if (color) {
       const matchingVariant = variants.find(v =>
         v.options?.color === color &&
         v.options?.sizes?.includes(size) &&
         (!shade || v.options?.shades?.includes(shade))
       );

       if (matchingVariant) {
         // Find matching combination if available
         if (matchingVariant.combinations && matchingVariant.combinations.length > 0) {
           const matchingCombination = matchingVariant.combinations.find(c =>
             c.attributes.size === size && (!shade || c.attributes.shade === shade)
           );

           if (matchingCombination) {
             setSelectedCombinationId(matchingCombination.combinationId);
             onSelectVariant(matchingVariant, matchingCombination);
           } else {
             setSelectedCombinationId(matchingVariant.combinations[0].combinationId);
             onSelectVariant(matchingVariant, matchingVariant.combinations[0]);
           }
         } else {
           setSelectedCombinationId(null);
           onSelectVariant(matchingVariant);
         }
       }
     }
  };

  const handleShadeSelect = (shade: string) => {
    setSelectedOptions(prev => ({ ...prev, shade: shade }));
    // Find and select the matching variant immediately
    const { color, size } = selectedOptions;
    if (color) {
      const matchingVariant = variants.find(v =>
        v.options?.color === color &&
        (!size || v.options?.sizes?.includes(size)) &&
        v.options?.shades?.includes(shade)
      );

      if (matchingVariant) {
        // Find matching combination if available
        if (matchingVariant.combinations && matchingVariant.combinations.length > 0) {
          const matchingCombination = matchingVariant.combinations.find(c =>
            c.attributes.shade === shade && (!size || c.attributes.size === size)
          );

          if (matchingCombination) {
            setSelectedCombinationId(matchingCombination.combinationId);
            onSelectVariant(matchingVariant, matchingCombination);
          } else {
            setSelectedCombinationId(matchingVariant.combinations[0].combinationId);
            onSelectVariant(matchingVariant, matchingVariant.combinations[0]);
          }
        } else {
          setSelectedCombinationId(null);
          onSelectVariant(matchingVariant);
        }
      }
    }
  };

  // Handle combination selection
  const handleCombinationSelect = (combinationId: string, variant: Variant) => {
    setSelectedCombinationId(combinationId);
    const combination = variant.combinations?.find(c => c.combinationId === combinationId);
    if (combination) {
      onSelectVariant(variant, combination);
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
    <div className="space-y-5">
      {/* Màu sắc */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Màu sắc:</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const { name, code } = parseColorString(color);
              return (
                <button
                  key={color}
                  onClick={() => color && handleColorSelect(color)}
                  className={`
                    h-10 rounded-md flex items-center px-3 transition-all duration-200
                    ${selectedOptions.color === color
                      ? 'bg-gradient-to-r from-pink-50 to-white border border-pink-200 shadow-sm'
                      : 'border border-gray-200 hover:border-pink-200 hover:bg-pink-50/30'
                    }
                  `}
                  title={color}
                >
                  {code ? (
                    <span
                      className={`h-6 w-6 rounded-full mr-2 ${selectedOptions.color === color ? 'ring-2 ring-pink-300' : ''}`}
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
                  <span className={`text-sm ${selectedOptions.color === color ? 'font-medium text-pink-700' : 'text-gray-700'}`}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kích thước */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Dung tích:</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeSelect(size)}
                disabled={!isSizeValid(size)}
                className={`
                  px-4 py-2 rounded-md text-sm transition-all duration-200
                  ${selectedOptions.size === size
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                    : isSizeValid(size)
                      ? 'border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50/30'
                      : 'border border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed'
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone màu */}
      {availableShades.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tone màu:</h3>
          <div className="flex flex-wrap gap-2">
            {availableShades.map((shade) => (
              <button
                key={shade}
                onClick={() => handleShadeSelect(shade)}
                disabled={!isShadeValid(shade)}
                className={`
                  px-4 py-2 rounded-md text-sm transition-all duration-200
                  ${selectedOptions.shade === shade
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                    : isShadeValid(shade)
                      ? 'border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50/30'
                      : 'border border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed'
                  }
                `}
              >
                {shade}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tổ hợp biến thể */}
      {selectedVariant && selectedVariant.combinations && selectedVariant.combinations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tổ hợp:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedVariant.combinations.map((combination) => {
              // Tạo tên hiển thị cho tổ hợp
              const combinationName = Object.entries(combination.attributes)
                .map(([key, value]) => `${key === 'shade' ? 'Tone' : key === 'size' ? 'Dung tích' : key}: ${value}`)
                .join(', ');

              return (
                <button
                  key={combination.combinationId}
                  onClick={() => handleCombinationSelect(combination.combinationId, selectedVariant)}
                  className={`
                    px-4 py-2 rounded-md text-sm transition-all duration-200
                    ${selectedCombinationId === combination.combinationId
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                      : 'border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50/30'
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span>{combinationName}</span>
                    {combination.price && (
                      <span className="text-xs mt-1">
                        {combination.price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                    {!combination.price && combination.additionalPrice && combination.additionalPrice > 0 && (
                      <span className="text-xs mt-1">
                        +{combination.additionalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;
