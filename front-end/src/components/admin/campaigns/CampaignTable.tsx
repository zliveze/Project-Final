import { useState, useEffect } from 'react';
import { Edit2, Trash2, Eye, Search, Filter, ChevronDown } from 'lucide-react'; // Updated icons
import { format } from 'date-fns';
// import { vi } from 'date-fns/locale'; // Removed unused import
import Pagination from '@/components/admin/common/Pagination';
import { Campaign } from '@/contexts/CampaignContext'; // Import Campaign type

// Định nghĩa kiểu dữ liệu cho props
interface CampaignTableProps {
  campaigns: Campaign[]; // Receive campaigns as prop
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (campaign: Campaign) => void; // Pass the whole campaign object
  onToggleStatus?: (id: string, currentStatus: string) => void; // Re-added as optional
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  onSearchChange: (search: string) => void;
  onFilterChange?: (filterType: string, value: string | Date | null) => void; // Add filter handler
}

export default function CampaignTable({ 
  campaigns,
  isLoading = false,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onView, 
  onEdit, 
  onDelete, 
  // onToggleStatus, // Still not destructured as it's not used in this component
  onPageChange,
  onItemsPerPageChange,
  onSearchChange,
  onFilterChange // Destructure new prop
}: CampaignTableProps) {
  // Local state for controlled inputs
  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedType, setSelectedType] = useState('all'); // Use 'all' as default
  const [showFilters, setShowFilters] = useState(false); // State to toggle filter visibility

  // Handle search input change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only call onSearchChange if searchTerm has actually changed 
      // (prevents initial call on mount if needed, though usually fine)
      onSearchChange(searchTerm); 
    }, 500); // Debounce time: 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onSearchChange]);

  // Handle type filter change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setSelectedType(newType);
    if (onFilterChange) {
      onFilterChange('type', newType === 'all' ? '' : newType); // Pass empty string if 'all'
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onItemsPerPageChange(Number(e.target.value));
  };

  // Function to get status text and color based on dates
  const getStatusInfo = (startDate: Date, endDate: Date): { text: string; color: string } => {
    const now = new Date();
    // Ensure dates are Date objects before comparison
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { text: 'Ngày không hợp lệ', color: 'bg-red-100 text-red-800' };
    }

    if (end < now) {
      return { text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
    } else if (start <= now && end >= now) {
      return { text: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
    } else if (start > now) {
      return { text: 'Lên lịch', color: 'bg-blue-100 text-blue-800' };
    } else {
      // Fallback for unexpected cases
      return { text: 'Không xác định', color: 'bg-yellow-100 text-yellow-800' }; 
    }
  };

  // Function to display campaign type text
  const getTypeText = (type: string) => {
    switch (type) {
      case 'Sale Event':
        return 'Sự kiện giảm giá';
      case 'Hero Banner':
        return 'Banner quảng cáo';
      default:
        return type || 'N/A'; // Handle potential undefined/empty type
    }
  };

  // Format date helper
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      // Ensure it's a Date object before formatting
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
          return 'Ngày không hợp lệ';
      }
      return format(dateObj, 'dd/MM/yyyy, HH:mm');
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return 'Lỗi định dạng';
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
      {/* Filter and Search Section */}
      <div className="p-5 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-grow sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm chiến dịch..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Button and Dropdowns */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 flex items-center transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Lọc
              <ChevronDown className={`h-4 w-4 ml-1.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="relative">
              <select
                id="items-per-page"
                className="appearance-none pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-sm transition-colors"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={10}>10 / trang</option>
                <option value={30}>30 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="campaignTypeFilter" className="block text-xs font-medium text-slate-600 mb-1">Loại chiến dịch</label>
              <select
                id="campaignTypeFilter"
                className="appearance-none w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-sm transition-colors"
                value={selectedType}
                onChange={handleTypeChange}
              >
                <option value="all">Tất cả loại</option>
                <option value="Sale Event">Sự kiện giảm giá</option>
                <option value="Hero Banner">Banner quảng cáo</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            <div className="relative">
              <label htmlFor="statusFilter" className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
              <select
                id="statusFilter"
                className="appearance-none w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-sm transition-colors"
                value="all"
                onChange={(e) => onFilterChange && onFilterChange('status', e.target.value === 'all' ? '' : e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="ended">Đã kết thúc</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Chiến dịch
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Loại
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Thời gian
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-pink-500"></div>
                    <p className="text-base font-medium">Đang tải dữ liệu...</p>
                  </div>
                </td>
              </tr>
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign) => {
                const statusInfo = getStatusInfo(campaign.startDate, campaign.endDate);
                return (
                  <tr key={campaign._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11 bg-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-pink-600 font-semibold text-base">{campaign.title.substring(0, 1).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-800 line-clamp-1">{campaign.title}</div>
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{campaign.description || 'Không có mô tả'}</div>
                          <div className="flex flex-wrap mt-1.5">
                            {campaign.products && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mr-1.5 mb-1 transition-colors duration-150 hover:bg-slate-200">
                                {campaign.products.length} sản phẩm
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-pink-50 text-pink-700 transition-colors duration-150 hover:bg-pink-100">
                        {getTypeText(campaign.type)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">
                        {formatDate(campaign.startDate)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        đến {formatDate(campaign.endDate)}
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${statusInfo.color} transition-colors duration-150`}>
                        {statusInfo.text}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => onView(campaign._id)}
                          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors duration-150"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(campaign._id)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-150"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(campaign)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-150"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Search className="h-10 w-10 text-slate-400" />
                    <p className="text-base font-medium">Không tìm thấy chiến dịch nào</p>
                    <p className="text-sm">Vui lòng thử lại với bộ lọc khác hoặc tạo chiến dịch mới.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <div onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showItemsInfo={true}
              className="py-1.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
