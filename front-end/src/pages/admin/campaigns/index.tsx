import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiPlus, FiCalendar, FiCheckCircle, FiClock, FiFileText, FiPause, FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import CampaignTable from '@/components/admin/campaigns/CampaignTable';
import CampaignAddModal from '@/components/admin/campaigns/CampaignAddModal';
import CampaignEditModal from '@/components/admin/campaigns/CampaignEditModal';
import CampaignViewModal from '@/components/admin/campaigns/CampaignViewModal';
import toast from 'react-hot-toast';
import { Campaign } from '@/contexts/CampaignContext'; // Import Campaign type from context
import { useCampaign } from '@/contexts/CampaignContext'; // Import the hook

export default function AdminCampaigns() {
  const router = useRouter();
  const {
    campaigns,
    selectedCampaign,
    stats,
    isLoading,
    error,
    currentPage,
    totalItems,
    itemsPerPage,
    totalPages,
    fetchCampaigns,
    fetchCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    resetState,
    setCurrentPage,
    setItemsPerPage
  } = useCampaign();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignToView, setCampaignToView] = useState<Campaign | null>(null);
  const [campaignToEdit, setCampaignToEdit] = useState<Partial<Campaign> | null>(null);
  
  // State cho modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    startDateFrom: null as Date | null,
    startDateTo: null as Date | null,
    endDateFrom: null as Date | null,
    endDateTo: null as Date | null,
  });

  // Fetch campaigns on mount and when filters/pagination change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchCampaigns(
      currentPage,
      itemsPerPage,
      filters.search || undefined,
      filters.type || undefined,
      filters.startDateFrom || undefined,
      filters.startDateTo || undefined,
      filters.endDateFrom || undefined,
      filters.endDateTo || undefined
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, filters]);

  // Reset state on unmount
  useEffect(() => {
    return () => {
      resetState();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers for table actions
  const handleViewCampaign = useCallback(async (id: string) => {
    const campaign = await fetchCampaignById(id);
    if (campaign) {
      setCampaignToView(campaign);
      setShowViewModal(true);
    }
  }, [fetchCampaignById]);

  const handleEditCampaign = useCallback(async (id: string) => {
    const campaign = await fetchCampaignById(id);
    if (campaign) {
      setCampaignToEdit(campaign);
      setShowEditModal(true);
    }
  }, [fetchCampaignById]);

  const handleDeleteCampaign = useCallback((campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteModal(true);
  }, []);

  // Toggle status is not directly supported by backend filter, 
  // but we might implement pause/resume via update later if needed.
  const handleToggleStatus = useCallback((id: string, currentStatus: string) => {
    // Placeholder: Implement update logic if needed
    console.log(`Toggle status requested for ${id}. Current: ${currentStatus}`);
    toast.error('Chức năng tạm dừng/kích hoạt chưa được hỗ trợ.');
  }, []);

  // Confirm delete
  const confirmDeleteCampaign = useCallback(async () => {
    if (!campaignToDelete) return;
    const success = await deleteCampaign(campaignToDelete._id);
    if (success) {
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      // Optional: Refetch campaigns if not automatically updated by context
      // fetchCampaigns(currentPage, itemsPerPage, filters.search || undefined, filters.type || undefined);
    }
  }, [campaignToDelete, deleteCampaign]);

  const cancelDeleteCampaign = useCallback(() => {
    setShowDeleteModal(false);
    setCampaignToDelete(null);
  }, []);

  // Add modal
  const handleAddCampaign = useCallback(() => {
    setCampaignToEdit(null); // Ensure no initial data for add modal
    setShowAddModal(true);
  }, []);

  // Save new campaign (called from AddModal)
  const handleSaveNewCampaign = useCallback(async (campaignData: Partial<Campaign>) => {
    const newCampaign = await createCampaign(campaignData);
    if (newCampaign) {
      setShowAddModal(false);
      // Optional: Refetch or rely on context update
    }
    // Error handling is done within the context
  }, [createCampaign]);

  // Update campaign (called from EditModal)
  const handleUpdateCampaign = useCallback(async (campaignData: Partial<Campaign>) => {
    if (!campaignToEdit?._id) return;
    const updated = await updateCampaign(campaignToEdit._id, campaignData);
    if (updated) {
      setShowEditModal(false);
      setCampaignToEdit(null);
      // Optional: Refetch or rely on context update
    }
    // Error handling is done within the context
  }, [campaignToEdit, updateCampaign]);

  // Handlers for pagination and filters from Table
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page
  }, [setItemsPerPage, setCurrentPage]);

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setCurrentPage(1); // Reset to first page
  }, [setCurrentPage]);

  const handleFilterChange = useCallback((filterType: string, value: string | Date | null) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page
  }, [setCurrentPage]);

  return (
    <AdminLayout title="Quản lý Chiến dịch">
      <Head>
        <title>Quản lý Chiến dịch - Admin</title>
      </Head>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Danh sách Chiến dịch</h1>
        <button
          onClick={handleAddCampaign}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm chiến dịch mới
        </button>
      </div>

      {/* Statistics Section */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCalendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số
                  </dt>
                  <dd>
                    {/* Add check for stats */}
                    <div className="text-lg font-medium text-gray-900">{stats ? stats.total : 0}</div>
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
                    Đang diễn ra
                  </dt>
                  <dd>
                    {/* Add check for stats */}
                    <div className="text-lg font-medium text-gray-900">{stats ? stats.active : 0}</div>
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
                    {/* Add check for stats */}
                    <div className="text-lg font-medium text-gray-900">{stats ? stats.scheduled : 0}</div>
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
                <FiFileText className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Bản nháp
                  </dt>
                  <dd>
                    {/* Add check for stats */}
                    <div className="text-lg font-medium text-gray-900">{stats ? stats.drafts : 0}</div>
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
                <FiPause className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đã kết thúc
                  </dt>
                  <dd>
                    {/* Add check for stats */}
                    <div className="text-lg font-medium text-gray-900">{stats ? stats.ended : 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="mt-8">
        <CampaignTable
          campaigns={campaigns}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onView={handleViewCampaign}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
          onToggleStatus={handleToggleStatus} // Keep prop, but functionality limited
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange} // Pass filter handler
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && campaignToDelete && (
        <div className="fixed z-[1001] inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xóa chiến dịch: {campaignToDelete.title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa chiến dịch này? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={confirmDeleteCampaign}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDeleteCampaign}
                  disabled={isLoading}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit/View Modals */}
      <CampaignAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSaveNewCampaign}
      />

      {campaignToEdit && (
        <CampaignEditModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setCampaignToEdit(null); }}
          onSubmit={handleUpdateCampaign}
          campaignData={campaignToEdit}
        />
      )}

      {campaignToView && (
        <CampaignViewModal
          isOpen={showViewModal}
          onClose={() => { setShowViewModal(false); setCampaignToView(null); }}
          onEdit={() => {
            handleEditCampaign(campaignToView._id);
            setShowViewModal(false); // Close view modal when opening edit
          }}
          campaign={campaignToView}
        />
      )}
    </AdminLayout>
  );
}
