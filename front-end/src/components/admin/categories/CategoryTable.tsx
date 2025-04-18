import { useState, useEffect, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiStar, FiChevronUp, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { Pagination, Badge, Button } from '@/components/admin/common';
import { Category } from '@/contexts/CategoryContext';

// Định nghĩa interface cho props
interface CategoryTableProps {
  categories: Category[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onToggleFeatured?: (id: string) => void;
  onChangeOrder?: (id: string, order: number) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  selectedStatus?: string;
  selectedLevel?: number | 'all';
  selectedFeatured?: boolean | 'all';
}

export default function CategoryTable({
  categories,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onChangeOrder,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  searchTerm: externalSearchTerm,
  selectedStatus: externalSelectedStatus,
  selectedLevel: externalSelectedLevel,
  selectedFeatured: externalSelectedFeatured
}: CategoryTableProps) {
  // Sử dụng state nội bộ nếu không có prop từ bên ngoài
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedFeatured, setSelectedFeatured] = useState<boolean | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Category; direction: 'ascending' | 'descending' } | null>(null);
  const [itemsPerPage] = useState(10);

  // Sử dụng giá trị từ props nếu có
  const effectiveSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : searchTerm;
  const effectiveSelectedStatus = externalSelectedStatus !== undefined ? externalSelectedStatus : selectedStatus;
  const effectiveSelectedLevel = externalSelectedLevel !== undefined ? externalSelectedLevel : selectedLevel;
  const effectiveSelectedFeatured = externalSelectedFeatured !== undefined ? externalSelectedFeatured : selectedFeatured;

  // Hàm sắp xếp
  const sortedCategories = [...categories];
  if (sortConfig && sortConfig.key) {
    sortedCategories.sort((a, b) => {
      const aValue = String(a[sortConfig.key as keyof Category] || '');
      const bValue = String(b[sortConfig.key as keyof Category] || '');

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  // Xử lý sắp xếp khi click vào tiêu đề cột
  const requestSort = (key: keyof Category) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Hàm lọc danh mục
  const filteredCategories = useMemo(() => {
    return sortedCategories.filter(category => {
      const matchesSearch = !effectiveSearchTerm ||
        category.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(effectiveSearchTerm.toLowerCase()));

      const matchesStatus = effectiveSelectedStatus === 'all' || category.status === effectiveSelectedStatus;

      const matchesLevel = effectiveSelectedLevel === 'all' || category.level === effectiveSelectedLevel;

      const matchesFeatured = effectiveSelectedFeatured === 'all' || category.featured === effectiveSelectedFeatured;

      return matchesSearch && matchesStatus && matchesLevel && matchesFeatured;
    });
  }, [sortedCategories, effectiveSearchTerm, effectiveSelectedStatus, effectiveSelectedLevel, effectiveSelectedFeatured]);

  // Hàm để hiển thị variant badge dựa trên trạng thái danh mục
  const getStatusVariant = (status: string): 'success' | 'danger' | 'secondary' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Hàm để hiển thị tên trạng thái danh mục
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  // Hàm để hiển thị icon trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FiCheck className="mr-1 h-3 w-3" />;
      case 'inactive':
        return <FiX className="mr-1 h-3 w-3" />;
      default:
        return null;
    }
  };

  // Hàm để lấy tên danh mục cha
  const getParentCategoryName = (parentId: string | null | undefined) => {
    if (!parentId) return 'Không có';
    const parent = categories.find(cat => cat._id === parentId);
    return parent ? parent.name : 'Không tìm thấy';
  };

  // Hiển thị icon sắp xếp
  const getSortIcon = (key: keyof Category) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FiChevronUp className="inline-block ml-1" /> : <FiChevronDown className="inline-block ml-1" />;
  };

  // Format date nếu cần
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '';

    try {
      if (typeof dateString === 'string' && dateString.includes('/')) {
        return dateString;
      }

      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      return dateString.toString();
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      {/* Bộ lọc đã được chuyển lên trang chính */}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                Danh mục {getSortIcon('name')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('level')}
              >
                Cấp độ {getSortIcon('level')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục cha
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('order')}
              >
                Thứ tự {getSortIcon('order')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Con
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('status')}
              >
                Trạng thái {getSortIcon('status')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('featured')}
              >
                Nổi bật {getSortIcon('featured')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('createdAt')}
              >
                Ngày tạo {getSortIcon('createdAt')}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <tr key={category._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                      {category.image && category.image.url ? (
                        <Image
                          src={category.image.url}
                          alt={category.image.alt || category.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 flex items-center justify-center rounded-md">
                          <span className="text-gray-500 text-xs">{category.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.description && category.description.length > 50
                    ? `${category.description.substring(0, 50)}...`
                    : category.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.level}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getParentCategoryName(category.parentId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-2">{category.order}</span>
                    {onChangeOrder && (
                      <div className="flex flex-col">
                        <button
                          onClick={() => onChangeOrder(category._id || '', category.order - 1)}
                          disabled={category.order <= 0}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Tăng thứ tự"
                        >
                          <FiChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onChangeOrder(category._id || '', category.order + 1)}
                          className="text-gray-400 hover:text-gray-700"
                          title="Giảm thứ tự"
                        >
                          <FiChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.childrenCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus && onToggleStatus(category._id || '')}
                    className={`${onToggleStatus ? 'cursor-pointer' : ''}`}
                    title={onToggleStatus ? 'Nhấp để thay đổi trạng thái' : ''}
                  >
                    <Badge
                      variant={getStatusVariant(category.status)}
                      icon={getStatusIcon(category.status)}
                    >
                      {getStatusText(category.status)}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onToggleFeatured && onToggleFeatured(category._id || '')}
                    className={`${onToggleFeatured ? 'cursor-pointer' : ''}`}
                    title={onToggleFeatured ? 'Nhấp để thay đổi trạng thái nổi bật' : ''}
                  >
                    {category.featured ? (
                      <FiStar className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(category.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="light"
                      size="xs"
                      icon={<FiEye className="h-4 w-4" />}
                      onClick={() => onView(category._id || '')}
                      title="Xem chi tiết"
                      className="text-gray-600 hover:text-gray-900"
                    />
                    <Button
                      variant="light"
                      size="xs"
                      icon={<FiEdit2 className="h-4 w-4" />}
                      onClick={() => onEdit(category._id || '')}
                      title="Chỉnh sửa"
                      className="text-blue-600 hover:text-blue-900"
                    />
                    <Button
                      variant="light"
                      size="xs"
                      icon={<FiTrash2 className="h-4 w-4" />}
                      onClick={() => onDelete(category._id || '')}
                      title="Xóa"
                      className="text-red-600 hover:text-red-900"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCategories.length === 0 && (
        <div className="px-6 py-4 text-center text-gray-500">
          Không tìm thấy danh mục nào
        </div>
      )}

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        {onPageChange ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={categories.length}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
            className="w-full"
          />
        ) : (
          <Pagination
            currentPage={1}
            totalPages={Math.ceil(filteredCategories.length / itemsPerPage)}
            onPageChange={() => {}}
            totalItems={filteredCategories.length}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}