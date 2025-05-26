import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiMapPin, FiMoreHorizontal, FiEdit, FiTrash, FiAlertTriangle } from 'react-icons/fi';
import { format } from 'date-fns';
import { useBranches } from '@/contexts/BranchContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/admin/common/Pagination';
import { toast } from 'react-hot-toast';
import { Menu } from '@headlessui/react';
import ConfirmModal from '@/components/common/ConfirmModal';

// Hàm tiện ích để xử lý classNames
const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

interface BranchListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BranchList: React.FC<BranchListProps> = ({ onView, onEdit, onDelete }) => {
  const {
    branches,
    loading,
    error,
    pagination,
    fetchBranches,
    deleteBranch,
    forceDeleteBranch
  } = useBranches();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
  const [branchIdToForceDelete, setBranchIdToForceDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, sortField, sortOrder]);

  // Lọc chi nhánh theo từ khóa tìm kiếm
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm để hiển thị icon sắp xếp
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;

    return sortOrder === 'asc' ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  // Hàm xử lý sắp xếp
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Xử lý chuyển trang
  const handlePageChange = (page: number) => {
    fetchBranches(page, pagination.limit);
  };

  // Format thời gian
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      return String(date);
    }
  };

  // Xóa chi nhánh
  const handleDelete = async (id: string) => {
    try {
      // Gọi API xóa
      const success = await deleteBranch(id);

      if (success) {
        // Hiển thị thông báo thành công
        toast.success("Chi nhánh đã được xóa thành công");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa chi nhánh");
      console.error("Error deleting branch:", error);
    }
  };

  // Xóa chi nhánh với force option nếu có lỗi
  const handleForceDelete = async (id: string) => {
    try {
      // Gọi API xóa với force option
      const result = await forceDeleteBranch(id);

      if (result && result.success) {
        // Hiển thị thông báo thành công với số sản phẩm được cập nhật
        const message = result.productsUpdated > 0
          ? `Chi nhánh đã được xóa thành công và đã cập nhật ${result.productsUpdated} sản phẩm.`
          : 'Chi nhánh đã được xóa thành công.';

        toast.success(message, {
          duration: 5000,
          position: 'top-right',
        });
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa chi nhánh");
      console.error("Error force deleting branch:", error);
    }
  };

  // Mở modal xác nhận xóa với force delete
  const handleOpenForceDeleteModal = (id: string) => {
    setBranchIdToForceDelete(id);
    setShowForceDeleteModal(true);
  };

  // Xác nhận force delete
  const confirmForceDelete = async () => {
    if (branchIdToForceDelete) {
      await handleForceDelete(branchIdToForceDelete);
      setShowForceDeleteModal(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden"> {/* Re-added rounded-lg */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm chi nhánh..."
              className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" // Re-added rounded-lg
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            {/* Sắp xếp */}
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${ // Re-added rounded-md
                  sortField === 'name' && sortOrder === 'asc' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setSortField('name'); setSortOrder('asc'); }}
              >
                Tên (A-Z)
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${ // Re-added rounded-md
                  sortField === 'name' && sortOrder === 'desc' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setSortField('name'); setSortOrder('desc'); }}
              >
                Tên (Z-A)
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${ // Re-added rounded-md
                  sortField === 'createdAt' && sortOrder === 'desc' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setSortField('createdAt'); setSortOrder('desc'); }}
              >
                Mới nhất
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
         </div>
       ) : (
         <div> {/* Removed overflow-x-auto */}
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                  Tên chi nhánh {getSortIcon('name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Ngày tạo {getSortIcon('createdAt')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" size={14} />
                        {branch.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {branch.contact}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.createdAt && formatDate(branch.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <div className="relative group">
                          <button
                            onClick={() => onView(branch.id)}
                            className="p-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md transition-all relative z-40" // Re-added rounded
                          >
                            <FiEye className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center"> {/* Re-added rounded */}
                            Xem chi tiết
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => onEdit(branch.id)}
                            className="p-2 rounded bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-md transition-all relative z-40" // Re-added rounded
                          >
                            <FiEdit className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center"> {/* Re-added rounded */}
                            Chỉnh sửa
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => onDelete(branch.id)}
                            className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md transition-all relative z-40" // Re-added rounded
                          >
                            <FiTrash className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-16 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center"> {/* Re-added rounded */}
                            Xóa
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => handleOpenForceDeleteModal(branch.id)}
                            className="p-2 rounded bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md transition-all relative z-40" // Re-added rounded
                          >
                            <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center"> {/* Re-added rounded */}
                            Xóa và cập nhật sản phẩm
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có chi nhánh nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang với component Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          showItemsInfo={true}
          className="mt-4"
        />
      </div>

      {/* Thêm modal xác nhận force delete */}
      {showForceDeleteModal && (
        <ConfirmModal
          isOpen={showForceDeleteModal}
          onClose={() => setShowForceDeleteModal(false)}
          onConfirm={confirmForceDelete}
          title="Xác nhận xóa chi nhánh và cập nhật sản phẩm"
          message="Điều này sẽ xóa chi nhánh và tự động cập nhật tất cả sản phẩm liên quan. Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?"
          confirmText="Xóa và cập nhật sản phẩm"
          cancelText="Hủy"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </div>
  );
};

export default BranchList;
