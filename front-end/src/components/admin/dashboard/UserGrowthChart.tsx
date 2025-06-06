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
  TooltipItem,
  ChartDataset,
  Element,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAdminUser } from '@/contexts/AdminUserContext';

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

const UserGrowthChart = () => {
  const { stats, loading } = useAdminUser();
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  // Sử dụng state để tránh hiệu ứng nhấp nháy khi chuyển trang
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // Cập nhật dữ liệu biểu đồ khi có dữ liệu thống kê từ AdminUserContext
    if (!loading && stats?.monthlyCounts?.length > 0 && !isDataLoaded) {
      // Cập nhật nhãn và dữ liệu
      const labels = stats.monthlyCounts.map(item => item.month);

      // Hiển thị tỷ lệ tăng trưởng thay vì số lượng người dùng
      const growthRates = stats.monthlyCounts.map(item => item.growthRate || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Tỷ lệ tăng trưởng (%)',
            data: growthRates,
            backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue color
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      });

      setIsDataLoaded(true);
    }
  }, [stats, loading, isDataLoaded]);

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
              return `Tăng trưởng: ${value.toFixed(1)}%`;
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
              return value + '%';
            }
            return value;
          },
        },
      },
    },
    // Hiển thị số liệu ở đầu cột
    animation: {
      onComplete: function(context: { chart: Chart<'bar'> }) {
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
              if (dataPointValue !== 0 && element && typeof element.x === 'number' && typeof element.y === 'number') {
                ctx.fillText(
                  dataPointValue.toFixed(1) + '%',
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
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold mb-4">Tăng trưởng người dùng</h2>
      <div className="w-full h-64">
        {!isDataLoaded ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <Bar options={options} data={chartData} />
        )}
      </div>
    </div>
  );
};

export default UserGrowthChart;
