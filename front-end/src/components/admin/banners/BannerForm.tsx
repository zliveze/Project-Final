import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUpload, FiTrash2, FiLink, FiImage } from 'react-icons/fi';

// Định nghĩa kiểu dữ liệu cho Banner
export interface Banner {
  _id?: string;
  title: string;
  campaignId: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  href: string;
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Định nghĩa kiểu dữ liệu cho Campaign (dùng để hiển thị dropdown)
interface Campaign {
  _id: string;
  title: string;
  type: string;
}

interface BannerFormProps {
  initialData?: Partial<Banner>;
  onSubmit: (data: Partial<Banner>) => void;
  isSubmitting: boolean;
}

const sampleCampaigns: Campaign[] = [
  { _id: 'valentine-2024', title: 'Valentine - Chạm tim deal ngọt ngào', type: 'Hero Banner' },
  { _id: 'tet-2024', title: 'Tết rộn ràng - Sale cực khủng', type: 'Hero Banner' },
  { _id: 'new-year-2024', title: 'Năm mới - Deal hời', type: 'Hero Banner' },
  { _id: 'beauty-special', title: 'Đẹp chuẩn - Giá tốt', type: 'Hero Banner' }
];

const BannerForm: React.FC<BannerFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    campaignId: '',
    desktopImage: '',
    mobileImage: '',
    alt: '',
    href: '',
    active: true,
    order: 1,
    ...(initialData || {})
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>(sampleCampaigns);
  
