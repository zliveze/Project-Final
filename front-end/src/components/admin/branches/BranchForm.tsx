import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiMapPin, FiPhone, FiType } from 'react-icons/fi';
import { useBranches, Branch as BranchType } from '@/contexts/BranchContext';
import toast from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho chi nhánh form
export type Branch = {
  id?: string;
  name: string;
  address: string;
  contact?: string;
  // isActive?: boolean; // Removed status field
  createdAt?: string;
  updatedAt?: string;
};

interface BranchFormProps {
  branch?: Branch;
  onSubmit: (data: Partial<Branch>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const BranchForm: React.FC<BranchFormProps> = ({
  branch,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  // Khởi tạo form với react-hook-form
  const { register, handleSubmit, formState: { errors } } = useForm<Branch>({
    defaultValues: {
      name: branch?.name || '',
      address: branch?.address || '',
      contact: branch?.contact || '',
      // isActive: branch?.isActive !== undefined ? branch.isActive : true // Removed status field
    }
  });

  // Xử lý submit form
  const onFormSubmit = (data: Branch) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Tên chi nhánh */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FiType className="text-pink-600" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên chi nhánh <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Nhập tên đầy đủ của chi nhánh</p>
            </div>
          </div>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Tên chi nhánh là bắt buộc' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: Chi nhánh Hồ Chí Minh"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Địa chỉ */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FiMapPin className="text-blue-600" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Nhập địa chỉ đầy đủ của chi nhánh</p>
            </div>
          </div>
          <textarea
            id="address"
            rows={3}
            {...register('address', { required: 'Địa chỉ là bắt buộc' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: Phường 13 Quận Bình Thạnh, 1/11/46 Hẻm Đặng Thuỳ Trâm"
          />
          {errors.address && (
            <p className="mt-2 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        {/* Thông tin liên hệ */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FiPhone className="text-green-600" />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Thông tin liên hệ
              </label>
              <p className="text-xs text-gray-500 mb-2">Nhập số điện thoại và người liên hệ (nếu có)</p>
            </div>
          </div>
          <input
            type="text"
            id="contact"
            {...register('contact')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: 0986644572 Lê Tấn Đạt"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
          disabled={isSubmitting}
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
          disabled={isSubmitting}
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu chi nhánh'}
        </button>
      </div>
    </form>
  );
};

export default BranchForm;

