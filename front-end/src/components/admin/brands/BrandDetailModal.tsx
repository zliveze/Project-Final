import { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2, FiGlobe, FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import Image from 'next/image';
import { Brand } from './BrandForm';
import toast from 'react-hot-toast';

interface BrandDetailModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BrandDetailModal: React.FC<BrandDetailModalProps> = ({
  brand,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    try {
      if (isOpen) {
        setModalVisible(true);
      } else {
        setTimeout(() => {
          setModalVisible(false);
        }, 300);
      }
    } catch (error) {
      console.error("Lỗi khi mở/đóng modal chi tiết thương hiệu:", error);
      toast.error("Đã xảy ra lỗi khi hiển thị chi tiết thương hiệu", {
        duration: 3000,
        position: "top-right",
        icon: '❌'
      });
    }
  }, [isOpen]);
  
  if (!isOpen && !modalVisible || !brand) return null;

  // Hiển thị ngày tháng định dạng Việt Nam
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return dateString; // Trả về chuỗi ban đầu nếu có lỗi
    }
  };

  // Lấy phong cách cho trạng thái
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Lấy tên trạng thái hiển thị
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  // Xử lý khi người dùng nhấn nút chỉnh sửa
  const handleEdit = (id: string) => {
    onClose(); // Đóng modal chi tiết trước
    setTimeout(() => {
      onEdit(id); // Sau đó mở modal chỉnh sửa
    }, 300); // Đợi animation đóng modal hoàn tất
  };

  // Xử lý khi người dùng nhấn nút xóa
  const handleDelete = (id: string) => {
    onClose(); // Đóng modal chi tiết trước
    setTimeout(() => {
      onDelete(id); // Sau đó mở modal xóa
    }, 300); // Đợi animation đóng modal hoàn tất
  };

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <FiEye className="text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết thương hiệu
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo và thông tin cơ bản */}
              <div className="flex flex-col items-center justify-start">
                <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 w-40 h-40 flex items-center justify-center bg-white p-2">
                  <Image
                    src={brand.logo.url}
                    alt={brand.logo.alt || brand.name}
                    width={150}
                    height={150}
                    className="object-contain"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{brand.name}</h3>
                
                <div className="mb-4 text-center">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${getStatusStyle(brand.status)}`}>
                    {getStatusText(brand.status)}
                  </span>

                  {brand.featured && (
                    <span className="ml-2 px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Nổi bật
                    </span>
                  )}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(brand.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-5 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiEdit2 className="mr-1.5 h-4 w-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm leading-5 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <FiTrash2 className="mr-1.5 h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Mô tả</h4>
                  <p className="text-base text-gray-900">{brand.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Xuất xứ</h4>
                  <p className="text-base text-gray-900">{brand.origin || 'Chưa có thông tin'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Website</h4>
                  {brand.website ? (
                    <a 
                      href={brand.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-base text-blue-600 hover:text-blue-800"
                    >
                      <FiGlobe className="mr-1.5 h-4 w-4" />
                      {brand.website}
                    </a>
                  ) : (
                    <p className="text-base text-gray-400">Chưa có thông tin</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Mạng xã hội</h4>
                  <div className="space-y-2">
                    {brand.socialMedia?.facebook ? (
                      <a 
                        href={brand.socialMedia.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-base text-blue-600 hover:text-blue-800"
                      >
                        <FiFacebook className="mr-1.5 h-4 w-4" />
                        {brand.socialMedia.facebook}
                      </a>
                    ) : null}

                    {brand.socialMedia?.instagram ? (
                      <a 
                        href={brand.socialMedia.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-base text-pink-600 hover:text-pink-800"
                      >
                        <FiInstagram className="mr-1.5 h-4 w-4" />
                        {brand.socialMedia.instagram}
                      </a>
                    ) : null}

                    {brand.socialMedia?.youtube ? (
                      <a 
                        href={brand.socialMedia.youtube} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-base text-red-600 hover:text-red-800"
                      >
                        <FiYoutube className="mr-1.5 h-4 w-4" />
                        {brand.socialMedia.youtube}
                      </a>
                    ) : null}

                    {!brand.socialMedia?.facebook && !brand.socialMedia?.instagram && !brand.socialMedia?.youtube && (
                      <p className="text-base text-gray-400">Chưa có thông tin</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Ngày tạo</h4>
                      <p className="text-sm text-gray-900">{formatDate(brand.createdAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Cập nhật lần cuối</h4>
                      <p className="text-sm text-gray-900">{formatDate(brand.updatedAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Số sản phẩm</h4>
                      <p className="text-sm text-gray-900">{brand.productCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailModal; 