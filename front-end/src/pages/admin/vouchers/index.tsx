import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiPlus, FiTag, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import VoucherTable from '@/components/admin/vouchers/VoucherTable';
import VoucherAddModal from '@/components/admin/vouchers/VoucherAddModal';
import VoucherEditModal from '@/components/admin/vouchers/VoucherEditModal';
import VoucherDetailModal from '@/components/admin/vouchers/VoucherDetailModal';
import VoucherDeleteModal from '@/components/admin/vouchers/VoucherDeleteModal';
import { Voucher } from '@/components/admin/vouchers/VoucherForm';

export default function AdminVouchers() {
  // State quản lý modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // State quản lý dữ liệu voucher đang được thao tác
  const [selectedVoucher, setSelectedVoucher] = useState<Partial<Voucher>>({});
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string>('');
  
  // State quản lý thống kê
  const [voucherStats, setVoucherStats] = useState({
    total: 6,
    active: 4,
    expired: 1,
    scheduled: 1
  });
  
  // State quản lý loading
  const [isLoading, setIsLoading] = useState(false);

  // Giả lập việc tải dữ liệu ban đầu
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Xử lý refresh dữ liệu
  const handleRefreshData = () => {
    setIsLoading(true);
    // Giả lập API call
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  // Xử lý thêm voucher mới
  const handleAddVoucher = () => {
    setIsAddModalOpen(true);
  };

  const handleAddVoucherSubmit = (data: Partial<Voucher>) => {
    console.log('Thêm voucher mới:', data);
    setIsAddModalOpen(false);
    handleRefreshData();
    // Thêm logic xử lý API call ở đây
  };

  // Xử lý xem chi tiết voucher
  const handleViewVoucher = (id: string) => {
    // Tìm voucher trong dữ liệu
    console.log('Xem chi tiết voucher có ID:', id);
    
    // Demo data
    setSelectedVoucher({
      _id: id,
      code: 'SUMMER2023',
      description: 'Giảm giá mùa hè 2023 cho tất cả sản phẩm',
      discountType: 'percentage',
      discountValue: 15,
      minimumOrderValue: 500000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-31'),
      usageLimit: 200,
      usedCount: 45,
      isActive: true,
    });
    
    setIsDetailModalOpen(true);
  };

  // Xử lý chỉnh sửa voucher
  const handleEditVoucher = (id: string) => {
    console.log('Chỉnh sửa voucher có ID:', id);
    
    // Demo data
    setSelectedVoucher({
      _id: id,
      code: 'SUMMER2023',
      description: 'Giảm giá mùa hè 2023 cho tất cả sản phẩm',
      discountType: 'percentage',
      discountValue: 15,
      minimumOrderValue: 500000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-31'),
      usageLimit: 200,
      usedCount: 45,
      isActive: true,
    });
    
    setIsEditModalOpen(true);
  };

  const handleEditVoucherSubmit = (data: Partial<Voucher>) => {
    console.log('Cập nhật voucher:', data);
    setIsEditModalOpen(false);
    handleRefreshData();
    // Thêm logic xử lý API call ở đây
  };

  // Xử lý xóa voucher
  const handleDeleteVoucher = (id: string) => {
    setSelectedVoucherId(id);
    // Tìm vouncher code từ id
    setSelectedVoucherCode('SUMMER2023'); // Demo code
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVoucher = () => {
    console.log(`Đã xóa voucher có ID: ${selectedVoucherId}`);
    setIsDeleteModalOpen(false);
    setSelectedVoucherId(null);
    handleRefreshData();
    // Thêm logic xử lý API call ở đây
  };

  // Xử lý sao chép voucher
  const handleCopyVoucher = (id: string) => {
    console.log('Sao chép voucher có ID:', id);
    
    // Demo data - lấy dữ liệu hiện tại của voucher
    const voucherToCopy: Partial<Voucher> = {
      code: 'SUMMER2023_COPY',
      description: 'Giảm giá mùa hè 2023 cho tất cả sản phẩm (bản sao)',
      discountType: 'percentage',
      discountValue: 15,
      minimumOrderValue: 500000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      usageLimit: 200,
      isActive: true,
    };
    
    setSelectedVoucher(voucherToCopy);
    setIsAddModalOpen(true);
  };

  return (
    <AdminLayout title="Quản lý voucher">
      <Head>
        <title>Quản lý voucher | Yumin Admin</title>
      </Head>
      
      <Toaster />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center space-x-3">
        <button
          onClick={handleAddVoucher}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm voucher mới
        </button>
          <button
            onClick={handleRefreshData}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Làm mới dữ liệu"
            disabled={isLoading}
          >
            <FiRefreshCw className={`h-5 w-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thống kê voucher */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTag className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số voucher
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        voucherStats.total
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? (
                        <div className="h-6 w-10 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        voucherStats.active
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiXCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đã hết hạn
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? (
                        <div className="h-6 w-10 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        voucherStats.expired
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiClock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Lên lịch
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? (
                        <div className="h-6 w-10 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        voucherStats.scheduled
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <VoucherTable
          onView={handleViewVoucher}
          onEdit={handleEditVoucher}
          onDelete={handleDeleteVoucher}
          onCopy={handleCopyVoucher}
        />
      </div>

      {/* Modal thêm voucher */}
      <VoucherAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddVoucherSubmit}
      />

      {/* Modal chỉnh sửa voucher */}
      <VoucherEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditVoucherSubmit}
        voucherData={selectedVoucher}
      />

      {/* Modal chi tiết voucher */}
      <VoucherDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        voucherData={selectedVoucher}
      />

      {/* Modal xác nhận xóa voucher */}
      <VoucherDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteVoucher}
        voucherCode={selectedVoucherCode}
      />
    </AdminLayout>
  );
} 