import React, { useState, useEffect } from 'react'; // Added useEffect
import { FiSave, FiX, FiCalendar, FiShoppingBag } from 'react-icons/fi';
import Image from 'next/image';
import { vi } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ProductSelectionTable from './ProductSelectionTable';
import CampaignProductsTable from './CampaignProductsTable';
// Import types from context
import { Campaign, ProductInCampaign, VariantInCampaign, CombinationInCampaign } from '@/contexts/CampaignContext';

interface CampaignFormProps {
  initialData?: Partial<Campaign>; // Use context Campaign type
  onSubmit: (data: Partial<Campaign>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({
    title: '',
    description: '',
    type: 'Sale Event',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    products: [],
    ...(initialData || {})
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProductSelection, setShowProductSelection] = useState(false);

  // Effect to manage body scroll when ProductSelectionTable is open/closed
  useEffect(() => {
    if (showProductSelection) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = ''; // Revert to default
    }
    // Cleanup function to ensure body scroll is restored if component unmounts while modal is open
    return () => {
      document.body.style.overflow = '';
    };
  }, [showProductSelection]);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.stopPropagation(); // Ngăn chặn sự kiện lan truyền

    const { name, value } = e.target;
    console.log(`Field ${name} changed to: ${value}`);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý thay đổi ngày
  const handleDateChange = (date: Date | null, fieldName: string) => {
    if (date) {
      console.log(`Date field ${fieldName} changed to: ${date}`);

      setFormData(prev => ({
        ...prev,
        [fieldName]: date
      }));

      // Nếu ngày bắt đầu > ngày kết thúc, cập nhật ngày kết thúc
      if (fieldName === 'startDate' && formData.endDate && date > formData.endDate) {
        setFormData(prev => ({
          ...prev,
          endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000) // Thêm 1 ngày
        }));
      }

      // Clear error
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      }
    }
  };

  // Xử lý thêm sản phẩm
  const handleAddProducts = (products: ProductInCampaign[]) => {
    setFormData(prev => ({
      ...prev,
      products: [...products]
    }));
    // Đóng modal chọn sản phẩm nhưng không submit form
    setShowProductSelection(false);
  };

  // Xử lý xóa sản phẩm
  const handleRemoveProduct = (productId: string, variantId?: string, combinationId?: string) => {
    setFormData(prev => {
      const updatedProducts = [...(prev.products || [])];

      if (combinationId && variantId) {
        // Xóa tổ hợp biến thể cụ thể
        return {
          ...prev,
          products: updatedProducts.map(product => {
            if (product.productId === productId) {
              return {
                ...product,
                variants: product.variants?.map(variant => {
                  if (variant.variantId === variantId) {
                    return {
                      ...variant,
                      combinations: variant.combinations?.filter(
                        combination => combination.combinationId !== combinationId
                      )
                    };
                  }
                  return variant;
                })
              };
            }
            return product;
          })
        };
      } else if (variantId) {
        // Xóa biến thể cụ thể
        return {
          ...prev,
          products: updatedProducts.map(product => {
            if (product.productId === productId) {
              return {
                ...product,
                variants: product.variants?.filter(variant => variant.variantId !== variantId)
              };
            }
            return product;
          })
        };
      } else {
        // Xóa toàn bộ sản phẩm
        return {
          ...prev,
          products: updatedProducts.filter(product => product.productId !== productId)
        };
      }
    });
  };

  // Xử lý thay đổi giá sản phẩm
  const handleProductPriceChange = (productId: string, newPrice: number, variantId?: string, combinationId?: string) => {
    setFormData(prev => {
      const updatedProducts = [...(prev.products || [])];

      if (combinationId && variantId) {
        // Cập nhật giá cho tổ hợp biến thể cụ thể
        return {
          ...prev,
          products: updatedProducts.map(product => {
            if (product.productId === productId) {
              return {
                ...product,
                variants: product.variants?.map(variant => {
                  if (variant.variantId === variantId) {
                    return {
                      ...variant,
                      combinations: variant.combinations?.map(combination => {
                        if (combination.combinationId === combinationId) {
                          return { ...combination, adjustedPrice: newPrice };
                        }
                        return combination;
                      })
                    };
                  }
                  return variant;
                })
              };
            }
            return product;
          })
        };
      } else if (variantId) {
        // Cập nhật giá cho biến thể cụ thể
        return {
          ...prev,
          products: updatedProducts.map(product => {
            if (product.productId === productId) {
              return {
                ...product,
                variants: product.variants?.map(variant => {
                  if (variant.variantId === variantId) {
                    return { ...variant, adjustedPrice: newPrice };
                  }
                  return variant;
                })
              };
            }
            return product;
          })
        };
      } else {
        // Cập nhật giá cho sản phẩm chính
        return {
          ...prev,
          products: updatedProducts.map(product => {
            if (product.productId === productId) {
              return { ...product, adjustedPrice: newPrice };
            }
            return product;
          })
        };
      }
    });
  };

  // Validation form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Tiêu đề chiến dịch không được để trống';
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Mô tả chiến dịch không được để trống';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (!formData.products || formData.products.length === 0) {
      newErrors.products = 'Vui lòng thêm ít nhất một sản phẩm vào chiến dịch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn chặn sự kiện lan truyền

    console.log('Form submit triggered');

    if (validateForm()) {
      console.log('Form validation passed, submitting data');
      onSubmit(formData);
    } else {
      console.log('Form validation failed');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      onClick={(e) => {
        // Ngăn chặn sự kiện submit form khi click vào các phần tử trong form
        // Trừ khi click vào nút submit
        if (e.target !== e.currentTarget) {
          // Chỉ cho phép submit khi click vào nút có type="submit"
          const target = e.target as HTMLElement;
          if (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit') {
            // Cho phép sự kiện tiếp tục
          } else {
            e.stopPropagation();
          }
        }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tiêu đề chiến dịch */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề chiến dịch <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Loại chiến dịch */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Loại chiến dịch <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type || 'Sale Event'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="Sale Event">Sự kiện giảm giá</option>
            <option value="Hero Banner">Banner quảng cáo</option>
          </select>
        </div>

        {/* Ngày bắt đầu */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={formData.startDate}
              onChange={(date) => handleDateChange(date, 'startDate')}
              dateFormat="dd/MM/yyyy"
              locale={vi}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Ngăn chặn sự kiện mặc định khi nhấn Enter
                }
              }}
              className={`w-full px-3 py-2 border ${
                errors.startDate ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
            <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        {/* Ngày kết thúc */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={formData.endDate}
              onChange={(date) => handleDateChange(date, 'endDate')}
              dateFormat="dd/MM/yyyy"
              locale={vi}
              minDate={formData.startDate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Ngăn chặn sự kiện mặc định khi nhấn Enter
                }
              }}
              className={`w-full px-3 py-2 border ${
                errors.endDate ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
            <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
        </div>

        {/* Mô tả */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description || ''}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault(); // Ngăn chặn sự kiện mặc định khi nhấn Ctrl+Enter
              }
            }}
            className={`w-full px-3 py-2 border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">Sản phẩm trong chiến dịch</h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault(); // Ngăn chặn sự kiện mặc định
              e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
              setShowProductSelection(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-pink-600 rounded-md shadow-sm text-sm font-medium text-pink-600 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiShoppingBag className="mr-2 -ml-1 h-5 w-5" />
            Thêm sản phẩm
          </button>
        </div>

        {errors.products && (
          <p className="mb-4 text-sm text-red-600">{errors.products}</p>
        )}

        {formData.products && formData.products.length > 0 ? (
          <CampaignProductsTable
            products={formData.products}
            onRemoveProduct={handleRemoveProduct}
            onPriceChange={handleProductPriceChange}
          />
        ) : (
          <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sản phẩm nào</h3>
            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm sản phẩm vào chiến dịch của bạn.</p>
          </div>
        )}
      </div>

      {/* Product Selection Modal */}
      {showProductSelection && (
        <ProductSelectionTable
          isOpen={showProductSelection}
          onClose={() => setShowProductSelection(false)}
          onAddProducts={handleAddProducts}
          initialSelectedProducts={formData.products || []}
        />
      )}

      {/* Nút form */}
      <div className="flex justify-end space-x-3 pt-5 border-t">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); // Ngăn chặn sự kiện mặc định
            e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
            onCancel();
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          disabled={isSubmitting}
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          disabled={isSubmitting}
          onClick={() => {
            // Đảm bảo rằng sự kiện submit được xử lý đúng cách
            console.log('Submit button clicked');
          }}
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu chiến dịch'}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;
