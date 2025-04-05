import React, { useState, useEffect } from 'react';
import { FiWifi, FiWifiOff, FiLoader } from 'react-icons/fi';

interface ApiStatusAlertProps {
  status: 'online' | 'offline' | 'checking';
  onRetry?: () => void;
  hasLoadedData?: boolean;
}

const ApiStatusAlert: React.FC<ApiStatusAlertProps> = ({ status, onRetry, hasLoadedData = false }) => {
  const [clientStatus, setClientStatus] = useState<'online' | 'offline' | 'checking' | null>(null);
  
  useEffect(() => {
    if (hasLoadedData && status === 'checking') {
      setClientStatus('online');
    } else {
      setClientStatus(status);
    }
  }, [status, hasLoadedData]);
  
  if (clientStatus === null) return null;
  if (clientStatus === 'online') return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 shadow-lg rounded-lg p-4 max-w-sm ${
      clientStatus === 'offline' ? 'bg-red-50 border border-red-300' : 'bg-yellow-50 border border-yellow-300'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {clientStatus === 'offline' ? (
            <FiWifiOff className="h-5 w-5 text-red-500" />
          ) : (
            <FiLoader className="h-5 w-5 text-yellow-500 animate-spin" />
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${
            clientStatus === 'offline' ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {clientStatus === 'offline' ? 'Mất kết nối API' : 'Đang kiểm tra kết nối...'}
          </h3>
          <div className={`mt-2 text-sm ${
            clientStatus === 'offline' ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {clientStatus === 'offline' ? (
              <p>
                Không thể kết nối đến máy chủ API. Vui lòng kiểm tra kết nối mạng của bạn
                hoặc liên hệ quản trị viên hệ thống.
              </p>
            ) : (
              <p>Đang kiểm tra trạng thái kết nối đến máy chủ API...</p>
            )}
          </div>
          {clientStatus === 'offline' && onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiWifi className="mr-2 h-4 w-4" aria-hidden="true" />
                Thử lại kết nối
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiStatusAlert; 