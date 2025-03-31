import React from 'react';
import { RadioGroup } from '@headlessui/react';

interface VariantOption {
  color?: string;
  shade?: string;
  size?: string;
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

const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  selectedVariant,
  onSelectVariant,
}) => {
  // Lấy danh sách các loại biến thể có sẵn
  const availableColors = [...new Set(variants.filter(v => v.options.color).map(v => v.options.color))];
  const availableSizes = [...new Set(variants.filter(v => v.options.size).map(v => v.options.size))];
  const availableShades = [...new Set(variants.filter(v => v.options.shade).map(v => v.options.shade))];

  // Tìm biến thể dựa trên các tùy chọn đã chọn
  const findVariantByOptions = (color?: string, size?: string, shade?: string) => {
    return variants.find(
      v => 
        (!color || v.options.color === color) && 
        (!size || v.options.size === size) && 
        (!shade || v.options.shade === shade)
    );
  };

  // Xử lý khi chọn màu sắc
  const handleColorSelect = (color: string) => {
    const newVariant = findVariantByOptions(
      color, 
      selectedVariant?.options.size, 
      selectedVariant?.options.shade
    );
    if (newVariant) {
      onSelectVariant(newVariant);
    }
  };

  // Xử lý khi chọn kích thước
  const handleSizeSelect = (size: string) => {
    const newVariant = findVariantByOptions(
      selectedVariant?.options.color, 
      size, 
      selectedVariant?.options.shade
    );
    if (newVariant) {
      onSelectVariant(newVariant);
    }
  };

  // Xử lý khi chọn tone màu
  const handleShadeSelect = (shade: string) => {
    const newVariant = findVariantByOptions(
      selectedVariant?.options.color, 
      selectedVariant?.options.size, 
      shade
    );
    if (newVariant) {
      onSelectVariant(newVariant);
    }
  };

  return (
    <div className="space-y-6">
      {/* Màu sắc */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Màu sắc</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color!)}
                className={`
                  h-8 w-8 rounded-full border-2 flex items-center justify-center
                  ${selectedVariant?.options.color === color 
                    ? 'border-[#d53f8c] ring-2 ring-[#d53f8c] ring-opacity-30' 
                    : 'border-gray-300'
                  }
                `}
                title={color}
              >
                <span 
                  className="h-6 w-6 rounded-full" 
                  style={{ backgroundColor: color?.toLowerCase() }}
                />
              </button>
            ))}
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
                onClick={() => handleSizeSelect(size!)}
                className={`
                  px-3 py-1 border rounded-md text-sm
                  ${selectedVariant?.options.size === size
                    ? 'border-[#d53f8c] bg-[#fdf2f8] text-[#d53f8c]'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
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
                onClick={() => handleShadeSelect(shade!)}
                className={`
                  px-3 py-1 border rounded-md text-sm
                  ${selectedVariant?.options.shade === shade
                    ? 'border-[#d53f8c] bg-[#fdf2f8] text-[#d53f8c]'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
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