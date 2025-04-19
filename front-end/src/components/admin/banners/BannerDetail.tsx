import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiExternalLink, FiCalendar, FiTag, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiLink, FiLayers, FiImage, FiInfo } from 'react-icons/fi';
import { Banner } from './BannerForm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCampaign } from '@/contexts/CampaignContext';
import { Campaign } from '@/contexts/CampaignContext';

interface BannerDetailProps {
  banner: Banner;
}

const BannerDetail: React.FC<BannerDetailProps> = ({ banner }) => {
  const { activeCampaigns, fetchActiveCampaigns } = useCampaign();
  const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);

  // Lấy thông tin chiến dịch khi component mount
  useEffect(() => {
    const loadCampaignInfo = async () => {
      if (banner.campaignId) {
        // Nếu đã có danh sách campaigns, tìm trong đó
        if (activeCampaigns.length > 0) {
          const campaign = activeCampaigns.find(c => c._id === banner.campaignId);
          setCampaignInfo(campaign || null);
        } else {
          // Nếu chưa có, fetch danh sách campaigns trước
          await fetchActiveCampaigns();
        }
      }
    };

    loadCampaignInfo();
  }, [banner.campaignId, activeCampaigns, fetchActiveCampaigns]);

  // Cập nhật campaignInfo khi activeCampaigns thay đổi
  useEffect(() => {
    if (banner.campaignId && activeCampaigns.length > 0) {
      const campaign = activeCampaigns.find(c => c._id === banner.campaignId);
      setCampaignInfo(campaign || null);
    }
  }, [activeCampaigns, banner.campaignId]);

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  // Kiểm tra trạng thái hiển thị dựa vào thời gian
  const getTimeBasedStatus = () => {
    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;

    if (!banner.active) {
      return { status: 'inactive', message: 'Banner đang bị tắt (không hoạt động)', color: 'gray' };
    }

    if (startDate && now < startDate) {
      return { status: 'pending', message: 'Banner sẽ hiển thị khi đến thời gian bắt đầu', color: 'yellow' };
    }

    if (endDate && now > endDate) {
      return { status: 'expired', message: 'Banner đã hết thời gian hiển thị', color: 'red' };
    }

    if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
      return { status: 'active', message: 'Banner đang trong thời gian hiển thị', color: 'green' };
    }

    return { status: 'unknown', message: 'Không xác định được trạng thái', color: 'gray' };
  };

  const timeStatus = getTimeBasedStatus();

  return (
    <div className="space-y-8">
      {/* Thông tin cơ bản */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Tiêu đề</label>
              <p className="mt-1 text-sm text-gray-900">{banner.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Chiến dịch</label>
              <div className="mt-1 flex items-center">
                <FiTag className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-900 font-medium">
                  {campaignInfo ? campaignInfo.title : banner.campaignId || 'Không có chiến dịch'}
                </span>
              </div>
              {campaignInfo && (
                <div className="mt-2 text-xs text-gray-500">
                  <div className="flex items-center mt-1">
                    <FiInfo className="h-3 w-3 text-gray-400 mr-1" />
                    <span>Loại: {campaignInfo.type}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <FiCalendar className="h-3 w-3 text-gray-400 mr-1" />
                    <span>Từ: {formatDate(campaignInfo.startDate)}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <FiCalendar className="h-3 w-3 text-gray-400 mr-1" />
                    <span>Đến: {formatDate(campaignInfo.endDate)}</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Thứ tự hiển thị</label>
              <div className="mt-1 flex items-center">
                <FiLayers className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-900">{banner.order}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Đường dẫn</label>
              <div className="mt-1 flex items-center">
                <FiLink className="h-4 w-4 text-gray-400 mr-1" />
                <a
                  href={banner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 truncate"
                >
                  {banner.href}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hình ảnh */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Hình ảnh</h3>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div>
            <div className="flex items-center mb-2">
              <FiImage className="h-4 w-4 text-gray-400 mr-1" />
              <label className="text-sm font-medium text-gray-500">Ảnh Desktop</label>
            </div>
            <div className="relative border rounded-lg overflow-hidden">
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
            <div className="flex items-center mb-2">
              <FiImage className="h-4 w-4 text-gray-400 mr-1" />
              <label className="text-sm font-medium text-gray-500">Ảnh Mobile</label>
            </div>
            <div className="relative border rounded-lg overflow-hidden w-1/2 mx-auto">
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
      </div>

      {/* Thời gian */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thời gian</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <FiCalendar className="h-4 w-4 mr-1" />
                <span>Ngày tạo: {formatDate(banner.createdAt)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiCalendar className="h-4 w-4 mr-1" />
                <span>Cập nhật: {formatDate(banner.updatedAt)}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <FiClock className="h-4 w-4 mr-1" />
                <span>Bắt đầu: {formatDate(banner.startDate)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiClock className="h-4 w-4 mr-1" />
                <span>Kết thúc: {formatDate(banner.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trạng thái */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Trạng thái</h3>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {banner.active ? (
                <FiCheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <FiXCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className="text-sm font-medium">
                {banner.active ? 'Đang hoạt động' : 'Đã tắt'}
              </span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
              ${timeStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                timeStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                timeStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'}`}
            >
              {timeStatus.message}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerDetail;