import React, { useState } from 'react';
import Image from 'next/image';
import { 
  FiEye,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Banner } from '@/contexts/BannerContext';

interface BannerTableProps {
  banners: Banner[];
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
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: vi });
    } catch (err) {
      return '-';
    }
  };

  // Tạo URL ảnh thumbnail từ URL gốc
  const getThumbnailUrl = (url: string) => {
    // Chỉ trả về URL gốc vì chưa có dịch vụ resize ảnh
    return url;
  };

  return (
    <div className="overflow-x-auto shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hình ảnh
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tiêu đề
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thời gian hiển thị
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thứ tự
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {banners.length > 0 ? (
            banners.map((banner) => (
              <tr key={banner._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative h-16 w-24 rounded overflow-hidden">
                    <Image
                      src={getThumbnailUrl(banner.desktopImage)}
                      alt={banner.alt || banner.title}
                      fill
                      sizes="(max-width: 96px) 100vw, 96px"
                      style={{ objectFit: 'cover' }}
                      className="rounded"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {banner.href ? <span>Link: {banner.href}</span> : 'Không có link'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    <div>Bắt đầu: {formatDate(banner.startDate)}</div>
                    <div>Kết thúc: {formatDate(banner.endDate)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(banner._id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      banner.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {banner.active ? (
                      <>
                        <FiToggleRight className="mr-1" />
                        Hiển thị
                      </>
                    ) : (
                      <>
                        <FiToggleLeft className="mr-1" />
                        Ẩn
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{banner.order}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => onChangeOrder(banner._id, 'up')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => onChangeOrder(banner._id, 'down')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(banner._id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(banner._id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(banner._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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