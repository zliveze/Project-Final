import React from 'react';
import Image from 'next/image';
import { FiAlertTriangle, FiCalendar, FiLink, FiTag } from 'react-icons/fi';
import { Banner } from './BannerForm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BannerDeleteConfirmProps {
  banner: Banner;
}

const BannerDeleteConfirm: React.FC<BannerDeleteConfirmProps> = ({ banner }) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (err) {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <FiAlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">
            Xác nhận xóa banner
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Bạn có chắc chắn muốn xóa banner <strong>{banner.title}</strong>? Hành động này không thể hoàn tác.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-shrink-0 h-24 w-40 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={banner.desktopImage || 'https://via.placeholder.com/120x60?text=No+Image'}
              alt={banner.alt || 'Banner preview'}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{banner.title}</h4>
            <div className="mt-1 flex flex-col space-y-1">
              <div className="flex items-center text-sm text-gray-500">
                <FiTag className="flex-shrink-0 mr-1.5 h-4 w-4" />
                <span>Chiến dịch: {banner.campaignId}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiLink className="flex-shrink-0 mr-1.5 h-4 w-4" />
                <a 
                  href={banner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-pink-600"
                >
                  {banner.href}
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                <span>Tạo lúc: {formatDate(banner.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {banner.active ? 'Đang hiển thị' : 'Đã ẩn'}
            </span>
          </div>
          <div className="text-gray-500">
            Thứ tự hiển thị: {banner.order}
          </div>
        </div>
      </div>

      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Lưu ý quan trọng
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Banner sẽ bị xóa vĩnh viễn khỏi hệ thống</li>
                <li>Các hình ảnh liên quan sẽ bị xóa khỏi storage</li>
                <li>Không thể khôi phục lại sau khi xóa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerDeleteConfirm; 