import { useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentOrders from '@/components/admin/RecentOrders';
import TopProducts from '@/components/admin/TopProducts';

export default function AdminDashboard() {
  useEffect(() => {
    // Có thể thêm logic để tải dữ liệu từ API ở đây
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Thống kê tổng quan */}
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Đơn hàng gần đây */}
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>
          
          {/* Sản phẩm bán chạy */}
          <div>
            <TopProducts />
          </div>
          
          {/* Biểu đồ doanh thu */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Biểu đồ doanh thu</h3>
            <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-500">Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
            </div>
          </div>
        </div>
        
        {/* Hoạt động gần đây */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                  NV
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Nguyễn Văn A</span> đã đặt một đơn hàng mới
                </p>
                <p className="text-xs text-gray-500">5 phút trước</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                  TT
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Trần Thị B</span> đã đăng ký tài khoản mới
                </p>
                <p className="text-xs text-gray-500">30 phút trước</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm">
                  AD
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Admin</span> đã thêm sản phẩm mới "Kem dưỡng ẩm Yumin"
                </p>
                <p className="text-xs text-gray-500">1 giờ trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 