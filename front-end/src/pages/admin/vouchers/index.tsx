import { useState, useEffect, useCallback } from 'react'; // Thêm useCallback
import Head from 'next/head';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
// Removed unused imports: FiTag, FiCheckCircle, FiXCircle, FiClock, Toaster
import AdminLayout from '@/components/admin/AdminLayout';
import VoucherTable from '@/components/admin/vouchers/VoucherTable';
import VoucherAddModal from '@/components/admin/vouchers/VoucherAddModal';
import VoucherEditModal from '@/components/admin/vouchers/VoucherEditModal';
import VoucherDetailModal from '@/components/admin/vouchers/VoucherDetailModal';
import VoucherDeleteModal from '@/components/admin/vouchers/VoucherDeleteModal';
import VoucherStatsCards from '@/components/admin/vouchers/VoucherStatsCards';
import { useVoucher } from '@/contexts/VoucherContext'; // VoucherProvider đã được cung cấp bởi AppProviders
import { Voucher } from '@/contexts/VoucherContext';
// VoucherStatistics removed as it's not used
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// ExtendedVoucherStatistics interface removed as it's not used

// Define proper types to replace 'any'
interface VoucherFilters {
  status?: string;
  discountType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

function VouchersPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const {
    vouchers,
    // statistics: voucherStats - removed as it's not used
    isLoading: loading,
    paginatedVouchers: { total: totalItems },
    getVouchers: fetchVouchers,
    getVoucherById: fetchVoucherById,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    getVoucherStatistics: fetchVoucherStats
  } = useVoucher();

  // State cho query params và pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<VoucherFilters>({});

  // State cho modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Làm mới dữ liệu
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchVouchers({ page: currentPage, limit: itemsPerPage, ...filters }),
        fetchVoucherStats()
      ]);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setIsRefreshing(false);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    }
  }, [currentPage, itemsPerPage, filters, fetchVouchers, fetchVoucherStats]);

  // Kiểm tra xác thực
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, currentPage, itemsPerPage, filters, fetchVouchers, fetchVoucherStats, refreshData]); // Expanded dependencies

  // Load vouchers khi thay đổi trang hoặc filters
  useEffect(() => {
    if (isAuthenticated) {
      fetchVouchers({
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      });
    }
  }, [currentPage, itemsPerPage, filters, isAuthenticated, fetchVouchers]);

  // Thêm voucher mới
  const handleAddVoucher = async (voucherData: Partial<Voucher>) => {
    setIsSubmitting(true);
    try {
      await createVoucher(voucherData);
      toast.success('Thêm voucher thành công!');
      setIsAddModalOpen(false);
      refreshData();
    } catch (error: unknown) {
      console.error('Error adding voucher:', error);
      const errorObj = error as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || 'Có lỗi xảy ra khi thêm voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật voucher
  const handleEditVoucher = async (id: string, voucherData: Partial<Voucher>) => {
    setIsSubmitting(true);
    try {
      await updateVoucher(id, voucherData);
      toast.success('Cập nhật voucher thành công!');
      setIsEditModalOpen(false);
      refreshData();
    } catch (error: unknown) {
      console.error('Error updating voucher:', error);
      const errorObj = error as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa voucher
  const handleDeleteVoucher = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteVoucher(id);
      toast.success('Xóa voucher thành công!');
      setIsDeleteModalOpen(false);
      refreshData();
    } catch (error: unknown) {
      console.error('Error deleting voucher:', error);
      const errorObj = error as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || 'Có lỗi xảy ra khi xóa voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xem chi tiết voucher
  const handleViewVoucher = async (id: string) => {
    try {
      const voucher = await fetchVoucherById(id);
      if (voucher) {
        setSelectedVoucher(voucher);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching voucher details:', error);
      toast.error('Không thể tải thông tin voucher');
    }
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = async (id: string) => {
    try {
      const voucher = await fetchVoucherById(id);
      if (voucher) {
        setSelectedVoucher(voucher);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching voucher for edit:', error);
      toast.error('Không thể tải thông tin voucher để chỉnh sửa');
    }
  };

  // Mở modal xóa
  const handleOpenDeleteModal = async (id: string) => {
    try {
      const voucher = await fetchVoucherById(id);
      if (voucher) {
        setSelectedVoucher(voucher);
        setIsDeleteModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching voucher for delete:', error);
      toast.error('Không thể tải thông tin voucher để xóa');
    }
  };

  // Sao chép voucher
  const handleCopyVoucher = async (id: string) => {
    try {
      const voucher = await fetchVoucherById(id);
      if (voucher) {
        setSelectedVoucher(voucher);
        setIsAddModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching voucher for copy:', error);
      toast.error('Không thể tải thông tin voucher để sao chép');
    }
  };

  // Xử lý thay đổi filter (sử dụng useCallback)
  const handleFilterChange = useCallback((newFilters: unknown) => { // Changed VoucherFilters to unknown
    setFilters(newFilters as Record<string, unknown>);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi filter
  }, []); // Không có dependencies bên ngoài, chỉ cần tạo 1 lần

  // Xử lý thay đổi số lượng hiển thị trên mỗi trang (sử dụng useCallback)
  const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi số lượng hiển thị
  }, []); // Không có dependencies bên ngoài, chỉ cần tạo 1 lần

  // usedVouchers variable removed as it's not used

  // Hiển thị loading khi đang kiểm tra xác thực
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
        <span className="ml-2 text-xl font-semibold">Đang tải...</span>
      </div>
    );
  }

  // Return null khi đang chuyển hướng hoặc chưa xác thực
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout title="Quản lý Voucher">
      <Head>
        <title>Quản lý Voucher | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Quản lý Voucher</h1>

            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FiRefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Làm mới
              </button>

              <button
                onClick={() => {
                  setSelectedVoucher(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Thêm voucher
              </button>
            </div>
          </div>

          {/* Thống kê */}
          <div className="mb-6">
            <VoucherStatsCards />
          </div>

          {/* Bảng voucher */}
          <VoucherTable
            voucherData={vouchers}
            totalItems={totalItems}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            isLoading={loading}
            onView={handleViewVoucher}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onCopy={handleCopyVoucher}
            onPageChange={setCurrentPage}
            onFilterChange={handleFilterChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      </div>

      {/* Modals */}
      <VoucherAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddVoucher}
        isSubmitting={isSubmitting}
        initialData={selectedVoucher ? {
          code: `${selectedVoucher.code}_COPY`,
          description: selectedVoucher.description,
          discountType: selectedVoucher.discountType,
          discountValue: selectedVoucher.discountValue,
          minimumOrderValue: selectedVoucher.minimumOrderValue,
          usageLimit: selectedVoucher.usageLimit,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          isActive: true
        } : undefined}
      />

      <VoucherEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditVoucher}
        isSubmitting={isSubmitting}
        voucher={selectedVoucher}
      />

      <VoucherDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        voucher={selectedVoucher}
      />

      <VoucherDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteVoucher}
        isSubmitting={isSubmitting}
        voucher={selectedVoucher}
      />
    </AdminLayout>
  );
}

// Các provider đã được cung cấp bởi AppProviders cho đường dẫn /admin/vouchers
export default function VouchersPage() {
  return <VouchersPageContent />;
}
