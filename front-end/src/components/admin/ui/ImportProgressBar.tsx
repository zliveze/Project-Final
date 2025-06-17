import React from 'react';

interface ImportProgressBarProps {
  progress: number;
  status: string;
  message?: string;
}

const statusColors = {
  reading: 'bg-blue-500',
  parsing: 'bg-indigo-500',
  processing: 'bg-pink-500',
  finalizing: 'bg-purple-500',
  completed: 'bg-green-500',
  error: 'bg-red-500'
};



const ImportProgressBar: React.FC<ImportProgressBarProps> = ({ progress, status, message }) => {
  // Xác định màu dựa trên trạng thái
  const barColor = statusColors[status as keyof typeof statusColors] || 'bg-pink-500';

  // Đảm bảo progress không vượt quá 100%
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">
          {status === 'completed' ? 'Hoàn thành' : 'Đang xử lý...'}
        </span>
        <span className="text-sm font-medium text-gray-700">{Math.round(clampedProgress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${barColor} transition-all duration-500 ease-out transform`}
          style={{
            width: `${clampedProgress}%`,
            willChange: 'width' // Tối ưu hóa cho animation
          }}
        ></div>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600 transition-opacity duration-300">{message}</p>
      )}
    </div>
  );
};

export default ImportProgressBar;
