import React, { useEffect, useState, useCallback } from 'react';
import { FiGift, FiCheckCircle, FiAlertTriangle, FiUsers } from 'react-icons/fi';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface VoucherDashboardStats {
  totalVouchers: number;
  activeVouchers: number;
  expiringSoon: number;
  topUsedVouchers: Array<{
    _id: string;
    code: string;
    description: string;
    usedCount: number;
    usageLimit: number;
    discountType: string;
    discountValue: number;
    endDate: Date;
    daysLeft: number;
  }>;
}

interface ApiVoucher {
  _id: string;
  code: string;
  description: string;
  usedCount: number;
  usageLimit: number;
  discountType: string;
  discountValue: number;
  endDate: string; // endDate from API is a string
  daysLeft: number;
}

const VoucherStatsCards = () => {
  const { accessToken, isAuthenticated } = useAdminAuth();
  const [dashboardStats, setDashboardStats] = useState<VoucherDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchVoucherStats = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/vouchers/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const statsData = response.data;

      // Chuẩn hóa dữ liệu endDate trong topUsedVouchers
      if (statsData.topUsedVouchers) {
        statsData.topUsedVouchers = statsData.topUsedVouchers.map((voucher: ApiVoucher) => ({
          ...voucher,
          endDate: new Date(voucher.endDate)
        }));
      }

      setDashboardStats(statsData);
    } catch (error) {
      console.error('Error fetching voucher stats:', error);
      // Tạo dữ liệu mẫu nếu API chưa có
      setDashboardStats({
        totalVouchers: 0,
        activeVouchers: 0,
        expiringSoon: 0,
        topUsedVouchers: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    fetchVoucherStats();
  }, [fetchVoucherStats]);

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  };

  if (isLoading) {
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

  if (!dashboardStats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <p className="text-gray-500 text-center">Không thể tải thống kê vouchers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiGift className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.totalVouchers}</div>
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
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.activeVouchers}</div>
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
                <FiUsers className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng lượt dùng
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {dashboardStats.topUsedVouchers.reduce((sum, voucher) => sum + voucher.usedCount, 0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Used Vouchers */}
      {dashboardStats.topUsedVouchers.length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Vouchers được sử dụng nhiều nhất
            </h3>
            <div className="space-y-3">
              {dashboardStats.topUsedVouchers.slice(0, 5).map((voucher, index) => (
                <div key={voucher._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{voucher.code}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Giảm {formatDiscount(voucher.discountType, voucher.discountValue)}
                        </span>
                        {voucher.daysLeft > 0 ? (
                          <span className="text-xs text-gray-500">• {voucher.daysLeft} ngày</span>
                        ) : (
                          <span className="text-xs text-red-500">• Đã hết hạn</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{voucher.usedCount}/{voucher.usageLimit}</p>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-purple-500 h-1.5 rounded-full" 
                        style={{ width: `${getUsagePercentage(voucher.usedCount, voucher.usageLimit)}%` }}
                      ></div>
                    </div>
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
                Cảnh báo: {dashboardStats.expiringSoon} voucher sắp hết hạn
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>Có {dashboardStats.expiringSoon} voucher sẽ hết hạn trong 7 ngày tới. Hãy kiểm tra và gia hạn nếu cần thiết.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherStatsCards;
