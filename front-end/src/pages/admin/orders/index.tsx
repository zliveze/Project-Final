import { useState, useEffect } from 'react';
// useCallback removed as it's not used
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOrderList from '@/components/admin/orders/AdminOrderList';
import OrderStats from '@/components/admin/orders/OrderStats';
import OrderStatsAdvanced from '@/components/admin/orders/OrderStatsAdvanced';
import OrderDetailModal from '@/components/admin/orders/OrderDetailModal';
import OrderEditForm from '@/components/admin/orders/OrderEditForm';
import OrderConfirmDelete from '@/components/admin/orders/OrderConfirmDelete';
import OrderFilter from '@/components/admin/orders/OrderFilter';
import { FiFilter, FiDownload, FiRefreshCw, FiTrendingUp, FiList, FiBarChart2, FiClock } from 'react-icons/fi';
// FiAlertCircle and FiCalendar removed as they're not used
import { Toaster, toast } from 'react-hot-toast';
import Script from 'next/script';
import { useAdminOrder } from '@/contexts';
// AdminOrderProvider removed as it's not used

// Định nghĩa interface cho OrderFilterState
interface OrderFilterState {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  timePeriod: string;
  dateRange: {
    from: string;
    to: string;
  };
  priceRange: {
    min: string;
    max: string;
  };
}

// StatsData interface removed as it's not used

// Định nghĩa interface cho loại xem
type ViewMode = 'list' | 'advanced' | 'edit';

