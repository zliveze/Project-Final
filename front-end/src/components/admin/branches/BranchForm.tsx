import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX } from 'react-icons/fi';
import { useBranches, Branch as BranchType } from '@/contexts/BranchContext';
import toast from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho chi nhánh form
export type Branch = {
  id?: string;
  name: string;
  address: string;
  contact?: string;
  isActive?: boolean;
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
      isActive: branch?.isActive !== undefined ? branch.isActive : true
    }
  });

  // Xử lý submit form
  const onFormSubmit = (data: Branch) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tên chi nhánh */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Tên chi nhánh *
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Tên chi nhánh là bắt buộc' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            placeholder="Nhập tên chi nhánh"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Địa chỉ */}
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ *
          </label>
          <textarea
            id="address"
            rows={3}
            {...register('address', { required: 'Địa chỉ là bắt buộc' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            placeholder="Nhập địa chỉ chi nhánh"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        {/* Thông tin liên hệ */}
        <div className="md:col-span-2">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
            Thông tin liên hệ
          </label>
          <input
            type="text"
            id="contact"
            {...register('contact')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            placeholder="Số điện thoại, email, người quản lý,..."
          />
        </div>

        {/* Trạng thái hiển thị */}
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Chi nhánh đang hoạt động
            </label>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          disabled={isSubmitting}
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
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