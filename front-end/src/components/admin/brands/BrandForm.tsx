import { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import Image from 'next/image';

// Định nghĩa interfaces cho Brand
export interface BrandLogo {
  url: string;
  alt: string;
}

export interface BrandSocialMedia {
  facebook: string;
  instagram: string;
  youtube: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: BrandLogo;
  origin: string;
  website: string;
  featured: boolean;
  status: string;
  socialMedia: BrandSocialMedia;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

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
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    description: '',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: ''
    },
    origin: '',
    website: '',
    featured: false,
    status: 'active',
    socialMedia: {
      facebook: '',
      instagram: '',
      youtube: ''
    },
    ...(initialData || {})
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
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({
          ...prev,
          logo: {
            url: result,
            alt: prev.logo?.alt || file.name
          }
        }));
      };
      reader.readAsDataURL(file);
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
    } catch (e) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo upload */}
        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center mb-4">
          <div className="relative w-40 h-40 mb-4 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
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
                <p>Chưa có hình ảnh</p>
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-pink-100 text-pink-700 hover:bg-pink-200 px-4 py-2 rounded-md transition duration-150 font-medium text-sm flex items-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            Tải lên logo thương hiệu
          </label>
          <span className="text-xs text-gray-500 mt-2">Khuyến nghị kích thước 150x150px, định dạng PNG, JPG</span>
        </div>

        {/* Tên thương hiệu */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Tên thương hiệu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Xuất xứ */}
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
            Xuất xứ
          </label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Mô tả */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website || ''}
            onChange={handleChange}
            placeholder="https://example.com"
            className={`w-full px-3 py-2 border ${
              errors.website ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
        </div>

        {/* Trạng thái */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || 'active'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>

        {/* Featured checkbox */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              checked={formData.featured || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Thương hiệu nổi bật
            </label>
          </div>
        </div>

        {/* Social Media */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Mạng xã hội</h3>
          
          <div className="space-y-4">
            {/* Facebook */}
            <div>
              <label htmlFor="socialMedia.facebook" className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="url"
                id="socialMedia.facebook"
                name="socialMedia.facebook"
                value={formData.socialMedia?.facebook || ''}
                onChange={handleChange}
                placeholder="https://facebook.com/yourbrand"
                className={`w-full px-3 py-2 border ${
                  errors['socialMedia.facebook'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
              />
              {errors['socialMedia.facebook'] && <p className="mt-1 text-sm text-red-600">{errors['socialMedia.facebook']}</p>}
            </div>

            {/* Instagram */}
            <div>
              <label htmlFor="socialMedia.instagram" className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="url"
                id="socialMedia.instagram"
                name="socialMedia.instagram"
                value={formData.socialMedia?.instagram || ''}
                onChange={handleChange}
                placeholder="https://instagram.com/yourbrand"
                className={`w-full px-3 py-2 border ${
                  errors['socialMedia.instagram'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
              />
              {errors['socialMedia.instagram'] && <p className="mt-1 text-sm text-red-600">{errors['socialMedia.instagram']}</p>}
            </div>

            {/* Youtube */}
            <div>
              <label htmlFor="socialMedia.youtube" className="block text-sm font-medium text-gray-700 mb-1">
                Youtube
              </label>
              <input
                type="url"
                id="socialMedia.youtube"
                name="socialMedia.youtube"
                value={formData.socialMedia?.youtube || ''}
                onChange={handleChange}
                placeholder="https://youtube.com/c/yourbrand"
                className={`w-full px-3 py-2 border ${
                  errors['socialMedia.youtube'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
              />
              {errors['socialMedia.youtube'] && <p className="mt-1 text-sm text-red-600">{errors['socialMedia.youtube']}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu thương hiệu'}
        </button>
      </div>
    </form>
  );
};

export default BrandForm; 