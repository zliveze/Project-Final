import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiTarget, FiGift, FiTrendingUp, FiExternalLink } from 'react-icons/fi';
import { useCampaign } from '@/contexts/CampaignContext';

interface CampaignStat {
  id: string;
  name: string;
  type: 'campaign' | 'voucher';
  usageCount: number;
  targetCount?: number;
  status: 'active' | 'inactive' | 'expired';
  endDate?: string;
}

const CampaignsWidget = () => {
  const { campaigns, loading, fetchCampaigns } = useCampaign();
  const [campaignStats, setCampaignStats] = useState<CampaignStat[]>([]);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (!hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      fetchCampaigns(1, 5); // Lấy 5 campaigns gần đây nhất
    }
  }, [hasAttemptedFetch, fetchCampaigns]);

  useEffect(() => {
    // Cập nhật thống kê campaigns khi có dữ liệu
    if (campaigns && campaigns.length > 0) {
      const stats: CampaignStat[] = campaigns.slice(0, 3).map(campaign => ({
        id: campaign._id,
        name: campaign.name,
        type: 'campaign',
        usageCount: Math.floor(Math.random() * 300) + 50, // Tạm thời random vì chưa có field usage
        targetCount: 500,
        status: campaign.isActive ? 'active' : 'inactive',
        endDate: campaign.endDate
      }));
      setCampaignStats(stats);
    }
  }, [campaigns]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-100';
      case 'inactive':
        return 'text-gray-500 bg-gray-100';
      case 'expired':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang chạy';
      case 'inactive':
        return 'Tạm dừng';
      case 'expired':
        return 'Hết hạn';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Campaigns & Vouchers</h2>
        <Link 
          href="/admin/campaigns" 
          className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center"
        >
          Xem tất cả
          <FiExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        // Loading skeleton
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : campaignStats.length > 0 ? (
        <div className="space-y-3">
          {campaignStats.map((campaign) => (
            <div 
              key={campaign.id} 
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${campaign.type === 'campaign' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                  {campaign.type === 'campaign' ? (
                    <FiTarget className="h-4 w-4" />
                  ) : (
                    <FiGift className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{campaign.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                    {campaign.targetCount && (
                      <span className="text-xs text-gray-500">
                        {campaign.usageCount}/{campaign.targetCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center text-sm font-medium text-gray-900">
                  <FiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  {campaign.usageCount}
                </div>
                <span className="text-xs text-gray-500">lượt sử dụng</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FiTarget className="h-full w-full" />
          </div>
          <p className="text-gray-500 text-sm">Chưa có campaigns nào</p>
          <Link 
            href="/admin/campaigns" 
            className="inline-flex items-center mt-2 text-pink-500 hover:text-pink-600 text-sm font-medium"
          >
            Tạo campaign mới
            <FiExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Quick stats */}
      {campaignStats.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {campaignStats.filter(c => c.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">Đang hoạt động</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {campaignStats.reduce((sum, c) => sum + c.usageCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Tổng lượt sử dụng</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsWidget;
