import React from 'react';
import Image from 'next/image';
import { FiExternalLink, FiCalendar, FiTag, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Banner } from './BannerForm';

interface BannerDetailProps {
  banner: Banner;
}

const BannerDetail: React.FC<BannerDetailProps> = ({ banner }) => {
  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Banner images */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Ảnh Desktop</h4>
            <div className="relative border rounded-md overflow-hidden">
              <Image
                src={banner.desktopImage || 'https://via.placeholder.com/1200x400?text=No+Image'}
                alt={banner.alt || 'Banner preview'}
                width={1200}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Ảnh Mobile</h4>
            <div className="relative border rounded-md overflow-hidden w-1/2 mx-auto">
              <Image
                src={banner.mobileImage || 'https://via.placeholder.com/600x300?text=No+Image'}
                alt={banner.alt || 'Banner preview'}
                width={600}
                height={300}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Banner info */}
        <div className="bg-gray-50 rounded-lg px-4 py-5 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{banner.title}</h3>
              <div className="mt-2 flex items-start">
                <FiTag className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">{banner.campaignId}</span>
              </div>
              <div className="mt-2 flex items-start">
                <FiExternalLink className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                <a 
                  href={banner.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {banner.href}
                </a>
              </div>
            </div>

            <div>
              <div className="flex items-center mt-2">
                <div className="mr-3 flex-shrink-0">
                  {banner.active ? (
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <FiXCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p className="text-sm text-gray-500">
                    {banner.active ? 'Đang hiển thị' : 'Đã ẩn'}
                  </p>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <div className="mr-3 flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100">
                    <span className="text-sm font-medium text-gray-600">{banner.order}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Thứ tự hiển thị</p>
                  <p className="text-sm text-gray-500">
                    Banner có thứ tự nhỏ sẽ hiển thị trước
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center">
                  <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Ngày tạo:</span>
                </div>
                <p className="mt-1 text-sm text-gray-900">{formatDate(banner.createdAt)}</p>
              </div>

              <div>
                <div className="flex items-center">
                  <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Cập nhật lần cuối:</span>
                </div>
                <p className="mt-1 text-sm text-gray-900">{formatDate(banner.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerDetail; 