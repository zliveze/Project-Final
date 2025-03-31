import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiPlus, FiCalendar, FiCheckCircle, FiClock, FiFileText, FiPause } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import CampaignTable from '@/components/admin/campaigns/CampaignTable';
import CampaignAddModal from '@/components/admin/campaigns/CampaignAddModal';
import CampaignEditModal from '@/components/admin/campaigns/CampaignEditModal';
import CampaignViewModal from '@/components/admin/campaigns/CampaignViewModal';
import toast from 'react-hot-toast';
import { Campaign } from '@/components/admin/campaigns/CampaignForm';

// Dữ liệu mẫu cho chiến dịch
const sampleCampaigns = [
  {
    _id: 'CP-001',
    title: 'Khuyến mãi mùa hè 2025',
    type: 'Sale Event',
    description: 'Giảm giá lên đến 50% cho tất cả sản phẩm chăm sóc da',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-06-30'),
    products: [
      {
        productId: 'P001',
        productName: 'Kem dưỡng ẩm Intensive',
        variantId: 'V001',
        variantName: '50ml',
        originalPrice: 350000,
        adjustedPrice: 175000,
        image: 'https://via.placeholder.com/50'
      },
      {
        productId: 'P002',
        productName: 'Serum Vitamin C',
        variantId: 'V003',
        variantName: '30ml',
        originalPrice: 420000,
        adjustedPrice: 210000,
        image: 'https://via.placeholder.com/50'
      }
    ],
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-03-15')
  },
  {
    _id: 'CP-002',
    title: 'Chào mừng thành viên mới',
    type: 'Hero Banner',
    description: 'Tặng voucher 50K cho thành viên mới đăng ký',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    products: [],
    createdAt: new Date('2025-03-14'),
    updatedAt: new Date('2025-03-14')
  }
];

export default function AdminCampaigns() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Partial<Campaign> | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>(sampleCampaigns as Campaign[]);
  
  // State cho modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Xử lý xem chi tiết chiến dịch
  const handleViewCampaign = (id: string) => {
    const campaign = campaigns.find(c => c._id === id);
    if (campaign) {
      setSelectedCampaign(campaign);
      setShowViewModal(true);
    }
  };

  // Xử lý chỉnh sửa chiến dịch
  const handleEditCampaign = (id: string) => {
    const campaign = campaigns.find(c => c._id === id);
    if (campaign) {
      setSelectedCampaign(campaign);
      setShowEditModal(true);
    }
  };

  // Xử lý xóa chiến dịch
  const handleDeleteCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setShowDeleteModal(true);
  };

  // Xử lý thay đổi trạng thái chiến dịch
  const handleToggleStatus = (id: string, currentStatus: string) => {
    console.log(`Thay đổi trạng thái chiến dịch ${id} từ ${currentStatus} sang ${currentStatus === 'active' ? 'paused' : 'active'}`);
    // Thực hiện logic thay đổi trạng thái ở đây
    toast.success(`Đã ${currentStatus === 'active' ? 'tạm dừng' : 'kích hoạt'} chiến dịch thành công!`);
  };

  // Xác nhận xóa chiến dịch
  const confirmDeleteCampaign = () => {
    if (!selectedCampaignId) return;

    // Xử lý logic xóa chiến dịch
    setCampaigns(prevCampaigns => prevCampaigns.filter(c => c._id !== selectedCampaignId));
    toast.success('Đã xóa chiến dịch thành công!');
    setShowDeleteModal(false);
    setSelectedCampaignId(null);
  };

  // Hủy xóa chiến dịch
  const cancelDeleteCampaign = () => {
    setShowDeleteModal(false);
    setSelectedCampaignId(null);
  };

  // Xử lý thêm chiến dịch mới
  const handleAddCampaign = () => {
    setShowAddModal(true);
  };

  // Xử lý khi lưu chiến dịch mới
  const handleSaveNewCampaign = (campaignData: Partial<Campaign>) => {
    // Tạo ID mới cho chiến dịch
    const newCampaign: Campaign = {
      _id: `CP-${String(campaigns.length + 1).padStart(3, '0')}`,
      title: campaignData.title || 'Chiến dịch mới',
      description: campaignData.description || '',
      type: campaignData.type || 'Sale Event',
      startDate: campaignData.startDate || new Date(),
      endDate: campaignData.endDate || new Date(),
      products: campaignData.products || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Thêm chiến dịch mới vào danh sách
    setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
  };

  // Xử lý khi cập nhật chiến dịch
  const handleUpdateCampaign = (campaignData: Partial<Campaign>) => {
    if (!campaignData._id) return;

    // Cập nhật chiến dịch trong danh sách
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign._id === campaignData._id
          ? { ...campaign, ...campaignData, updatedAt: new Date() }
          : campaign
      )
    );
  };

  return (
    <AdminLayout title="Quản lý sự kiện & chiến dịch">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <button
          onClick={handleAddCampaign}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm chiến dịch mới
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Thống kê chiến dịch */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCalendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số chiến dịch
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{campaigns.length}</div>
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
                    <div className="text-lg font-medium text-gray-900">2</div>
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
                    <div className="text-lg font-medium text-gray-900">2</div>
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
                    <div className="text-lg font-medium text-gray-900">1</div>
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
                    <div className="text-lg font-medium text-gray-900">1</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <CampaignTable
          onView={handleViewCampaign}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Modal xác nhận xóa chiến dịch */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiCalendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xóa chiến dịch
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa chiến dịch này? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeleteCampaign}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDeleteCampaign}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals CRUD */}
      <CampaignAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSaveNewCampaign}
      />

      {selectedCampaign && (
        <>
          <CampaignEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdateCampaign}
            campaignData={selectedCampaign}
          />

          <CampaignViewModal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            onEdit={handleEditCampaign}
            campaign={selectedCampaign}
          />
        </>
      )}
    </AdminLayout>
  );
} 