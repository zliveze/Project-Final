import { toast } from 'react-hot-toast';

// Các thông báo liên quan đến User CRUD
export const UserNotifications = {
  // Thông báo thành công
  success: {
    create: () => toast.success('Thêm người dùng mới thành công!', { id: 'user-create-success' }),
    update: () => toast.success('Cập nhật thông tin người dùng thành công!', { id: 'user-update-success' }),
    delete: () => toast.success('Xóa người dùng thành công!', { id: 'user-delete-success' }),
    resetPassword: () => toast.success('Đặt lại mật khẩu thành công! Mail đã được gửi đến người dùng.', { id: 'user-reset-password-success' }),
    
    // Thông báo thay đổi trạng thái
    statusChange: {
      active: () => toast.success('Đã kích hoạt tài khoản người dùng!', { id: 'user-status-active-success' }),
      inactive: () => toast.success('Đã vô hiệu hóa tài khoản người dùng!', { id: 'user-status-inactive-success' }),
      blocked: () => toast.success('Đã khóa tài khoản người dùng!', { id: 'user-status-blocked-success' }),
    },
    
    // Thông báo thay đổi vai trò
    roleChange: {
      admin: () => toast.success('Đã cấp quyền Quản trị viên cho người dùng!', { id: 'user-role-admin-success' }),
      user: () => toast.success('Đã thu hồi quyền Quản trị viên của người dùng!', { id: 'user-role-user-success' }),
    },
    
    // Thông báo địa chỉ
    address: {
      add: () => toast.success('Thêm địa chỉ mới thành công!', { id: 'user-address-add-success' }),
      update: () => toast.success('Cập nhật địa chỉ thành công!', { id: 'user-address-update-success' }),
      delete: () => toast.success('Xóa địa chỉ thành công!', { id: 'user-address-delete-success' }),
      setDefault: () => toast.success('Đặt địa chỉ mặc định thành công!', { id: 'user-address-default-success' }),
    },
    
    customerLevel: {
      update: (level: string) => toast.success(`Đã cập nhật cấp độ khách hàng thành ${level}!`, { id: 'user-customer-level-update-success' }),
      reset: () => toast.success('Đã reset số đơn hàng tháng này!', { id: 'user-customer-level-reset-success' }),
    },
  },
  
  // Thông báo lỗi
  error: {
    create: () => toast.error('Có lỗi xảy ra khi thêm người dùng!', { id: 'user-create-error' }),
    update: () => toast.error('Có lỗi xảy ra khi cập nhật thông tin người dùng!', { id: 'user-update-error' }),
    delete: () => toast.error('Có lỗi xảy ra khi xóa người dùng!', { id: 'user-delete-error' }),
    resetPassword: () => toast.error('Có lỗi xảy ra khi đặt lại mật khẩu!', { id: 'user-reset-password-error' }),
    validation: (message: string) => toast.error(`Lỗi: ${message}`, { id: 'user-validation-error' }),
    
    // Thông báo lỗi khi thay đổi trạng thái
    statusChange: () => toast.error('Có lỗi xảy ra khi thay đổi trạng thái người dùng!', { id: 'user-status-change-error' }),
    
    // Thông báo lỗi khi thay đổi vai trò
    roleChange: () => toast.error('Có lỗi xảy ra khi thay đổi vai trò người dùng!', { id: 'user-role-change-error' }),
    
    // Thông báo lỗi địa chỉ
    address: {
      add: () => toast.error('Có lỗi xảy ra khi thêm địa chỉ!', { id: 'user-address-add-error' }),
      update: () => toast.error('Có lỗi xảy ra khi cập nhật địa chỉ!', { id: 'user-address-update-error' }),
      delete: () => toast.error('Có lỗi xảy ra khi xóa địa chỉ!', { id: 'user-address-delete-error' }),
      setDefault: () => toast.error('Có lỗi xảy ra khi đặt địa chỉ mặc định!', { id: 'user-address-default-error' }),
    },
    
    customerLevel: {
      update: () => toast.error('Có lỗi xảy ra khi cập nhật cấp độ khách hàng!', { id: 'user-customer-level-update-error' }),
      reset: () => toast.error('Có lỗi xảy ra khi reset số đơn hàng!', { id: 'user-customer-level-reset-error' }),
    },
  },
  
  // Thông báo cảnh báo
  warning: {
    confirmDelete: () => toast('Bạn có chắc chắn muốn xóa người dùng này?', {
      icon: '⚠️',
      id: 'user-confirm-delete'
    }),
    confirmBlock: () => toast('Cảnh báo: Hành động này sẽ khóa tài khoản của người dùng!', {
      icon: '⚠️',
      id: 'user-confirm-block'
    }),
  },
  
  // Thông báo thông tin
  info: {
    loading: () => {
      toast.dismiss('user-loading');
      return toast.loading('Đang xử lý...', { id: 'user-loading' });
    },
    resetPasswordInfo: () => toast('Mật khẩu mới sẽ được gửi qua email.', {
      icon: 'ℹ️',
      id: 'user-reset-password-info'
    }),
    
    customerLevel: {
      info: (level: string, orders: number) => toast(`Cần ${orders} đơn hàng nữa để đạt cấp độ ${level}`, {
        icon: 'ℹ️',
        id: 'user-customer-level-info'
      }),
    },
  },
};

export default UserNotifications; 