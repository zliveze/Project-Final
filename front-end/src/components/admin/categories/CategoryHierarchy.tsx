import React, { useState } from 'react';
import { FiChevronRight, FiChevronDown, FiFolder, FiEdit2, FiEye, FiTrash2, FiStar, FiCheck, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { Pagination, Badge, Button } from '@/components/admin/common';
import { Category } from '@/contexts/CategoryContext';

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
      if (!category._id) return;

      categoryMap[category._id] = {
        ...category,
        children: []
      };
    });

    // Sau đó, xây dựng cây bằng cách liên kết các node
    categories.forEach(category => {
      if (!category._id) return;

      const node = categoryMap[category._id];
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

  // Format description
  const formatDescription = (desc?: string) => {
    if (!desc) return '';
    return desc.length > 40 ? `${desc.substring(0, 40)}...` : desc;
  };

  // Mảng màu sắc cho các cấp độ
  const levelColors = [
    { border: 'border-pink-200', bg: 'bg-pink-50', icon: 'text-pink-500', hover: 'hover:bg-pink-100', text: 'text-pink-800' },
    { border: 'border-blue-200', bg: 'bg-blue-50', icon: 'text-blue-500', hover: 'hover:bg-blue-100', text: 'text-blue-800' },
    { border: 'border-purple-200', bg: 'bg-purple-50', icon: 'text-purple-500', hover: 'hover:bg-purple-100', text: 'text-purple-800' },
    { border: 'border-green-200', bg: 'bg-green-50', icon: 'text-green-500', hover: 'hover:bg-green-100', text: 'text-green-800' },
    { border: 'border-yellow-200', bg: 'bg-yellow-50', icon: 'text-yellow-500', hover: 'hover:bg-yellow-100', text: 'text-yellow-800' },
    { border: 'border-indigo-200', bg: 'bg-indigo-50', icon: 'text-indigo-500', hover: 'hover:bg-indigo-100', text: 'text-indigo-800' },
  ];

  // Đệ quy hiển thị cây danh mục
  const renderCategoryTree = (categories: CategoryTreeItem[], level = 0) => {
    return categories.map(category => {
      if (!category._id) return null;

      const hasChildren = category.children.length > 0;
      const isExpanded = expandedCategories.has(category._id);
      // Tăng khoảng cách giữa các cấp để thể hiện rõ hơn
      const indentPadding = level * 24; // Tăng padding cho mỗi cấp

      // Lấy màu sắc cho cấp hiện tại
      const colorIndex = level % levelColors.length;
      const currentLevelColors = levelColors[colorIndex];

      // Màu nền khác nhau cho các cấp
      const bgColorClass = `${currentLevelColors.hover}`;

      return (
        <React.Fragment key={category._id}>
          <tr className={`${bgColorClass} transition-colors duration-150`}>
            <td className={`px-6 py-3 whitespace-nowrap`} style={{ paddingLeft: `${indentPadding + 24}px` }}>
              <div className="flex items-center relative">
                {/* Đường kẻ kết nối */}
                {level > 0 && (
                  <div className="category-tree-item">
                    <div
                      className={`category-tree-line-horizontal ${levelColors[(level-1) % levelColors.length].border}`}
                      style={{ width: `${20}px`, left: `-${20}px` }}
                    ></div>
                    <div
                      className={`category-tree-line ${levelColors[(level-1) % levelColors.length].border}`}
                      style={{ height: '150%', left: `-${20}px`, top: '-50%' }}
                    ></div>
                  </div>
                )}

                {hasChildren ? (
                  <button
                    onClick={() => toggleCategory(category._id || '')}
                    className={`mr-2 p-1 rounded-full hover:bg-white focus:outline-none flex-shrink-0 z-10 ${currentLevelColors.bg}`}
                  >
                    {isExpanded ? (
                      <FiChevronDown className={`h-5 w-5 ${currentLevelColors.icon}`} />
                    ) : (
                      <FiChevronRight className={`h-5 w-5 ${currentLevelColors.icon}`} />
                    )}
                  </button>
                ) : (
                  <span className="mr-2 w-6 flex-shrink-0"></span>
                )}

                <div className={`flex items-center bg-white p-3 rounded-md border ${currentLevelColors.border} shadow-sm flex-grow hover:shadow transition-all duration-200 ${currentLevelColors.hover}`}>
                  {category.image && category.image.url ? (
                    <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden mr-3">
                      <Image
                        src={category.image.url}
                        alt={category.image.alt || category.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <FiFolder className={`h-8 w-8 ${currentLevelColors.icon} mr-3`} />
                  )}
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      {category.name}
                      {category.featured && (
                        <FiStar className="ml-1 h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <span>ID: {category._id.substring(0, 8)}...</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${currentLevelColors.bg} ${currentLevelColors.text}`}>Cấp {category.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
              {formatDescription(category.description)}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
              {category.childrenCount || 0}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-500">
              {category.order}
            </td>
            <td className="px-6 py-3 whitespace-nowrap">
              <Badge
                variant={category.status === 'active' ? 'success' : 'danger'}
                icon={category.status === 'active' ? <FiCheck className="mr-1 h-3 w-3" /> : <FiX className="mr-1 h-3 w-3" />}
              >
                {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
              </Badge>
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="light"
                  size="xs"
                  icon={<FiEye className="h-4 w-4" />}
                  onClick={() => onView(category._id || '')}
                  title="Xem chi tiết"
                  className="text-gray-600 hover:text-gray-900"
                >
                  {null}
                </Button>
                <Button
                  variant="light"
                  size="xs"
                  icon={<FiEdit2 className="h-4 w-4" />}
                  onClick={() => onEdit(category._id || '')}
                  title="Chỉnh sửa"
                  className="text-blue-600 hover:text-blue-900"
                >
                  {null}
                </Button>
                <Button
                  variant="light"
                  size="xs"
                  icon={<FiTrash2 className="h-4 w-4" />}
                  onClick={() => onDelete(category._id || '')}
                  title="Xóa"
                  className="text-red-600 hover:text-red-900"
                >
                  {null}
                </Button>
              </div>
            </td>
          </tr>

          {/* Hiển thị các danh mục con nếu đang mở rộng với hiệu ứng */}
          {isExpanded && hasChildren && (
            <tr>
              <td colSpan={6} className="p-0 border-0">
                <div className="animate-fadeIn pl-6 relative overflow-hidden">
                  {renderCategoryTree(category.children, level + 1)}
                </div>
              </td>
            </tr>
          )}
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
    <div>
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
        <h3 className="text-lg font-medium text-gray-900">Cấu trúc phân cấp danh mục</h3>
        <p className="mt-1 text-sm text-gray-500">
          Hiển thị cấu trúc phân cấp các danh mục và các danh mục con
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 bg-pink-50 border border-pink-200 mr-1 rounded-sm"></div>
            <span className="text-pink-800">Cấp 1</span>
          </div>
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 mr-1 rounded-sm"></div>
            <span className="text-blue-800">Cấp 2</span>
          </div>
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 bg-purple-50 border border-purple-200 mr-1 rounded-sm"></div>
            <span className="text-purple-800">Cấp 3</span>
          </div>
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 bg-green-50 border border-green-200 mr-1 rounded-sm"></div>
            <span className="text-green-800">Cấp 4</span>
          </div>
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 mr-1 rounded-sm"></div>
            <span className="text-yellow-800">Cấp 5</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-50 border border-indigo-200 mr-1 rounded-sm"></div>
            <span className="text-indigo-800">Cấp 6</span>
          </div>
        </div>
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
                Số danh mục con
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
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}