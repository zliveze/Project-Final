import React, { InputHTMLAttributes, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSearch?: () => void;
  showClearButton?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className = '',
  onSearch,
  showClearButton = true,
  ...props
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center w-full rounded-md border 
        ${isFocused ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-300'} 
        transition-all duration-200
      `}>
        <div className="pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          className="w-full pl-2 pr-10 py-2 border-0 focus:ring-0 focus:outline-none text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          {...props}
        />
        
        {showClearButton && value && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={handleClear}
          >
            <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
} 