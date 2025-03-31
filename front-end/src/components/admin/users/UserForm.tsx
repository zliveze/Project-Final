import React, { useState, useRef, useEffect } from 'react';
import { UserNotifications } from './';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiShield, FiCheck, FiX, FiUpload, FiInfo, FiAlertCircle } from 'react-icons/fi';

interface UserFormProps {
  initialValues?: {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    password?: string;
    avatar?: string;
    googleId?: string;
    addresses?: {
      addressId: string;
      addressLine: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      isDefault: boolean;
    }[];
    wishlist?: { productId: string; variantId: string }[];
  };
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  icon: React.ReactNode;
  placeholder: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

const UserForm: React.FC<UserFormProps> = ({
  initialValues = {
    name: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: '',
    avatar: '',
    addresses: [],
    wishlist: [],
  },
  onSubmit,
  onCancel,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialValues.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cấu hình trường dữ liệu
  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Họ và tên',
      type: 'text',
      icon: <FiUser />,
      placeholder: 'Nhập họ và tên',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      icon: <FiMail />,
      placeholder: 'example@domain.com',
      required: true
    },
    {
      name: 'phone',
      label: 'Số điện thoại',
      type: 'tel',
      icon: <FiPhone />,
      placeholder: 'Nhập số điện thoại',
      required: false
    },
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      icon: <FiShield />,
      placeholder: '',
      options: [
        { value: 'user', label: 'Người dùng' },
        { value: 'admin', label: 'Quản trị viên' }
      ]
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      icon: <FiCheck />,
      placeholder: '',
      options: [
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Không hoạt động' },
        { value: 'blocked', label: 'Đã khóa' }
      ]
    }
  ];
  
  // Nếu không phải edit mode hoặc không có googleId, thêm trường password
  if (!isEditMode || !formData.googleId) {
    formFields.splice(3, 0, {
      name: 'password',
      label: isEditMode ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu',
      type: 'password',
      icon: <FiShield />,
      placeholder: isEditMode ? '••••••••' : 'Nhập mật khẩu',
      required: !isEditMode
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Xóa lỗi khi người dùng thay đổi giá trị
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Trong thực tế, bạn sẽ upload file và lưu URL
      // Ở đây chúng ta chỉ tạo một URL tạm thời để hiển thị preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên người dùng';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Validate phone
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
    }
    
    // Validate password nếu là thêm mới hoặc password được nhập
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        onSubmit(formData);
      } catch (error) {
        console.error('Lỗi khi xử lý form:', error);
        toast.error('Có lỗi xảy ra khi xử lý form');
        setIsSubmitting(false);
      }
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  // Hiển thị thông tin địa chỉ đã có nhưng không cho phép chỉnh sửa
  const renderAddresses = () => {
    if (!isEditMode || !formData.addresses || formData.addresses.length === 0) {
      return null;
    }

    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
            <FiInfo className="text-pink-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Danh sách địa chỉ</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-4 rounded-md border border-blue-100 flex items-start">
          <FiInfo className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Địa chỉ không thể chỉnh sửa trực tiếp từ form này. Vui lòng sử dụng chức năng quản lý địa chỉ từ trang chi tiết người dùng.
          </span>
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
          {formData.addresses.map((address, index) => (
            <div 
              key={address.addressId || index} 
              className={`p-4 rounded-md border transition-all hover:shadow-sm ${
                address.isDefault 
                  ? 'border-pink-300 bg-pink-50' 
                  : 'border-gray-200 hover:border-pink-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {address.addressLine}
                    {address.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                        Mặc định
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {address.city}, {address.state}, {address.country}, {address.postalCode}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render input field với error handling và styles nhất quán
  const renderField = (field: FormField) => {
    const hasError = errors[field.name] ? true : false;
    
    return (
      <div key={field.name} className="space-y-1">
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 flex items-center">
          {field.icon && <span className="mr-1.5 text-gray-400">{field.icon}</span>}
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name as keyof typeof formData] as string}
              onChange={handleChange}
              className={`block w-full pl-3 pr-10 py-2.5 text-base border ${
                hasError 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
              } rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors`}
              aria-invalid={hasError ? 'true' : 'false'}
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name as keyof typeof formData] as string}
              onChange={handleChange}
              placeholder={field.placeholder}
              className={`block w-full px-3 py-2.5 text-base border ${
                hasError 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
              } rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors`}
              aria-invalid={hasError ? 'true' : 'false'}
            />
          )}
          
          {hasError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiAlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>
        
        {hasError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <FiAlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
            {errors[field.name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        {isEditMode && (
          <div className="flex items-center">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              formData.status === 'active' ? 'bg-green-100 text-green-800' : 
              formData.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {formData.status === 'active' ? 'Đang hoạt động' : 
               formData.status === 'inactive' ? 'Không hoạt động' : 'Đã khóa'}
            </span>
          </div>
        )}
      </div>
      
      {/* Avatar upload section */}
      <div className="flex flex-col sm:flex-row items-center mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
          <div 
            className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-md"
            style={{ backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            {!avatarPreview && (
              <span className="text-2xl font-bold text-gray-400">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-md font-medium text-gray-900 mb-2">Ảnh đại diện</h3>
          <p className="text-sm text-gray-500 mb-3">
            Upload ảnh đại diện cho người dùng (định dạng JPG, PNG).
          </p>
          
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={triggerFileInput}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              <FiUpload className="mr-2" /> Tải ảnh lên
            </button>
            
            {avatarPreview && (
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(null);
                  setFormData(prev => ({ ...prev, avatar: '' }));
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                <FiX className="mr-2" /> Xóa ảnh
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map(field => renderField(field))}
      </div>

      {/* Phần hiển thị địa chỉ (không cho phép chỉnh sửa) */}
      {renderAddresses()}

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors flex items-center"
        >
          <FiX className="mr-1.5" /> Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-colors flex items-center"
        >
          <FiCheck className="mr-1.5" />
          {isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};

export default UserForm; 