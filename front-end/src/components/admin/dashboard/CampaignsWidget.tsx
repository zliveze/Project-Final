import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FiTarget, FiTrendingUp, FiExternalLink, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { useCampaign } from '@/contexts/CampaignContext';

const CampaignsWidget = () => {
  const { dashboardStats, fetchCampaignStats } = useCampaign();
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Chỉ load stats một lần khi component mount
    if (!hasLoadedRef.current && !dashboardStats) {
      const loadStats = async () => {
        setIsStatsLoading(true);
        try {
          await fetchCampaignStats();
          hasLoadedRef.current = true;
        } finally {
          setIsStatsLoading(false);
        }
      };

      loadStats();
    }
  }, [dashboardStats, fetchCampaignStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
        <Link
          href="/admin/campaigns"
          className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center"
        >
          Xem tất cả
          <FiExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </div>

      {isStatsLoading ? (
        // Loading skeleton
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : dashboardStats ? (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCampaigns}</p>
              <p className="text-xs text-gray-500">Tổng số</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardStats.activeCampaigns}</p>
              <p className="text-xs text-gray-500">Đang chạy</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center">
                <FiAlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.expiringSoon}</p>
              </div>
              <p className="text-xs text-gray-500">Sắp hết hạn</p>
            </div>
          </div>

          {/* Top Performing Campaigns */}
          {dashboardStats.topPerformingCampaigns.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Hiệu quả cao nhất</h3>
              <div className="space-y-3">
                {dashboardStats.topPerformingCampaigns.slice(0, 3).map((campaign) => (
                  <div
                    key={campaign._id}
                    className="flex flex-col sm:flex-row sm:items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 sm:pr-4">
                      <div className="p-2 rounded-full bg-pink-100 text-pink-500 flex-shrink-0">
                        <FiTarget className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-medium text-gray-900 text-sm truncate"
                          title={campaign.title}
                        >
                          {campaign.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 whitespace-nowrap">{campaign.type}</span>
                          {campaign.daysLeft > 0 && (
                            <div className="flex items-center text-xs text-gray-500 whitespace-nowrap">
                              <FiCalendar className="h-3 w-3 mr-1" />
                              {campaign.daysLeft} ngày
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0 ml-11 sm:ml-0">
                      <div className="flex items-center sm:justify-end text-sm font-medium text-gray-900">
                        <FiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="truncate max-w-[120px] sm:max-w-[150px]" title={formatCurrency(campaign.totalRevenue)}>
                          {formatCurrency(campaign.totalRevenue)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{campaign.totalOrders} đơn hàng</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FiTarget className="h-full w-full" />
          </div>
          <p className="text-gray-500 text-sm">Chưa có dữ liệu thống kê</p>
          <Link
            href="/admin/campaigns"
            className="inline-flex items-center mt-2 text-pink-500 hover:text-pink-600 text-sm font-medium"
          >
            Tạo campaign mới
            <FiExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default CampaignsWidget;
