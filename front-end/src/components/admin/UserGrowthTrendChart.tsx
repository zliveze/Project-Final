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
  title = "Xu hướng tăng trưởng người dùng", 
  className = "", 
  onRefresh 
}: UserGrowthTrendChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');
  const [period, setPeriod] = useState<'6months' | '12months'>('12months');
  const [isLoading, setIsLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [maxCount, setMaxCount] = useState(0);

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
          <FiTrendingUp className="text-purple-500 w-5 h-5" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {isLoading && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin ml-2"></div>}
        </div>
        
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-purple-500 rounded transition-colors mr-1"
            title="Làm mới dữ liệu"
            disabled={isLoading}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-500' : ''}`} />
          </button>
          <button
            onClick={handleViewChange}
            className="p-1.5 text-gray-500 hover:text-purple-500 rounded transition-colors"
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
              ? 'bg-purple-100 text-purple-700 font-medium' 
              : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => handlePeriodChange('6months')}
          >
            6 tháng gần đây
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-full transition-colors ${period === '12months' 
              ? 'bg-purple-100 text-purple-700 font-medium' 
              : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => handlePeriodChange('12months')}
          >
            12 tháng gần đây
          </button>
        </div>
      </div>
      
      <div className="flex-grow px-5 py-4 relative">
        {/* Đường biểu đồ xu hướng */}
        <svg 
          className="w-full h-full" 
          viewBox="0 0 100 50" 
          preserveAspectRatio="none"
        >
          {/* Vẽ đường cơ sở */}
          <line 
            x1="0" 
            y1="49.5" 
            x2="100" 
            y2="49.5" 
            stroke="#e5e7eb" 
            strokeWidth="0.5"
          />
          
          {/* Đường biểu đồ chính */}
          {chartData.length > 1 && (
            <g>
              <path
                d={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = 49.5 - (point.count / maxCount * 45);
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="0.8"
                strokeLinecap="round"
                className={`${animate ? 'animate-draw-line' : ''}`}
                style={{ 
                  strokeDasharray: animate ? '1000' : '0',
                  strokeDashoffset: animate ? '1000' : '0',
                  animation: animate ? 'drawLine 1.5s ease-in-out forwards' : 'none'
                }}
              />
              
              {/* Điểm dữ liệu trên đường */}
              {chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                const y = 49.5 - (point.count / maxCount * 45);
                return (
                  <g key={index} className="group">
                    <circle
                      cx={x}
                      cy={y}
                      r={0.8}
                      fill="#8b5cf6"
                      className={`transition-all duration-300 hover:r-1.5 ${animate ? 'animate-show-points' : ''}`}
                      style={{
                        animationDelay: `${index * 150 + 500}ms`,
                        opacity: animate ? 0 : 1
                      }}
                    />
                    
                    {/* Tooltip hiển thị thông tin khi hover */}
                    <g 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      transform={`translate(${x}, ${y - 5})`}
                    >
                      <rect
                        x="-15"
                        y="-25"
                        width="30"
                        height="20"
                        rx="2"
                        fill="#1f2937"
                      />
                      <text
                        x="0"
                        y="-12"
                        textAnchor="middle"
                        fill="white"
                        fontSize="3"
                      >
                        {point.count}
                      </text>
                    </g>
                  </g>
                );
              })}
              
              {/* Khu vực tô màu bên dưới đường */}
              <path
                d={`
                  ${chartData.map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 49.5 - (point.count / maxCount * 45);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  L ${100} 49.5
                  L 0 49.5
                  Z
                `}
                fill="url(#gradientFill)"
                fillOpacity="0.2"
                className={`${animate ? 'animate-fill-gradient' : ''}`}
                style={{
                  opacity: animate ? 0 : 0.2
                }}
              />
              
              {/* Gradient cho khu vực tô màu */}
              <defs>
                <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </g>
          )}
        </svg>
        
        {/* Nhãn trục x */}
        <div className="flex justify-between mt-2">
          {chartData.map((item, index) => (
            <div key={index} className="text-xs text-gray-500">
              {item.month}
            </div>
          ))}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes fillGradient {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.2;
          }
        }
        
        @keyframes showPoints {
          from {
            opacity: 0;
            r: 0;
          }
          to {
            opacity: 1;
            r: 0.8;
          }
        }
        
        .animate-draw-line {
          animation: drawLine 1.5s ease-in-out forwards;
        }
        
        .animate-fill-gradient {
          animation: fillGradient 0.5s ease-in-out forwards 1s;
        }
        
        .animate-show-points {
          animation: showPoints 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
} 