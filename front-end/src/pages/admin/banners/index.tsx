import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import BannerTable from '@/components/admin/banners/BannerTable';
import BannerModal from '@/components/admin/banners/BannerModal';
import BannerForm from '@/components/admin/banners/BannerForm';
import BannerDetail from '@/components/admin/banners/BannerDetail';
import BannerDeleteConfirm from '@/components/admin/banners/BannerDeleteConfirm';
import { useBanner, Banner, BannerFormData } from '@/contexts/BannerContext';
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
    stats,
    pagination,
    fetchBanners, 
    fetchBannerById, 
    createBanner, 
    updateBanner, 
    deleteBanner, 
    toggleBannerStatus, 
    changeBannerOrder,
    fetchBannerStats
  } = useBanner();
  
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải dữ liệu banner khi trang được truy cập lần đầu hoặc khi router thay đổi
  useEffect(() => {
    // Hàm tải dữ liệu banner
    const loadBanners = async () => {
      try {
        console.log('Tải dữ liệu banner từ trang admin/banners');
        await fetchBanners();
        await fetchBannerStats();
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
  }, [router.isReady]);

  // Mở modal xem chi tiết banner
  const handleViewBanner = async (id: string) => {
    try {
      const banner = await fetchBannerById(id);
      setCurrentBanner(banner);
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
      setCurrentBanner(banner);
      setModalType(ModalType.EDIT);
    } catch (error) {
      toast.error('Không thể lấy thông tin banner');
    }
  };

  // Mở modal xóa banner
  const handleDeleteBanner = async (id: string) => {
    try {
      const banner = await fetchBannerById(id);
      setCurrentBanner(banner);
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
  const convertToFormBanner = (banner: Banner): BannerFormType => {
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
      await createBanner(data as BannerFormData);
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
    if (!currentBanner) return;
    
    setIsSubmitting(true);
    
    try {
      await updateBanner(currentBanner._id, data as BannerFormData);
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
    if (!currentBanner) return;
    
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-900">Danh sách banner</h2>
          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
            {banners.length} banner
          </span>
        </div>
        <button
          onClick={handleAddBanner}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm banner mới
        </button>
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
        <div className="mt-4">
          <BannerTable
            banners={banners}
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