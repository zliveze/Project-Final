import React, { useEffect, useState, useRef } from 'react';
import { FiCalendar, FiCheckCircle, FiClock, FiFileText, FiPause, FiAlertTriangle, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import { useCampaign } from '@/contexts/CampaignContext';

const CampaignStatsCards = () => {
  const { dashboardStats, fetchCampaignStats, stats } = useCampaign();
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Chỉ load stats một lần khi component mount
    if (!hasLoadedRef.current && !dashboardStats) {
      const loadStats = async () => {
        console.log('[CampaignStatsCards] Starting to load stats...');
        setIsStatsLoading(true);
        try {
          await fetchCampaignStats();
          console.log('[CampaignStatsCards] Stats loaded successfully');
          hasLoadedRef.current = true;
        } catch (error) {
          console.error('[CampaignStatsCards] Error loading stats:', error);
        } finally {
          setIsStatsLoading(false);
        }
      };

      loadStats();
    }
  }, []); // Empty dependency array để chỉ chạy một lần

  // Debug logging
  console.log('[CampaignStatsCards] Current state:', {
    isStatsLoading,
    dashboardStats,
    hasFetchFunction: !!fetchCampaignStats
  });

  // Log chi tiết dashboardStats
  if (dashboardStats) {
    console.log('[CampaignStatsCards] Dashboard stats details:', {
      totalCampaigns: dashboardStats.totalCampaigns,
      activeCampaigns: dashboardStats.activeCampaigns,
      expiringSoon: dashboardStats.expiringSoon,
      topPerformingCount: dashboardStats.topPerformingCampaigns?.length || 0
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Hàm refresh stats manually
  const handleRefreshStats = async () => {
    setIsStatsLoading(true);
    try {
      await fetchCampaignStats();
      console.log('[CampaignStatsCards] Stats refreshed manually');
    } catch (error) {
      console.error('[CampaignStatsCards] Error refreshing stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  if (isStatsLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Sử dụng stats cũ nếu dashboardStats không có
  if (!dashboardStats) {
    return (
      <div className="space-y-6">
        {/* Header với nút refresh */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Thống kê Campaigns</h2>
          <button
            onClick={handleRefreshStats}
            disabled={isStatsLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 mr-2 ${isStatsLoading ? 'animate-spin' : ''}`} />
            {isStatsLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Fallback stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiCalendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tổng số
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.total || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Đang hoạt động
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.active || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiClock className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Lên lịch
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.scheduled || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiPause className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Đã kết thúc
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.ended || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo không có dữ liệu chi tiết */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Thông tin thống kê chi tiết chưa sẵn sàng
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Đang hiển thị thống kê cơ bản. Nhấn "Làm mới" để tải thống kê chi tiết.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header với nút refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Thống kê Campaigns</h2>
        <button
          onClick={handleRefreshStats}
          disabled={isStatsLoading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 mr-2 ${isStatsLoading ? 'animate-spin' : ''}`} />
          {isStatsLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCalendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.totalCampaigns}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.activeCampaigns}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sắp hết hạn
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.expiringSoon}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng doanh thu
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {formatCurrency(
                        dashboardStats.topPerformingCampaigns.reduce((sum, campaign) => sum + campaign.totalRevenue, 0)
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      {dashboardStats.topPerformingCampaigns.length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Campaigns hiệu quả nhất
            </h3>
            <div className="space-y-3">
              {dashboardStats.topPerformingCampaigns.slice(0, 5).map((campaign, index) => (
                <div key={campaign._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{campaign.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{campaign.type}</span>
                        {campaign.daysLeft > 0 ? (
                          <span className="text-xs text-gray-500">• {campaign.daysLeft} ngày còn lại</span>
                        ) : (
                          <span className="text-xs text-red-500">• Đã kết thúc</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(campaign.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">{campaign.totalOrders} đơn hàng</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Alert */}
      {dashboardStats.expiringSoon > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Cảnh báo: {dashboardStats.expiringSoon} campaign sắp hết hạn
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>Có {dashboardStats.expiringSoon} campaign sẽ hết hạn trong 7 ngày tới. Hãy kiểm tra và gia hạn nếu cần thiết.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignStatsCards;
