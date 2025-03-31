import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import BannerTable from '@/components/admin/banners/BannerTable';
import BannerModal from '@/components/admin/banners/BannerModal';
import BannerForm from '@/components/admin/banners/BannerForm';
import BannerDetail from '@/components/admin/banners/BannerDetail';
import BannerDeleteConfirm from '@/components/admin/banners/BannerDeleteConfirm';
import { Banner } from '@/components/admin/banners/BannerForm';

// Dữ liệu mẫu
const sampleBanners: Banner[] = [
  {
    _id: 'banner1',
    title: 'Valentine - Chạm tim deal ngọt ngào',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg1.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile2.png?v=608',
    alt: 'Valentine Campaign',
    campaignId: 'valentine-2024',
    href: '/shop?campaign=valentine-2024',
    active: true,
    order: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: 'banner2',
    title: 'Tết rộn ràng - Sale cực khủng',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg2.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile1.png?v=608',
    alt: 'Tết Campaign',
    campaignId: 'tet-2024',
    href: '/shop?campaign=tet-2024',
    active: true,
    order: 2,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12')
  },
  {
    _id: 'banner3',
    title: 'Năm mới - Deal hời',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg3.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile3.png?v=608',
    alt: 'New Year Campaign',
    campaignId: 'new-year-2024',
    href: '/shop?campaign=new-year-2024',
    active: true,
    order: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05')
  },
  {
    _id: 'banner4',
    title: 'Đẹp chuẩn - Giá tốt',
    desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg4.png?v=608',
    mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile4.png?v=608',
    alt: 'Beauty Campaign',
    campaignId: 'beauty-special',
    href: '/shop?campaign=beauty-special',
    active: false,
    order: 4,
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2023-12-25')
  }
];

enum ModalType {
  NONE = 'none',
  VIEW = 'view',
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete'
}

export default function AdminBanners() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>(sampleBanners);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy dữ liệu banner từ API
  // useEffect(() => {
  //   // TODO: Fetch banners from API
  // }, []);

  // Mở modal xem chi tiết banner
  const handleViewBanner = (id: string) => {
    const banner = banners.find(b => b._id === id);
    if (banner) {
      setCurrentBanner(banner);
      setModalType(ModalType.VIEW);
    }
  };

  // Mở modal thêm mới banner
  const handleAddBanner = () => {
    setCurrentBanner(null);
    setModalType(ModalType.ADD);
  };

  // Mở modal chỉnh sửa banner
  const handleEditBanner = (id: string) => {
    const banner = banners.find(b => b._id === id);
    if (banner) {
      setCurrentBanner(banner);
      setModalType(ModalType.EDIT);
    }
  };

  // Mở modal xóa banner
  const handleDeleteBanner = (id: string) => {
    const banner = banners.find(b => b._id === id);
    if (banner) {
      setCurrentBanner(banner);
      setModalType(ModalType.DELETE);
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setModalType(ModalType.NONE);
    setCurrentBanner(null);
  };

  // Xử lý thay đổi thứ tự banner
  const handleChangeOrder = (id: string, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const index = newBanners.findIndex(b => b._id === id);
    
    if (index === -1) return;
    
    // Nếu di chuyển lên và không phải banner đầu tiên
    if (direction === 'up' && index > 0) {
      // Hoán đổi thứ tự hiển thị
      const temp = newBanners[index].order;
      newBanners[index].order = newBanners[index - 1].order;
      newBanners[index - 1].order = temp;
      
      // Sắp xếp lại mảng theo thứ tự
      newBanners.sort((a, b) => a.order - b.order);
    }
    
    // Nếu di chuyển xuống và không phải banner cuối cùng
    if (direction === 'down' && index < newBanners.length - 1) {
      // Hoán đổi thứ tự hiển thị
      const temp = newBanners[index].order;
      newBanners[index].order = newBanners[index + 1].order;
      newBanners[index + 1].order = temp;
      
      // Sắp xếp lại mảng theo thứ tự
      newBanners.sort((a, b) => a.order - b.order);
    }
    
    setBanners(newBanners);
    
    // TODO: Gọi API cập nhật thứ tự banner
  };

  // Xử lý thêm mới banner
  const handleSubmitAdd = async (data: Partial<Banner>) => {
    setIsSubmitting(true);
    
    try {
      // TODO: Gọi API thêm mới banner
      console.log('Thêm mới banner:', data);
      
      // Mô phỏng thêm mới thành công
      const newBanner: Banner = {
        _id: `banner${banners.length + 1}`,
        title: data.title || '',
        desktopImage: data.desktopImage || '',
        mobileImage: data.mobileImage || '',
        alt: data.alt || '',
        campaignId: data.campaignId || '',
        href: data.href || '',
        active: data.active !== undefined ? data.active : true,
        order: data.order || banners.length + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setBanners([...banners, newBanner]);
      handleCloseModal();
    } catch (error) {
      console.error('Lỗi khi thêm mới banner:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý cập nhật banner
  const handleSubmitEdit = async (data: Partial<Banner>) => {
    if (!currentBanner) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Gọi API cập nhật banner
      console.log('Cập nhật banner:', data);
      
      // Mô phỏng cập nhật thành công
      const updatedBanners = banners.map(banner => {
        if (banner._id === currentBanner._id) {
          return {
            ...banner,
            ...data,
            updatedAt: new Date()
          };
        }
        return banner;
      });
      
      setBanners(updatedBanners);
      handleCloseModal();
    } catch (error) {
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
      // TODO: Gọi API xóa banner
      console.log('Xóa banner:', currentBanner._id);
      
      // Mô phỏng xóa thành công
      const updatedBanners = banners.filter(banner => banner._id !== currentBanner._id);
      
      // Cập nhật lại thứ tự hiển thị
      const reorderedBanners = updatedBanners.map((banner, index) => ({
        ...banner,
        order: index + 1
      }));
      
      setBanners(reorderedBanners);
      handleCloseModal();
    } catch (error) {
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
            <BannerDetail banner={currentBanner} />
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
              initialData={currentBanner}
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
            <BannerDeleteConfirm banner={currentBanner} />
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

      <div className="mt-4">
        <BannerTable
          banners={banners}
          onView={handleViewBanner}
          onEdit={handleEditBanner}
          onDelete={handleDeleteBanner}
          onChangeOrder={handleChangeOrder}
        />
      </div>

      {renderModal()}
    </AdminLayout>
  );
} 