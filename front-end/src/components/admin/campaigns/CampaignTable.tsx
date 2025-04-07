import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiPause, FiPlay, FiSearch } from 'react-icons/fi';
import Image from 'next/image';
import Pagination from '@/components/admin/common/Pagination';
import { Campaign } from '@/contexts/CampaignContext'; // Import Campaign type
import { format } from 'date-fns'; // Import date-fns for formatting

interface CampaignTableProps {
  campaigns: Campaign[]; // Receive campaigns as prop
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (campaign: Campaign) => void; // Pass the whole campaign object
  onToggleStatus: (id: string, currentStatus: string) => void; // Keep for potential future use
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filterType: string, value: string | Date | null) => void; // Add filter handler
}

export default function CampaignTable({ 
  campaigns,
  isLoading,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onView, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onPageChange,
  onItemsPerPageChange,
  onSearchChange,
  onFilterChange // Destructure new prop
}: CampaignTableProps) {
  // Local state for controlled inputs
  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedType, setSelectedType] = useState(''); // Use empty string for 'all'

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
    onFilterChange('type', newType === 'all' ? '' : newType); // Pass empty string if 'all'
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

  // Function to display toggle button (Placeholder)
  const getToggleButton = (campaign: Campaign) => {
    const statusInfo = getStatusInfo(campaign.startDate, campaign.endDate);
    // This requires backend logic for pause/resume functionality
    if (statusInfo.text === 'Đang diễn ra') {
      return (
        <button 
          onClick={() => onToggleStatus(campaign._id, 'active')}
          className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Tạm dừng (Chưa hỗ trợ)"
          disabled // Disable until implemented
        >
          <FiPause className="h-5 w-5" />
        </button>
      );
    } else if (statusInfo.text === 'Lên lịch') {
      return (
        <button 
          onClick={() => onToggleStatus(campaign._id, 'inactive')}
          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Kích hoạt (Chưa hỗ trợ)"
          disabled // Disable until implemented
        >
          <FiPlay className="h-5 w-5" />
        </button>
      );
    }
    return null;
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
      return format(dateObj, 'dd/MM/yyyy');
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return 'Lỗi định dạng';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Filters Section */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="w-full md:w-auto md:flex-grow lg:max-w-xs">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm theo tiêu đề..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Other Filters */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
            {/* Type Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              value={selectedType}
              onChange={handleTypeChange}
            >
              <option value="">Tất cả loại</option> {/* Use empty string for 'all' */}
              <option value="Sale Event">Sự kiện giảm giá</option>
              <option value="Hero Banner">Banner quảng cáo</option>
            </select>
            
            {/* Items Per Page Selector */}
            <div className="flex items-center">
              <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-600 whitespace-nowrap">Hiển thị:</label>
              <select
                id="items-per-page"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chiến dịch
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign) => {
                const statusInfo = getStatusInfo(campaign.startDate, campaign.endDate);
                return (
                  <tr key={campaign._id} className="hover:bg-gray-50 transition-colors duration-150">
                    {/* Campaign Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Optional Image Placeholder */}
                        {/* <div className="flex-shrink-0 h-10 w-10 mr-4"> <Image ... /> </div> */}
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{campaign.title}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={campaign.description}>
                            {campaign.description || 'Không có mô tả'}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{getTypeText(campaign.type)}</div>
                      <div className="text-xs text-gray-500">{campaign.products?.length || 0} sản phẩm</div>
                    </td>
                    {/* Dates */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Từ: {formatDate(campaign.startDate)}</div>
                      <div>Đến: {formatDate(campaign.endDate)}</div>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                     {/* Created At */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => onView(campaign._id)}
                          className="text-gray-500 hover:text-pink-600 transition-colors duration-150"
                          title="Xem chi tiết"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        {/* {getToggleButton(campaign)} */}
                        <button 
                          onClick={() => onEdit(campaign._id)}
                          className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => onDelete(campaign)} // Pass whole campaign object
                          className="text-red-500 hover:text-red-700 transition-colors duration-150"
                          title="Xóa"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Không tìm thấy chiến dịch nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      { !isLoading && totalPages > 0 && (
        <div className="px-4 py-3 md:px-6 border-t border-gray-200 bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange} // Use handler from props
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
          />
        </div>
      )}
    </div>
  );
}
