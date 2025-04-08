import { useState, useEffect } from 'react';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '../../../components/admin/AdminLayout';
import BranchList from '@/components/admin/branches/BranchList';
import { BranchProvider, useBranches } from '@/contexts/BranchContext';
import BranchAddModal from '@/components/admin/branches/BranchAddModal';
import BranchEditModal from '@/components/admin/branches/BranchEditModal';
import BranchViewModal from '@/components/admin/branches/BranchViewModal';
import ConfirmModal from '@/components/common/ConfirmModal';

function BranchesContent() {
  const { 
    branches, 
    loading, 
    error, 
    statistics, 
    pagination,
    fetchBranches,
    fetchBranch,
    deleteBranch
  } = useBranches();

  // State quản lý các modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchBranches(pagination.page, pagination.limit);
  }, []);
  
  // Render thống kê
  const renderStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Tổng số chi nhánh</p>
              <p className="text-2xl font-bold">{statistics.totalBranches || 0}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Xử lý xem chi tiết chi nhánh
  const handleViewBranch = async (id: string) => {
    setSelectedBranchId(id);
    setShowViewModal(true);
  };

  // Xử lý mở modal chỉnh sửa chi nhánh
  const handleOpenEditModal = (id: string) => {
    setSelectedBranchId(id);
    setShowEditModal(true);
    setShowViewModal(false);
  };

  // Xử lý mở modal xóa chi nhánh
  const handleOpenDeleteModal = (id: string) => {
    setSelectedBranchId(id);
    setShowDeleteModal(true);
    setShowViewModal(false);
  };

  // Xác nhận xóa chi nhánh
  const confirmDeleteBranch = async () => {
    if (!selectedBranchId) return;
    
    try {
      const success = await deleteBranch(selectedBranchId);
      if (success) {
        setShowDeleteModal(false);
        // Tải lại danh sách sau khi xóa
        fetchBranches(pagination.page, pagination.limit);
      }
      // Không cần else - nếu có lỗi, deleteBranch đã xử lý hiển thị lỗi
    } catch (error) {
      console.error("Lỗi khi xóa chi nhánh:", error);
      // Không cần làm gì thêm vì lỗi đã được xử lý trong BranchContext
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chi nhánh</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý thông tin các chi nhánh của hệ thống
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Thêm chi nhánh mới
          </button>
        </div>
      </div>

      {/* Thống kê */}
      {renderStats()}

      {/* Hiển thị thông báo lỗi */}
      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bảng danh sách chi nhánh */}
      <BranchList 
        onView={handleViewBranch}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
      />

      {/* Modals */}
      {showAddModal && (
        <BranchAddModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            // Refresh data after adding
            fetchBranches(pagination.page, pagination.limit);
          }}
        />
      )}

      {showEditModal && selectedBranchId && (
        <BranchEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            // Refresh data after editing
            fetchBranches(pagination.page, pagination.limit);
          }}
          branchId={selectedBranchId}
        />
      )}

      {showViewModal && selectedBranchId && (
        <BranchViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          branchId={selectedBranchId}
          onEdit={() => {
            setShowEditModal(true);
            setShowViewModal(false);
          }}
          onDelete={() => {
            setShowDeleteModal(true);
            setShowViewModal(false);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteBranch}
          title="Xác nhận xóa chi nhánh"
          message="Bạn có chắc chắn muốn xóa chi nhánh này? Hành động này không thể hoàn tác."
          confirmText="Xóa chi nhánh"
          cancelText="Hủy"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </div>
  );
}

export default function BranchesPage() {
  return (
    <AdminLayout title="Quản lý Chi nhánh">
      <BranchProvider>
        <BranchesContent />
      </BranchProvider>
    </AdminLayout>
  );
} 