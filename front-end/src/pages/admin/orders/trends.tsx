import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiBarChart2, FiTrendingUp, FiDownload, FiFilter, FiArrowLeft } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import OrderStatsAdvanced from '@/components/admin/orders/OrderStatsAdvanced';
import Script from 'next/script';

// Định nghĩa interface cho dữ liệu so sánh
interface ComparisonData {
  currentPeriod: {
    label: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    newCustomers: number;
  };
  previousPeriod: {
    label: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    newCustomers: number;
  };
  growth: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
    newCustomers: number;
  };
}

interface CategoryData {
  name: string;
  count: number;
  value: number;
}

const OrderTrendsPage: React.FC = () => {
  const router = useRouter();
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [topCategories, setTopCategories] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<CategoryData[]>([]);
  const [trendChartData, setTrendChartData] = useState({
    week: {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      revenue: [15.5, 18.7, 21.3, 25.8, 28.4, 22.1, 16.5],
      orders: [25, 32, 37, 45, 48, 37, 28]
    },
    month: {
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      revenue: [78.5, 92.3, 105.7, 88.6],
      orders: [148, 175, 192, 165]
    },
    quarter: {
      labels: ['Tháng 1', 'Tháng 2', 'Tháng 3'],
      revenue: [265.2, 318.7, 295.4],
      orders: [515, 620, 565]
    },
    year: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      revenue: [879.3, 945.8, 820.5, 1025.7],
      orders: [1700, 1850, 1590, 1980]
    }
  });
  
  // Giả lập fetch dữ liệu so sánh khi periodType thay đổi
  useEffect(() => {
    const fetchComparisonData = () => {
      setIsLoading(true);
      
      // Trong môi trường thực tế, đây sẽ là API call
      setTimeout(() => {
        let data: ComparisonData;
        
        switch (periodType) {
          case 'week':
            data = {
              currentPeriod: {
                label: 'Tuần này',
                orders: 252,
                revenue: 148500000,
                avgOrderValue: 589285,
                newCustomers: 68
              },
              previousPeriod: {
                label: 'Tuần trước',
                orders: 218,
                revenue: 123800000,
                avgOrderValue: 567890,
                newCustomers: 57
              },
              growth: {
                orders: 15.6,
                revenue: 19.9,
                avgOrderValue: 3.8,
                newCustomers: 19.3
              }
            };
            break;
            
          case 'month':
            data = {
              currentPeriod: {
                label: 'Tháng này',
                orders: 680,
                revenue: 365100000,
                avgOrderValue: 536912,
                newCustomers: 215
              },
              previousPeriod: {
                label: 'Tháng trước',
                orders: 625,
                revenue: 328500000,
                avgOrderValue: 525600,
                newCustomers: 190
              },
              growth: {
                orders: 8.8,
                revenue: 11.1,
                avgOrderValue: 2.2,
                newCustomers: 13.2
              }
            };
            break;
            
          case 'quarter':
            data = {
              currentPeriod: {
                label: 'Quý này',
                orders: 1950,
                revenue: 985600000,
                avgOrderValue: 505435,
                newCustomers: 625
              },
              previousPeriod: {
                label: 'Quý trước',
                orders: 1820,
                revenue: 895400000,
                avgOrderValue: 492000,
                newCustomers: 580
              },
              growth: {
                orders: 7.1,
                revenue: 10.1,
                avgOrderValue: 2.7,
                newCustomers: 7.8
              }
            };
            break;
            
          case 'year':
            data = {
              currentPeriod: {
                label: 'Năm nay',
                orders: 7120,
                revenue: 3671300000,
                avgOrderValue: 515632,
                newCustomers: 2450
              },
              previousPeriod: {
                label: 'Năm trước',
                orders: 6050,
                revenue: 3015200000,
                avgOrderValue: 498380,
                newCustomers: 2105
              },
              growth: {
                orders: 17.7,
                revenue: 21.8,
                avgOrderValue: 3.5,
                newCustomers: 16.4
              }
            };
            break;
            
          default:
            data = {
              currentPeriod: {
                label: '',
                orders: 0,
                revenue: 0,
                avgOrderValue: 0,
                newCustomers: 0
              },
              previousPeriod: {
                label: '',
                orders: 0,
                revenue: 0,
                avgOrderValue: 0,
                newCustomers: 0
              },
              growth: {
                orders: 0,
                revenue: 0,
                avgOrderValue: 0,
                newCustomers: 0
              }
            };
        }
        
        setComparisonData(data);
        fetchTopCategories();
        fetchTopProducts();
        setIsLoading(false);
      }, 800);
    };
    
    fetchComparisonData();
  }, [periodType]);
  
  // Giả lập fetch danh mục phổ biến nhất
  const fetchTopCategories = () => {
    // Trong thực tế, đây sẽ là API call
    const data: CategoryData[] = [
      { name: 'Kem dưỡng da', count: 650, value: 358500000 },
      { name: 'Sữa rửa mặt', count: 520, value: 247800000 },
      { name: 'Mặt nạ', count: 850, value: 183600000 },
      { name: 'Son môi', count: 420, value: 156400000 },
      { name: 'Serum', count: 380, value: 425700000 }
    ];
    
    setTopCategories(data);
  };
  
  // Giả lập fetch sản phẩm phổ biến nhất
  const fetchTopProducts = () => {
    // Trong thực tế, đây sẽ là API call
    const data: CategoryData[] = [
      { name: 'Kem dưỡng ẩm Yumin Aqua', count: 245, value: 175800000 },
      { name: 'Serum Yumin Collagen 50ml', count: 205, value: 224500000 },
      { name: 'Sữa rửa mặt Yumin Tea Tree', count: 285, value: 125400000 },
      { name: 'Mặt nạ dưỡng ẩm Yumin (5 miếng)', count: 420, value: 98600000 },
      { name: 'Son lì Yumin Matte Lipstick', count: 305, value: 112300000 }
    ];
    
    setTopProducts(data);
  };
  
  // Định dạng số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Chuyển đổi khoảng thời gian
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter' | 'year') => {
    setPeriodType(newPeriod);
  };
  
  // Xử lý tải báo cáo
  const handleExportReport = () => {
    alert('Tính năng xuất báo cáo sẽ được triển khai trong phiên bản tiếp theo');
  };
  
  // Xử lý quay lại trang quản lý đơn hàng
  const handleGoBack = () => {
    router.push('/admin/orders');
  };
  
  // Vẽ biểu đồ xu hướng
  useEffect(() => {
    // Kiểm tra xem thư viện Chart đã được load hay chưa
    if (typeof window !== 'undefined' && (window as any).Chart && !isLoading) {
      const renderTrendChart = () => {
        const trendChart = document.getElementById('trendChart');
        if (!trendChart) return;

        // Xóa biểu đồ cũ nếu tồn tại
        if ((window as any).trendChartInstance) {
          (window as any).trendChartInstance.destroy();
        }

        const ctx = (trendChart as HTMLCanvasElement).getContext('2d');
        if (!ctx) return;

        const labels = trendChartData[periodType].labels;
        const revenueData = trendChartData[periodType].revenue;
        const ordersData = trendChartData[periodType].orders;

        // Vẽ biểu đồ xu hướng
        (window as any).trendChartInstance = new (window as any).Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Doanh thu (triệu VND)',
                data: revenueData,
                borderColor: 'rgba(79, 70, 229, 1)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                yAxisID: 'y'
              },
              {
                label: 'Số đơn hàng',
                data: ordersData,
                borderColor: 'rgba(219, 39, 119, 1)',
                backgroundColor: 'rgba(219, 39, 119, 0.05)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.3,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                align: 'end'
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Thời gian'
                }
              },
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Doanh thu (triệu VND)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false
                },
                title: {
                  display: true,
                  text: 'Số đơn hàng'
                }
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }
        });
      };

      // Sử dụng setTimeout để đảm bảo DOM đã được render
      setTimeout(renderTrendChart, 300);
    }
  }, [periodType, isLoading, trendChartData]);
  
  // Vẽ biểu đồ danh mục và sản phẩm
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Chart && !isLoading && topCategories.length > 0 && topProducts.length > 0) {
      // Vẽ biểu đồ danh mục
      const renderCategoryChart = () => {
        const categoriesChart = document.getElementById('categoriesChart');
        if (!categoriesChart) return;
        
        // Xóa biểu đồ cũ nếu tồn tại
        if ((window as any).categoryChartInstance) {
          (window as any).categoryChartInstance.destroy();
        }
        
        const ctxCategories = (categoriesChart as HTMLCanvasElement).getContext('2d');
        if (!ctxCategories) return;
        
        const categories = topCategories.map(item => item.name);
        const categoryValues = topCategories.map(item => item.value);
        
        (window as any).categoryChartInstance = new (window as any).Chart(ctxCategories, {
          type: 'doughnut',
          data: {
            labels: categories,
            datasets: [{
              data: categoryValues,
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(249, 115, 22, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(139, 92, 246, 0.8)'
              ],
              borderColor: '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = Math.round((value * 100) / total);
                    return `${context.label}: ${new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0
                    }).format(value)} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      };
      
      // Vẽ biểu đồ sản phẩm
      const renderProductChart = () => {
        const productsChart = document.getElementById('productsChart');
        if (!productsChart) return;
        
        // Xóa biểu đồ cũ nếu tồn tại
        if ((window as any).productChartInstance) {
          (window as any).productChartInstance.destroy();
        }
        
        const ctxProducts = (productsChart as HTMLCanvasElement).getContext('2d');
        if (!ctxProducts) return;
        
        const products = topProducts.map(item => item.name);
        const productCounts = topProducts.map(item => item.count);
        
        (window as any).productChartInstance = new (window as any).Chart(ctxProducts, {
          type: 'pie',
          data: {
            labels: products,
            datasets: [{
              data: productCounts,
              backgroundColor: [
                'rgba(236, 72, 153, 0.8)',
                'rgba(124, 58, 237, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)'
              ],
              borderColor: '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                    const count = context.raw;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = Math.round((count * 100) / total);
                    return `${context.label}: ${count} đơn (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      };
      
      // Sử dụng setTimeout để đảm bảo DOM đã được render
      setTimeout(() => {
        renderCategoryChart();
        renderProductChart();
      }, 300);
    }
  }, [topCategories, topProducts, isLoading]);
  
  return (
    <AdminLayout title="Phân tích xu hướng đơn hàng">
      <Head>
        <title>Phân tích xu hướng đơn hàng | Yumin Admin</title>
      </Head>
      
      {/* Import thư viện Chart.js */}
      <Script src="https://cdn.jsdelivr.net/npm/chart.js"></Script>
      
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <button 
              onClick={handleGoBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Quay lại trang quản lý đơn hàng"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Phân tích xu hướng đơn hàng</h1>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-md transition-colors ${
                showFilters 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiFilter className="mr-2" />
              {showFilters ? 'Ẩn bộ lọc' : 'Lọc dữ liệu'}
            </button>
            
            <button
              onClick={handleExportReport}
              className="px-4 py-2 flex items-center text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 transition-colors"
            >
              <FiDownload className="mr-2" />
              Xuất báo cáo
            </button>
          </div>
        </div>
        
        {/* Thông tin giải thích trang phân tích xu hướng */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-purple-800 mb-2 flex items-center">
            <FiTrendingUp className="mr-2 text-purple-600" />
            Phân tích xu hướng đơn hàng
          </h2>
          <p className="text-purple-700 mb-2">
            Khác với chế độ <b>Thống kê nâng cao</b> trên trang quản lý đơn hàng, trang phân tích xu hướng cung cấp:
          </p>
          <ul className="list-disc list-inside text-purple-700 space-y-1 ml-2">
            <li>So sánh chi tiết với kỳ trước để phân tích tăng trưởng</li>
            <li>Biểu đồ phân tích danh mục và sản phẩm phổ biến nhất</li>
            <li>Dữ liệu về khách hàng mới và giá trị đơn hàng trung bình</li>
            <li>Khả năng xuất báo cáo đầy đủ để phân tích sâu hơn</li>
          </ul>
        </div>
        
        {/* Bộ lọc */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Tùy chọn lọc</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Tất cả</option>
                  <option value="cod">COD</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="momo">Ví Momo</option>
                  <option value="zalopay">ZaloPay</option>
                  <option value="vnpay">VNPay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục sản phẩm</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Tất cả</option>
                  <option value="skincare">Chăm sóc da</option>
                  <option value="makeup">Trang điểm</option>
                  <option value="cleansing">Làm sạch</option>
                  <option value="mask">Mặt nạ</option>
                  <option value="lipstick">Son môi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn hàng</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600">
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        )}
        
        {/* Component thống kê nâng cao */}
        <OrderStatsAdvanced 
          periodType={periodType} 
          onPeriodChange={handlePeriodChange}
        />
        
        {/* Bảng so sánh */}
        {!isLoading && comparisonData && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiTrendingUp className="mr-2 text-pink-500" />
              So sánh với kỳ trước
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chỉ số
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {comparisonData.previousPeriod.label}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {comparisonData.currentPeriod.label}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thay đổi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Tổng đơn hàng
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {comparisonData.previousPeriod.orders.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {comparisonData.currentPeriod.orders.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${comparisonData.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonData.growth.orders >= 0 ? '+' : ''}{comparisonData.growth.orders.toFixed(1)}%
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Doanh thu
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(comparisonData.previousPeriod.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(comparisonData.currentPeriod.revenue)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${comparisonData.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonData.growth.revenue >= 0 ? '+' : ''}{comparisonData.growth.revenue.toFixed(1)}%
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Giá trị đơn hàng trung bình
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(comparisonData.previousPeriod.avgOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(comparisonData.currentPeriod.avgOrderValue)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${comparisonData.growth.avgOrderValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonData.growth.avgOrderValue >= 0 ? '+' : ''}{comparisonData.growth.avgOrderValue.toFixed(1)}%
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Khách hàng mới
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {comparisonData.previousPeriod.newCustomers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {comparisonData.currentPeriod.newCustomers.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${comparisonData.growth.newCustomers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonData.growth.newCustomers >= 0 ? '+' : ''}{comparisonData.growth.newCustomers.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Biểu đồ xu hướng */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-indigo-500" />
            Biểu đồ xu hướng theo thời gian
          </h2>
          
          <div className="flex space-x-4 mb-4">
            <button 
              className={`px-3 py-1 rounded-md text-sm ${periodType === 'week' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => handlePeriodChange('week')}
            >
              Tuần
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${periodType === 'month' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => handlePeriodChange('month')}
            >
              Tháng
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${periodType === 'quarter' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => handlePeriodChange('quarter')}
            >
              Quý
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${periodType === 'year' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => handlePeriodChange('year')}
            >
              Năm
            </button>
          </div>
          
          <div className="relative h-80">
            <canvas id="trendChart" className="w-full h-full"></canvas>
          </div>
        </div>
        
        {/* Phân tích danh mục và sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Top danh mục */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiBarChart2 className="mr-2 text-green-500" />
              Danh mục phổ biến nhất
            </h2>
            
            <div className="h-72 relative">
              <canvas id="categoriesChart"></canvas>
            </div>
          </div>
          
          {/* Top sản phẩm */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiBarChart2 className="mr-2 text-pink-500" />
              Sản phẩm bán chạy nhất
            </h2>
            
            <div className="h-72 relative">
              <canvas id="productsChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderTrendsPage; 