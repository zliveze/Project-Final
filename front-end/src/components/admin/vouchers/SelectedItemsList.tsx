import React from 'react';
import { FiX, FiTag } from 'react-icons/fi';

interface SelectedItem {
  id: string;
  name: string;
}

interface SelectedItemsListProps {
  items: SelectedItem[];
  onRemove: (id: string) => void;
  emptyText?: string;
  maxDisplayItems?: number;
}

export const SelectedItemsList: React.FC<SelectedItemsListProps> = ({
  items,
  onRemove,
  emptyText = 'Chưa có mục nào được chọn',
  maxDisplayItems = 10
}) => {
  const hasItems = items.length > 0;
  const displayedItems = items.slice(0, maxDisplayItems);
  const remainingCount = items.length - maxDisplayItems;

  return (
    <div className="mt-2">
      {!hasItems ? (
        <p className="text-sm text-gray-500 italic">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {displayedItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center bg-pink-50 text-pink-700 border border-pink-200 rounded-md px-2 py-1 text-sm"
              >
                <FiTag className="mr-1 h-3 w-3" />
                <span className="mr-1">{item.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-pink-400 hover:text-pink-600 focus:outline-none"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="flex items-center bg-gray-100 text-gray-700 rounded-md px-2 py-1 text-sm">
                <span>+{remainingCount} mục khác</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Đã chọn {items.length} mục
          </p>
        </div>
      )}
    </div>
  );
}; 