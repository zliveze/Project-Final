import { useState, useEffect } from 'react';
import { FiBarChart2, FiChevronsUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';

interface DataPoint {
  month: string;
  count: number;
  growthRate?: number;
}

interface UserGrowthChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
  onRefresh?: () => void;
}

export default function UserGrowthChart({ 
  data, 
  title = "Tăng trưởng người dùng", 
  className = "", 
  onRefresh 
}: UserGrowthChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [growthRates, setGrowthRates] = useState<number[]>([]);
  const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');
  const [maxCount, setMaxCount] = useState(0);
  const [period, setPeriod] = useState<'6months' | '12months'>('12months');
  const [isLoading, setIsLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

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
    
    // Tìm giá trị lớn nhất trong dữ liệu
    const max = Math.max(...filteredData.map(item => item.count));
    setMaxCount(max);
    
    // Sử dụng growthRate từ API nếu có, nếu không thì tính toán
    const rates = filteredData.map((item, index) => {
      // Nếu đã có growthRate từ API và xem theo tháng, sử dụng trực tiếp
      if (item.growthRate !== undefined && view === 'monthly') {
        return item.growthRate;
      }
      
      // Nếu không có growthRate hoặc đang xem theo quý (đã tính ở trên), tự tính dựa trên dữ liệu hiện tại
      if (index === 0) return 0;
      const prevCount = filteredData[index - 1].count;
      if (prevCount === 0) return 100; // Tránh chia cho 0
      return ((item.count - prevCount) / prevCount) * 100;
    });
    
    setGrowthRates(rates);
    
    // Trì hoãn hiệu ứng để tạo animation
    setTimeout(() => {
      setChartData(filteredData);
      setIsLoading(false);
      setAnimate(true);
      
      // Reset animation sau khi hoàn thành
      setTimeout(() => {
        setAnimate(false);
      }, 800);
    }, 200);
  }, [data, period, view]);

  // Tính % tăng trưởng tổng thể
  const calculateGrowth = () => {
    if (chartData.length < 2) return 0;
    const firstValue = chartData[0].count;
    const lastValue = chartData[chartData.length - 1].count;
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const growth = calculateGrowth();
  const isPositiveGrowth = growth >= 0;

  // Xử lý thay đổi khoảng thời gian
  const handlePeriodChange = (newPeriod: '6months' | '12months') => {
    setPeriod(newPeriod);
    setAnimate(false);
  };

  // Xử lý thay đổi chế độ xem
  const handleViewChange = () => {
    setView(prev => prev === 'monthly' ? 'quarterly' : 'monthly');
    setAnimate(false);
  };

  // Xử lý refresh dữ liệu
  const handleRefresh = () => {
    if (onRefresh) {
      setIsLoading(true);
      setAnimate(false);
      onRefresh();
    }
  };
  
  // Lấy màu sắc cho biểu đồ dựa trên tỷ lệ tăng trưởng
  const getGrowthColor = (growth: number) => {
    if (growth > 10) return 'bg-gradient-to-t from-pink-500 to-pink-400';
    if (growth > 0) return 'bg-gradient-to-t from-green-500 to-green-400';
    if (growth < -10) return 'bg-gradient-to-t from-red-500 to-red-400';
    if (growth < 0) return 'bg-gradient-to-t from-orange-500 to-orange-400';
    return 'bg-gradient-to-t from-blue-500 to-blue-400';
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
      <div className="flex justify-between items-center p-5 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <FiBarChart2 className="text-pink-500 w-5 h-5" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {isLoading && <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin ml-2"></div>}
        </div>
        
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-pink-500 rounded transition-colors mr-1"
            title="Làm mới dữ liệu"
            disabled={isLoading}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-500' : ''}`} />
          </button>
          <button
            onClick={handleViewChange}
            className="p-1.5 text-gray-500 hover:text-pink-500 rounded transition-colors"
            title={view === 'monthly' ? "Xem theo quý" : "Xem theo tháng"}
          >
            <FiCalendar className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-5 pt-3">
        <div className="flex items-center space-x-1.5">
          <button
            className={`px-2 py-1 text-xs rounded-full transition-colors ${period === '6months' 
              ? 'bg-pink-100 text-pink-700 font-medium' 
              : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => handlePeriodChange('6months')}
          >
            6 tháng gần đây
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-full transition-colors ${period === '12months' 
              ? 'bg-pink-100 text-pink-700 font-medium' 
              : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => handlePeriodChange('12months')}
          >
            12 tháng gần đây
          </button>
        </div>
        
        <div className="flex items-center">
          <div className={`text-sm font-medium ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            {isPositiveGrowth ? <FiChevronsUp className="mr-0.5" /> : <FiChevronsUp className="mr-0.5 transform rotate-180" />}
            {Math.abs(growth).toFixed(1)}% tăng trưởng tổng thể
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex items-end space-x-1 px-5 py-4">
        {chartData.map((item, index) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const growthRate = growthRates[index];
          const isPositive = growthRate >= 0;
          const barColor = getGrowthColor(growthRate);
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0 group relative">
              <div className="w-full bg-gray-50 rounded-t-md relative" style={{ height: `calc(100% - 34px)` }}>
                <div 
                  className={`absolute bottom-0 left-0 right-0 ${barColor} rounded-t-md transition-all duration-500 shadow-md ${animate ? 'animate-grow-height' : ''} hover:brightness-110`}
                  style={{ 
                    height: animate ? '0%' : `${height}%`,
                    animation: animate ? `growHeight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards` : 'none',
                    transitionDelay: `${index * 70}ms`
                  }}
                >
                  {/* Tooltip hiển thị khi di chuột qua */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                    <div className="font-medium">{item.count.toLocaleString()} người dùng</div>
                    {index > 0 && (
                      <div className={isPositive ? 'text-green-300' : 'text-red-300'}>
                        {isPositive ? '+' : ''}{growthRate.toFixed(1)}% so với {view === 'monthly' ? 'tháng' : 'quý'} trước
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">
                {item.month}
              </div>
              {/* Hiển thị % tăng trưởng dưới tháng */}
              {index > 0 && (
                <div className={`text-[10px] ${isPositive ? 'text-green-600' : 'text-red-500'} font-medium`}>
                  {isPositive ? '+' : ''}{growthRate.toFixed(1)}%
                </div>
              )}
            </div>
          );
        })}
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
      `}</style>
    </div>
  );
} 