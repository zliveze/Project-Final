import { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiCopy, FiFilter, FiSearch, FiX, FiCalendar } from 'react-icons/fi';
import Pagination from '../common/Pagination';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Dữ liệu mẫu cho voucher
const sampleVouchers = [
  {
    id: 'VC-001',
    code: 'SUMMER2025',
    type: 'percent',
    value: 15,
    minOrderValue: 500000,
    maxDiscount: 100000,
    startDate: '01/06/2025',
    endDate: '30/06/2025',
    usageLimit: 100,
    usageCount: 45,
    status: 'active',
    createdAt: '15/03/2025'
  },
  {
    id: 'VC-002',
    code: 'WELCOME50K',
    type: 'fixed',
    value: 50000,
    minOrderValue: 300000,
    maxDiscount: null,
    startDate: '01/01/2025',
    endDate: '31/12/2025',
    usageLimit: 1000,
    usageCount: 358,
    status: 'active',
    createdAt: '14/03/2025'
  },
  {
    id: 'VC-003',
    code: 'FREESHIP',
    type: 'shipping',
    value: 100,
    minOrderValue: 200000,
    maxDiscount: 30000,
    startDate: '01/03/2025',
    endDate: '31/05/2025',
    usageLimit: 500,
    usageCount: 123,
    status: 'active',
    createdAt: '13/03/2025'
  },
  {
    id: 'VC-004',
    code: 'NEWYEAR2025',
    type: 'percent',
    value: 20,
    minOrderValue: 1000000,
    maxDiscount: 200000,
    startDate: '01/01/2025',
    endDate: '15/01/2025',
    usageLimit: 200,
    usageCount: 187,
    status: 'expired',
    createdAt: '12/12/2024'
  },
  {
    id: 'VC-005',
    code: 'FLASH100K',
    type: 'fixed',
    value: 100000,
    minOrderValue: 500000,
    maxDiscount: null,
    startDate: '10/04/2025',
    endDate: '12/04/2025',
    usageLimit: 50,
    usageCount: 0,
    status: 'scheduled',
    createdAt: '11/03/2025'
  },
  {
    id: 'VC-006',
    code: 'MEMBER10',
    type: 'percent',
    value: 10,
    minOrderValue: 0,
    maxDiscount: 50000,
    startDate: '01/01/2025',
    endDate: '31/12/2025',
    usageLimit: null,
    usageCount: 1245,
    status: 'active',
    createdAt: '10/03/2025'
  }
];

interface VoucherTableProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
}

