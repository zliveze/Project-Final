import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiCalendar, FiClock, FiCheckCircle, FiFileText } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import EventsTable, { Event } from '@/components/admin/events/EventsTable';
import EventAddModal from '@/components/admin/events/EventAddModal';
import EventEditModal from '@/components/admin/events/EventEditModal';
import EventViewModal from '@/components/admin/events/EventViewModal';
import EventDeleteModal from '@/components/admin/events/EventDeleteModal';
import { EventFormData } from '@/components/admin/events/EventForm';
import toast from 'react-hot-toast';

export default function AdminEvents() {
  const router = useRouter();
  
  // State quản lý danh sách sự kiện
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State quản lý sự kiện đang được thao tác
  const [currentEventId, setCurrentEventId] = useState<string | undefined>(undefined);
  const [currentEvent, setCurrentEvent] = useState<Event | undefined>(undefined);
  
  // Giả lập dữ liệu và tải dữ liệu khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dữ liệu mẫu
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
        
        setEvents(sampleEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Đã xảy ra lỗi khi tải dữ liệu sự kiện');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Xử lý xem chi tiết sự kiện
  const handleViewEvent = (id: string) => {
    setCurrentEventId(id);
    const event = events.find(e => e._id === id);
    setCurrentEvent(event);
    setShowViewModal(true);
  };
  
  // Xử lý mở modal chỉnh sửa
  const handleOpenEditModal = (id: string) => {
    setCurrentEventId(id);
    setShowEditModal(true);
  };
  
  // Xử lý mở modal xóa
  const handleOpenDeleteModal = (id: string) => {
    setCurrentEventId(id);
    const event = events.find(e => e._id === id);
    setCurrentEvent(event);
    setShowDeleteModal(true);
  };
  
  // Xử lý thêm sự kiện mới
  const handleAddEvent = (data: EventFormData) => {
    // Tạo sự kiện mới với ID giả
    const newEvent: Event = {
      _id: `event${Date.now()}`,
      title: data.title,
      description: data.description,
      tags: data.tags,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      products: data.products,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Cập nhật danh sách sự kiện
    setEvents(prev => [newEvent, ...prev]);
    
    // Đóng modal
    setShowAddModal(false);
    
    // Thông báo
    toast.success('Đã thêm sự kiện mới thành công');
  };
  
  // Xử lý chỉnh sửa sự kiện
  const handleEditEvent = (id: string, data: EventFormData) => {
    // Tìm sự kiện cần cập nhật
    const eventIndex = events.findIndex(e => e._id === id);
    
    if (eventIndex !== -1) {
      // Tạo bản sao của mảng events
      const updatedEvents = [...events];
      
      // Cập nhật sự kiện
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        title: data.title,
        description: data.description,
        tags: data.tags,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        products: data.products,
        updatedAt: new Date()
      };
      
      // Cập nhật state
      setEvents(updatedEvents);
      
      // Đóng modal
      setShowEditModal(false);
      
      // Cập nhật currentEvent (nếu đang được hiển thị trong modal xem chi tiết)
      if (currentEvent && currentEvent._id === id) {
        setCurrentEvent(updatedEvents[eventIndex]);
      }
      
      // Thông báo
      toast.success('Đã cập nhật sự kiện thành công');
    }
  };
  
  // Xử lý xóa sự kiện
  const handleDeleteEvent = (id: string) => {
    // Xóa sự kiện khỏi danh sách
    setEvents(prev => prev.filter(e => e._id !== id));
    
    // Đóng modal
    setShowDeleteModal(false);
    
    // Thông báo
    toast.success('Đã xóa sự kiện thành công');
  };

  // Đếm số lượng sự kiện theo trạng thái
  const countEventsByStatus = (status: 'upcoming' | 'ongoing' | 'ended') => {
    return events.filter(event => {
      const now = new Date();
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      if (status === 'upcoming') return now < startDate;
      if (status === 'ongoing') return now >= startDate && now <= endDate;
      if (status === 'ended') return now > endDate;
      return false;
    }).length;
  };

  // Tổng số sản phẩm trong tất cả sự kiện
  const totalProducts = events.reduce((sum, event) => sum + event.products.length, 0);

  return (
    <AdminLayout title="Quản lý sự kiện">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm sự kiện mới
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Thống kê sự kiện */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCalendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số sự kiện
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{events.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiClock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sắp diễn ra
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{countEventsByStatus('upcoming')}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang diễn ra
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{countEventsByStatus('ongoing')}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiFileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đã kết thúc
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{countEventsByStatus('ended')}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiFileText className="h-6 w-6 text-pink-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng sản phẩm
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{totalProducts}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <EventsTable 
            onView={handleViewEvent}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
        )}
      </div>
      
      {/* Modals */}
      <EventAddModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEvent}
      />
      
      <EventEditModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditEvent}
        eventId={currentEventId}
        events={events}
      />
      
      <EventViewModal 
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        event={currentEvent}
      />
      
      <EventDeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        eventId={currentEventId}
        eventTitle={currentEvent?.title}
        productsCount={currentEvent?.products.length}
      />
    </AdminLayout>
  );
} 