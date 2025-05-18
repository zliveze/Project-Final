import { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
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
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Filter and Search */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-colors duration-200"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="flash_sale">Flash Sale</option>
                <option value="sale">Khuyến mãi</option>
                <option value="promotion">Ưu đãi</option>
                <option value="holiday">Sự kiện lễ hội</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-colors duration-200"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="ended">Đã kết thúc</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="flex items-center">
              <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-600">Hiển thị:</label>
              <div className="relative">
                <select
                  id="items-per-page"
                  className="appearance-none pl-3 pr-8 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white transition-colors duration-200"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-pink-50">
            <tr>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Sự kiện
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Loại
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Thời gian
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {currentEvents.length > 0 ? (
              currentEvents.map((event) => {
                const status = getEventStatus(event);
                const type = getEventType(event);

                return (
                  <tr key={event._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-pink-600 font-medium text-lg">{event.title.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs mt-0.5">{event.description}</div>
                          <div className="flex flex-wrap mt-2">
                            {event.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1.5 transition-colors duration-150 hover:bg-gray-200">
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 2 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 transition-colors duration-150 hover:bg-gray-200">
                                +{event.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800 transition-colors duration-150 hover:bg-pink-200">
                        {getEventTypeText(type)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(event.startDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        {format(new Date(event.endDate), 'dd/MM/yyyy')}
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)} transition-colors duration-150`}>
                        {getStatusText(status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => onView(event._id)}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
                          title="Xem chi tiết"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onEdit(event._id)}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors duration-150"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onDelete(event._id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors duration-150"
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
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">Không tìm thấy sự kiện nào</p>
                    <p className="text-sm">Thử thay đổi bộ lọc hoặc tạo sự kiện mới</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div onClick={(e) => {
            // Ngăn chặn sự kiện lan truyền đến form cha
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
              className="py-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}