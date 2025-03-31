import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiSave, FiX, FiEye } from 'react-icons/fi';
import { ChromePicker } from 'react-color';

// Định nghĩa kiểu dữ liệu cho thông báo
export type Notification = {
  _id?: string;
  content: string;
  type: string;
  link?: string;
  priority: number;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

interface NotificationFormProps {
  notification?: Partial<Notification>;
  onSubmit: (data: Partial<Notification>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const NotificationForm: React.FC<NotificationFormProps> = ({
  notification,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  // Khởi tạo form với react-hook-form
  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<Notification>({
    defaultValues: {
      content: notification?.content || '',
      type: notification?.type || 'system',
      link: notification?.link || '',
      priority: notification?.priority || 1,
      startDate: notification?.startDate ? new Date(notification.startDate) : new Date(),
      endDate: notification?.endDate ? new Date(notification.endDate) : null,
      isActive: notification?.isActive !== undefined ? notification.isActive : true,
      backgroundColor: notification?.backgroundColor || '#E5FBF1',
      textColor: notification?.textColor || '#306E51'
    }
  });

  // State cho color picker
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  
  // Lấy giá trị hiện tại của form để preview
  const currentContent = watch('content');
  const currentBgColor = watch('backgroundColor');
  const currentTextColor = watch('textColor');

  // Danh sách loại thông báo
  const notificationTypes = [
    { value: 'voucher', label: 'Mã giảm giá' },
    { value: 'shipping', label: 'Vận chuyển' },
    { value: 'promotion', label: 'Khuyến mãi' },
    { value: 'system', label: 'Hệ thống' }
  ];

  // Xử lý khi thay đổi màu nền
  const handleBackgroundColorChange = (color: any) => {
    setValue('backgroundColor', color.hex);
  };

  // Xử lý khi thay đổi màu chữ
  const handleTextColorChange = (color: any) => {
    setValue('textColor', color.hex);
  };

  // Xử lý submit form
  const onFormSubmit = (data: Notification) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Preview thông báo */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <h3 className="font-medium text-gray-700 mb-2">Xem trước thông báo:</h3>
        <div className="w-full h-[30px]" style={{ backgroundColor: currentBgColor || '#E5FBF1' }}>
          <div className="h-full flex items-center overflow-hidden px-4">
            <div className="marquee-container">
              <span style={{ color: currentTextColor || '#306E51' }} className="text-sm font-bold">
                {currentContent || 'Nội dung thông báo sẽ hiển thị ở đây'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nội dung thông báo */}
        <div className="md:col-span-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung thông báo *
          </label>
          <input
            type="text"
            id="content"
            {...register('content', { required: 'Nội dung thông báo là bắt buộc' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            placeholder="Nhập nội dung thông báo"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Loại thông báo */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Loại thông báo *
          </label>
          <select
            id="type"
            {...register('type', { required: 'Loại thông báo là bắt buộc' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          >
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Đường dẫn (nếu có) */}
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
            Đường dẫn (không bắt buộc)
          </label>
          <input
            type="text"
            id="link"
            {...register('link')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            placeholder="https://example.com/promotion"
          />
        </div>

        {/* Độ ưu tiên */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Độ ưu tiên *
          </label>
          <input
            type="number"
            id="priority"
            {...register('priority', { 
              required: 'Độ ưu tiên là bắt buộc',
              min: { value: 1, message: 'Độ ưu tiên tối thiểu là 1' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            min="1"
          />
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Số càng nhỏ càng được ưu tiên hiển thị</p>
        </div>

        {/* Ngày bắt đầu */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu *
          </label>
          <Controller
            control={control}
            name="startDate"
            rules={{ required: 'Ngày bắt đầu là bắt buộc' }}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            )}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        {/* Ngày kết thúc */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc
          </label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                dateFormat="dd/MM/yyyy"
                isClearable
                placeholderText="Không giới hạn"
                minDate={watch('startDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            )}
          />
          <p className="mt-1 text-xs text-gray-500">Để trống nếu không giới hạn thời gian</p>
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
              Hiển thị thông báo
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">Khi bỏ chọn, thông báo sẽ không hiển thị cho người dùng</p>
        </div>

        {/* Màu nền */}
        <div className="relative">
          <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-1">
            Màu nền
          </label>
          <div className="flex items-center">
            <Controller
              name="backgroundColor"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  id="backgroundColor"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  placeholder="#E5FBF1"
                />
              )}
            />
            <div
              className="w-8 h-8 ml-2 border border-gray-300 cursor-pointer"
              style={{ backgroundColor: currentBgColor || '#E5FBF1' }}
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            ></div>
          </div>
          {showBgColorPicker && (
            <div className="absolute z-10 right-0 bottom-full mb-2">
              <div className="fixed inset-0" onClick={() => setShowBgColorPicker(false)}></div>
              <div className="relative">
                <ChromePicker
                  color={currentBgColor || '#E5FBF1'}
                  onChange={handleBackgroundColorChange}
                  disableAlpha={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Màu chữ */}
        <div className="relative">
          <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-1">
            Màu chữ
          </label>
          <div className="flex items-center">
            <Controller
              name="textColor"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  id="textColor"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  placeholder="#306E51"
                />
              )}
            />
            <div
              className="w-8 h-8 ml-2 border border-gray-300 cursor-pointer"
              style={{ backgroundColor: currentTextColor || '#306E51' }}
              onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            ></div>
          </div>
          {showTextColorPicker && (
            <div className="absolute z-10 right-0 bottom-full mb-2">
              <div className="fixed inset-0" onClick={() => setShowTextColorPicker(false)}></div>
              <div className="relative">
                <ChromePicker
                  color={currentTextColor || '#306E51'}
                  onChange={handleTextColorChange}
                  disableAlpha={false}
                />
              </div>
            </div>
          )}
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
          {isSubmitting ? 'Đang lưu...' : 'Lưu thông báo'}
        </button>
      </div>
    </form>
  );
};

export default NotificationForm; 