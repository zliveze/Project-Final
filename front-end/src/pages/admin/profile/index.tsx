import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiPhone, FiLock, FiSave } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import AdminLayout from '../../../components/admin/AdminLayout';
import Card from '../../../components/admin/common/Card';
import { useAdminAuth } from '../../../contexts';

type ProfileFormValues = {
  name: string;
  email: string;
  phone: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function AdminProfile() {
  const { admin, setAdmin } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log('useAdminAuth hook data:', admin);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
    watch,
  } = useForm<PasswordFormValues>();

  const newPassword = watch('newPassword');

  // Hàm tải thông tin profile từ API
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        return;
      }
      
      const response = await axios.get('/api/admin/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Loaded profile data from API:', response.data);
      
      if (response.data) {
        // Cập nhật context
        if (setAdmin) {
          setAdmin(response.data);
        }
        
        // Cập nhật form
        reset({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
        });
        
        // Cập nhật localStorage
        localStorage.setItem('adminUser', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Tải thông tin profile khi component mount
    loadProfile();
  }, []);

  useEffect(() => {
    if (admin) {
      console.log('Setting form values from admin data:', {
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || ''
      });
      
      reset({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || '',
      });
    }
  }, [admin, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log('Đang gửi request cập nhật profile:', {
        url: '/api/admin/profile',
        data,
        token: localStorage.getItem('adminToken') ? 'Token tồn tại' : 'Token không tồn tại'
      });
      
      const response = await axios.put('/api/admin/profile', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      console.log('Nhận được response:', response.data);

      if (response.data.success) {
        toast.success('Thông tin đã được cập nhật thành công!');
        
        // Tải lại thông tin profile từ API
        await loadProfile();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } catch (error) {
      console.error('Lỗi cập nhật thông tin:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      setIsSubmittingPassword(true);
      
      const response = await axios.put(
        '/api/admin/profile/change-password',
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Mật khẩu đã được cập nhật thành công!');
        resetPassword();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi cập nhật mật khẩu');
      }
    } catch (error: any) {
      console.error('Lỗi cập nhật mật khẩu:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <AdminLayout title="Thông tin tài khoản">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <Card title="Thông tin cá nhân">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="inline-block h-8 w-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                <span className="ml-2">Đang tải thông tin...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Họ và tên
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
                        placeholder="Nhập họ và tên"
                        {...register('name', { required: 'Họ và tên là bắt buộc' })}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
                        placeholder="Nhập email"
                        {...register('email', {
                          required: 'Email là bắt buộc',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email không hợp lệ',
                          },
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Số điện thoại
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="phone"
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
                        placeholder="Nhập số điện thoại"
                        {...register('phone', {
                          required: 'Số điện thoại là bắt buộc',
                          pattern: {
                            value: /^[0-9]{10,11}$/,
                            message: 'Số điện thoại không hợp lệ',
                          },
                        })}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      ) : (
                        <FiSave className="mr-2 h-5 w-5" />
                      )}
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card title="Đổi mật khẩu">
            <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Mật khẩu hiện tại
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="currentPassword"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
                      placeholder="Nhập mật khẩu hiện tại"
                      {...registerPassword('currentPassword', {
                        required: 'Mật khẩu hiện tại là bắt buộc',
                      })}
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Mật khẩu mới
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="newPassword"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
                      placeholder="Nhập mật khẩu mới"
                      {...registerPassword('newPassword', {
                        required: 'Mật khẩu mới là bắt buộc',
                        minLength: {
                          value: 6,
                          message: 'Mật khẩu phải có ít nhất 6 ký tự',
                        },
                      })}
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm`}
                      placeholder="Xác nhận mật khẩu mới"
                      {...registerPassword('confirmPassword', {
                        required: 'Xác nhận mật khẩu là bắt buộc',
                        validate: (value) =>
                          value === newPassword || 'Mật khẩu xác nhận không khớp',
                      })}
                    />
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                  >
                    {isSubmittingPassword ? (
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : (
                      <FiSave className="mr-2 h-5 w-5" />
                    )}
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 