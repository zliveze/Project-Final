import React from 'react';
import Image from 'next/image';
import { 
  FiEye,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiToggleLeft,
  FiToggleRight,
  FiCalendar,
  FiLink,
  FiClock
} from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Banner as BannerType } from '@/contexts/BannerContext';
import { Banner } from '@/components/admin/banners/BannerForm';

interface BannerTableProps {
  banners: BannerType[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onChangeOrder: (id: string, direction: 'up' | 'down') => void;
}

const BannerTable: React.FC<BannerTableProps> = ({
  banners,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onChangeOrder
}) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (err) {
      return '-';
    }
  };

  // Kiểm tra trạng thái hiển thị dựa vào thời gian
  const getTimeBasedStatus = (banner: Banner) => {
    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;
    
    if (!banner.active) {
      return { status: 'inactive', message: 'Đã ẩn', color: 'gray' };
    }
    
    if (startDate && now < startDate) {
      return { status: 'pending', message: 'Chờ hiển thị', color: 'yellow' };
    }
    
    if (endDate && now > endDate) {
      return { status: 'expired', message: 'Hết hạn', color: 'red' };
    }
    
    if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
      return { status: 'active', message: 'Đang hiển thị', color: 'green' };
    }
    
    return { status: 'unknown', message: 'Không xác định', color: 'gray' };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Banner
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thông tin
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thời gian
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {banners.length > 0 ? (
            banners.map((banner) => {
              const timeStatus = getTimeBasedStatus(banner as Banner);
              return (
                <tr key={banner._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={banner.desktopImage}
                          alt={banner.alt || banner.title}
                          fill
                          sizes="(max-width: 128px) 100vw, 128px"
                          style={{ objectFit: 'cover' }}
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {banner.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Thứ tự: {banner.order}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-500 mb-1">
                        <FiLink className="mr-1 h-4 w-4" />
                        <a 
                          href={banner.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-pink-600 truncate max-w-xs"
                        >
                          {banner.href}
                        </a>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                          {banner.campaignId}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center mb-1">
                        <FiCalendar className="mr-1 h-4 w-4" />
                        <span>Tạo: {formatDate(banner.createdAt)}</span>
                      </div>
                      {banner.startDate && (
                        <div className="flex items-center text-gray-500 mb-1">
                          <FiClock className="mr-1 h-4 w-4" />
                          <span>Bắt đầu: {formatDate(banner.startDate)}</span>
                        </div>
                      )}
                      {banner.endDate && (
                        <div className="flex items-center text-gray-500">
                          <FiClock className="mr-1 h-4 w-4" />
                          <span>Kết thúc: {formatDate(banner.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => banner._id && onToggleStatus(banner._id)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors
                          ${banner.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                      >
                        {banner.active ? (
                          <>
                            <FiToggleRight className="mr-1 h-4 w-4" />
                            Đang bật
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="mr-1 h-4 w-4" />
                            Đã tắt
                          </>
                        )}
                      </button>
                      
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium
                        ${timeStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          timeStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          timeStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {timeStatus.message}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => banner._id && onView(banner._id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => banner._id && onEdit(banner._id)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => banner._id && onDelete(banner._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => banner._id && onChangeOrder(banner._id, 'up')}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Di chuyển lên"
                        >
                          <FiArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => banner._id && onChangeOrder(banner._id, 'down')}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Di chuyển xuống"
                        >
                          <FiArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                Không có banner nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BannerTable; 