import { useState } from 'react';
import { Edit2, Trash2, Eye, Search, Filter, ChevronDown } from 'lucide-react'; // Updated icons
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Pagination from '../common/Pagination';
import { Event } from '@/contexts/EventsContext';

// Định nghĩa kiểu dữ liệu cho props
interface EventsTableProps {
  events: Event[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Dữ liệu mẫu không còn cần thiết nữa, đã được xóa

export default function EventsTable({ events, onView, onEdit, onDelete }: EventsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, ongoing, ended
  const [eventType, setEventType] = useState('all'); // Lọc theo loại sự kiện (dựa trên tags)
  const [itemsPerPage, setItemsPerPage] = useState(10); // Số sự kiện hiển thị mỗi trang
  const [showFilters, setShowFilters] = useState(false); // State to toggle filter visibility

  // Tính toán trạng thái của sự kiện
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'ongoing';
  };

  // Xác định loại sự kiện dựa trên tags
  const getEventType = (event: Event) => {
    const tags = event.tags.map(tag => tag.toLowerCase());
    if (tags.includes('flash sale')) return 'flash_sale';
    if (tags.includes('sale') || tags.includes('khuyến mãi')) return 'sale';
    if (tags.includes('tết') || tags.includes('lễ')) return 'holiday';
    return 'promotion';
  };

  // Text hiển thị cho các loại sự kiện
  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'flash_sale': return 'Flash Sale';
      case 'sale': return 'Khuyến mãi';
      case 'holiday': return 'Sự kiện lễ hội';
      case 'promotion': return 'Ưu đãi';
      default: return type;
    }
  };

  // Lọc sự kiện theo trạng thái, loại và từ khóa tìm kiếm
  const filteredEvents = events.filter(event => {
    // Lọc theo trạng thái
    if (filterStatus !== 'all') {
      const status = getEventStatus(event);
      if (status !== filterStatus) return false;
    }

    // Lọc theo loại sự kiện
    if (eventType !== 'all') {
      const type = getEventType(event);
      if (type !== eventType) return false;
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Tính toán tổng số trang
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  // Lấy các sự kiện cho trang hiện tại
  const currentEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Xử lý chuyển trang
  const handlePageChange = (page: number) => {
    // Tránh việc gọi API liên tục khi đang ở cùng trang
    if (page !== currentPage) {
      console.log('Chuyển đến trang:', page);
      setCurrentPage(page);
    }
  };

  // Xử lý thay đổi số lượng hiển thị
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi số lượng hiển thị
  };

  // Hàm hiển thị màu cho trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm hiển thị text cho trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'ended':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
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
              placeholder="Tìm kiếm sự kiện..."
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
              <label htmlFor="eventTypeFilter" className="block text-xs font-medium text-slate-600 mb-1">Loại sự kiện</label>
              <select
                id="eventTypeFilter"
                className="appearance-none w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-sm transition-colors"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="flash_sale">Flash Sale</option>
                <option value="sale">Khuyến mãi</option>
                <option value="promotion">Ưu đãi</option>
                <option value="holiday">Sự kiện lễ hội</option>
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
                Sự kiện
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
            {currentEvents.length > 0 ? (
              currentEvents.map((event) => {
                const status = getEventStatus(event);
                const type = getEventType(event);

                return (
                  <tr key={event._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11 bg-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-pink-600 font-semibold text-base">{event.title.substring(0, 1).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-800 line-clamp-1">{event.title}</div>
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{event.description}</div>
                          <div className="flex flex-wrap mt-1.5">
                            {event.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mr-1.5 mb-1 transition-colors duration-150 hover:bg-slate-200">
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-1 transition-colors duration-150 hover:bg-slate-200">
                                +{event.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-pink-50 text-pink-700 transition-colors duration-150 hover:bg-pink-100">
                        {getEventTypeText(type)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">
                        {format(new Date(event.startDate), 'dd/MM/yyyy, HH:mm')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        đến {format(new Date(event.endDate), 'dd/MM/yyyy, HH:mm')}
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${getStatusColor(status)} transition-colors duration-150`}>
                        {getStatusText(status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => onView(event._id)}
                          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors duration-150"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(event._id)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-150"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(event._id)}
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
                    <p className="text-base font-medium">Không tìm thấy sự kiện nào</p>
                    <p className="text-sm">Vui lòng thử lại với bộ lọc khác hoặc tạo sự kiện mới.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <div onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredEvents.length}
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