  // Preview images
  const [desktopPreview, setDesktopPreview] = useState<string | null>(formData.desktopImage || null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(formData.mobileImage || null);

  useEffect(() => {
    // TODO: Fetch campaigns from API
    // For now, use sample data
  }, []);

  // Update campaign link when campaignId changes
  useEffect(() => {
    if (formData.campaignId) {
      const href = `/shop?campaign=${formData.campaignId}`;
      setFormData(prev => ({
        ...prev,
        href
      }));
    }
  }, [formData.campaignId]);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? Number(value) : value
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Xử lý thay đổi checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Xử lý upload ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'desktopImage' | 'mobileImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [imageType]: 'Kích thước ảnh không được vượt quá 2MB'
      }));
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [imageType]: 'Chỉ chấp nhận các file ảnh JPG, PNG, hoặc WebP'
      }));
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    if (imageType === 'desktopImage') {
      setDesktopPreview(previewUrl);
    } else {
      setMobilePreview(previewUrl);
    }

    // TODO: In a real app, you would upload the image to a server and get back a URL
    // For now, just use the preview URL
    setFormData(prev => ({
      ...prev,
      [imageType]: previewUrl
    }));

    // Clear error
    if (errors[imageType]) {
      setErrors(prev => ({
        ...prev,
        [imageType]: ''
      }));
    }
  };

  // Xóa ảnh
  const handleRemoveImage = (imageType: 'desktopImage' | 'mobileImage') => {
    if (imageType === 'desktopImage') {
      setDesktopPreview(null);
    } else {
      setMobilePreview(null);
    }

    setFormData(prev => ({
      ...prev,
      [imageType]: ''
    }));
  };

  // Validation form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Tiêu đề banner không được để trống';
    }
    
    if (!formData.campaignId) {
      newErrors.campaignId = 'Vui lòng chọn chiến dịch';
    }
    
    if (!formData.desktopImage) {
      newErrors.desktopImage = 'Vui lòng tải lên ảnh desktop';
    }
    
    if (!formData.mobileImage) {
      newErrors.mobileImage = 'Vui lòng tải lên ảnh mobile';
    }
    
    if (!formData.alt || formData.alt.trim() === '') {
      newErrors.alt = 'Mô tả alt không được để trống';
    }
    
    if (!formData.href || formData.href.trim() === '') {
      newErrors.href = 'Đường dẫn không được để trống';
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
        {/* Tiêu đề banner */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề banner <span className="text-red-500">*</span>
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

        {/* Chiến dịch liên kết */}
        <div>
          <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
            Chiến dịch liên kết <span className="text-red-500">*</span>
          </label>
          <select
            id="campaignId"
            name="campaignId"
            value={formData.campaignId || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.campaignId ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          >
            <option value="">Chọn chiến dịch</option>
            {campaigns.map(campaign => (
              <option key={campaign._id} value={campaign._id}>
                {campaign.title}
              </option>
            ))}
          </select>
          {errors.campaignId && <p className="mt-1 text-sm text-red-600">{errors.campaignId}</p>}
        </div>

        {/* Ảnh Desktop */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ảnh Desktop <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(Kích thước khuyến nghị: 1200x400px)</span>
          </label>
          <div className="mt-1 flex items-center">
            <div className={`flex-grow p-2 border ${
              errors.desktopImage ? 'border-red-300' : 'border-gray-300'
            } border-dashed rounded-md`}>
              {desktopPreview ? (
                <div className="relative">
                  <Image 
                    src={desktopPreview} 
                    alt="Desktop preview" 
                    width={600} 
                    height={200} 
                    className="w-full h-auto object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('desktopImage')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="desktop-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none"
                    >
                      <span>Tải ảnh lên</span>
                      <input
                        id="desktop-upload"
                        name="desktop-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageChange(e, 'desktopImage')}
                      />
                    </label>
                    <p className="pl-1">hoặc kéo thả ảnh vào đây</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP tối đa 2MB</p>
                </div>
              )}
            </div>
          </div>
          {errors.desktopImage && <p className="mt-1 text-sm text-red-600">{errors.desktopImage}</p>}
        </div>

        {/* Ảnh Mobile */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ảnh Mobile <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(Kích thước khuyến nghị: 600x300px)</span>
          </label>
          <div className="mt-1 flex items-center">
            <div className={`flex-grow p-2 border ${
              errors.mobileImage ? 'border-red-300' : 'border-gray-300'
            } border-dashed rounded-md`}>
              {mobilePreview ? (
                <div className="relative">
                  <Image 
                    src={mobilePreview} 
                    alt="Mobile preview" 
                    width={300} 
                    height={150} 
                    className="w-full h-auto object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('mobileImage')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="mobile-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none"
                    >
                      <span>Tải ảnh lên</span>
                      <input
                        id="mobile-upload"
                        name="mobile-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageChange(e, 'mobileImage')}
                      />
                    </label>
                    <p className="pl-1">hoặc kéo thả ảnh vào đây</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP tối đa 2MB</p>
                </div>
              )}
            </div>
          </div>
          {errors.mobileImage && <p className="mt-1 text-sm text-red-600">{errors.mobileImage}</p>}
        </div>

        {/* Alt cho ảnh */}
        <div>
          <label htmlFor="alt" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả alt cho ảnh <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="alt"
            name="alt"
            value={formData.alt || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.alt ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          {errors.alt && <p className="mt-1 text-sm text-red-600">{errors.alt}</p>}
        </div>

        {/* Link khi click vào banner */}
        <div>
          <label htmlFor="href" className="block text-sm font-medium text-gray-700 mb-1">
            Link khi click vào banner <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="href"
              name="href"
              value={formData.href || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 pl-10 border ${
                errors.href ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLink className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {errors.href && <p className="mt-1 text-sm text-red-600">{errors.href}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Link sẽ tự động được tạo khi chọn chiến dịch (dạng /shop?campaign=xxx)
          </p>
        </div>

        {/* Thứ tự hiển thị */}
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
            Thứ tự hiển thị
          </label>
          <input
            type="number"
            id="order"
            name="order"
            min="1"
            value={formData.order || 1}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Banner có thứ tự nhỏ hơn sẽ hiển thị trước
          </p>
        </div>

        {/* Trạng thái hiển thị */}
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Hiển thị banner
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Nếu không chọn, banner sẽ không hiển thị cho người dùng
          </p>
        </div>
      </div>

      <div className="pt-5">
        <button
          type="submit"
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu banner'}
        </button>
      </div>
    </form>
  );
};

export default BannerForm; 