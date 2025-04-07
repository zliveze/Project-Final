import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiCalendar, FiShoppingBag } from 'react-icons/fi';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ProductSelectionTable from './ProductSelectionTable';
// Import types from context
import { Campaign, CampaignProduct as Product } from '@/contexts/CampaignContext'; 

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

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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
  const handleAddProducts = (products: Product[]) => {
    setFormData(prev => ({
      ...prev,
      products: [...products]
    }));
    setShowProductSelection(false);
  };

  // Xử lý xóa sản phẩm
  const handleRemoveProduct = (productId: string, variantId?: string) => { // Make variantId optional here
    setFormData(prev => ({
      ...prev,
      products: prev.products?.filter(p => 
        !(p.productId === productId && p.variantId === variantId)
      ) || []
    }));
  };

  // Xử lý thay đổi giá sản phẩm
  const handleProductPriceChange = (productId: string, variantId: string | undefined, newPrice: number) => { // Allow variantId to be undefined
    setFormData(prev => ({
      ...prev,
      products: prev.products?.map(p => {
        if (p.productId === productId && p.variantId === variantId) {
          return { ...p, adjustedPrice: newPrice };
        }
        return p;
      }) || []
    }));
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
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            onClick={() => setShowProductSelection(true)}
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
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biến thể
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá gốc
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá campaign
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.products.map((product, index) => (
                  <tr key={`${product.productId}-${product.variantId}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            src={product.image || 'https://via.placeholder.com/40'}
                            alt={product.productName || 'Product image'}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.productName || `Sản phẩm ${index + 1}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.variantName || 'Mặc định'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.originalPrice?.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={product.adjustedPrice}
                        onChange={(e) => handleProductPriceChange(
                          product.productId,
                          product.variantId, // Pass potentially undefined variantId
                          Number(e.target.value)
                        )}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {product.originalPrice && product.adjustedPrice ? ( // Check adjustedPrice too
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ((product.originalPrice - product.adjustedPrice) / product.originalPrice * 100) > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {Math.round(((product.originalPrice - product.adjustedPrice) / product.originalPrice) * 100)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.productId, product.variantId)} // Pass potentially undefined variantId
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          onClick={onCancel}
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
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu chiến dịch'}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;
