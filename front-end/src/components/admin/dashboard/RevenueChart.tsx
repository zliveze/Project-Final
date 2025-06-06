import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipCallbacks,
  Chart,
  CoreChartOptions,
  TooltipItem, // Added for Tooltip context
  ChartDataset, // Added for dataset typing
  Element,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAdminOrder } from '@/contexts/AdminOrderContext';

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

const RevenueChart = () => {
  const { orderStats, loading, fetchOrderStats } = useAdminOrder();
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (!hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      // Gọi API để lấy thống kê doanh thu
      fetchOrderStats('month');
    }
  }, [hasAttemptedFetch, fetchOrderStats]);

  useEffect(() => {
    // Cập nhật dữ liệu biểu đồ khi có dữ liệu thực từ API
    if (!loading && orderStats?.monthlyStats?.length > 0 && !isDataLoaded) {
      const labels = orderStats.monthlyStats.map(item => item.month);
      const revenueData = orderStats.monthlyStats.map(item => item.revenue);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Doanh thu (VNĐ)',
            data: revenueData,
            backgroundColor: 'rgba(236, 72, 153, 0.6)', // Pink color
            borderColor: 'rgba(236, 72, 153, 1)',
            borderWidth: 1,
          },
        ],
      });

      setIsDataLoaded(true);
    }
  }, [orderStats, loading, isDataLoaded]);

  // Tùy chọn cấu hình của biểu đồ
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem: TooltipItem<'bar'>) {
            const value = tooltipItem.parsed?.y;
            if (typeof value === 'number') {
              return `Doanh thu: ${value.toLocaleString('vi-VN')} VNĐ`;
            }
            return '';
          },
        } as Partial<TooltipCallbacks<'bar'>>,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return value.toLocaleString('vi-VN') + ' VNĐ';
            }
            return value;
          },
        },
      },
    },
    // Hiển thị số liệu ở đầu cột
    animation: {
      onComplete: function(context: { chart: Chart<'bar'> }) { // Using a more generic context type
        const chartInstance = context.chart;
        if (!chartInstance || !chartInstance.ctx) {
          return;
        }

        const ctx = chartInstance.ctx;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';

        chartInstance.data.datasets.forEach((dataset: ChartDataset<'bar'>, i: number) => {
          const meta = chartInstance.getDatasetMeta(i);
          if (meta && meta.data) {
            meta.data.forEach((element: Element, index: number) => {
              const dataPointValue = dataset.data?.[index] as number;
              if (dataPointValue > 0 && element && typeof element.x === 'number' && typeof element.y === 'number') {
                ctx.fillText(
                  dataPointValue.toLocaleString('vi-VN'),
                  element.x,
                  element.y - 5
                );
              }
            });
          }
        });
      }
    } as CoreChartOptions<'bar'>['animation']
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h2>
      <div className="w-full h-64">
        {!isDataLoaded ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 border-t-2 border-b-2 border-pink-500 rounded-full animate-spin"></div>
          </div>
        ) : chartData.datasets.length > 0 ? (
          <Bar options={options} data={chartData} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Chưa có dữ liệu doanh thu
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
