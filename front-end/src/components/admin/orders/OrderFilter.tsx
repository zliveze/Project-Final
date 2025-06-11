import React, { useState } from 'react';
import { FiFilter, FiSave, FiFolder } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Interface cho các trạng thái của đơn hàng
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
  savedFilterName?: string;
}

// Props cho OrderFilter component
interface OrderFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: OrderFilterState) => void;
  currentFilters?: OrderFilterState;
}

// Dữ liệu mẫu cho bộ lọc đã lưu
const SAVED_FILTERS = [
  { id: 1, name: 'Đơn COD chưa thanh toán' },
  { id: 2, name: 'Đơn hoàn thành tháng này' },
  { id: 3, name: 'Đơn giá trị cao' }
];

// Component lọc nâng cao
export default function OrderFilter({ isOpen, onClose, onApply, currentFilters }: OrderFilterProps) {
  // State cho các bộ lọc
  const [filters, setFilters] = useState<OrderFilterState>(
    currentFilters || {
      status: 'all',
      paymentStatus: 'all',
      paymentMethod: 'all',
      timePeriod: 'all',
      dateRange: {
        from: '',
        to: ''
      },
      priceRange: {
        min: '',
        max: ''
      }
    }
  );

  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSavedFilters, setShowSavedFilters] = useState(false);

  // Xử lý thay đổi các trường input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFilters(prevFilters => ({
        ...prevFilters,
        [parent]: {
          ...(prevFilters[parent as 'dateRange' | 'priceRange']),
          [child]: value
        }
      }));
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }

    // Nếu thay đổi timePeriod, đặt lại dateRange
    if (name === 'timePeriod' && value !== 'custom') {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          from: '',
          to: ''
        }
      }));
    }
  };

  // Xử lý reset bộ lọc
  const handleReset = () => {
    setFilters({
      status: 'all',
      paymentStatus: 'all',
      paymentMethod: 'all',
      timePeriod: 'all',
      dateRange: {
        from: '',
        to: ''
      },
      priceRange: {
        min: '',
        max: ''
      }
    });
    toast('Đã xóa tất cả bộ lọc', {
      id: 'reset-filters'
    });
  };

  // Xử lý áp dụng bộ lọc
  const handleApply = () => {
    toast.success('Đã áp dụng bộ lọc', {
      id: 'apply-filters'
    });
    onApply(filters);
    onClose();
  };

  // Giả lập lưu bộ lọc
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Vui lòng nhập tên bộ lọc', {
        id: 'save-filter-error'
      });
      return;
    }
    
    toast.success(`Đã lưu bộ lọc "${filterName}"`, {
      id: `save-filter-success-${filterName}`
    });
    setShowSaveFilter(false);
    setFilterName('');
  };

  // Giả lập tải bộ lọc
  const handleLoadFilter = (id: number, name: string) => {
    // Trong thực tế, đây sẽ là một API call để tải cấu hình bộ lọc
    // Hiện tại chỉ giả lập phần này
    
    const mockFilter: OrderFilterState = {
      status: id === 1 ? 'pending' : id === 2 ? 'completed' : 'all',
      paymentStatus: id === 1 ? 'pending' : 'all',
      paymentMethod: id === 1 ? 'COD' : 'all',
      timePeriod: id === 2 ? 'month' : 'all',
      dateRange: {
        from: '',
        to: ''
      },
      priceRange: {
        min: id === 3 ? '1000000' : '',
        max: ''
      },
      savedFilterName: name
    };
    
    setFilters(mockFilter);
    setShowSavedFilters(false);
    toast(`Đã tải bộ lọc: ${name}`, {
      id: `load-filter-${id}`
    });
  };

  // Hiển thị các trường ngày tháng tùy chỉnh khi chọn "Custom"
  const showCustomDateRange = filters.timePeriod === 'custom';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <FiFilter className="mr-2" /> Lọc đơn hàng nâng cao
                  </h3>
                  {filters.savedFilterName && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {filters.savedFilterName}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lọc theo khoảng thời gian */}
                  <div>
                    <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700 mb-1">
                      Khoảng thời gian
                    </label>
                    <select
                      id="timePeriod"
                      name="timePeriod"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      value={filters.timePeriod}
                      onChange={handleChange}
                    >
                      <option value="all">Tất cả thời gian</option>
                      <option value="today">Hôm nay</option>
                      <option value="yesterday">Hôm qua</option>
                      <option value="week">Tuần này</option>
                      <option value="last_week">Tuần trước</option>
                      <option value="month">Tháng này</option>
                      <option value="last_month">Tháng trước</option>
                      <option value="quarter">Quý này</option>
                      <option value="last_quarter">Quý trước</option>
                      <option value="year">Năm nay</option>
                      <option value="last_year">Năm trước</option>
                      <option value="custom">Tùy chỉnh...</option>
                    </select>
                  </div>
                
                  {/* Lọc theo trạng thái đơn hàng */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái đơn hàng
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      value={filters.status}
                      onChange={handleChange}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chờ xử lý</option>
                      <option value="shipped">Đang giao</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  
                  {/* Lọc theo trạng thái thanh toán */}
                  <div>
                    <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái thanh toán
                    </label>
                    <select
                      id="paymentStatus"
                      name="paymentStatus"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      value={filters.paymentStatus}
                      onChange={handleChange}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chưa thanh toán</option>
                      <option value="completed">Đã thanh toán</option>
                      <option value="failed">Thanh toán thất bại</option>
                      <option value="refunded">Đã hoàn tiền</option>
                    </select>
                  </div>
                  
                  {/* Lọc theo phương thức thanh toán */}
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Phương thức thanh toán
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      value={filters.paymentMethod}
                      onChange={handleChange}
                    >
                      <option value="all">Tất cả phương thức</option>
                      <option value="COD">COD (Tiền mặt)</option>
                      <option value="Momo">Ví Momo</option>
                      <option value="Stripe">Stripe</option>
                    </select>
                  </div>
                  
                  {/* Lọc theo khoảng thời gian tùy chỉnh */}
                  {showCustomDateRange && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Khoảng thời gian tùy chỉnh
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <span className="text-gray-500 text-sm mr-2">Từ:</span>
                          <input
                            type="date"
                            name="dateRange.from"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            value={filters.dateRange.from}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 text-sm mr-2">Đến:</span>
                          <input
                            type="date"
                            name="dateRange.to"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            value={filters.dateRange.to}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Lọc theo khoảng giá */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khoảng giá trị đơn hàng
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm mr-2">Từ:</span>
                        <input
                          type="number"
                          name="priceRange.min"
                          placeholder="Giá trị tối thiểu"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                          value={filters.priceRange.min}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm mr-2">Đến:</span>
                        <input
                          type="number"
                          name="priceRange.max"
                          placeholder="Giá trị tối đa"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                          value={filters.priceRange.max}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lưu bộ lọc */}
                <div className="mt-6 flex flex-col md:flex-row justify-between">
                  <div className="flex space-x-2 mb-4 md:mb-0">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      onClick={() => setShowSavedFilters(!showSavedFilters)}
                    >
                      <FiFolder className="mr-2" />
                      Bộ lọc đã lưu
                    </button>
                    
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      onClick={() => setShowSaveFilter(!showSaveFilter)}
                    >
                      <FiSave className="mr-2" />
                      Lưu bộ lọc này
                    </button>
                  </div>
                </div>
                
                {/* Form lưu bộ lọc */}
                {showSaveFilter && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Nhập tên bộ lọc..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                        onClick={handleSaveFilter}
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Danh sách bộ lọc đã lưu */}
                {showSavedFilters && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Chọn bộ lọc đã lưu</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {SAVED_FILTERS.map((filter) => (
                        <div 
                          key={filter.id} 
                          className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                          onClick={() => handleLoadFilter(filter.id, filter.name)}
                        >
                          <span className="text-sm">{filter.name}</span>
                          <button className="text-xs text-blue-600 hover:text-blue-800">Chọn</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleApply}
            >
              Áp dụng bộ lọc
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleReset}
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
