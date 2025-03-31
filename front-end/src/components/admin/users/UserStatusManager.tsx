import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface UserStatusManagerProps {
  userId: string;
  currentStatus: 'active' | 'inactive' | 'blocked';
  onStatusChange: (userId: string, newStatus: string) => void;
}

const UserStatusManager: React.FC<UserStatusManagerProps> = ({
  userId,
  currentStatus,
  onStatusChange
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [statusToChange, setStatusToChange] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusAnimation, setStatusAnimation] = useState(false);

  // Khi status cần thay đổi, animate trạng thái hiện tại
  useEffect(() => {
    if (statusToChange) {
      setStatusAnimation(true);
    } else {
      setStatusAnimation(false);
    }
  }, [statusToChange]);

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

  const handleStatusChange = (newStatus: string) => {
    setStatusToChange(newStatus);
    setShowConfirmation(true);
  };

  const confirmStatusChange = () => {
    if (statusToChange) {
      // Hiển thị loading toast
      const loadingToast = toast.loading('Đang cập nhật trạng thái...');
      
      // Mô phỏng API call
      setTimeout(() => {
        onStatusChange(userId, statusToChange);
        toast.dismiss(loadingToast);
        
        // Hiển thị thông báo thành công
        let message = '';
        switch (statusToChange) {
          case 'active':
            message = 'Đã kích hoạt tài khoản người dùng!';
            break;
          case 'inactive':
            message = 'Đã vô hiệu hóa tài khoản người dùng!';
            break;
          case 'blocked':
            message = 'Đã khóa tài khoản người dùng!';
            break;
        }
        toast.success(message);
        
        setShowConfirmation(false);
        setStatusToChange(null);
      }, 600);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'blocked':
        return 'Đã khóa';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 hover:bg-green-600 focus:ring-green-500';
      case 'inactive':
        return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500';
      case 'blocked':
        return 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FiCheck className="mr-1.5" />;
      case 'inactive':
        return <FiX className="mr-1.5" />;
      case 'blocked':
        return <FiAlertTriangle className="mr-1.5" />;
      default:
        return <FiShield className="mr-1.5" />;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiShield className="mr-2 text-pink-500" />
          Quản lý trạng thái người dùng
        </h2>
        <p className="text-sm text-gray-500 mt-1">Thay đổi trạng thái hoạt động của tài khoản người dùng</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="mb-4 sm:mb-0">
            <div className="text-sm text-gray-500 mb-2">Trạng thái hiện tại</div>
            <div className={`
              flex items-center px-4 py-2 rounded-full border ${getStatusColor(currentStatus)}
              ${statusAnimation ? 'animate-pulse' : ''}
              transition-all duration-300
            `}>
              {getStatusIcon(currentStatus)}
              <span className="font-medium">
                {getStatusText(currentStatus)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentStatus !== 'active' && (
              <button
                onClick={() => handleStatusChange('active')}
                className={`px-4 py-2.5 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 flex items-center font-medium shadow-sm ${getStatusBgColor('active')}`}
              >
                <FiCheck className="mr-1.5" />
                Kích hoạt tài khoản
              </button>
            )}
            
            {currentStatus !== 'inactive' && (
              <button
                onClick={() => handleStatusChange('inactive')}
                className={`px-4 py-2.5 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 flex items-center font-medium shadow-sm ${getStatusBgColor('inactive')}`}
              >
                <FiX className="mr-1.5" />
                Vô hiệu hóa tài khoản
              </button>
            )}
            
            {currentStatus !== 'blocked' && (
              <button
                onClick={() => handleStatusChange('blocked')}
                className={`px-4 py-2.5 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 flex items-center font-medium shadow-sm ${getStatusBgColor('blocked')}`}
              >
                <FiAlertTriangle className="mr-1.5" />
                Khóa tài khoản
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal xác nhận thay đổi trạng thái */}
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
              <div className={`bg-${statusToChange === 'active' ? 'green' : statusToChange === 'inactive' ? 'yellow' : 'red'}-50 px-4 py-3 sm:px-6 border-b ${
                statusToChange === 'active' ? 'border-green-100' : 
                statusToChange === 'inactive' ? 'border-yellow-100' : 'border-red-100'
              }`}>
                <div className="flex items-center">
                  <div className={`mr-3 flex-shrink-0 h-10 w-10 rounded-full ${
                    statusToChange === 'active' ? 'bg-green-100 text-green-600' : 
                    statusToChange === 'inactive' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                  } flex items-center justify-center`}>
                    {statusToChange === 'active' ? (
                      <FiCheck className="h-5 w-5" />
                    ) : statusToChange === 'inactive' ? (
                      <FiX className="h-5 w-5" />
                    ) : (
                      <FiAlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className={`text-lg leading-6 font-medium ${
                    statusToChange === 'active' ? 'text-green-800' : 
                    statusToChange === 'inactive' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    Xác nhận thay đổi trạng thái
                  </h3>
                </div>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-4">
                        {statusToChange === 'active' && 'Bạn có chắc chắn muốn kích hoạt tài khoản người dùng này? Người dùng sẽ có thể đăng nhập và sử dụng đầy đủ tính năng của hệ thống.'}
                        {statusToChange === 'inactive' && 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản người dùng này? Người dùng sẽ không thể đăng nhập cho đến khi tài khoản được kích hoạt.'}
                        {statusToChange === 'blocked' && 'Bạn có chắc chắn muốn khóa tài khoản người dùng này? Người dùng sẽ không thể đăng nhập và tất cả phiên hiện tại sẽ bị chấm dứt.'}
                      </p>
                      
                      <div className={`p-3 rounded-md text-sm ${
                        statusToChange === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 
                        statusToChange === 'inactive' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        <div className="flex">
                          <FiAlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>
                            {statusToChange === 'active' && 'Thao tác này sẽ kích hoạt lại tài khoản đã bị vô hiệu hóa hoặc khóa.'}
                            {statusToChange === 'inactive' && 'Thao tác này sẽ tạm thời vô hiệu hóa tài khoản. Bạn có thể kích hoạt lại sau.'}
                            {statusToChange === 'blocked' && 'Thao tác này sẽ khóa vĩnh viễn tài khoản. Chỉ quản trị viên mới có thể mở khóa.'}
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
                    ${statusToChange === 'active' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}
                    ${statusToChange === 'inactive' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' : ''}
                    ${statusToChange === 'blocked' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
                  `}
                  onClick={confirmStatusChange}
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

export default UserStatusManager; 