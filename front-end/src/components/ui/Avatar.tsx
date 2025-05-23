'use client';

import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 'md', 
  className = '',
  rounded = true 
}) => {
  // Lấy chữ cái đầu từ tên
  const getInitials = (fullName: string) => {
    if (!fullName || fullName.trim() === '') return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  // Tạo màu solid dựa trên tên
  const getSolidColor = (name: string) => {
    const colors = [
      'bg-pink-500',
      'bg-rose-500', 
      'bg-purple-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-amber-500',
      'bg-orange-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-violet-500',
      'bg-fuchsia-500',
      'bg-sky-500'
    ];
    
    // Hash tên để lấy màu consistent
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg'
  };

  const initials = getInitials(name);
  const solidColor = getSolidColor(name);
  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${roundedClass} 
        ${solidColor}
        flex items-center justify-center 
        text-white font-semibold 
        shadow-sm flex-shrink-0
        select-none
        ${className}
      `}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar; 