import React from 'react';

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-gray-100">
      {/* Đã loại bỏ tất cả animation, thay thế bằng background màu xám đơn giản */}
    </div>
  );
};

export default BackgroundAnimation;