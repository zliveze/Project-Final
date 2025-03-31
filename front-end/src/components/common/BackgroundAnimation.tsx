import React from 'react';
import { motion } from 'framer-motion';

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Hiệu ứng tròn ở góc trên bên phải */}
      <motion.div 
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-pink-300 opacity-15"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
      
      {/* Hiệu ứng tròn ở góc trên bên trái */}
      <motion.div 
        className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-purple-300 opacity-15"
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, 30, 0],
          y: [0, 40, 0],
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      {/* Hiệu ứng tròn ở giữa trang */}
      <motion.div 
        className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-pink-200 opacity-10"
        animate={{ 
          scale: [1, 1.4, 1],
          x: [0, -30, 0],
        }}
        transition={{ 
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      {/* Hiệu ứng tròn ở góc dưới bên phải */}
      <motion.div 
        className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-pink-400 opacity-15"
        animate={{ 
          y: [0, -40, 0],
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      {/* Hiệu ứng tròn nhỏ di chuyển ngẫu nhiên */}
      <motion.div 
        className="absolute bottom-1/3 left-1/4 w-32 h-32 rounded-full bg-purple-400 opacity-15"
        animate={{ 
          x: [0, 100, 50, 200, 0],
          y: [0, -50, 100, 50, 0],
          scale: [1, 1.2, 0.8, 1.1, 1],
        }}
        transition={{ 
          duration: 30,
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
      
      {/* Hiệu ứng tròn nhỏ khác */}
      <motion.div 
        className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-fuchsia-200 opacity-20"
        animate={{ 
          x: [0, -120, -60, -180, 0],
          y: [0, 80, 30, -50, 0],
          scale: [1, 0.8, 1.2, 0.9, 1],
        }}
        transition={{ 
          duration: 35,
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
      
      {/* Thêm hiệu ứng tròn mới màu hồng nhạt */}
      <motion.div 
        className="absolute top-2/3 right-1/4 w-40 h-40 rounded-full bg-pink-100 opacity-20"
        animate={{ 
          x: [0, 60, 120, 30, 0],
          y: [0, 40, -80, -20, 0],
          scale: [1, 1.1, 0.9, 1.2, 1],
        }}
        transition={{ 
          duration: 28,
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
    </div>
  );
};

export default BackgroundAnimation; 