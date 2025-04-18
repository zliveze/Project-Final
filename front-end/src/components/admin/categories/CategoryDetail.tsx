import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiStar, FiCheck, FiX } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Category } from '@/contexts/CategoryContext';
import { Button, Badge } from '@/components/admin/common';

interface CategoryDetailProps {
  category: Category | null;
  parentCategory?: Category | null;
  childCategories: Category[];
  productCount?: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export default function CategoryDetail({
  category,
  parentCategory,
  childCategories,
  productCount = 0,
  onEdit,
  onDelete,
  onBack
}: CategoryDetailProps) {
  // Nếu category là null, hiển thị thông báo lỗi
  if (!category) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-md">
        <p className="text-yellow-700">Không thể tải thông tin danh mục.</p>
        <button
          onClick={onBack}
          className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return '';

    try {
      // Check if dateString is already in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        return dateString;
      }

      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return String(dateString);
    }
  };

  // Status display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" icon={<FiCheck className="mr-1 h-3 w-3" />}>
            Hoạt động
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="danger" icon={<FiX className="mr-1 h-3 w-3" />}>
            Không hoạt động
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  // Hàm xử lý khi nhấn nút chỉnh sửa
  const handleEdit = () => {
    try {
      if (category._id) {
        onEdit(category._id);
      } else {
        toast.error("Không tìm thấy ID danh mục", {
          duration: 3000,
          position: "top-right"
        });
      }
    } catch (error) {
      console.error("Lỗi khi chuyển sang chỉnh sửa danh mục:", error);
      toast.error("Đã xảy ra lỗi khi chuyển sang chỉnh sửa danh mục", {
        duration: 3000,
        position: "top-right",
        icon: '❌'
      });
    }
  };

  // Hàm xử lý khi nhấn nút xóa
  const handleDelete = () => {
    try {
      if (category._id) {
        onDelete(category._id);
      } else {
        toast.error("Không tìm thấy ID danh mục", {
          duration: 3000,
          position: "top-right"
        });
      }
    } catch (error) {
      console.error("Lỗi khi chuyển sang xóa danh mục:", error);
      toast.error("Đã xảy ra lỗi khi chuyển sang xóa danh mục", {
        duration: 3000,
        position: "top-right",
        icon: '❌'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="secondary"
          size="md"
          icon={<FiEdit2 className="h-5 w-5" />}
          onClick={handleEdit}
        >
          Chỉnh sửa
        </Button>
        <Button
          variant="danger"
          size="md"
          icon={<FiTrash2 className="h-5 w-5" />}
          onClick={handleDelete}
        >
          Xóa
        </Button>
      </div>

      {/* Category info */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            {category.image && category.image.url && (
              <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden mr-4">
                <Image
                  src={category.image.url}
                  alt={category.image.alt || category.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div>
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                {category.featured && (
                  <FiStar className="ml-2 h-5 w-5 text-yellow-500" title="Danh mục nổi bật" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {getStatusBadge(category.status)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h3>
                <div className="mt-3 border-t border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">ID</dt>
                      <dd className="text-sm text-gray-900">{category._id || 'N/A'}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Tên danh mục</dt>
                      <dd className="text-sm text-gray-900">{category.name}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Slug</dt>
                      <dd className="text-sm text-gray-900">{category.slug}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Cấp độ</dt>
                      <dd className="text-sm text-gray-900">{category.level}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Thứ tự hiển thị</dt>
                      <dd className="text-sm text-gray-900">{category.order}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Nổi bật</dt>
                      <dd className="text-sm text-gray-900">{category.featured ? 'Có' : 'Không'}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                      <dd className="text-sm text-gray-900">{getStatusBadge(category.status)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Thông tin thời gian */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Thông tin thời gian</h3>
                <div className="mt-3 border-t border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
                      <dd className="text-sm text-gray-900">{formatDate(category.createdAt)}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Cập nhật lần cuối</dt>
                      <dd className="text-sm text-gray-900">{formatDate(category.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Thông tin khác */}
            <div className="space-y-6">
              {/* Mô tả */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Mô tả</h3>
                <div className="mt-3 border-t border-gray-200 py-3">
                  <p className="text-sm text-gray-700">{category.description || 'Không có mô tả'}</p>
                </div>
              </div>

              {/* Danh mục cha (nếu có) */}
              {category.level > 1 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Danh mục cha</h3>
                  <div className="mt-3 border-t border-gray-200 py-3">
                    {parentCategory ? (
                      <div className="flex items-center">
                        {parentCategory.image && parentCategory.image.url && (
                          <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden mr-3">
                            <Image
                              src={parentCategory.image.url}
                              alt={parentCategory.image.alt || parentCategory.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{parentCategory.name}</p>
                          <p className="text-sm text-gray-500">ID: {parentCategory._id || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Không tìm thấy thông tin danh mục cha</p>
                    )}
                  </div>
                </div>
              )}

              {/* Thống kê sản phẩm */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Thống kê</h3>
                <div className="mt-3 border-t border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Số danh mục con</dt>
                      <dd className="text-sm text-gray-900">{category.childrenCount || 0}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Tổng số sản phẩm</dt>
                      <dd className="text-sm text-gray-900">{productCount}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Child categories if exists */}
      {childCategories.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Danh mục con ({childCategories.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số danh mục con
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
                {childCategories.map((childCategory) => (
                  <tr key={childCategory._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {childCategory.image && childCategory.image.url && (
                          <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                            <Image
                              src={childCategory.image.url}
                              alt={childCategory.image.alt || childCategory.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{childCategory.name}</div>
                          <div className="text-sm text-gray-500">{childCategory.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {childCategory.description && childCategory.description.length > 50
                        ? `${childCategory.description.substring(0, 50)}...`
                        : childCategory.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {childCategory.childrenCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(childCategory.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="light"
                          size="xs"
                          icon={<FiEdit2 className="h-4 w-4" />}
                          onClick={() => onEdit(childCategory._id || '')}
                          title="Chỉnh sửa"
                          className="text-blue-600 hover:text-blue-900"
                        />
                        <Button
                          variant="light"
                          size="xs"
                          icon={<FiTrash2 className="h-4 w-4" />}
                          onClick={() => onDelete(childCategory._id || '')}
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
        </div>
      )}
    </div>
  );
}