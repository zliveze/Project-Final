import { useState, useEffect } from 'react';
import { FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';

interface DataPoint {
  month: string;
  count: number;
  growthRate?: number;
}

interface UserGrowthTrendChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
  onRefresh?: () => void;
}

export default function UserGrowthTrendChart({
  data,
  className = "",
  onRefresh
}: UserGrowthTrendChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');
  const [period, setPeriod] = useState<'6months' | '12months'>('12months');
  const [isLoading, setIsLoading] = useState(false);
  // Không cần animate nữa vì chúng ta đã loại bỏ animation

  useEffect(() => {
    // Không có dữ liệu
    if (!data || data.length === 0) return;

    setIsLoading(true);

    // Lọc dữ liệu theo khoảng thời gian
    let filteredData = [...data];

    if (period === '6months') {
      filteredData = data.slice(-6);
    }

    if (view === 'quarterly') {
      // Tạo dữ liệu theo quý bằng cách gộp các tháng
      const quarterlyData: DataPoint[] = [];
      const quarters: Record<string, {count: number, prevCount: number}> = {};

      filteredData.forEach((item, index) => {
        const monthNum = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"].indexOf(item.month);
        const quarter = Math.floor(monthNum / 3) + 1;
        const year = new Date().getFullYear();
        const quarterKey = `Q${quarter}/${year}`;

        if (quarters[quarterKey]) {
          quarters[quarterKey].count += item.count;
        } else {
          // Lưu số lượng tháng đầu tiên của quý để tính tỷ lệ tăng trưởng
          const prevQuarterKey = index > 0 ? `Q${Math.floor((monthNum - 3) / 3) + 1}/${year}` : '';
          const prevCount = prevQuarterKey && quarters[prevQuarterKey] ? quarters[prevQuarterKey].count : 0;

          quarters[quarterKey] = {
            count: item.count,
            prevCount: prevCount
          };
        }
      });

      Object.keys(quarters).forEach(quarter => {
        // Tính tỷ lệ tăng trưởng cho quý
        let growthRate: number | undefined = undefined;
        const { count, prevCount } = quarters[quarter];

        if (prevCount > 0) {
          growthRate = ((count - prevCount) / prevCount) * 100;
        } else if (count > 0) {
          growthRate = 100;
        } else {
          growthRate = 0;
        }

        quarterlyData.push({
          month: quarter,
          count: count,
          growthRate
        });
      });

      filteredData = quarterlyData;
    }

    // Trì hoãn hiệu ứng để tạo animation
    setTimeout(() => {
      setChartData(filteredData);
      setIsLoading(false);

      // Không cần reset animation nữa
    }, 200);
  }, [data, period, view]);

  // Xử lý thay đổi khoảng thời gian
  const handlePeriodChange = (newPeriod: '6months' | '12months') => {
    setPeriod(newPeriod);
    // Không cần setAnimate nữa
  };

  // Xử lý thay đổi chế độ xem
  const handleViewChange = () => {
    setView(prev => prev === 'monthly' ? 'quarterly' : 'monthly');
    // Không cần setAnimate nữa
  };

  // Xử lý refresh dữ liệu
  const handleRefresh = () => {
    if (onRefresh) {
      setIsLoading(true);
      // Không cần setAnimate nữa
      onRefresh();
    }
  };

  // Hiển thị thông báo khi không có dữ liệu
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg h-full flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Không có dữ liệu biểu đồ</p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <FiTrendingUp className="text-blue-600 w-5 h-5" />
          <h3 className="text-base font-medium text-gray-800">Tỷ lệ tăng trưởng theo tháng</h3>
          {isLoading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-2"></div>}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded transition-colors"
            title="Làm mới dữ liệu"
            disabled={isLoading}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleViewChange}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded transition-colors"
            title={view === 'monthly' ? "Xem theo quý" : "Xem theo tháng"}
          >
            <FiCalendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center space-x-1.5">
          <button
            className={`px-2 py-1 text-xs rounded transition-colors ${period === '6months'
              ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
              : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
            onClick={() => handlePeriodChange('6months')}
          >
            6 tháng gần đây
          </button>
          <button
            className={`px-2 py-1 text-xs rounded transition-colors ${period === '12months'
              ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
              : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
            onClick={() => handlePeriodChange('12months')}
          >
            12 tháng gần đây
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-xs text-gray-600">Tăng trưởng dương</span>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-xs text-gray-600">Tăng trưởng âm</span>
          </div>
        </div>
      </div>

      <div className="flex-grow px-4 py-4 relative">
        {/* Biểu đồ cột */}
        <div className="h-full flex flex-col">
          {/* Đường lưới ngang */}
          <div className="flex-grow relative" style={{height: '200px'}}>
            <div className="absolute inset-0">
              <div className="h-1/4 border-t border-gray-100"></div>
              <div className="h-1/4 border-t border-gray-100"></div>
              <div className="h-1/4 border-t border-gray-100"></div>
              <div className="h-1/4 border-t border-gray-100"></div>
            </div>

            {/* Biểu đồ cột cho tỷ lệ tăng trưởng */}
            <div className="absolute inset-0 flex items-end px-1">
              {chartData.map((item, index) => {
                // Tính tỷ lệ tăng trưởng
                let growthRate = 0;
                if (index > 0) {
                  const prevCount = chartData[index - 1].count;
                  if (prevCount > 0) {
                    growthRate = ((item.count - prevCount) / prevCount) * 100;
                  }
                }

                // Xác định màu sắc dựa trên tỷ lệ tăng trưởng
                let barColor = "bg-gray-300";
                if (growthRate > 10) barColor = "bg-emerald-500";
                else if (growthRate > 0) barColor = "bg-green-500";
                else if (growthRate < -10) barColor = "bg-red-500";
                else if (growthRate < 0) barColor = "bg-orange-500";
                else barColor = "bg-blue-500";

                // Giới hạn tỷ lệ tăng trưởng để hiển thị
                const absGrowthRate = Math.abs(growthRate);
                // Tỷ lệ tăng trưởng tối đa hiển thị là 50%
                const height = Math.min(absGrowthRate, 50) * 2; // Nhân đôi để tỷ lệ 50% chiếm 100% chiều cao

                return (
                  <div key={index} className="flex flex-col items-center mx-1 group relative h-full" style={{width: `${100/chartData.length - 2}%`}}>
                    {/* Hiển thị tỷ lệ tăng trưởng ở đầu cột */}
                    <div
                      className="absolute -top-6 w-full text-center"
                    >
                      <span className={`text-xs font-medium ${growthRate > 0 ? 'text-emerald-600' : growthRate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {index === 0 ? '-' : (growthRate > 0 ? '+' : '')}{index === 0 ? '' : growthRate.toFixed(1) + '%'}
                      </span>
                    </div>

                    {/* Cột biểu đồ */}
                    <div className="w-full h-full relative">
                      <div
                        className={`w-full ${barColor} rounded-t transition-all duration-300 absolute bottom-0`}
                        style={{
                          height: index === 0 ? '0%' : `${height}%`,
                          minHeight: index === 0 ? '0px' : '4px'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nhãn trục x */}
          <div className="flex mt-2 px-1">
            {chartData.map((item, index) => (
              <div key={index} className="text-xs text-gray-500 font-medium text-center mx-1" style={{width: `${100/chartData.length - 2}%`}}>
                {item.month}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes growHeight {
          0% {
            height: 0%;
          }
          100% {
            height: var(--final-height);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
