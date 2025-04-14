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
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">
          {status === 'completed' ? 'Hoàn thành' : 'Đang xử lý...'}
        </span>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${barColor} transition-all duration-300 ease-in-out`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default ImportProgressBar;
