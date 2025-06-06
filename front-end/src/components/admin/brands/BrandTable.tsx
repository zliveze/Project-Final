import { FC, useState } from 'react';
import { FiEdit2, FiEye, FiTrash2, FiCheck, FiX, FiStar, FiSearch, FiFilter } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useBrands, Brand } from '@/contexts/BrandContext'; // Import Brand from BrandContext
import Pagination from '@/components/admin/common/Pagination';

// Sử dụng type import từ BrandForm để đảm bảo tính nhất quán
// import { Brand } from './BrandForm'; // Comment out or remove this line

// Hàm format date đơn giản
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface BrandTableProps {
  brands: Brand[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const BrandTable: FC<BrandTableProps> = ({
  brands,
  onView,
  onEdit,
  onDelete,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const { toggleBrandStatus, toggleBrandFeatured } = useBrands();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string | undefined) => {
    if (!id) {
      toast.error("Không thể thay đổi trạng thái: ID thương hiệu không hợp lệ.");
      return;
    }
    setUpdatingId(id);
    try {
      await toggleBrandStatus(id);
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái:', error);
      toast.error('Không thể thay đổi trạng thái thương hiệu');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatured = async (id: string | undefined) => {
    if (!id) {
      toast.error("Không thể thay đổi trạng thái nổi bật: ID thương hiệu không hợp lệ.");
      return;
    }
    setUpdatingId(id);
    try {
      await toggleBrandFeatured(id);
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái nổi bật:', error);
      toast.error('Không thể thay đổi trạng thái nổi bật');
    } finally {
      setUpdatingId(null);
    }
  };

  // Không cần lọc brands nữa vì đã được lọc từ API

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
          <h2 className="text-xl font-medium text-gray-800">Danh sách thương hiệu</h2>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm thương hiệu..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors"
              />
            </div>

            <div className="relative inline-block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="block w-full pl-9 pr-8 py-2 border border-gray-200 rounded-md leading-5 bg-white focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm appearance-none transition-colors"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
                <option value="featured">Nổi bật</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <div className="flex items-center">
            <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium text-gray-600">
              Hiển thị:
            </label>
            <select
              id="itemsPerPage"
              name="itemsPerPage"
              className="rounded-md border border-gray-200 py-1.5 pl-3 pr-8 text-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500 appearance-none transition-colors"
              value={itemsPerPage}
              onChange={onItemsPerPageChange}
            >
              <option value={5}>5 mục</option>
              <option value={10}>10 mục</option>
              <option value={20}>20 mục</option>
              <option value={50}>50 mục</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
              Tên thương hiệu
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Logo
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Xuất xứ
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nổi bật
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày tạo
            </th>
            <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Hành động</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {brands.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            brands.map((brand) => (
              <tr key={brand.id} className={updatingId === brand.id ? 'bg-gray-50' : 'hover:bg-gray-50 transition-colors'} >
                <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {brand.name}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-500">
                  {brand.logo?.url ? (
                    <div className="h-10 w-10 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                      <Image
                        src={brand.logo.url}
                        alt={brand.logo.alt || brand.name}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-400">No logo</span>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-500">{brand.origin || '-'}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-500">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(brand.id)}
                    disabled={updatingId !== null}
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      brand.featured
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    } transition-colors`}
                  >
                    <FiStar
                      className={`mr-1 h-3 w-3 ${brand.featured ? 'text-amber-500' : ''}`}
                    />
                    {brand.featured ? 'Nổi bật' : 'Bình thường'}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-500">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(brand.id)}
                    disabled={updatingId !== null}
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      brand.status === 'active'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    } transition-colors`}
                  >
                    {brand.status === 'active' ? (
                      <>
                        <FiCheck className="mr-1 h-3 w-3" />
                        Hoạt động
                      </>
                    ) : (
                      <>
                        <FiX className="mr-1 h-3 w-3" />
                        Tạm ngưng
                      </>
                    )}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-500">
                  {formatDate(brand.createdAt instanceof Date ? brand.createdAt.toISOString() : brand.createdAt || '')}
                </td>
                <td className="relative whitespace-nowrap py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex justify-end space-x-1">
                    <button
                      type="button"
                      onClick={() => brand.id && onView(brand.id)}
                      disabled={!brand.id}
                      className="text-gray-600 hover:text-pink-600 p-1.5 rounded hover:bg-pink-50 transition-colors disabled:opacity-50"
                      title="Xem chi tiết"
                    >
                      <FiEye className="h-4 w-4" />
                      <span className="sr-only">Xem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => brand.id && onEdit(brand.id)}
                      disabled={!brand.id}
                      className="text-gray-600 hover:text-pink-600 p-1.5 rounded hover:bg-pink-50 transition-colors disabled:opacity-50"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      <span className="sr-only">Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => brand.id && onDelete(brand.id)}
                      disabled={!brand.id}
                      className="text-gray-600 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Xóa"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      <span className="sr-only">Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
        </div>

        {/* Phân trang */}
        <div className="mt-6 px-4 py-4 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
            className="mt-0"
            maxVisiblePages={5}
          />
        </div>
      </div>
    </div>
  );
};

export default BrandTable;
