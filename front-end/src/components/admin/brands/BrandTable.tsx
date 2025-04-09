import { FC, useState, useMemo } from 'react';
import { FiEdit2, FiEye, FiTrash2, FiCheck, FiX, FiStar, FiSearch, FiFilter } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useBrands } from '@/contexts/BrandContext';
import Pagination from '@/components/admin/common/Pagination';

// Sử dụng type import từ BrandForm để đảm bảo tính nhất quán
import { Brand } from './BrandForm';

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
  onPageChange
}) => {
  const { toggleBrandStatus, toggleBrandFeatured } = useBrands();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleToggleStatus = async (id: string) => {
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

  const handleToggleFeatured = async (id: string) => {
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

  // Lọc brands theo tìm kiếm và trạng thái
  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (brand.origin && brand.origin.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'active') return matchesSearch && brand.status === 'active';
      if (statusFilter === 'inactive') return matchesSearch && brand.status === 'inactive';
      if (statusFilter === 'featured') return matchesSearch && brand.featured;
      
      return matchesSearch;
    });
  }, [brands, searchTerm, statusFilter]);

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Danh sách thương hiệu</h2>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm thương hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
            </div>
            
            <div className="relative inline-block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
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
            <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium text-gray-700">
              Hiển thị:
            </label>
            <select
              id="itemsPerPage"
              name="itemsPerPage"
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
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
          <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Tên thương hiệu
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Logo
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Xuất xứ
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Nổi bật
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Trạng thái
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Ngày tạo
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Hành động</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredBrands.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            filteredBrands.map((brand) => (
              <tr key={brand.id} className={updatingId === brand.id ? 'bg-gray-50' : ''}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 border-b border-gray-200">
                  {brand.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-b border-gray-200">
                  {brand.logo?.url ? (
                    <Image
                      src={brand.logo.url}
                      alt={brand.logo.alt || brand.name}
                      width={40}
                      height={40}
                      className="object-contain rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No logo</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-b border-gray-200">{brand.origin || '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(brand.id)}
                    disabled={updatingId !== null}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${
                      brand.featured
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <FiStar
                      className={`mr-1 h-4 w-4 ${brand.featured ? 'fill-yellow-500' : ''}`}
                    />
                    {brand.featured ? 'Nổi bật' : 'Bình thường'}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(brand.id)}
                    disabled={updatingId !== null}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${
                      brand.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {brand.status === 'active' ? (
                      <>
                        <FiCheck className="mr-1 h-4 w-4" />
                        Hoạt động
                      </>
                    ) : (
                      <>
                        <FiX className="mr-1 h-4 w-4" />
                        Tạm ngưng
                      </>
                    )}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-b border-gray-200">
                  {formatDate(brand.createdAt)}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 border-b border-gray-200">
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => onView(brand.id)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                      title="Xem chi tiết"
                    >
                      <FiEye className="h-4 w-4" />
                      <span className="sr-only">Xem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(brand.id)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-full hover:bg-blue-100 transition-colors ml-2"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      <span className="sr-only">Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(brand.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-full hover:bg-red-100 transition-colors ml-2"
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
        <div className="mt-6 px-4 py-4 border-t border-gray-200">
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