function AdminOrdersContent() {
  const router = useRouter();
  const {
    // orders - removed as it's not used
    // orderStats - removed as it's not used
    // loading: isContextLoading - removed as it's not used
    // fetchOrders - removed as it's not used
    fetchOrderStats,
    // updateOrderStatus - removed as it's not used
    cancelOrder,
    // createShipment - removed as it's not used
    // getShipmentInfo - removed as it's not used
    setFilters,
    refreshData
  } = useAdminOrder();

  // Quản lý trạng thái UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<OrderFilterState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Dùng để trigger refresh dữ liệu
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Trạng thái dữ liệu thống kê - removed as they're not used
  // const [statsData, setStatsData] = useState<StatsData>({
  //   totalOrders: 0,
  //   totalRevenue: 0,
  //   pendingOrders: 0,
  //   processingOrders: 0,
  //   completedOrders: 0,
  //   cancelledOrders: 0
  // });

  // Fetch dữ liệu thống kê
  useEffect(() => {
    fetchOrderStats(periodType);
  }, [refreshKey, periodType, fetchOrderStats]);

  // Thiết lập auto refresh khi cần thiết
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOrderStats();
        toast('Dữ liệu đã được cập nhật tự động', {
          id: 'auto-refresh-data'
        });
      }, 30000); // Cập nhật mỗi 30 giây

      setRefreshInterval(interval);

      return () => {
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, fetchOrderStats, refreshInterval]);

  // Define Chart window interface
  interface ChartWindow extends Window {
    Chart?: unknown;
  }

  // Script khởi tạo Chart.js
  useEffect(() => {
    // Kiểm tra xem thư viện Chart đã được load hay chưa
    const checkChartLoaded = () => {
      const chartWindow = window as ChartWindow;
      if (typeof window !== 'undefined' && chartWindow.Chart) {
        console.log('Chart.js đã sẵn sàng cho việc khởi tạo biểu đồ');
      } else {
        // Nếu chưa load thì đợi và thử lại
        setTimeout(checkChartLoaded, 100);
      }
    };

    checkChartLoaded();
  }, [viewMode, periodType]);

  // Chức năng clean up khi component unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Hàm này đã được thay thế bằng fetchOrderStats từ context

  // Xử lý xem chi tiết đơn hàng
  const handleView = (id: string) => {
    setSelectedOrderId(id);
    setShowDetailModal(true);
  };

  // Xử lý chỉnh sửa đơn hàng
  const handleEdit = (id: string) => {
    setSelectedOrderId(id);
    setViewMode('edit');
  };

  // Xử lý xóa đơn hàng
  const handleCancel = (id: string) => {
    setSelectedOrderId(id);
    setShowCancelModal(true);
  };

  // Xử lý xác nhận xóa đơn hàng
  const confirmCancel = async () => {
    if (!selectedOrderId) return;

    try {
      // Sử dụng hàm cancelOrder từ context
      await cancelOrder(selectedOrderId, 'Đơn hàng bị hủy bởi admin');

      // Đóng modal và refresh dữ liệu
      setShowCancelModal(false);
      setSelectedOrderId(null);

      // Chỉ gọi refreshData, không cần handleRefreshData
      await refreshData();

      toast.success('Đã hủy đơn hàng thành công', {
        id: 'cancel-success'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Lỗi khi hủy đơn hàng: ${errorMessage}`);
    }
  };

  // Xử lý hủy chỉnh sửa
  const handleCancelEdit = () => {
    setViewMode('list');
    setSelectedOrderId(null);
    toast('Đã hủy chỉnh sửa đơn hàng', {
      id: 'cancel-edit'
    });
  };

  // Xử lý lưu thành công
  const handleEditSuccess = () => {
    setViewMode('list');
    setSelectedOrderId(null);
    handleRefreshData();
    toast.success('Đã cập nhật đơn hàng thành công', {
      id: 'edit-success'
    });
  };

  // Xử lý áp dụng bộ lọc
  const handleApplyFilter = (newFilters: OrderFilterState) => {
    setActiveFilters(newFilters);
    // Cập nhật filters trong context
    setFilters(newFilters);
    handleRefreshData();
    toast('Đã áp dụng bộ lọc mới', {
      id: 'apply-filter'
    });
  };

  // Refresh dữ liệu sau khi có thay đổi
  const handleRefreshData = () => {
    setIsLoading(true);
    // Trigger refresh bằng cách thay đổi refreshKey
    setRefreshKey(prev => prev + 1);

    // Gọi hàm refreshData từ context
    refreshData().then(() => {
      setIsLoading(false);
      if (!autoRefresh) { // Tránh hiển thị thông báo khi tự động refresh
        toast.success('Đã cập nhật dữ liệu thành công', {
          id: 'refresh-success'
        });
      }
    });
  };

  // Xuất báo cáo
  const handleExportReport = () => {
    toast('Đang chuyển đến trang xuất báo cáo...', {
      id: 'export-report'
    });
    router.push('/admin/orders/export');
  };

  // Chuyển đến trang phân tích xu hướng
  const handleViewTrends = () => {
    toast('Đang chuyển đến trang phân tích xu hướng...', {
      id: 'view-trends'
    });
    router.push('/admin/orders/trends');
  };

  // Kiểm tra xem có bộ lọc đang áp dụng không
  const hasActiveFilters = () => {
    if (!activeFilters) return false;

    return (
      activeFilters.status !== 'all' ||
      activeFilters.paymentStatus !== 'all' ||
      activeFilters.paymentMethod !== 'all' ||
      activeFilters.timePeriod !== 'all' ||
      activeFilters.dateRange.from !== '' ||
      activeFilters.dateRange.to !== '' ||
      activeFilters.priceRange.min !== '' ||
      activeFilters.priceRange.max !== ''
    );
  };

  // Chuyển đổi giữa các chế độ xem
  const handleTabChange = (mode: 'list' | 'advanced') => {
    setViewMode(mode);
    toast(`Đã chuyển sang chế độ ${mode === 'list' ? 'danh sách' : 'thống kê nâng cao'}`, {
      id: `tab-change-${mode}`
    });
  };

  // Chuyển đổi tự động refresh
  const toggleAutoRefresh = () => {
    const newState = !autoRefresh;
    setAutoRefresh(newState);
    if (newState) {
      toast.success('Đã bật chế độ tự động cập nhật (30 giây/lần)', {
        id: 'auto-refresh-on'
      });
    } else {
      toast('Đã tắt chế độ tự động cập nhật', {
        id: 'auto-refresh-off'
      });
    }
  };

  // Xử lý thay đổi khoảng thời gian cho thống kê nâng cao
  const handlePeriodChange = (period: 'week' | 'month' | 'quarter' | 'year') => {
    setPeriodType(period);

    const periodText = {
      'week': 'tuần',
      'month': 'tháng',
      'quarter': 'quý',
      'year': 'năm'
    }[period];

    toast(`Đang xem thống kê theo ${periodText}`, {
      id: `period-change-${period}`
    });
  };

  // Xử lý thay đổi bộ lọc - removed as it's not used
  // const handleFilterChange = (newFilters: Partial<OrderFilterState>) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     ...newFilters
  //   }));
  // };

  return (
    <AdminLayout title="Quản lý đơn hàng">
      <Head>
        <title>Quản lý đơn hàng | Yumin Admin</title>
      </Head>

      {/* Import thư viện Chart.js */}
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="afterInteractive"
        onLoad={() => console.log('Chart.js đã được tải thành công')}
      />

      {viewMode === 'edit' ? (
        <OrderEditForm
          orderId={selectedOrderId || ''}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
              <div className="flex p-1 bg-gray-100 rounded-md">
                <button
                  className={`px-4 py-2 rounded-md flex items-center ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  onClick={() => handleTabChange('list')}
                >
                  <FiList className="mr-2 h-4 w-4" />
                  Danh sách
                </button>
                <button
                  className={`px-4 py-2 rounded-md flex items-center ${viewMode === 'advanced' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  onClick={() => handleTabChange('advanced')}
                >
                  <FiBarChart2 className="mr-2 h-4 w-4" />
                  Thống kê nâng cao
                </button>
              </div>

              <button
                className={`px-4 py-2 ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center`}
                onClick={toggleAutoRefresh}
                title={autoRefresh ? "Tự động làm mới: Bật (30s)" : "Tự động làm mới: Tắt"}
              >
                <FiClock className="mr-2 h-4 w-4" />
                {autoRefresh ? 'Tự động' : 'Thủ công'}
              </button>

              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center"
                onClick={() => handleRefreshData()}
              >
                <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>

              <button
                className={`px-4 py-2 ${hasActiveFilters() ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700'} rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center`}
                onClick={() => setShowFilterModal(true)}
              >
                <FiFilter className="mr-2 h-4 w-4" />
                Lọc nâng cao {hasActiveFilters() && '(Đang áp dụng)'}
              </button>

              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                onClick={handleViewTrends}
              >
                <FiTrendingUp className="mr-2 h-4 w-4" />
                Phân tích xu hướng
              </button>

              <button
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 flex items-center"
                onClick={handleExportReport}
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Xuất báo cáo
              </button>
            </div>
          </div>

          {/* Hiển thị thông tin thống kê */}
          {viewMode === 'list' ? (
            <OrderStats />
          ) : (
            <div className="mb-4">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Thống kê nâng cao</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Đây là chế độ xem thống kê nâng cao trực tiếp tại trang quản lý đơn hàng. Để xem đầy đủ báo cáo phân tích và so sánh xu hướng, vui lòng truy cập trang <button onClick={handleViewTrends} className="underline font-medium">Phân tích xu hướng</button>.</p>
                    </div>
                  </div>
                </div>
              </div>
              <OrderStatsAdvanced
                periodType={periodType}
                onPeriodChange={handlePeriodChange}
              />
            </div>
          )}

          {/* Hiển thị bảng đơn hàng hoặc thống kê nâng cao */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white shadow-md rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : viewMode === 'list' ? (
            <AdminOrderList
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleCancel}
            />
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-gray-500 text-center py-4">
                Thống kê nâng cao đang hiển thị ở phần trên.
                <br />
                Sử dụng các nút chuyển đổi khoảng thời gian để xem thống kê khác nhau.
                <br />
                Hoặc truy cập trang <button
                  className="text-indigo-600 hover:text-indigo-800 underline"
                  onClick={handleViewTrends}
                >
                  Phân tích xu hướng
                </button> để xem phân tích chi tiết hơn.
              </p>
            </div>
          )}

          {/* Modal chi tiết đơn hàng */}
          <OrderDetailModal
            orderId={selectedOrderId || ''}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEdit}
            onDelete={handleCancel}
          />

          {/* Modal xác nhận xóa */}
          <OrderConfirmDelete
            orderId={selectedOrderId || ''}
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={confirmCancel}
          />

          {/* Modal lọc nâng cao */}
          <OrderFilter
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            onApply={handleApplyFilter}
            currentFilters={activeFilters || undefined}
          />
        </div>
      )}

      {/* Toast notification */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#fff',
            color: '#333',
            zIndex: 9999,
          },
        }}
      />
    </AdminLayout>
  );
}

// AdminOrderProvider đã được cung cấp bởi AppProviders cho đường dẫn /admin/orders
export default function AdminOrders() {
  return <AdminOrdersContent />;
}