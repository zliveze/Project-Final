import React from 'react';
import Image from 'next/image';
import { FiAlertTriangle } from 'react-icons/fi';
import { Banner } from './BannerForm';

interface BannerDeleteConfirmProps {
  banner: Banner;
}

const BannerDeleteConfirm: React.FC<BannerDeleteConfirmProps> = ({ banner }) => {
  return (
    <div className="text-center sm:text-left">
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <FiAlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Xác nhận xóa banner
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Bạn có chắc chắn muốn xóa banner <strong>{banner.title}</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-32 h-16 rounded-md overflow-hidden border">
            <Image
              src={banner.desktopImage || 'https://via.placeholder.com/120x60?text=No+Image'}
              alt={banner.alt || 'Banner preview'}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-medium text-gray-900">{banner.title}</h4>
            <p className="text-xs text-gray-500">Chiến dịch: {banner.campaignId}</p>
            <p className="text-xs text-gray-500">
              Trạng thái: {banner.active ? 'Đang hiển thị' : 'Đã ẩn'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerDeleteConfirm; 