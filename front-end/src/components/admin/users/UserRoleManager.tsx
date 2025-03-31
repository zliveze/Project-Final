import React, { useState, useEffect } from 'react';
import { FiShield, FiAlertTriangle, FiUserCheck, FiUserX, FiUser } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface UserRoleManagerProps {
  userId: string;
  userName: string;
  currentRole: 'user' | 'admin';
  onRoleChange: (userId: string, newRole: string) => void;
}

const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  userId,
  userName,
  currentRole,
  onRoleChange
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [roleToChange, setRoleToChange] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleAnimation, setRoleAnimation] = useState(false);

  // Khi role cần thay đổi, animate vai trò hiện tại
  useEffect(() => {
    if (roleToChange) {
      setRoleAnimation(true);
    } else {
      setRoleAnimation(false);
    }
  }, [roleToChange]);

  // Khi hiển thị modal xác nhận
  useEffect(() => {
    if (showConfirmation) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [showConfirmation]);

  const handleRoleChange = (newRole: string) => {
    if (newRole === currentRole) return;
    
    setRoleToChange(newRole);
    setShowConfirmation(true);
  };

  const confirmRoleChange = () => {
    if (roleToChange) {
      // Hiển thị loading toast
      const loadingToast = toast.loading('Đang cập nhật vai trò...');
      
      // Mô phỏng API call
      setTimeout(() => {
        onRoleChange(userId, roleToChange);
        toast.dismiss(loadingToast);
        
        // Hiển thị thông báo thành công
        const message = roleToChange === 'admin'
          ? `Người dùng đã được cấp quyền Quản trị viên!`
          : `Đã thu hồi quyền Quản trị viên!`;
        
        toast.success(message);
        
        setShowConfirmation(false);
        setRoleToChange(null);
      }, 600);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'user':
        return 'Người dùng';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-500 bg-purple-50 border-purple-200';
      case 'user':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500';
      case 'user':
        return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiUser className="mr-2 text-pink-500" />
          Quản lý vai trò người dùng
        </h2>
        <p className="text-sm text-gray-500 mt-1">Thay đổi vai trò của tài khoản người dùng</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="mb-4 sm:mb-0">
            <div className="text-sm text-gray-500 mb-2">Vai trò hiện tại</div>
            <div 
              className={`flex items-center px-4 py-2 rounded-full border ${getRoleColor(currentRole)} ${roleAnimation ? 'animate-pulse' : ''} transition-all duration-300`}
            >
              {currentRole === 'admin' ? (
                <FiShield className="mr-2" />
              ) : (
                <FiUserCheck className="mr-2" />
              )}
              <span className="font-medium">
                {getRoleText(currentRole)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentRole !== 'admin' && (
              <button
                onClick={() => handleRoleChange('admin')}
                className={`px-4 py-2.5 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 flex items-center font-medium shadow-sm ${getRoleBgColor('admin')}`}
              >
                <FiShield className="mr-1.5" />
                Cấp quyền Quản trị viên
              </button>
            )}
            
            {currentRole !== 'user' && (
              <button
                onClick={() => handleRoleChange('user')}
                className={`px-4 py-2.5 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 flex items-center font-medium shadow-sm ${getRoleBgColor('user')}`}
              >
                <FiUserX className="mr-1.5" />
                Thu hồi quyền Quản trị viên
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded border border-yellow-100 text-sm flex items-start">
          <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Lưu ý về phân quyền:</p>
            <p>Quản trị viên có toàn quyền truy cập và quản lý hệ thống, bao gồm tất cả dữ liệu người dùng, sản phẩm, đơn hàng và cấu hình hệ thống.</p>
          </div>
        </div>
      </div>
      
      {/* Modal xác nhận thay đổi vai trò */}
      {(showConfirmation || modalVisible) && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${showConfirmation ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
              showConfirmation ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
            }`}>
              <div className={`bg-${roleToChange === 'admin' ? 'purple' : 'blue'}-50 px-4 py-3 sm:px-6 border-b ${
                roleToChange === 'admin' ? 'border-purple-100' : 'border-blue-100'
              }`}>
                <div className="flex items-center">
                  <div className={`mr-3 flex-shrink-0 h-10 w-10 rounded-full ${
                    roleToChange === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                  } flex items-center justify-center`}>
                    {roleToChange === 'admin' ? (
                      <FiShield className="h-5 w-5" />
                    ) : (
                      <FiUserX className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className={`text-lg leading-6 font-medium ${
                    roleToChange === 'admin' ? 'text-purple-800' : 'text-blue-800'
                  }`}>
                    Xác nhận thay đổi vai trò
                  </h3>
                </div>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-4">
                        {roleToChange === 'admin' ? 
                          `Bạn có chắc chắn muốn cấp quyền Quản trị viên cho "${userName}"? 
                          Quản trị viên có toàn quyền quản lý hệ thống.` : 
                          `Bạn có chắc chắn muốn thu hồi quyền Quản trị viên của "${userName}"?
                          Họ sẽ không còn có thể truy cập vào khu vực quản trị nữa.`}
                      </p>
                      
                      <div className={`p-3 rounded-md text-sm ${
                        roleToChange === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        <div className="flex">
                          <FiAlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                          <span>
                            {roleToChange === 'admin' ? (
                              <>
                                <span className="font-medium block mb-1">Thông tin quan trọng về bảo mật</span>
                                <p>Quản trị viên có quyền truy cập vào toàn bộ dữ liệu và chức năng của hệ thống. Chỉ cấp quyền này cho những người đáng tin cậy.</p>
                              </>
                            ) : (
                              <>
                                <span className="font-medium block mb-1">Thông tin về phiên làm việc</span>
                                <p>Việc thu hồi quyền sẽ tự động đăng xuất người dùng này khỏi tất cả phiên đăng nhập hiện tại của họ.</p>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-300
                    ${roleToChange === 'admin' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : ''}
                    ${roleToChange === 'user' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : ''}
                  `}
                  onClick={confirmRoleChange}
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-300"
                  onClick={() => setShowConfirmation(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleManager; 