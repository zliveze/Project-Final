import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Trash2, ChevronDown, ChevronUp, ImageOff, PackageSearch } from 'lucide-react'; // Updated icons
import { toast } from 'react-hot-toast';
// Sử dụng ProductInEventData từ EventForm để đảm bảo tính nhất quán
import { ProductInEventData as ProductInEvent } from './EventForm';


// Định nghĩa kiểu dữ liệu cho props
interface EventProductsTableProps {
  products: ProductInEvent[];
  onRemoveProduct: (productId: string, variantId?: string, combinationId?: string) => void;
  onPriceChange: (productId: string, newPrice: number, variantId?: string, combinationId?: string) => void;
}

const EventProductsTable: React.FC<EventProductsTableProps> = ({
  products = [],
  onRemoveProduct,
  onPriceChange
}) => {
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Initialize or update localPrices when products prop changes
  useEffect(() => {
    const newLocalPrices = { ...localPrices };
    let pricesChanged = false;

    products.forEach(product => {
      const productKey = createProductKey(product.productId);
      if (newLocalPrices[productKey] === undefined || newLocalPrices[productKey] !== product.adjustedPrice) {
        newLocalPrices[productKey] = product.adjustedPrice;
        pricesChanged = true;
      }

      product.variants?.forEach(variant => {
        const variantKey = createProductKey(product.productId, variant.variantId);
        if (newLocalPrices[variantKey] === undefined || newLocalPrices[variantKey] !== variant.adjustedPrice) {
          newLocalPrices[variantKey] = variant.adjustedPrice;
          pricesChanged = true;
        }

        variant.combinations?.forEach(combination => {
          const combinationKey = createProductKey(product.productId, variant.variantId, combination.combinationId);
          if (newLocalPrices[combinationKey] === undefined || newLocalPrices[combinationKey] !== combination.adjustedPrice) {
            newLocalPrices[combinationKey] = combination.adjustedPrice;
            pricesChanged = true;
          }
        });
      });
    });

    if (pricesChanged) {
      setLocalPrices(newLocalPrices);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]); // Rerun when products array itself changes, or its content.

  const calculateDiscount = (originalPrice?: number, adjustedPrice?: number) => {
    if (originalPrice === undefined || adjustedPrice === undefined || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - adjustedPrice) / originalPrice) * 100);
  };

  const displayProducts = products; // Use products directly

  const createProductKey = useCallback((productId: string, variantId?: string, combinationId?: string) => {
    return `${productId}${variantId ? `:${variantId}` : ''}${combinationId ? `:${combinationId}` : ''}`;
  }, []);

  const handlePriceInputChange = (key: string, value: string) => {
    const newPrice = parseInt(value, 10);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setLocalPrices(prev => ({ ...prev, [key]: newPrice }));
    } else if (value === '') { // Allow clearing the input
      setLocalPrices(prev => ({ ...prev, [key]: 0 })); // Or handle as undefined if preferred
    }
  };

  const handlePriceInputBlur = (
    productId: string,
    currentAdjustedPrice: number, // Giá hiện tại từ localPrices
    variantId?: string,
    combinationId?: string
  ) => {
    // Tìm giá gốc tương ứng
    let originalPrice: number | undefined;
    const product = products.find(p => p.productId === productId);
    if (product) {
      if (combinationId && variantId && product.variants) {
        const variant = product.variants.find(v => v.variantId === variantId);
        const combination = variant?.combinations?.find(c => c.combinationId === combinationId);
        originalPrice = combination?.originalPrice;
      } else if (variantId && product.variants) {
        const variant = product.variants.find(v => v.variantId === variantId);
        originalPrice = variant?.originalPrice;
      } else {
        originalPrice = product.originalPrice;
      }
    }

    if (currentAdjustedPrice > (originalPrice || 0) && originalPrice !== undefined) {
      toast.error('Giá khuyến mãi không được lớn hơn giá gốc.');
      // Optionally revert to originalPrice or previous valid price
      // For now, we let the user correct it.
      // Or, call onPriceChange with originalPrice to revert
      // onPriceChange(productId, originalPrice, variantId, combinationId);
      // setLocalPrices(prev => ({ ...prev, [createProductKey(productId, variantId, combinationId)]: originalPrice }));
      return; // Prevent calling onPriceChange if invalid
    }
    onPriceChange(productId, currentAdjustedPrice, variantId, combinationId);
  };


  const handleToggleProductExpand = useCallback((key: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setExpandedProducts(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const formatCurrency = (value?: number) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  };

  return (
    <div className="bg-white overflow-hidden border border-slate-200 rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Giá gốc
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Giá KM
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Giảm
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {displayProducts.length > 0 ? (
              displayProducts.flatMap((product) => {
                const productKey = createProductKey(product.productId);
                const displayPrice = localPrices[productKey] ?? product.adjustedPrice;
                const discount = calculateDiscount(product.originalPrice, displayPrice);

                const productRow = (
                  <tr key={product.productId} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image ? (
                          <div className="relative h-10 w-10 rounded-md border border-slate-200 overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name || 'Sản phẩm'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-slate-800 line-clamp-1">
                            {product.name || `Sản phẩm ID: ${product.productId}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {product.sku && `SKU: ${product.sku}`}
                            {product.brand && ` - ${product.brand}`}
                          </div>
                        </div>
                        {product.variants && product.variants.length > 0 && (
                           <button
                              type="button" // Explicitly set type
                              onClick={(e) => handleToggleProductExpand(product.productId, e)}
                              className="ml-2 p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-pink-600 transition-colors"
                              title={expandedProducts[product.productId] ? "Ẩn biến thể" : "Hiện biến thể"}
                            >
                              {expandedProducts[product.productId] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                         )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-600">
                      {formatCurrency(product.originalPrice)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="relative w-28">
                        <input
                          type="text" // Use text to allow formatting, parse to number on change/blur
                          value={localPrices[productKey]?.toLocaleString('vi-VN') || '0'}
                          onChange={(e) => handlePriceInputChange(productKey, e.target.value.replace(/\./g, ''))}
                          onBlur={() => handlePriceInputBlur(product.productId, localPrices[productKey] ?? 0)}
                          className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors text-right"
                        />
                         <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                      {discount > 0 ? (
                        <span className={`font-semibold ${discount >= 30 ? 'text-red-600' : 'text-green-600'}`}>
                          -{discount}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => onRemoveProduct(product.productId)}
                        className="text-slate-400 hover:text-red-600 focus:outline-none transition-colors p-1 rounded-md hover:bg-red-50"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );

                const variantRows = (expandedProducts[product.productId] && product.variants)
                  ? product.variants.flatMap(variant => {
                      const variantKey = createProductKey(product.productId, variant.variantId);
                      const variantDisplayPrice = localPrices[variantKey] ?? variant.adjustedPrice;
                      const variantDiscount = calculateDiscount(variant.originalPrice, variantDisplayPrice);

                      const variantRow = (
                        <tr key={variantKey} className="bg-slate-50/30 hover:bg-slate-50 transition-colors duration-150">
                          <td className="pl-10 pr-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {variant.image ? (
                                <div className="relative h-8 w-8 rounded border border-slate-200 overflow-hidden">
                                  <Image
                                    src={variant.image}
                                    alt={variant.variantName || 'Biến thể'}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded flex items-center justify-center">
                                  <ImageOff className="h-4 w-4 text-slate-400" />
                                </div>
                              )}
                              <div className="ml-2.5">
                                <div className="text-xs font-medium text-slate-700 line-clamp-1">
                                  {variant.variantName || `Biến thể ID: ${variant.variantId}`}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {Object.entries(variant.variantAttributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                  {variant.variantSku && ` (SKU: ${variant.variantSku})`}
                                </div>
                              </div>
                               {variant.combinations && variant.combinations.length > 0 && (
                                 <button
                                   type="button" // Explicitly set type
                                   onClick={(e) => handleToggleProductExpand(variantKey, e)} // Use variantKey for expanding combinations
                                   className="ml-2 p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-pink-500 transition-colors"
                                   title={expandedProducts[variantKey] ? "Ẩn tổ hợp" : "Hiện tổ hợp"}
                                 >
                                   {expandedProducts[variantKey] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                 </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                            {formatCurrency(variant.originalPrice)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                             <div className="relative w-24">
                                <input
                                  type="text"
                                  value={localPrices[variantKey]?.toLocaleString('vi-VN') || '0'}
                                  onChange={(e) => handlePriceInputChange(variantKey, e.target.value.replace(/\./g, ''))}
                                  onBlur={() => handlePriceInputBlur(product.productId, localPrices[variantKey] ?? 0, variant.variantId)}
                                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors text-right"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₫</span>
                              </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            {variantDiscount > 0 ? (
                              <span className={`font-medium ${variantDiscount >= 30 ? 'text-red-500' : 'text-green-500'}`}>
                                -{variantDiscount}%
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              type="button" // Explicitly set type
                              onClick={(e) => { e.stopPropagation(); onRemoveProduct(product.productId, variant.variantId); }}
                              className="text-slate-400 hover:text-red-500 focus:outline-none transition-colors p-0.5 rounded hover:bg-red-50"
                              title="Xóa biến thể"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );

                      const combinationRows = (expandedProducts[variantKey] && variant.combinations)
                        ? variant.combinations.map(combination => {
                            const combinationKey = createProductKey(product.productId, variant.variantId, combination.combinationId);
                            const combinationDisplayPrice = localPrices[combinationKey] ?? combination.adjustedPrice;
                            const combinationDiscount = calculateDiscount(combination.originalPrice, combinationDisplayPrice);
                            return (
                              <tr key={combinationKey} className="bg-slate-50/10 hover:bg-slate-100/50 transition-colors duration-150">
                                <td className="pl-16 pr-4 py-2.5 whitespace-nowrap">
                                  <div className="text-[11px] font-normal text-slate-600">
                                    {
                                      (() => {
                                        const combinationSpecificAttributes = Object.entries(combination.attributes || {})
                                          .filter(([key, value]) => 
                                            !variant.variantAttributes || 
                                            variant.variantAttributes[key] !== value
                                          );
                                        if (combinationSpecificAttributes.length === 0) {
                                          return <span className="text-slate-400">-</span>;
                                        }
                                        return combinationSpecificAttributes.map(([k, v]) => `${k}: ${v}`).join(' / ');
                                      })()
                                    }
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-500">
                                  {formatCurrency(combination.originalPrice)}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <div className="relative w-20">
                                    <input
                                      type="text"
                                      value={localPrices[combinationKey]?.toLocaleString('vi-VN') || '0'}
                                      onChange={(e) => handlePriceInputChange(combinationKey, e.target.value.replace(/\./g, ''))}
                                      onBlur={() => handlePriceInputBlur(product.productId, localPrices[combinationKey] ?? 0, variant.variantId, combination.combinationId)}
                                      className="w-full border border-slate-200 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-colors text-right"
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">₫</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[11px]">
                                  {combinationDiscount > 0 ? (
                                    <span className={`font-medium ${combinationDiscount >= 30 ? 'text-red-500' : 'text-green-500'}`}>
                                      -{combinationDiscount}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                  <button
                                    type="button" // Explicitly set type
                                    onClick={(e) => { e.stopPropagation(); onRemoveProduct(product.productId, variant.variantId, combination.combinationId); }}
                                    className="text-slate-400 hover:text-red-500 focus:outline-none transition-colors p-0.5 rounded hover:bg-red-50"
                                    title="Xóa tổ hợp"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        : [];
                      return [variantRow, ...combinationRows];
                    })
                  : [];

                return [productRow, ...variantRows];
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <PackageSearch className="h-12 w-12 text-slate-400" />
                    <p className="text-slate-600 font-medium">Chưa có sản phẩm nào trong sự kiện</p>
                    <p className="text-xs text-slate-400">Nhấn nút &quot;Thêm sản phẩm&quot; ở trên để bắt đầu.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventProductsTable;
