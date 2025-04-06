import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiCopy, FiFilter, FiSearch, FiX, FiCalendar } from 'react-icons/fi';
import Pagination from '../common/Pagination';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Voucher } from '@/contexts/VoucherContext';

interface VoucherTableProps {
  voucherData: Voucher[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: any) => void;
  onItemsPerPageChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function VoucherTable({ 
  voucherData, 
  totalItems, 
  currentPage, 
  itemsPerPage, 
  isLoading, 
  onView, 
  onEdit, 
  onDelete, 
  onCopy,
  onPageChange,
  onFilterChange,
  onItemsPerPageChange
}: VoucherTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // Bộ lọc nâng cao
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [minOrderValueFilter, setMinOrderValueFilter] = useState<number | ''>('');
  const [maxOrderValueFilter, setMaxOrderValueFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Đếm tổng số trang
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Gửi thay đổi bộ lọc lên component cha
  useEffect(() => {
    const filters = {
      page: currentPage,
      limit: itemsPerPage,
      searchTerm,
      selectedStatus,
      selectedType,
      startDateFilter,
      endDateFilter,
      minOrderValueFilter,
      maxOrderValueFilter,
      sortBy,
      sortOrder
    };
    
    onFilterChange(filters);
  }, [searchTerm, selectedStatus, selectedType, 
      startDateFilter, endDateFilter, 
      minOrderValueFilter, maxOrderValueFilter,
      sortBy, sortOrder, currentPage, itemsPerPage]);

  // Reset tất cả bộ lọc về mặc định
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedType('all');
    setStartDateFilter(null);
    setEndDateFilter(null);
    setMinOrderValueFilter('');
    setMaxOrderValueFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    onPageChange(1);
  };

  // Hàm để hiển thị màu sắc dựa trên trạng thái voucher
  const getStatusColor = (voucher: Voucher) => {
    const now = new Date();
    
    if (!voucher.isActive) {
      return 'bg-gray-100 text-gray-800';
    }
    
    if (now < new Date(voucher.startDate)) {
      return 'bg-blue-100 text-blue-800'; // Chưa đến thời gian
    }
    
    if (now > new Date(voucher.endDate)) {
      return 'bg-red-100 text-red-800'; // Đã hết hạn
    }
    
    return 'bg-green-100 text-green-800'; // Đang hoạt động
  };

  // Hàm để hiển thị tên trạng thái voucher
  const getStatusText = (voucher: Voucher) => {
    const now = new Date();
    
    if (!voucher.isActive) {
      return 'Vô hiệu hóa';
    }
    
    if (now < new Date(voucher.startDate)) {
      return 'Chưa đến thời gian';
    }
    
    if (now > new Date(voucher.endDate)) {
      return 'Đã hết hạn';
    }
    
    return 'Đang hoạt động';
  };

  // Hàm để hiển thị loại giảm giá
  const getTypeText = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Phần trăm (%)';
      case 'fixed':
        return 'Số tiền cố định';
      default:
        return type;
    }
  };

  // Hàm để hiển thị giá trị giảm giá
  const getValueText = (voucher: Voucher) => {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(voucher.discountValue);
    }
  };

  // Hàm để hiển thị giá trị đơn hàng tối thiểu
  const getMinOrderValueText = (value: number) => {
    if (value === 0) return 'Không giới hạn';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(value);
  };

  // Hàm định dạng ngày tháng
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      {/* Thanh công cụ */}
      <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative rounded-md shadow-sm max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Tìm theo mã voucher"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchTerm ? (
                <FiX
                  className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-500"
                  onClick={() => setSearchTerm('')}
                />
              ) : (
                <FiSearch className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-28 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="scheduled">Lên lịch</option>
            <option value="inactive">Vô hiệu</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="block w-36 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
          >
            <option value="all">Tất cả loại</option>
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            {showAdvancedFilter ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'}
          </button>

          <button
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {/* Bộ lọc nâng cao */}
      {showAdvancedFilter && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
            <div className="relative">
              <DatePicker
                selected={startDateFilter}
                onChange={(date) => setStartDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholderText="Từ ngày"
                isClearable
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
            <div className="relative">
              <DatePicker
                selected={endDateFilter}
                onChange={(date) => setEndDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholderText="Đến ngày"
                isClearable
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn hàng tối thiểu từ</label>
            <input
              type="number"
              value={minOrderValueFilter}
              onChange={(e) => setMinOrderValueFilter(e.target.value === '' ? '' : Number(e.target.value))}
              className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Từ (VND)"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn hàng tối thiểu đến</label>
            <input
              type="number"
              value={maxOrderValueFilter}
              onChange={(e) => setMaxOrderValueFilter(e.target.value === '' ? '' : Number(e.target.value))}
              className="block w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Đến (VND)"
              min="0"
            />
          </div>
        </div>
      )}

      {/* Bảng voucher */}
      <div className="bg-white">
        <div className="mb-4 flex justify-between items-center px-4 py-5 sm:px-6">
          <div>
            <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium text-gray-700">
              Hiển thị:
            </label>
            <select
              id="itemsPerPage"
              name="itemsPerPage"
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
              value={itemsPerPage}
              onChange={onItemsPerPageChange}
              disabled={!onItemsPerPageChange}
            >
              <option value={5}>5 mục</option>
              <option value={10}>10 mục</option>
              <option value={20}>20 mục</option>
              <option value={50}>50 mục</option>
            </select>
          </div>
        </div>

        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
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
                      Đơn tối thiểu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời hạn
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
                  {isLoading ? (
                    // Hiển thị placeholder khi đang tải
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`loading-${index}`}>
                        {Array.from({ length: 7 }).map((_, cellIndex) => (
                          <td key={`loading-cell-${cellIndex}`} className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : voucherData.length === 0 ? (
                    // Hiển thị khi không có kết quả
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                        Không tìm thấy voucher phù hợp với điều kiện tìm kiếm
                      </td>
                    </tr>
                  ) : (
                    // Hiển thị danh sách voucher
                    voucherData.map((voucher) => (
                      <tr key={voucher._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{voucher.code}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{voucher.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getTypeText(voucher.discountType)}</div>
                          <div className="text-sm text-gray-500">{getValueText(voucher)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getMinOrderValueText(voucher.minimumOrderValue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(voucher.startDate)}</div>
                          <div className="text-sm text-gray-500">{formatDate(voucher.endDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span>{voucher.usedCount} / {voucher.usageLimit === 0 ? '∞' : voucher.usageLimit}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(voucher)}`}>
                            {getStatusText(voucher)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => onView(voucher._id)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Xem chi tiết"
                            >
                              <FiEye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onEdit(voucher._id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Chỉnh sửa"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onCopy(voucher._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Sao chép"
                            >
                              <FiCopy className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onDelete(voucher._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Phân trang */}
      {totalItems > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
            className="mt-6"
          />
        </div>
      )}
    </div>
  );
} 