import React, { useState, useEffect } from 'react';

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
  promotionPrice?: number; // Giá khuyến mãi
  promotion?: {
    type: 'event' | 'campaign';
    id: string;
    name: string;
    adjustedPrice: number;
  };
}

export interface Variant {
  variantId: string;
  sku: string;
  options: VariantOption;
  price: number;
  promotionPrice?: number;
  promotion?: {
    type: 'event' | 'campaign';
    id: string;
    name: string;
    adjustedPrice: number;
  };
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

  // Chỉ khởi tạo màu sắc ban đầu, không tự động chọn các thuộc tính khác
  useEffect(() => {
    if (selectedVariant) {
      // Nếu variant được chọn từ bên ngoài, chỉ lấy màu sắc
      setSelectedOptions(prev => ({
        ...prev,
        color: selectedVariant.options?.color
      }));

      // Nếu có combination được chọn, cập nhật selectedCombinationId
      if (selectedCombination) {
        setSelectedCombinationId(selectedCombination.combinationId);

        // Cập nhật các thuộc tính dựa trên combination được chọn
        if (selectedCombination.attributes) {
          setSelectedOptions(prev => ({
            ...prev,
            color: selectedVariant.options?.color,
            size: selectedCombination.attributes.size,
            shade: selectedCombination.attributes.shade
          }));
        }
      } else {
        setSelectedCombinationId(null);
      }
    } else if (!selectedOptions.color && variants.length > 0) {
      // Nếu chưa có màu nào được chọn, chỉ chọn màu đầu tiên
      const firstVariant = variants[0];
      setSelectedOptions(prev => ({
        ...prev,
        color: firstVariant.options?.color
      }));
    }
  }, [selectedVariant, selectedCombination, variants, selectedOptions.color]); // Chạy lại khi selectedVariant thay đổi