export default function VoucherTable({ onView, onEdit, onDelete, onCopy }: VoucherTableProps) {
  const [vouchers, setVouchers] = useState(sampleVouchers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Bộ lọc nâng cao
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [minOrderValueFilter, setMinOrderValueFilter] = useState<number | ''>('');
  const [maxOrderValueFilter, setMaxOrderValueFilter] = useState<number | ''>('');
  
  const vouchersPerPage = 5;

  // Lọc voucher theo các tiêu chí
  const filteredVouchers = vouchers.filter(voucher => {
    // Lọc theo từ khóa tìm kiếm
    const matchesSearch = 
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Lọc theo trạng thái và loại
    const matchesStatus = selectedStatus === 'all' || voucher.status === selectedStatus;
    const matchesType = selectedType === 'all' || voucher.type === selectedType;
    
    // Lọc theo khoảng thời gian
    let matchesDateRange = true;
    if (startDateFilter) {
      const voucherStartDate = new Date(voucher.startDate.split('/').reverse().join('-'));
      matchesDateRange = matchesDateRange && voucherStartDate >= startDateFilter;
    }
    if (endDateFilter) {
      const voucherEndDate = new Date(voucher.endDate.split('/').reverse().join('-'));
      matchesDateRange = matchesDateRange && voucherEndDate <= endDateFilter;
    }
    
    // Lọc theo giá trị đơn hàng tối thiểu
    let matchesOrderValue = true;
    if (minOrderValueFilter !== '') {
      matchesOrderValue = matchesOrderValue && voucher.minOrderValue >= Number(minOrderValueFilter);
    }
    if (maxOrderValueFilter !== '') {
      matchesOrderValue = matchesOrderValue && voucher.minOrderValue <= Number(maxOrderValueFilter);
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDateRange && matchesOrderValue;
  });

  // Phân trang
  const indexOfLastVoucher = currentPage * vouchersPerPage;
  const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirstVoucher, indexOfLastVoucher);
  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);

  // Xử lý khi thay đổi trang
  const handlePageChange = (page: number) => {
    setIsLoading(true);
    // Giả lập delay khi tải dữ liệu
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 300);
  };

  // Reset tất cả bộ lọc về mặc định
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedType('all');
    setStartDateFilter(null);
    setEndDateFilter(null);
    setMinOrderValueFilter('');
    setMaxOrderValueFilter('');
    setCurrentPage(1);
  };

  // Hàm để hiển thị màu sắc dựa trên trạng thái voucher
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm để hiển thị tên trạng thái voucher
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'expired':
        return 'Đã hết hạn';
      case 'scheduled':
        return 'Lên lịch';
      default:
        return status;
    }
  };

  // Hàm để hiển thị tên loại voucher
  const getTypeText = (type: string) => {
    switch (type) {
      case 'percent':
        return 'Giảm theo %';
      case 'fixed':
        return 'Giảm số tiền cố định';
      case 'shipping':
        return 'Miễn phí vận chuyển';
      default:
        return type;
    }
  };

  // Hàm để hiển thị giá trị voucher
  const getValueText = (voucher: any) => {
    switch (voucher.type) {
      case 'percent':
        return `${voucher.value}%`;
      case 'fixed':
        return `${voucher.value.toLocaleString()}đ`;
      case 'shipping':
        return `${voucher.value}%`;
      default:
        return voucher.value;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col space-y-4">
          {/* Thanh tìm kiếm và lọc cơ bản */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm mã voucher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tất cả loại</option>
                <option value="percent">Giảm theo %</option>
                <option value="fixed">Giảm số tiền cố định</option>
                <option value="shipping">Miễn phí vận chuyển</option>
              </select>
              
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="expired">Đã hết hạn</option>
                <option value="scheduled">Lên lịch</option>
              </select>
              
              <button
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FiFilter className="mr-2 h-5 w-5 text-gray-500" />
                Bộ lọc nâng cao
              </button>
            </div>
          </div>
          
          {/* Bộ lọc nâng cao */}
          {showAdvancedFilter && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ ngày
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <DatePicker
                      selected={startDateFilter}
                      onChange={(date: Date | null) => {
                        setStartDateFilter(date);
                        setCurrentPage(1);
                      }}
                      selectsStart
                      startDate={startDateFilter || undefined}
                      endDate={endDateFilter || undefined}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholderText="Ngày bắt đầu"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đến ngày
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <DatePicker
                      selected={endDateFilter}
                      onChange={(date: Date | null) => {
                        setEndDateFilter(date);
                        setCurrentPage(1);
                      }}
                      selectsEnd
                      startDate={startDateFilter || undefined}
                      endDate={endDateFilter || undefined}
                      minDate={startDateFilter || undefined}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholderText="Ngày kết thúc"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị đơn tối thiểu từ
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderValueFilter}
                    onChange={(e) => {
                      setMinOrderValueFilter(e.target.value === '' ? '' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Từ giá trị"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đến giá trị
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxOrderValueFilter}
                    onChange={(e) => {
                      setMaxOrderValueFilter(e.target.value === '' ? '' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Đến giá trị"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <FiX className="mr-2 h-5 w-5 text-gray-500" />
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
          
          {/* Hiển thị thông tin về bộ lọc đang áp dụng */}
          {(searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || 
            startDateFilter || endDateFilter || minOrderValueFilter !== '' || maxOrderValueFilter !== '') && (
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
              <span className="text-gray-600">Đang lọc theo:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Từ khóa: {searchTerm}
                </span>
              )}
              
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Trạng thái: {getStatusText(selectedStatus)}
                </span>
              )}
              
              {selectedType !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Loại: {getTypeText(selectedType)}
                </span>
              )}
              
              {startDateFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Từ ngày: {startDateFilter.toLocaleDateString('vi-VN')}
                </span>
              )}
              
              {endDateFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Đến ngày: {endDateFilter.toLocaleDateString('vi-VN')}
                </span>
              )}
              
              {minOrderValueFilter !== '' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Giá trị từ: {Number(minOrderValueFilter).toLocaleString()}đ
                </span>
              )}
              
              {maxOrderValueFilter !== '' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Giá trị đến: {Number(maxOrderValueFilter).toLocaleString()}đ
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hiển thị trạng thái đang tải */}
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      )}
      
      {/* Bảng hiển thị dữ liệu */}
      <div className={`overflow-x-auto ${isLoading ? 'opacity-50' : ''}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã voucher
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại & Giá trị
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sử dụng
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentVouchers.map((voucher) => (
              <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{voucher.code}</div>
                    <div className="text-sm text-gray-500">Tối thiểu: {voucher.minOrderValue.toLocaleString()}đ</div>
                    {voucher.maxDiscount && (
                      <div className="text-sm text-gray-500">Tối đa: {voucher.maxDiscount.toLocaleString()}đ</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getTypeText(voucher.type)}</div>
                  <div className="text-sm font-medium text-gray-900">{getValueText(voucher)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">Từ: {voucher.startDate}</div>
                  <div className="text-sm text-gray-500">Đến: {voucher.endDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{voucher.usageCount} / {voucher.usageLimit || '∞'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(voucher.status)}`}>
                    {getStatusText(voucher.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onView(voucher.id)}
                      className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                      title="Xem chi tiết"
                    >
                      <FiEye className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onCopy(voucher.id)}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                      title="Sao chép"
                    >
                      <FiCopy className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onEdit(voucher.id)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(voucher.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Xóa"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!isLoading && filteredVouchers.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          <div className="inline-block p-2 rounded-full bg-gray-100 mb-2">
            <FiSearch className="h-6 w-6 text-gray-400" />
          </div>
          <p>Không tìm thấy voucher nào phù hợp với tiêu chí tìm kiếm</p>
        </div>
      )}
      
      {/* Phân trang */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredVouchers.length}
          itemsPerPage={vouchersPerPage}
          showItemsInfo={true}
          className="text-sm"
          maxVisiblePages={5}
        />
      </div>
    </div>
  );
} 