import { useState } from 'react';
import { FiSave, FiX, FiUpload, FiGlobe, FiFacebook, FiInstagram, FiYoutube, FiInfo } from 'react-icons/fi';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Brand } from '@/contexts/BrandContext'; // Import Brand from BrandContext

// Local Brand, BrandLogo, BrandSocialMedia interfaces are removed as Brand is now imported.
// The imported Brand type from BrandContext will be used.

interface BrandFormProps {
  initialData?: Partial<Brand>;
  onSubmit: (data: Partial<Brand>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const BrandForm: React.FC<BrandFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<Partial<Brand>>(() => {
    const defaults: Partial<Brand> = {
      name: '',
      description: '',
      logo: {
        url: 'https://via.placeholder.com/150',
        alt: '', // Default to empty string, as context Brand.logo.alt can be undefined
      },
      origin: '',
      website: '',
      featured: false,
      status: 'active',
      socialMedia: {
        facebook: '',
        instagram: '',
        youtube: '',
      },
    };
    // Merge initialData with defaults, ensuring nested structures are handled
    const mergedData = { ...defaults, ...initialData };
    if (initialData?.logo) {
      mergedData.logo = { ...defaults.logo, ...initialData.logo };
    } else {
      mergedData.logo = defaults.logo;
    }
    if (initialData?.socialMedia) {
      mergedData.socialMedia = { ...defaults.socialMedia, ...initialData.socialMedia };
    } else {
      mergedData.socialMedia = defaults.socialMedia;
    }
    return mergedData;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string>(
    initialData?.logo?.url || 'https://via.placeholder.com/150'
  );

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Xử lý nested object (socialMedia)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as unknown as Record<string, unknown> || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

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

  // Xử lý thay đổi logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name, 'size:', file.size, 'type:', file.type);

      // Kiểm tra kích thước file, giới hạn 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'Kích thước file quá lớn. Vui lòng chọn file dưới 5MB.'
        }));
        return;
      }

      // Kiểm tra định dạng file
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)$/)) {
        setErrors(prev => ({
          ...prev,
          logo: 'Định dạng file không được hỗ trợ. Vui lòng chọn file PNG, JPG hoặc GIF.'
        }));
        return;
      }

      // Tạo URL để xem trước ảnh
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // Lưu file để khi submit form sẽ gửi file trực tiếp lên server
      setFormData(prev => ({
        ...prev,
        logoFile: file,
        logo: {
          ...prev.logo,
          alt: prev.logo?.alt || file.name
        }
      }));

      // Xóa lỗi nếu có
      if (errors.logo) {
        setErrors(prev => ({
          ...prev,
          logo: ''
        }));
      }
    }
  };

  // Xử lý validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Tên thương hiệu không được để trống';
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Mô tả thương hiệu không được để trống';
    }

    if (formData.website && !isValidURL(formData.website)) {
      newErrors.website = 'URL website không hợp lệ';
    }

    if (formData.socialMedia?.facebook && !isValidURL(formData.socialMedia.facebook)) {
      newErrors['socialMedia.facebook'] = 'URL Facebook không hợp lệ';
    }

    if (formData.socialMedia?.instagram && !isValidURL(formData.socialMedia.instagram)) {
      newErrors['socialMedia.instagram'] = 'URL Instagram không hợp lệ';
    }

    if (formData.socialMedia?.youtube && !isValidURL(formData.socialMedia.youtube)) {
      newErrors['socialMedia.youtube'] = 'URL Youtube không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kiểm tra URL hợp lệ
  const isValidURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6 bg-white rounded-lg shadow-sm border border-gray-100"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột trái: Logo thương hiệu và Mạng xã hội */}
        <div className="col-span-1 lg:col-span-1 p-5 border-r border-gray-100">
          {/* Logo thương hiệu */}
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-800 mb-4 pb-2 border-b border-gray-100">Logo thương hiệu</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 mb-4 overflow-hidden rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 transition-all hover:border-pink-300 group">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={150}
                    height={150}
                    className="object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <FiUpload className="h-8 w-8 mx-auto mb-2" />
                    <p>Chưa có hình ảnh</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer bg-white text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded-md transition duration-150 font-medium text-sm flex items-center">
                    <FiUpload className="mr-1.5" />
                    Tải lên
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              </div>

              <label className="cursor-pointer bg-pink-600 text-white hover:bg-pink-700 px-3 py-1.5 rounded-md transition duration-150 font-medium text-sm flex items-center w-fit">
                <FiUpload className="mr-1.5" />
                Tải lên logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
              <div className="mt-2 flex items-center">
                <FiInfo className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">Khuyến nghị: 150x150px, PNG/JPG</span>
              </div>
              {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
            </div>
          </div>

          {/* Mạng xã hội */}
          <div className="mt-8">
            <h3 className="text-base font-medium text-gray-800 mb-4 border-b border-gray-100 pb-2">Mạng xã hội</h3>

            <div className="space-y-4">
              {/* Facebook */}
              <div className="space-y-2">
                <label htmlFor="socialMedia.facebook" className="block text-sm font-medium text-gray-700">
                  Facebook
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiFacebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <input
                    type="url"
                    id="socialMedia.facebook"
                    name="socialMedia.facebook"
                    value={formData.socialMedia?.facebook || ''}
                    onChange={handleChange}
                    placeholder="https://facebook.com/yourbrand"
                    className={`w-full pl-10 pr-4 py-2.5 border ${
                      errors['socialMedia.facebook'] ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all`}
                  />
                </div>
                {errors['socialMedia.facebook'] && <p className="text-sm text-red-600">{errors['socialMedia.facebook']}</p>}
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <label htmlFor="socialMedia.instagram" className="block text-sm font-medium text-gray-700">
                  Instagram
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiInstagram className="h-5 w-5 text-pink-600" />
                  </div>
                  <input
                    type="url"
                    id="socialMedia.instagram"
                    name="socialMedia.instagram"
                    value={formData.socialMedia?.instagram || ''}
                    onChange={handleChange}
                    placeholder="https://instagram.com/yourbrand"
                    className={`w-full pl-10 pr-4 py-2.5 border ${
                      errors['socialMedia.instagram'] ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all`}
                  />
                </div>
                {errors['socialMedia.instagram'] && <p className="text-sm text-red-600">{errors['socialMedia.instagram']}</p>}
              </div>

              {/* Youtube */}
              <div className="space-y-2">
                <label htmlFor="socialMedia.youtube" className="block text-sm font-medium text-gray-700">
                  Youtube
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiYoutube className="h-5 w-5 text-red-600" />
                  </div>
                  <input
                    type="url"
                    id="socialMedia.youtube"
                    name="socialMedia.youtube"
                    value={formData.socialMedia?.youtube || ''}
                    onChange={handleChange}
                    placeholder="https://youtube.com/c/yourbrand"
                    className={`w-full pl-10 pr-4 py-2.5 border ${
                      errors['socialMedia.youtube'] ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all`}
                  />
                </div>
                {errors['socialMedia.youtube'] && <p className="text-sm text-red-600">{errors['socialMedia.youtube']}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin thương hiệu và Trạng thái */}
        <div className="col-span-1 lg:col-span-1 p-5">
          {/* Thông tin thương hiệu */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4 border-b border-gray-100 pb-2">Thông tin thương hiệu</h3>

            {/* Tên thương hiệu */}
            <div className="space-y-2 mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Tên thương hiệu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="Nhập tên thương hiệu"
                className={`w-full px-4 py-2 border ${
                  errors.name ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all`}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Xuất xứ */}
            <div className="space-y-2 mb-4">
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                Xuất xứ
              </label>
              <input
                type="text"
                id="origin"
                name="origin"
                value={formData.origin || ''}
                onChange={handleChange}
                placeholder="Ví dụ: Hàn Quốc, Nhật Bản, Pháp..."
                className="w-full px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2 mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Nhập mô tả chi tiết về thương hiệu"
                className={`w-full px-4 py-2 border ${
                  errors.description ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all`}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Website */}
            <div className="space-y-2 mb-4">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website chính thức
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiGlobe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={`w-full pl-10 pr-4 py-2 border ${
                    errors.website ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all`}
                />
              </div>
              {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
            </div>
          </div>

          {/* Trạng thái */}
          <div className="mt-8">
            <h3 className="text-base font-medium text-gray-800 mb-4 border-b border-gray-100 pb-2">Trạng thái</h3>

            {/* Trạng thái hoạt động */}
            <div className="space-y-2 mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'active'}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none bg-white transition-all"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            {/* Featured checkbox */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  checked={formData.featured || false}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <div>
                  <label htmlFor="featured" className="block text-sm font-medium text-gray-700">
                    Thương hiệu nổi bật
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Hiển thị ở vị trí ưu tiên</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-pink-400' : 'bg-pink-600 hover:bg-pink-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all`}
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu thương hiệu'}
        </button>
      </div>
    </motion.form>
  );
};

export default BrandForm;
