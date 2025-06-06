import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image'; // Import next/image
import { Trash2, ChevronDown, ChevronUp, ImageOff } from 'lucide-react'; // Updated icons
import { toast } from 'react-hot-toast';
// Sử dụng ProductInCampaign từ CampaignContext để đảm bảo tính nhất quán
import { ProductInCampaign } from '@/contexts/CampaignContext';

// Định nghĩa kiểu dữ liệu cho props
interface CampaignProductsTableProps {
  products: ProductInCampaign[];
  onRemoveProduct: (productId: string, variantId?: string, combinationId?: string) => void;
  onPriceChange: (productId: string, newPrice: number, variantId?: string, combinationId?: string) => void;
}

const CampaignProductsTable: React.FC<CampaignProductsTableProps> = ({
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

  const createProductKey = useCallback((productId: string, variantId?: string, combinationId?: string) => {
    return `${productId}${variantId ? `:${variantId}` : ''}${combinationId ? `:${combinationId}` : ''}`;
  }, []);

  const handlePriceChange = (
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>,
    variantId?: string,
    combinationId?: string
  ) => {
    const key = createProductKey(productId, variantId, combinationId);
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    
    setLocalPrices(prev => ({
      ...prev,
      [key]: numericValue
    }));
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
                Xóa
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có sản phẩm nào trong chiến dịch. Vui lòng thêm sản phẩm.
                </td>
              </tr>
            ) : (
              products.map(product => {
                const productKey = createProductKey(product.productId);
                const displayPrice = localPrices[productKey] ?? product.adjustedPrice;
                const discount = calculateDiscount(product.originalPrice, displayPrice);

                return (
                  <React.Fragment key={product.productId}>
                    <tr className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {product.image ? (
                            <Image
                              className="h-10 w-10 rounded object-cover border border-slate-200"
                              src={product.image}
                              alt={product.name || 'Sản phẩm'}
                              width={40} // h-10 w-10 translates to 40px
                              height={40}
                            />
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded flex items-center justify-center">
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatCurrency(product.originalPrice)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={formatCurrency(displayPrice).replace(' ₫', '')}
                            onChange={(e) => handlePriceChange(product.productId, e)}
                            onBlur={() => handlePriceInputBlur(product.productId, displayPrice)}
                            className="block w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                          />
                          <span className="ml-2 text-sm text-slate-500">₫</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {discount > 0 ? (
                          <span className={`font-medium ${discount >= 30 ? 'text-red-500' : 'text-green-500'}`}>
                            -{discount}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          type="button" // Explicitly set type
                          onClick={() => onRemoveProduct(product.productId)}
                          className="text-slate-400 hover:text-red-500 focus:outline-none transition-colors p-1 rounded hover:bg-red-50"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {/* Render variant rows if expanded */}
                    {expandedProducts[product.productId] && product.variants && product.variants.map(variant => {
                      const variantKey = createProductKey(product.productId, variant.variantId);
                      const variantDisplayPrice = localPrices[variantKey] ?? variant.adjustedPrice;
                      const variantDiscount = calculateDiscount(variant.originalPrice, variantDisplayPrice);

                      return (
                        <React.Fragment key={variantKey}>
                          <tr className="bg-slate-50/30 hover:bg-slate-50 transition-colors duration-150">
                            <td className="pl-10 pr-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                {variant.image ? (
                                  <Image
                                    className="h-8 w-8 rounded object-cover border border-slate-200"
                                    src={variant.image}
                                    alt={variant.variantName || 'Biến thể'}
                                    width={32} // h-8 w-8 translates to 32px
                                    height={32}
                                  />
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
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                              {formatCurrency(variant.originalPrice)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  value={formatCurrency(variantDisplayPrice).replace(' ₫', '')}
                                  onChange={(e) => handlePriceChange(product.productId, e, variant.variantId)}
                                  onBlur={() => handlePriceInputBlur(product.productId, variantDisplayPrice, variant.variantId)}
                                  className="block w-20 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                />
                                <span className="ml-1.5 text-xs text-slate-500">₫</span>
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
                          
                          {/* Render combination rows if variant is expanded */}
                          {expandedProducts[variantKey] && variant.combinations && variant.combinations.map(combination => {
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
                                          )
                                          .map(([key, value]) => `${key}: ${value}`)
                                          .join(', ');
                                        
                                        return combinationSpecificAttributes || 'Tổ hợp mặc định';
                                      })()
                                    }
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-600">
                                  {formatCurrency(combination.originalPrice)}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      value={formatCurrency(combinationDisplayPrice).replace(' ₫', '')}
                                      onChange={(e) => handlePriceChange(product.productId, e, variant.variantId, combination.combinationId)}
                                      onBlur={() => handlePriceInputBlur(product.productId, combinationDisplayPrice, variant.variantId, combination.combinationId)}
                                      className="block w-16 px-1.5 py-0.5 text-[11px] border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                    />
                                    <span className="ml-1 text-[11px] text-slate-500">₫</span>
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
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignProductsTable;
