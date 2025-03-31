import React, { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiActivity, FiCalendar, FiDollarSign, FiShoppingBag, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/router';

// Định nghĩa interface cho dữ liệu thống kê
interface PeriodStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  newCustomers: number;
  comparisonStats: {
    ordersGrowth: number;
    revenueGrowth: number;
    customerGrowth: number;
  };
}

interface ChartData {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

interface OrderStatsAdvancedProps {
  periodType: 'week' | 'month' | 'quarter' | 'year';
  onPeriodChange: (periodType: 'week' | 'month' | 'quarter' | 'year') => void;
}

export default function OrderStatsAdvanced({ periodType, onPeriodChange }: OrderStatsAdvancedProps) {
  const router = useRouter();
  const isTrendsPage = router.pathname.includes('/trends');
  
  const [stats, setStats] = useState<PeriodStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    newCustomers: 0,
    comparisonStats: {
      ordersGrowth: 0,
      revenueGrowth: 0,
      customerGrowth: 0
    }
  });
  
  const [chartData, setChartData] = useState<ChartData>({
    categories: [],
    series: [
      {
        name: 'Doanh thu',
        data: []
      },
      {
        name: 'Đơn hàng',
        data: []
      }
    ]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Hàm giả lập lấy dữ liệu thống kê theo khoảng thời gian
  const fetchStatsByPeriod = (period: 'week' | 'month' | 'quarter' | 'year') => {
    setIsLoading(true);
    
    // Trong môi trường thực tế, đây sẽ là một API call
    setTimeout(() => {
      // Dữ liệu mẫu tùy theo loại thời gian
      let sampleData: PeriodStats;
      let sampleChartData: ChartData;
      
      switch(period) {
        case 'week':
          sampleData = {
            totalOrders: 252,
            totalRevenue: 148500000,
            averageOrderValue: 589285,
            completedOrders: 215,
            newCustomers: 68,
            comparisonStats: {
              ordersGrowth: 15.6,
              revenueGrowth: 19.9,
              customerGrowth: 19.3
            }
          };
          sampleChartData = {
            categories: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
            series: [
              {
                name: 'Doanh thu (triệu)',
                data: [15.5, 18.7, 21.3, 25.8, 28.4, 22.1, 16.5]
              },
              {
                name: 'Đơn hàng',
                data: [25, 32, 37, 45, 48, 37, 28]
              }
            ]
          };
          break;
        
        case 'month':
          sampleData = {
            totalOrders: 680,
            totalRevenue: 365100000,
            averageOrderValue: 536912,
            completedOrders: 580,
            newCustomers: 215,
            comparisonStats: {
              ordersGrowth: 8.8,
              revenueGrowth: 11.1,
              customerGrowth: 13.2
            }
          };
          sampleChartData = {
            categories: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
            series: [
              {
                name: 'Doanh thu (triệu)',
                data: [78.5, 92.3, 105.7, 88.6]
              },
              {
                name: 'Đơn hàng',
                data: [148, 175, 192, 165]
              }
            ]
          };
          break;
        
        case 'quarter':
          sampleData = {
            totalOrders: 1950,
            totalRevenue: 985600000,
            averageOrderValue: 505435,
            completedOrders: 1670,
            newCustomers: 625,
            comparisonStats: {
              ordersGrowth: 7.5,
              revenueGrowth: 10.2,
              customerGrowth: 5.8
            }
          };
          sampleChartData = {
            categories: ['Tháng 1', 'Tháng 2', 'Tháng 3'],
            series: [
              {
                name: 'Doanh thu (triệu)',
                data: [265.2, 318.7, 295.4]
              },
              {
                name: 'Đơn hàng',
                data: [515, 620, 565]
              }
            ]
          };
          break;
        
        case 'year':
          sampleData = {
            totalOrders: 7120,
            totalRevenue: 3671300000,
            averageOrderValue: 515632,
            completedOrders: 6185,
            newCustomers: 2450,
            comparisonStats: {
              ordersGrowth: 18.5,
              revenueGrowth: 21.8,
              customerGrowth: 16.4
            }
          };
          sampleChartData = {
            categories: ['Q1', 'Q2', 'Q3', 'Q4'],
            series: [
              {
                name: 'Doanh thu (triệu)',
                data: [879.3, 945.8, 820.5, 1025.7]
              },
              {
                name: 'Đơn hàng',
                data: [1700, 1850, 1590, 1980]
              }
            ]
          };
          break;
        
        default:
          sampleData = {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            completedOrders: 0,
            newCustomers: 0,
            comparisonStats: {
              ordersGrowth: 0,
              revenueGrowth: 0,
              customerGrowth: 0
            }
          };
          sampleChartData = {
            categories: [],
            series: [
              {
                name: 'Doanh thu',
                data: []
              },
              {
                name: 'Đơn hàng',
                data: []
              }
            ]
          };
      }
      
      setStats(sampleData);
      setChartData(sampleChartData);
      setIsLoading(false);
    }, 800);
  };
  
  // Fetch dữ liệu khi component mount hoặc khi periodType thay đổi
  useEffect(() => {
    fetchStatsByPeriod(periodType);
  }, [periodType]);
  
  // Vẽ biểu đồ khi dữ liệu thay đổi
  useEffect(() => {
    if (!isLoading && chartData.categories.length > 0) {
      if (typeof window !== 'undefined' && (window as any).Chart) {
        // Timeout nhỏ để đảm bảo DOM đã được cập nhật
        setTimeout(() => {
          const revenueChart = document.getElementById('revenueChart');
          const ordersChart = document.getElementById('ordersChart');
          
          if (revenueChart && ordersChart) {
            // Vẽ biểu đồ doanh thu
            const revenueCtx = (revenueChart as HTMLCanvasElement).getContext('2d');
            // Xóa biểu đồ cũ nếu tồn tại
            if ((window as any).chartInstances?.revenue) {
              (window as any).chartInstances.revenue.destroy();
            }
            
            if (revenueCtx) {
              (window as any).chartInstances = (window as any).chartInstances || {};
              (window as any).chartInstances.revenue = new (window as any).Chart(revenueCtx, {
                type: isTrendsPage ? 'line' : 'bar',
                data: {
                  labels: chartData.categories,
                  datasets: [{
                    label: 'Doanh thu (triệu)',
                    data: chartData.series[0].data,
                    backgroundColor: 'rgba(219, 39, 119, 0.7)',
                    borderColor: 'rgba(219, 39, 119, 1)',
                    borderWidth: 2,
                    fill: isTrendsPage,
                    tension: isTrendsPage ? 0.3 : 0
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  },
                  animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                  }
                }
              });
            }
            
            // Vẽ biểu đồ đơn hàng
            const ordersCtx = (ordersChart as HTMLCanvasElement).getContext('2d');
            // Xóa biểu đồ cũ nếu tồn tại
            if ((window as any).chartInstances?.orders) {
              (window as any).chartInstances.orders.destroy();
            }
            
            if (ordersCtx) {
              (window as any).chartInstances = (window as any).chartInstances || {};
              (window as any).chartInstances.orders = new (window as any).Chart(ordersCtx, {
                type: isTrendsPage ? 'line' : 'bar',
                data: {
                  labels: chartData.categories,
                  datasets: [{
                    label: 'Số đơn hàng',
                    data: chartData.series[1].data,
                    backgroundColor: 'rgba(124, 58, 237, 0.7)',
                    borderColor: 'rgba(124, 58, 237, 1)',
                    borderWidth: 2,
                    fill: isTrendsPage,
                    tension: isTrendsPage ? 0.3 : 0
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  },
                  animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                  }
                }
              });
            }
          }
        }, 200);
      }
    }
  }, [chartData, isLoading, isTrendsPage]);
  
  // Định dạng số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Tính chiều cao tối đa cho biểu đồ dạng cột
  const getMaxValue = (data: number[]) => {
    return Math.max(...data);
  };
  
  // Chuyển đổi giá trị thành chiều cao phần trăm cho biểu đồ đơn giản
  const calculateBarHeight = (value: number, maxValue: number) => {
    return (value / maxValue) * 100;
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      {/* Header với các tab thời gian */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 md:mb-0 flex items-center">
          <FiActivity className="mr-2 text-pink-500" />
          {isTrendsPage ? 'Tổng quan thống kê' : 'Thống kê chi tiết'} {' '}
          {periodType === 'week' && 'theo tuần'}
          {periodType === 'month' && 'theo tháng'}
          {periodType === 'quarter' && 'theo quý'}
          {periodType === 'year' && 'theo năm'}
          {!isTrendsPage && (
            <span className="ml-2 text-xs text-gray-500 font-normal hidden md:inline-block">(Xem thêm số liệu chi tiết tại trang Phân tích xu hướng)</span>
          )}
        </h2>
        
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${periodType === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} 
            onClick={() => onPeriodChange('week')}
          >
            Tuần
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${periodType === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} 
            onClick={() => onPeriodChange('month')}
          >
            Tháng
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${periodType === 'quarter' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} 
            onClick={() => onPeriodChange('quarter')}
          >
            Quý
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${periodType === 'year' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} 
            onClick={() => onPeriodChange('year')}
          >
            Năm
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        <>
          {/* Thẻ thống kê */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                  <p className="text-2xl font-semibold mt-1">{stats.totalOrders}</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <FiShoppingBag className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className={`mt-2 flex items-center ${stats.comparisonStats.ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.comparisonStats.ordersGrowth >= 0 ? (
                  <FiArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <FiArrowDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{Math.abs(stats.comparisonStats.ordersGrowth).toFixed(1)}%</span>
                <span className="text-xs text-gray-500 ml-1">so với kỳ trước</span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Doanh thu</p>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="h-12 w-12 bg-pink-50 rounded-full flex items-center justify-center">
                  <FiDollarSign className="h-6 w-6 text-pink-500" />
                </div>
              </div>
              <div className={`mt-2 flex items-center ${stats.comparisonStats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.comparisonStats.revenueGrowth >= 0 ? (
                  <FiArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <FiArrowDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{Math.abs(stats.comparisonStats.revenueGrowth).toFixed(1)}%</span>
                <span className="text-xs text-gray-500 ml-1">so với kỳ trước</span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Giá trị trung bình</p>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(stats.averageOrderValue)}</p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <FiActivity className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span>Trung bình trên mỗi đơn hàng</span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Đơn hoàn thành</p>
                  <p className="text-2xl font-semibold mt-1">{stats.completedOrders}</p>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <FiShoppingBag className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span>{((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}% tổng đơn hàng</span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Khách hàng mới</p>
                  <p className="text-2xl font-semibold mt-1">{stats.newCustomers}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center">
                  <FiUsers className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className={`mt-2 flex items-center ${stats.comparisonStats.customerGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.comparisonStats.customerGrowth >= 0 ? (
                  <FiArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <FiArrowDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{Math.abs(stats.comparisonStats.customerGrowth).toFixed(1)}%</span>
                <span className="text-xs text-gray-500 ml-1">so với kỳ trước</span>
              </div>
            </div>
          </div>
          
          {/* Biểu đồ thống kê đơn giản */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <FiCalendar className="mr-2 text-pink-500" />
              Biểu đồ doanh thu và đơn hàng
            </h3>
            
            {/* Biểu đồ doanh thu */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Doanh thu (triệu VND)</h4>
              <div className="relative h-60">
                <canvas id="revenueChart" className="w-full h-full"></canvas>
              </div>
            </div>
            
            {/* Biểu đồ đơn hàng */}
            <div className="mt-10">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Số đơn hàng</h4>
              <div className="relative h-60">
                <canvas id="ordersChart" className="w-full h-full"></canvas>
              </div>
            </div>
            
            {/* Ghi chú */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-pink-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-600">Doanh thu</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-600">Đơn hàng</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 