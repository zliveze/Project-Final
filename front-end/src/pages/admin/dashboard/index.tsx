import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

// Import tất cả components
import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import UserStatsCard from '@/components/admin/dashboard/UserStatsCard';
import UserGrowthChart from '@/components/admin/dashboard/UserGrowthChart';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import CampaignsWidget from '@/components/admin/dashboard/CampaignsWidget';
import ActivityWidget from '@/components/admin/dashboard/ActivityWidget';
import RecentOrders from '@/components/admin/RecentOrders';
import TopProducts from '@/components/admin/TopProducts';

export default function AdminDashboard() {
  useEffect(() => {
    // Dữ liệu sẽ được tải tự động thông qua các contexts từ AppProviders
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>

        {/* Thống kê tổng quan - 4 cards */}
        <DashboardStats />

        {/* Thống kê người dùng chi tiết */}
        <UserStatsCard />

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ tăng trưởng người dùng */}
          <UserGrowthChart />

          {/* Biểu đồ doanh thu */}
          <RevenueChart />
        </div>

        {/* Đơn hàng gần đây - Full width */}
        <RecentOrders />

        {/* Widgets bổ sung */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sản phẩm bán chạy */}
          <TopProducts />

          {/* Campaigns & Vouchers */}
          <CampaignsWidget />

          {/* Thông báo & Hoạt động - Tạm comment để debug */}
          <ActivityWidget />
        </div>
      </div>
    </AdminLayout>
  );
}