import { useState, useEffect } from 'react';
import { FiPlus, FiAlertCircle, FiMapPin, FiPhone, FiCalendar, FiClock } from 'react-icons/fi';
import AdminLayout from '../../../components/admin/AdminLayout';
import BranchList from '@/components/admin/branches/BranchList';
import { BranchProvider, useBranches } from '@/contexts/BranchContext';
import BranchAddModal from '@/components/admin/branches/BranchAddModal';
import BranchEditModal from '@/components/admin/branches/BranchEditModal';
import BranchViewModal from '@/components/admin/branches/BranchViewModal';
import BranchDeleteConfirmModal from '@/components/admin/branches/BranchDeleteConfirmModal';

function BranchesContent() {
  const {
    branches,
    loading,
    error,
    statistics,
    pagination,
    fetchBranches,
    deleteBranch,
    forceDeleteBranch
  } = useBranches();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <FiMapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Tổng số chi nhánh</p>
              <p className="text-3xl font-bold text-gray-800">{statistics.totalBranches || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-5 py-3">
          <p className="text-xs text-blue-600 font-medium">Quản lý tất cả chi nhánh</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mr-4">
              <FiPhone className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Liên hệ & Hỗ trợ</p>
              <p className="text-3xl font-bold text-gray-800">24/7</p>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 px-5 py-3">
          <p className="text-xs text-pink-600 font-medium">Dịch vụ khách hàng luôn sẵn sàng</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <FiClock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Cập nhật gần đây</p>
              <p className="text-lg font-bold text-gray-800">
                {branches[0]?.updatedAt ? new Date(branches[0]?.updatedAt).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 px-5 py-3">
          <p className="text-xs text-green-600 font-medium">Dữ liệu luôn được cập nhật</p>
        </div>
      </div>
    </div>
  );

  const handleViewBranch = (id: string) => {
    setSelectedBranchId(id);
    setShowViewModal(true);
  };

  const handleOpenEditModal = (id: string) => {
    setSelectedBranchId(id);
    setShowEditModal(true);
    setShowViewModal(false);
  };

  const handleOpenDeleteModal = (id: string) => {
    const branch = branches.find(b => b.id === id);
    setSelectedBranchId(id);
    setSelectedBranchName(branch?.name || '');
    setShowDeleteModal(true);
    setShowViewModal(false);
  };

  const confirmDeleteBranch = async () => {
    if (!selectedBranchId) return;

    try {
      const success = await deleteBranch(selectedBranchId);
      if (success) {
        setShowDeleteModal(false);
        setSelectedBranchId(null);
        setSelectedBranchName('');
        fetchBranches(pagination.page, pagination.limit);
      }
    } catch (error) {
      console.error("Lỗi khi xóa chi nhánh:", error);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chi nhánh</h1>
          <p className="mt-1 text-sm text-gray-500">Thêm, sửa, xóa và quản lý tất cả chi nhánh của Yumin</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Thêm chi nhánh mới
          </button>
        </div>
      </div>

      {renderStats()}

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <BranchList
          onView={handleViewBranch}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
        />
      </div>

      {showAddModal && (
        <BranchAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedBranchId && (
        <BranchEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
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

      {showDeleteModal && selectedBranchId && (
        <BranchDeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBranchId(null);
            setSelectedBranchName('');
          }}
          onConfirm={confirmDeleteBranch}
          branchId={selectedBranchId}
          branchName={selectedBranchName}
        />
      )}
    </div>
  );
}

export default function BranchesPage() {
  return (
    <AdminLayout>
      <BranchProvider>
        <BranchesContent />
      </BranchProvider>
    </AdminLayout>
  );
}
