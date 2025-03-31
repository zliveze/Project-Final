import React, { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
  icon?: ReactNode;
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  rounded = false,
  className = '',
  icon
}: BadgeProps) {
  // Variant styles
  const variantClasses = {
    primary: 'bg-pink-100 text-pink-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    light: 'bg-gray-50 text-gray-600',
    dark: 'bg-gray-700 text-white'
  };

  // Size styles
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5'
  };

  // Rounded styles
  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span className={`
      inline-flex items-center font-medium
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${roundedClass}
      ${className}
    `}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
} 