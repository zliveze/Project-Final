import React, { useState } from 'react';
import { FiChevronRight, FiChevronDown, FiFolder, FiEdit2, FiEye, FiTrash2, FiStar } from 'react-icons/fi';
import Image from 'next/image';
import { Category } from './CategoryTable';
import Pagination from '@/components/admin/common/Pagination';

interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
}

interface CategoryHierarchyProps {
  categories: Category[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CategoryHierarchy({
  categories,
  onView,
  onEdit,
  onDelete
}: CategoryHierarchyProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số lượng danh mục gốc hiển thị mỗi trang

  // Chuyển đổi danh sách phẳng thành cấu trúc cây
  const buildCategoryTree = (categories: Category[]): CategoryTreeItem[] => {
    const categoryMap: Record<string, CategoryTreeItem> = {};
    const roots: CategoryTreeItem[] = [];

    // Đầu tiên, chuyển đổi mỗi danh mục thành node trong cây
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: []
      };
    });

    // Sau đó, xây dựng cây bằng cách liên kết các node
    categories.forEach(category => {
      const node = categoryMap[category.id];
      if (category.parentId && categoryMap[category.parentId]) {
        // Nếu có parentId và parent tồn tại, thêm node vào children của parent
        categoryMap[category.parentId].children.push(node);
      } else {
        // Nếu không có parentId hoặc parent không tồn tại, đây là root node
        roots.push(node);
      }
    });

    // Sắp xếp theo thứ tự hiển thị
    const sortByOrder = (items: CategoryTreeItem[]) => {
      return items.sort((a, b) => a.order - b.order);
    };

    return sortByOrder(roots);
  };

  // Xử lý việc mở rộng/thu gọn danh mục
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Đệ quy hiển thị cây danh mục
  const renderCategoryTree = (categories: CategoryTreeItem[], level = 0) => {
    return categories.map(category => {
      const hasChildren = category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const indentClass = `pl-${level * 6}`;

      return (
        <React.Fragment key={category.id}>
          <tr className="hover:bg-gray-50">
            <td className={`px-6 py-3 whitespace-nowrap ${indentClass}`}>
              <div className="flex items-center">
                {hasChildren ? (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="mr-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                  >
                    {isExpanded ? (
                      <FiChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <FiChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                ) : (
                  <span className="mr-2 w-6"></span>
                )}
                
                <div className="flex items-center">
                  {category.image && category.image.url ? (
                    <div className="flex-shrink-0 h-8 w-8 rounded-md overflow-hidden mr-2">
                      <Image 
                        src={category.image.url} 
                        alt={category.image.alt || category.name}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <FiFolder className="h-6 w-6 text-gray-400 mr-2" />
                  )}
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      {category.name}
                      {category.featured && (
                        <FiStar className="ml-1 h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {category.id} | Cấp độ: {category.level}
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
              {category.description.length > 40 
                ? `${category.description.substring(0, 40)}...` 
                : category.description}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
              {category.productCount || 0}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-500">
              {category.order}
            </td>
            <td className="px-6 py-3 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
              </span>
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex items-center justify-end space-x-2">
                <button 
                  onClick={() => onView(category.id)}
                  className="text-gray-600 hover:text-gray-900"
                  title="Xem chi tiết"
                >
                  <FiEye className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => onEdit(category.id)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Chỉnh sửa"
                >
                  <FiEdit2 className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => onDelete(category.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Xóa"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
          
          {/* Hiển thị các danh mục con nếu đang mở rộng */}
          {isExpanded && hasChildren && renderCategoryTree(category.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  const categoryTree = buildCategoryTree(categories);
  
  // Phân trang cho danh mục gốc (level 1)
  const rootCategories = categoryTree.filter(cat => cat.level === 1);
  const totalPages = Math.ceil(rootCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRootCategories = rootCategories.slice(startIndex, startIndex + itemsPerPage);
  
  // Hàm chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Cấu trúc phân cấp danh mục</h3>
        <p className="mt-1 text-sm text-gray-500">
          Hiển thị cấu trúc phân cấp các danh mục và các danh mục con
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên danh mục
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thứ tự
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRootCategories.length > 0 ? (
              renderCategoryTree(paginatedRootCategories)
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Chưa có danh mục nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {rootCategories.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={rootCategories.length}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
          />
        </div>
      )}
    </div>
  );
} 