  // Tìm và chọn tổ hợp phù hợp khi các thuộc tính thay đổi
  useEffect(() => {
    const { color, size, shade } = selectedOptions;

    // Chỉ tìm variant nếu có ít nhất màu sắc được chọn
    if (color) {
      // Tìm variant phù hợp với các lựa chọn hiện tại
      const matchingVariant = variants.find(v =>
        v.options?.color === color &&
        (!size || v.options?.sizes?.includes(size)) &&
        (!shade || v.options?.shades?.includes(shade))
      );

      // Nếu tìm thấy variant phù hợp và khác với variant hiện tại
      if (matchingVariant && matchingVariant.variantId !== selectedVariant?.variantId) {
        // Chỉ tìm tổ hợp nếu có đủ cả size và shade
        if (matchingVariant.combinations && matchingVariant.combinations.length > 0 && size && shade) {
          const matchingCombination = matchingVariant.combinations.find(c =>
            c.attributes.shade === shade && c.attributes.size === size
          );

          if (matchingCombination) {
            setSelectedCombinationId(matchingCombination.combinationId);
            onSelectVariant(matchingVariant, matchingCombination);
          } else {
            // Không tự động chọn tổ hợp nếu không tìm thấy tổ hợp phù hợp
            setSelectedCombinationId(null);
            onSelectVariant(matchingVariant);
          }
        } else {
          // Nếu không có đủ thông tin để chọn tổ hợp
          setSelectedCombinationId(null);
          onSelectVariant(matchingVariant);
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
    // Chỉ cập nhật màu sắc, giữ nguyên các lựa chọn khác nếu có
    setSelectedOptions(prev => ({ ...prev, color }));

    // Tìm variant phù hợp với lựa chọn hiện tại
    const { size, shade } = selectedOptions;
    const matchingVariant = variants.find(v =>
      v.options?.color === color &&
      (!size || v.options?.sizes?.includes(size)) &&
      (!shade || v.options?.shades?.includes(shade))
    );

    if (matchingVariant) {
      // Tìm combination phù hợp nếu có
      if (matchingVariant.combinations && matchingVariant.combinations.length > 0 && size && shade) {
        const matchingCombination = matchingVariant.combinations.find(c =>
          c.attributes.size === size && c.attributes.shade === shade
        );

        if (matchingCombination) {
          setSelectedCombinationId(matchingCombination.combinationId);
          onSelectVariant(matchingVariant, matchingCombination);
        } else {
          // Không tự động chọn combination nếu không tìm thấy tổ hợp phù hợp
          setSelectedCombinationId(null);
          onSelectVariant(matchingVariant);
        }
      } else {
        setSelectedCombinationId(null);
        onSelectVariant(matchingVariant);
      }
    }
  };

  const handleSizeSelect = (size: string) => {
    // Chỉ cập nhật dung tích, giữ nguyên các lựa chọn khác
    setSelectedOptions(prev => ({ ...prev, size }));

    // Tìm variant phù hợp với lựa chọn hiện tại
    const { color, shade } = selectedOptions;
    if (color) {
      const matchingVariant = variants.find(v =>
        v.options?.color === color &&
        v.options?.sizes?.includes(size) &&
        (!shade || v.options?.shades?.includes(shade))
      );

      if (matchingVariant) {
        // Tìm combination phù hợp nếu có
        if (matchingVariant.combinations && matchingVariant.combinations.length > 0 && shade) {
          const matchingCombination = matchingVariant.combinations.find(c =>
            c.attributes.size === size && c.attributes.shade === shade
          );

          if (matchingCombination) {
            setSelectedCombinationId(matchingCombination.combinationId);
            onSelectVariant(matchingVariant, matchingCombination);
          } else {
            // Không tự động chọn combination nếu không tìm thấy tổ hợp phù hợp
            setSelectedCombinationId(null);
            onSelectVariant(matchingVariant);
          }
        } else {
          setSelectedCombinationId(null);
          onSelectVariant(matchingVariant);
        }
      }
    }
  };

  const handleShadeSelect = (shade: string) => {
    // Chỉ cập nhật tone màu, giữ nguyên các lựa chọn khác
    setSelectedOptions(prev => ({ ...prev, shade }));

    // Tìm variant phù hợp với lựa chọn hiện tại
    const { color, size } = selectedOptions;
    if (color) {
      const matchingVariant = variants.find(v =>
        v.options?.color === color &&
        (!size || v.options?.sizes?.includes(size)) &&
        v.options?.shades?.includes(shade)
      );

      if (matchingVariant) {
        // Tìm combination phù hợp nếu có
        if (matchingVariant.combinations && matchingVariant.combinations.length > 0 && size) {
          const matchingCombination = matchingVariant.combinations.find(c =>
            c.attributes.shade === shade && c.attributes.size === size
          );

          if (matchingCombination) {
            setSelectedCombinationId(matchingCombination.combinationId);
            onSelectVariant(matchingVariant, matchingCombination);
          } else {
            // Không tự động chọn combination nếu không tìm thấy tổ hợp phù hợp
            setSelectedCombinationId(null);
            onSelectVariant(matchingVariant);
          }
        } else {
          setSelectedCombinationId(null);
          onSelectVariant(matchingVariant);
        }
      }
    }
  };

  // Tìm giá của tổ hợp được chọn
  const selectedPriceInfo = React.useMemo(() => {
    if (!selectedVariant) return { originalPrice: null, currentPrice: null, hasPromotion: false };

    // Nếu có combination được chọn, lấy giá của combination đó
    if (selectedCombinationId && selectedVariant.combinations) {
      const combination = selectedVariant.combinations.find(c => c.combinationId === selectedCombinationId);
      if (combination) {
        let originalPrice = 0;
        let currentPrice = 0;
        let hasPromotion = false;

        // Xác định giá gốc
        if (combination.price) {
          originalPrice = combination.price;
        } else if (combination.additionalPrice) {
          originalPrice = selectedVariant.price + combination.additionalPrice;
        } else {
          originalPrice = selectedVariant.price;
        }

        // Xác định giá hiện tại (có thể là giá khuyến mãi)
        if (combination.promotion && combination.promotionPrice) {
          currentPrice = combination.promotionPrice;
          hasPromotion = true;
        } else {
          currentPrice = originalPrice;
        }

        return { originalPrice, currentPrice, hasPromotion };
      }
    }

    // Nếu không có combination hoặc không tìm thấy, trả về giá của variant
    const originalPrice = selectedVariant.price; // Changed to const
    const currentPrice = selectedVariant.promotionPrice || selectedVariant.price; // Changed to const
    const hasPromotion = !!selectedVariant.promotion && !!selectedVariant.promotionPrice; // Changed to const

    return { originalPrice, currentPrice, hasPromotion };
  }, [selectedVariant, selectedCombinationId]);


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
    <div className="space-y-3">
      {/* Layout responsive: 1 cột mobile, grid desktop */}
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {/* Màu sắc */}
        {availableColors.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Màu sắc:</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableColors.map((color) => {
                const { name, code } = parseColorString(color);
                return (
                  <button
                    key={color}
                    onClick={() => color && handleColorSelect(color)}
                    className={`
                      h-8 sm:h-9 rounded-md flex items-center px-2 sm:px-3 transition-all duration-200 text-xs sm:text-sm
                      ${selectedOptions.color === color
                        ? 'bg-gradient-to-r from-pink-50 to-white border border-pink-200 shadow-sm'
                        : 'border border-gray-200 hover:border-pink-200 hover:bg-pink-50/30'
                      }
                    `}
                    title={color}
                  >
                    {code ? (
                      <span
                        className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full mr-1.5 sm:mr-2 ${selectedOptions.color === color ? 'ring-2 ring-pink-300' : ''}`}
                        style={{ backgroundColor: code }}
                      />
                    ) : (
                      <span
                        className="h-4 w-4 sm:h-5 sm:w-5 rounded-full mr-1.5 sm:mr-2 bg-gray-200 flex items-center justify-center text-xs"
                        title="Mã màu không hợp lệ"
                      >
                        ?
                      </span>
                    )}
                    <span className={`text-xs sm:text-sm ${selectedOptions.color === color ? 'font-medium text-pink-700' : 'text-gray-700'}`}>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dung tích */}
        {availableSizes.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Dung tích:</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  disabled={!isSizeValid(size)}
                  className={`
                    px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-all duration-200
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
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tone màu:</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableShades.map((shade) => (
                <button
                  key={shade}
                  onClick={() => handleShadeSelect(shade)}
                  disabled={!isShadeValid(shade)}
                  className={`
                    px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-all duration-200
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
      </div>

      {/* Hiển thị thông tin tổ hợp đã chọn */}
      {selectedVariant && selectedCombinationId && selectedVariant.combinations && (
        <div className="mt-3 p-3 bg-pink-50/50 rounded-lg border border-pink-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Tổ hợp đã chọn:</h3>
              {selectedVariant.combinations.map((combination) => {
                if (combination.combinationId === selectedCombinationId) {
                  const combinationDetails = Object.entries(combination.attributes)
                    .map(([key, value]) => `${key === 'shade' ? 'Tone' : key === 'size' ? 'Dung tích' : key}: ${value}`)
                    .join(', ');
                  return (
                    <p key={combination.combinationId} className="text-sm text-gray-600 mt-1">
                      {combinationDetails}
                    </p>
                  );
                }
                return null;
              })}
            </div>
            {selectedPriceInfo.currentPrice !== null && (
              <div className="text-right">
                {selectedPriceInfo.hasPromotion && selectedPriceInfo.originalPrice !== null && (
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-medium text-pink-600">
                      {selectedPriceInfo.currentPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {selectedPriceInfo.originalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                {!selectedPriceInfo.hasPromotion && (
                  <span className="text-lg font-medium text-pink-600">
                    {selectedPriceInfo.currentPrice.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;
