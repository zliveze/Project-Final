import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAdminUser } from '@/contexts/AdminUserContext';

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill?: boolean;
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
    // Chỉ cập nhật dữ liệu biểu đồ khi có dữ liệu thống kê
    if (!loading && stats?.monthlyCounts?.length > 0 && !isDataLoaded) {
      // Cập nhật nhãn và dữ liệu
      const labels = stats.monthlyCounts.map(item => item.month);
      const data = stats.monthlyCounts.map(item => item.count);
      
      // Tính toán số liệu tăng trưởng cho đường thứ hai (nếu có)
      const growthRates = stats.monthlyCounts
        .filter(item => item.growthRate !== undefined)
        .map(item => item.growthRate as number);
      
      setChartData({
        labels,
        datasets: [
          {
            label: 'Tổng số người dùng',
            data,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Tỷ lệ tăng trưởng (%)',
            data: growthRates,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3,
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
        text: 'Tăng trưởng người dùng theo tháng',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          },
        },
      },
    },
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
          <Line options={options} data={chartData} />
        )}
      </div>
    </div>
  );
};

export default UserGrowthChart; 