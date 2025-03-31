import { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Pagination from '../common/Pagination';

// Định nghĩa kiểu dữ liệu cho props
interface EventsTableProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Định nghĩa kiểu dữ liệu cho event
export interface Event {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  startDate: Date;
  endDate: Date;
  products: {
    productId: string;
    variantId?: string;
    adjustedPrice: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Dữ liệu mẫu cho sự kiện
const sampleEvents: Event[] = [
  {
    _id: 'event1',
    title: 'Flash Sale Tháng 3',
    description: 'Giảm giá sốc cho sản phẩm chăm sóc da',
    tags: ['flash sale', 'chăm sóc da'],
    startDate: new Date('2024-03-15T00:00:00Z'),
    endDate: new Date('2024-03-20T23:59:59Z'),
    products: [
      { productId: 'prod1', adjustedPrice: 336000 },
      { productId: 'prod2', adjustedPrice: 208000 },
      { productId: 'prod3', adjustedPrice: 260000 }
    ],
    createdAt: new Date('2024-03-10T10:00:00Z'),
    updatedAt: new Date('2024-03-10T10:00:00Z')
  },
  {
    _id: 'event2',
    title: 'Ưu đãi tháng 4 - Trang điểm',
    description: 'Ưu đãi đặc biệt cho dòng sản phẩm trang điểm',
    tags: ['makeup', 'trang điểm'],
    startDate: new Date('2024-04-01T00:00:00Z'),
    endDate: new Date('2024-04-15T23:59:59Z'),
    products: [
      { productId: 'prod4', adjustedPrice: 420000 },
      { productId: 'prod5', adjustedPrice: 356000 },
      { productId: 'prod6', adjustedPrice: 189000 }
    ],
    createdAt: new Date('2024-03-15T10:00:00Z'),
    updatedAt: new Date('2024-03-15T10:00:00Z')
  },
  {
    _id: 'event3',
    title: 'Chào hè rực rỡ',
    description: 'Khuyến mãi các sản phẩm chống nắng và dưỡng thể',
    tags: ['summer', 'chống nắng'],
    startDate: new Date('2024-05-01T00:00:00Z'),
    endDate: new Date('2024-05-31T23:59:59Z'),
    products: [
      { productId: 'prod7', adjustedPrice: 540000 },
      { productId: 'prod8', adjustedPrice: 378000 },
      { productId: 'prod9', adjustedPrice: 298000 }
    ],
    createdAt: new Date('2024-04-10T10:00:00Z'),
    updatedAt: new Date('2024-04-10T10:00:00Z')
  },
  {
    _id: 'event4',
    title: 'Black Friday',
    description: 'Giảm giá toàn bộ sản phẩm trong cửa hàng',
    tags: ['black friday', 'sale'],
    startDate: new Date('2024-11-25T00:00:00Z'),
    endDate: new Date('2024-11-30T23:59:59Z'),
    products: [
      { productId: 'prod10', adjustedPrice: 245000 },
      { productId: 'prod11', adjustedPrice: 387000 },
      { productId: 'prod12', adjustedPrice: 456000 }
    ],
    createdAt: new Date('2024-11-01T10:00:00Z'),
    updatedAt: new Date('2024-11-01T10:00:00Z')
  },
  {
    _id: 'event5',
    title: 'Mừng Tết 2025',
    description: 'Khuyến mãi đặc biệt mừng xuân 2025',
    tags: ['tết', 'khuyến mãi'],
    startDate: new Date('2025-01-15T00:00:00Z'),
    endDate: new Date('2025-01-31T23:59:59Z'),
    products: [
      { productId: 'prod13', adjustedPrice: 198000 },
      { productId: 'prod14', adjustedPrice: 278000 }
    ],
    createdAt: new Date('2024-12-10T10:00:00Z'),
    updatedAt: new Date('2024-12-10T10:00:00Z')
  }
];

export default function EventsTable({ onView, onEdit, onDelete }: EventsTableProps) {
  const [events] = useState<Event[]>(sampleEvents);
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
    setCurrentPage(page);
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
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4 flex-wrap">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="flash_sale">Flash Sale</option>
              <option value="sale">Khuyến mãi</option>
              <option value="promotion">Ưu đãi</option>
              <option value="holiday">Sự kiện lễ hội</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="ended">Đã kết thúc</option>
            </select>

            <div className="flex items-center">
              <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-600">Hiển thị:</label>
              <select
                id="items-per-page"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                Sự kiện
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
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-pink-600 font-medium">{event.title.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                          <div className="flex flex-wrap mt-1">
                            {event.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                +{event.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                        {getEventTypeText(type)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(event.startDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        đến {format(new Date(event.endDate), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onView(event._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Xem chi tiết"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => onEdit(event._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => onDelete(event._id)}
                          className="text-red-600 hover:text-red-900"
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
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy sự kiện nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
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
      )}
    </div>
  );
} 