import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { useCategory, Category as CategoryType } from '@/contexts/CategoryContext';
import { createPortal } from 'react-dom';

interface Category extends CategoryType {
  _id?: string;
  id?: string;
}

interface VoucherCategoriesPopupProps {
  selectedCategories: string[];
  onCategoriesChange: (categoryIds: string[]) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const VoucherCategoriesPopup: React.FC<VoucherCategoriesPopupProps> = ({
  selectedCategories,
  onCategoriesChange,
  onClose,
  position
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedCategories));
  const [mounted, setMounted] = useState(false);

  // Use CategoryContext
  const { categories, loading, error, fetchCategories } = useCategory();

  useEffect(() => {
    setMounted(true);
    // Only fetch if categories array is empty
    if (!categories || categories.length === 0) {
      fetchCategories(1, 100);
    }
    return () => setMounted(false);
  }, []);

  // Memoize transformed categories
  const transformedCategories = useMemo(() => 
    categories.map((category: Category) => ({
      _id: category.id || category._id || '',
      name: category.name,
      image: category.image?.url
    }))
  , [categories]);

  // Memoize filtered categories
  const filteredCategories = useMemo(() => 
    transformedCategories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [transformedCategories, searchTerm]);

  // Memoize toggle handler
  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(categoryId)) {
        newSelected.delete(categoryId);
      } else {
        newSelected.add(categoryId);
      }
      onCategoriesChange(Array.from(newSelected));
      return newSelected;
    });
  }, [onCategoriesChange]);

  // Memoize save handler
  const handleSave = useCallback(() => {
    onCategoriesChange(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onCategoriesChange, onClose]);

  // Memoize search handler
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.getElementById('voucher-categories-popup');
      if (popup && !popup.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const popupContent = (
    <div 
      id="voucher-categories-popup"
      className="fixed bg-white rounded-lg shadow-xl w-[500px] max-h-[600px] flex flex-col"
      style={{
        top: position?.y || '50%',
        left: position?.x || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
        <h3 className="text-base font-medium text-gray-900">Chọn danh mục</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 p-1"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Có lỗi xảy ra khi tải danh sách danh mục
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredCategories.map((category) => (
              <div
                key={category._id}
                onClick={() => toggleCategory(category._id)}
                className={`flex items-center p-2 rounded-md border cursor-pointer transition-all duration-200 ${
                  selectedIds.has(category._id)
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {category.name}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {selectedIds.has(category._id) && (
                    <FiCheck className="h-4 w-4 text-pink-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          Lưu thay đổi
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;

  // Render using portal
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      {popupContent}
    </>,
    document.body
  );
}; 