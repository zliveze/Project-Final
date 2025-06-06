import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiGift, FiExternalLink, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';

interface RawVoucherData {
  _id: string;
  code: string;
  description: string;
  usedCount: number;
  usageLimit: number;
  discountType: string;
  discountValue: number;
  endDate: string | number | Date; // Type from API before conversion
  daysLeft: number;
}

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

const VouchersWidget = () => {
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
        statsData.topUsedVouchers = statsData.topUsedVouchers.map((voucher: RawVoucherData) => ({
          ...voucher,
          endDate: new Date(voucher.endDate)
        }));
      }

      setDashboardStats(statsData);
    } catch (error: unknown) {
      console.error('Error fetching voucher stats:', error);

      // Log chi tiết lỗi để debug
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status:', error.response.status);
      }

      // Tạo dữ liệu mẫu nếu API có lỗi
      setDashboardStats({
        totalVouchers: 0,
        activeVouchers: 0,
        expiringSoon: 0,
        topUsedVouchers: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, setIsLoading, setDashboardStats]);

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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Vouchers</h2>
        <Link
          href="/admin/vouchers"
          className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center"
        >
          Xem tất cả
          <FiExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
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
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalVouchers}</p>
              <p className="text-xs text-gray-500">Tổng số</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardStats.activeVouchers}</p>
              <p className="text-xs text-gray-500">Đang hoạt động</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center">
                <FiAlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.expiringSoon}</p>
              </div>
              <p className="text-xs text-gray-500">Sắp hết hạn</p>
            </div>
          </div>

          {/* Top Used Vouchers */}
          {dashboardStats.topUsedVouchers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Được sử dụng nhiều nhất</h3>
              <div className="space-y-3">
                {dashboardStats.topUsedVouchers.slice(0, 3).map((voucher) => (
                  <div
                    key={voucher._id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-500">
                        <FiGift className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{voucher.code}</h4>
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
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <FiUsers className="h-3 w-3 text-blue-500 mr-1" />
                        {voucher.usedCount}/{voucher.usageLimit}
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${getUsagePercentage(voucher.usedCount, voucher.usageLimit)}%` }}
                        ></div>
                      </div>
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
            <FiGift className="h-full w-full" />
          </div>
          <p className="text-gray-500 text-sm">Chưa có dữ liệu thống kê</p>
          <Link
            href="/admin/vouchers"
            className="inline-flex items-center mt-2 text-pink-500 hover:text-pink-600 text-sm font-medium"
          >
            Tạo voucher mới
            <FiExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default VouchersWidget;
