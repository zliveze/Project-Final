import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiAlertCircle, FiFilter, FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import BannerTable from '@/components/admin/banners/BannerTable';
import BannerModal from '@/components/admin/banners/BannerModal';
import BannerForm from '@/components/admin/banners/BannerForm';
import BannerDetail from '@/components/admin/banners/BannerDetail';
import BannerDeleteConfirm from '@/components/admin/banners/BannerDeleteConfirm';
import BannerSlugUpdater from '@/components/admin/banners/BannerSlugUpdater';
import { useBanner } from '@/contexts/BannerContext';
import { useCampaign } from '@/contexts/CampaignContext';
import { toast } from 'react-hot-toast';
import { Banner as BannerFormType } from '@/components/admin/banners/BannerForm';

enum ModalType {
  NONE = 'none',
  VIEW = 'view',
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete'
}

export default function AdminBanners() {
  const router = useRouter();
  const {
    banners,
    loading,
    error,
    statistics,
    totalBanners,
    currentPage,
    totalPages,
    itemsPerPage,
    fetchBanners,
    fetchBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    changeBannerOrder,
    fetchStatistics
  } = useBanner();

  // Sử dụng CampaignContext để lấy danh sách campaigns
  const { activeCampaigns, fetchActiveCampaigns } = useCampaign();

  const [currentBanner, setCurrentBanner] = useState<BannerFormType | null>(null);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');

  // Tải dữ liệu banner khi trang được truy cập lần đầu hoặc khi router thay đổi
  useEffect(() => {
    // Hàm tải dữ liệu banner
    const loadBanners = async () => {
      try {
        console.log('Tải dữ liệu banner từ trang admin/banners');
        await fetchBanners();
        await fetchStatistics();
        await fetchActiveCampaigns(); // Tải danh sách campaigns đang hoạt động
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu banner:', error);
      }
    };

    // Chỉ tải dữ liệu khi router đã sẵn sàng
    if (router.isReady) {
      loadBanners();
    }

    // Hàm xử lý khi chuyển route
    const handleRouteComplete = (url: string) => {
      // Chỉ tải dữ liệu khi chuyển đến trang banner
      if (url.includes('/admin/banners')) {
        loadBanners();
      }
    };

    // Đăng ký sự kiện router change
    router.events.on('routeChangeComplete', handleRouteComplete);

    // Hủy đăng ký sự kiện khi component unmount
    return () => {
      router.events.off('routeChangeComplete', handleRouteComplete);
    };
  }, [router.isReady, fetchBanners, fetchStatistics]);

  // Mở modal xem chi tiết banner
  const handleViewBanner = async (id: string) => {
    try {
      const banner = await fetchBannerById(id);
      setCurrentBanner(banner as BannerFormType);
      setModalType(ModalType.VIEW);
    } catch (error) {
      toast.error('Không thể lấy thông tin banner');
    }
  };

  // Mở modal thêm mới banner
  const handleAddBanner = () => {
    setCurrentBanner(null);
    setModalType(ModalType.ADD);
  };

  // Mở modal chỉnh sửa banner
  const handleEditBanner = async (id: string) => {
    try {
      const banner = await fetchBannerById(id);
      setCurrentBanner(banner as BannerFormType);
      setModalType(ModalType.EDIT);
    } catch (error) {
      toast.error('Không thể lấy thông tin banner');
    }
  };

  // Mở modal xóa banner
  const handleDeleteBanner = async (id: string) => {
    try {
      const banner = await fetchBannerById(id);
      setCurrentBanner(banner as BannerFormType);
      setModalType(ModalType.DELETE);
    } catch (error) {
      toast.error('Không thể lấy thông tin banner');
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setModalType(ModalType.NONE);
    setCurrentBanner(null);
  };

  // Xử lý thay đổi trạng thái banner
  const handleToggleStatus = async (id: string) => {
    try {
      await toggleBannerStatus(id);
      toast.success('Đã thay đổi trạng thái banner');
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái banner');
    }
  };

  // Xử lý thay đổi thứ tự banner
  const handleChangeOrder = async (id: string, direction: 'up' | 'down') => {
    try {
      await changeBannerOrder(id, direction);
      toast.success('Đã thay đổi thứ tự banner');
    } catch (error) {
      toast.error('Không thể thay đổi thứ tự banner');
    }
  };

  // Chuyển đổi Banner từ context sang BannerForm
  const convertToFormBanner = (banner: BannerFormType): BannerFormType => {
    return {
      _id: banner._id,
      title: banner.title,
      campaignId: banner.campaignId || '',
      desktopImage: banner.desktopImage,
      mobileImage: banner.mobileImage,
      alt: banner.alt || '',
      href: banner.href || '',
      active: banner.active,
      order: banner.order,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt
    };
  };

  // Xử lý thêm mới banner
  const handleSubmitAdd = async (data: Partial<BannerFormType>) => {
    setIsSubmitting(true);

    try {
      await createBanner(data);
      toast.success('Đã thêm banner mới');
      handleCloseModal();
    } catch (error) {
      toast.error('Không thể thêm banner mới');
      console.error('Lỗi khi thêm mới banner:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý cập nhật banner
  const handleSubmitEdit = async (data: Partial<BannerFormType>) => {
    if (!currentBanner || !currentBanner._id) return;

    setIsSubmitting(true);

    try {
      await updateBanner(currentBanner._id, data);
      toast.success('Đã cập nhật banner');
      handleCloseModal();
    } catch (error) {
      toast.error('Không thể cập nhật banner');
      console.error('Lỗi khi cập nhật banner:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa banner
  const handleConfirmDelete = async () => {
    if (!currentBanner || !currentBanner._id) return;

    setIsSubmitting(true);

    try {
      await deleteBanner(currentBanner._id);
      toast.success('Đã xóa banner');
      handleCloseModal();
    } catch (error) {
      toast.error('Không thể xóa banner');
      console.error('Lỗi khi xóa banner:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc banner dựa trên các điều kiện
  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (banner.campaignId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true :
                         filterStatus === 'active' ? banner.active : !banner.active;
    const matchesCampaign = filterCampaign === 'all' ? true :
                           banner.campaignId === filterCampaign;

    return matchesSearch && matchesStatus && matchesCampaign;
  });

  // Render modal tương ứng theo loại
  const renderModal = () => {
    switch (modalType) {
      case ModalType.VIEW:
        return currentBanner ? (
          <BannerModal
            title="Chi tiết banner"
            onClose={handleCloseModal}
            showFooter={false}
          >
            <BannerDetail banner={currentBanner as any} />
          </BannerModal>
        ) : null;

      case ModalType.ADD:
        return (
          <BannerModal
            title="Thêm banner mới"
            onClose={handleCloseModal}
            confirmText="Lưu banner"
            onConfirm={() => {}}
            showFooter={false}
          >
            <BannerForm
              onSubmit={handleSubmitAdd}
              isSubmitting={isSubmitting}
              onCancel={handleCloseModal}
            />
          </BannerModal>
        );

      case ModalType.EDIT:
        return currentBanner ? (
          <BannerModal
            title="Chỉnh sửa banner"
            onClose={handleCloseModal}
            confirmText="Cập nhật"
            onConfirm={() => {}}
            showFooter={false}
          >
            <BannerForm
              initialData={convertToFormBanner(currentBanner)}
              onSubmit={handleSubmitEdit}
              isSubmitting={isSubmitting}
              onCancel={handleCloseModal}
            />
          </BannerModal>
        ) : null;

      case ModalType.DELETE:
        return currentBanner ? (
          <BannerModal
            title="Xóa banner"
            onClose={handleCloseModal}
            confirmText="Xóa"
            onConfirm={handleConfirmDelete}
            isSubmitting={isSubmitting}
          >
            <BannerDeleteConfirm banner={currentBanner as any} />
          </BannerModal>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Quản lý banner">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng số banner</p>
              <p className="text-2xl font-semibold text-gray-900">{banners.length}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full">
              <FiEye className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Banner đang hiển thị</p>
              <p className="text-2xl font-semibold text-gray-900">
                {banners.filter(b => b.active).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiEdit2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Banner đã ẩn</p>
              <p className="text-2xl font-semibold text-gray-900">
                {banners.filter(b => !b.active).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiTrash2 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiến dịch</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(banners.map(b => b.campaignId)).size}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiFilter className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Banner Slug Updater */}
      <BannerSlugUpdater />

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm banner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="inactive">Đã ẩn</option>
            </select>
          </div>

          <div>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Tất cả chiến dịch</option>
              {activeCampaigns.map(campaign => (
                <option key={campaign._id} value={campaign._id}>{campaign.title}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddBanner}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Thêm banner mới
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-pink-400 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Danh sách banner
              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
                {filteredBanners.length} banner
              </span>
            </h3>
          </div>
          <BannerTable
            banners={filteredBanners}
            onView={handleViewBanner}
            onEdit={handleEditBanner}
            onDelete={handleDeleteBanner}
            onToggleStatus={handleToggleStatus}
            onChangeOrder={handleChangeOrder}
          />
        </div>
      )}

      {renderModal()}
    </AdminLayout>
  );
}