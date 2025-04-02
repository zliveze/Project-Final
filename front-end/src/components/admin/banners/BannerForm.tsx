import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUpload, FiTrash2, FiLink, FiImage, FiLoader } from 'react-icons/fi';
import { useBanner } from '@/contexts/BannerContext';
import { toast } from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho Banner
export interface Banner {
  _id?: string;
  title: string;
  campaignId: string;
  desktopImage: string;
  desktopImagePublicId?: string;
  desktopImageData?: string;
  mobileImage: string;
  mobileImagePublicId?: string;
  mobileImageData?: string;
  alt: string;
  href: string;
  active: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
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
  onCancel?: () => void;
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
  isSubmitting,
  onCancel
}) => {
  const { uploadBannerImage } = useBanner();
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
  
  // Upload state
  const [isUploading, setIsUploading] = useState({
    desktop: false,
    mobile: false
  });

  // Format thời gian
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16); // Format 'YYYY-MM-DDTHH:MM'
  };

  // Chuyển đổi giá trị thời gian cho formData
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        startDate: initialData.startDate ? formatDate(initialData.startDate) : '',
        endDate: initialData.endDate ? formatDate(initialData.endDate) : ''
      }));
    }
  }, [initialData]);

  // Kiểm tra trạng thái hiển thị dựa vào thời gian
  const getTimeBasedStatus = () => {
    const now = new Date();
    const startDate = formData.startDate ? new Date(formData.startDate) : null;
    const endDate = formData.endDate ? new Date(formData.endDate) : null;
    
    if (!formData.active) {
      return { status: 'inactive', message: 'Banner đang bị tắt (không hoạt động)' };
    }
    
    if (startDate && now < startDate) {
      return { status: 'pending', message: 'Banner sẽ hiển thị khi đến thời gian bắt đầu' };
    }
    
    if (endDate && now > endDate) {
      return { status: 'expired', message: 'Banner đã hết thời gian hiển thị' };
    }
    
    if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
      return { status: 'active', message: 'Banner đang trong thời gian hiển thị' };
    }
    
    return { status: 'unknown', message: 'Không xác định được trạng thái' };
  };
  
  const timeStatus = getTimeBasedStatus();

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

  // Upload ảnh trực tiếp lên Cloudinary thông qua API
  const handleCloudinaryUpload = async (
    file: File, 
    imageType: 'desktop' | 'mobile',
    preview: string
  ) => {
    try {
      // Bắt đầu uploading
      setIsUploading(prev => ({ ...prev, [imageType]: true }));
      
      // Đọc file thành base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        
        const base64Data = event.target.result.toString();
        
        try {
          // Upload ảnh lên Cloudinary
          const uploadResult = await uploadBannerImage(
            base64Data,
            imageType,
            formData.campaignId
          );
          
          // Cập nhật formData với URL và publicId từ Cloudinary
          setFormData(prev => ({
            ...prev,
            [`${imageType}Image`]: uploadResult.url,
            [`${imageType}ImagePublicId`]: uploadResult.publicId,
            [`${imageType}ImageData`]: ''  // Xóa dữ liệu base64 vì đã có URL
          }));
          
          // Hiển thị thông báo thành công
          toast.success(`Đã tải lên ảnh ${imageType} thành công`);
          
          // Clear error nếu có
          if (errors[`${imageType}Image`]) {
            setErrors(prev => ({ ...prev, [`${imageType}Image`]: '' }));
          }
        } catch (error: any) {
          console.error(`Lỗi khi upload ảnh ${imageType}:`, error);
          setErrors(prev => ({
            ...prev,
            [`${imageType}Image`]: error.message || `Lỗi khi tải lên ảnh ${imageType}`
          }));
          
          // Hiển thị thông báo lỗi
          toast.error(`Lỗi khi tải lên ảnh ${imageType}: ${error.message}`);
        }
      };
      
      reader.onerror = () => {
        setErrors(prev => ({
          ...prev,
          [`${imageType}Image`]: `Lỗi khi đọc file ${file.name}`
        }));
        
        toast.error(`Lỗi khi đọc file ${file.name}`);
      };
    } catch (error: any) {
      console.error(`Lỗi khi xử lý ảnh ${imageType}:`, error);
      setErrors(prev => ({
        ...prev,
        [`${imageType}Image`]: error.message || `Lỗi khi xử lý ảnh ${imageType}`
      }));
    } finally {
      setIsUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };

  // Xử lý upload ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [`${imageType}Image`]: 'Kích thước ảnh không được vượt quá 2MB'
      }));
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [`${imageType}Image`]: 'Chỉ chấp nhận các file ảnh JPG, PNG, hoặc WebP'
      }));
      return;
    }

    // Tạo URL cho preview
    const previewUrl = URL.createObjectURL(file);
    
    if (imageType === 'desktop') {
      setDesktopPreview(previewUrl);
    } else {
      setMobilePreview(previewUrl);
    }

    // Upload ảnh lên Cloudinary
    handleCloudinaryUpload(file, imageType, previewUrl);
  };

  // Xóa ảnh
  const handleRemoveImage = (imageType: 'desktop' | 'mobile') => {
    if (imageType === 'desktop') {
      setDesktopPreview(null);
    } else {
      setMobilePreview(null);
    }

    setFormData(prev => ({
      ...prev,
      [`${imageType}Image`]: '',
      [`${imageType}ImagePublicId`]: ''
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
      // Chuẩn bị dữ liệu form để gửi đi, loại bỏ các trường tạm thời
      const submitData = { ...formData };
      
      // Nếu đã upload riêng lẻ thì không gửi base64 data
      if (formData.desktopImage) {
        delete submitData.desktopImageData;
      }
      
      if (formData.mobileImage) {
        delete submitData.mobileImageData;
      }
      
      onSubmit(submitData);
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
              {isUploading.desktop && (
                <div className="flex flex-col items-center justify-center py-4">
                  <FiLoader className="animate-spin h-8 w-8 text-pink-500 mb-2" />
                  <p className="text-sm text-gray-600">Đang tải lên...</p>
                </div>
              )}
              {!isUploading.desktop && desktopPreview ? (
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
                    onClick={() => handleRemoveImage('desktop')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : !isUploading.desktop && (
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
                        onChange={(e) => handleImageChange(e, 'desktop')}
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
              {isUploading.mobile && (
                <div className="flex flex-col items-center justify-center py-4">
                  <FiLoader className="animate-spin h-8 w-8 text-pink-500 mb-2" />
                  <p className="text-sm text-gray-600">Đang tải lên...</p>
                </div>
              )}
              {!isUploading.mobile && mobilePreview ? (
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
                    onClick={() => handleRemoveImage('mobile')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : !isUploading.mobile && (
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
                        onChange={(e) => handleImageChange(e, 'mobile')}
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

        {/* Mô tả alt */}
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

        {/* Đường dẫn */}
        <div>
          <label htmlFor="href" className="block text-sm font-medium text-gray-700 mb-1">
            Đường dẫn khi click <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="href"
              name="href"
              value={formData.href || ''}
              onChange={handleChange}
              className={`w-full pl-8 pr-3 py-2 border ${
                errors.href ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
            <FiLink className="absolute left-2 top-2.5 text-gray-400" />
          </div>
          {errors.href && <p className="mt-1 text-sm text-red-600">{errors.href}</p>}
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
        </div>

        {/* Trạng thái */}
        <div>
          <div className="flex items-center">
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={formData.active}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Hiển thị banner (Hoạt động)
            </label>
          </div>
        </div>

        {/* Ngày bắt đầu */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu
          </label>
          {initialData && initialData.startDate && (
            <div className="mb-2 text-sm text-gray-600">
              Đã thiết lập: {new Date(initialData.startDate).toLocaleString('vi-VN')}
            </div>
          )}
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={formData.startDate || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Ngày kết thúc */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc
          </label>
          {initialData && initialData.endDate && (
            <div className="mb-2 text-sm text-gray-600">
              Đã thiết lập: {new Date(initialData.endDate).toLocaleString('vi-VN')}
            </div>
          )}
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        {/* Thông tin trạng thái hiển thị dựa trên thời gian */}
        <div className="col-span-3">
          <div className={`p-3 rounded-md mt-3 ${
            timeStatus.status === 'active' ? 'bg-green-100 text-green-800' :
            timeStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            timeStatus.status === 'expired' ? 'bg-gray-100 text-gray-800' :
            timeStatus.status === 'inactive' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                timeStatus.status === 'active' ? 'bg-green-500' :
                timeStatus.status === 'pending' ? 'bg-yellow-500' :
                timeStatus.status === 'expired' ? 'bg-gray-500' :
                timeStatus.status === 'inactive' ? 'bg-red-500' :
                'bg-gray-500'
              }`}></div>
              <span className="font-medium">Trạng thái hiển thị:</span>
              <span className="ml-2">{timeStatus.message}</span>
            </div>
            <div className="mt-2 text-sm">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="font-medium">Thời gian hiện tại:</span>
                  <span className="ml-1">{new Date().toLocaleString('vi-VN')}</span>
                </div>
                {formData.startDate && (
                  <div>
                    <span className="font-medium">Bắt đầu:</span>
                    <span className="ml-1">{new Date(formData.startDate).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {formData.endDate && (
                  <div>
                    <span className="font-medium">Kết thúc:</span>
                    <span className="ml-1">{new Date(formData.endDate).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading.desktop || isUploading.mobile}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
            (isSubmitting || isUploading.desktop || isUploading.mobile) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <FiLoader className="animate-spin mr-2" />
              <span>Đang xử lý...</span>
            </div>
          ) : 'Lưu banner'}
        </button>
      </div>
    </form>
  );
};

export default BannerForm; 