import { FC, useState } from 'react';
import { FiEdit2, FiEye, FiTrash2, FiCheck, FiX, FiStar } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useBrands } from '@/contexts/BrandContext';

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
}

const BrandTable: FC<BrandTableProps> = ({
  brands,
  onView,
  onEdit,
  onDelete,
  itemsPerPage,
  onItemsPerPageChange
}) => {
  const { toggleBrandStatus, toggleBrandFeatured } = useBrands();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <div>
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
          {brands.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            brands.map((brand) => (
              <tr key={brand.id} className={updatingId === brand.id ? 'bg-gray-50' : ''}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {brand.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{brand.origin || '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(brand.createdAt)}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => onView(brand.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <FiEye className="h-4 w-4" />
                      <span className="sr-only">Xem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(brand.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      <span className="sr-only">Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(brand.id)}
                      className="text-red-600 hover:text-red-900"
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
  );
};

export default BrandTable; 