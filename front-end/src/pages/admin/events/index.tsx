import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiCalendar, FiClock, FiCheckCircle, FiFileText } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import EventsTable from '@/components/admin/events/EventsTable';
import EventAddModal from '@/components/admin/events/EventAddModal';
import EventEditModal from '@/components/admin/events/EventEditModal';
import EventViewModal from '@/components/admin/events/EventViewModal';
import EventDeleteModal from '@/components/admin/events/EventDeleteModal';
import { EventFormData } from '@/components/admin/events/EventForm';
import toast from 'react-hot-toast';
import { useEvents, Event } from '@/contexts/EventsContext';

export default function AdminEvents() {
  const router = useRouter();
  const { 
    events, 
    isLoading, 
    fetchEvents, 
    addEvent, 
    updateEvent, 
    deleteEvent 
  } = useEvents();
  
  // State quản lý modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State quản lý sự kiện đang được thao tác
  const [currentEventId, setCurrentEventId] = useState<string | undefined>(undefined);
  const [currentEvent, setCurrentEvent] = useState<Event | undefined>(undefined);
  
  // Tải dữ liệu khi component mount
  useEffect(() => {
    if (fetchEvents && typeof fetchEvents === 'function') {
      fetchEvents();
    }
  }, [fetchEvents]);
  
  // Xử lý xem chi tiết sự kiện
  const handleViewEvent = (id: string) => {
    setCurrentEventId(id);
    const event = events?.find(e => e._id === id);
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
    const event = events?.find(e => e._id === id);
    setCurrentEvent(event);
    setShowDeleteModal(true);
  };
  
  // Xử lý thêm sự kiện mới
  const handleAddEvent = async (data: EventFormData) => {
    // Gọi API thêm sự kiện thông qua context
    const result = await addEvent(data);
    
    if (result) {
      // Đóng modal
      setShowAddModal(false);
      // Thông báo thành công đã được xử lý trong context
    }
  };
  
  // Xử lý chỉnh sửa sự kiện
  const handleEditEvent = async (id: string, data: EventFormData) => {
    // Gọi API cập nhật sự kiện thông qua context
    const result = await updateEvent(id, data);
    
    if (result) {
      // Đóng modal
      setShowEditModal(false);
      // Cập nhật currentEvent (nếu đang được hiển thị trong modal xem chi tiết)
      if (currentEvent && currentEvent._id === id) {
        setCurrentEvent(result);
      }
      // Thông báo thành công đã được xử lý trong context
    }
  };
  
  // Xử lý xóa sự kiện
  const handleDeleteEvent = async (id: string) => {
    // Gọi API xóa sự kiện thông qua context
    const success = await deleteEvent(id);
    
    if (success) {
      // Đóng modal
      setShowDeleteModal(false);
      // Thông báo thành công đã được xử lý trong context
    }
  };

  // Đếm số lượng sự kiện theo trạng thái
  const countEventsByStatus = (status: 'upcoming' | 'ongoing' | 'ended') => {
    if (!events || events.length === 0) return 0;
    
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
  const totalProducts = events && events.length > 0 
    ? events.reduce((sum, event) => sum + event.products.length, 0)
    : 0;

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
                    <div className="text-lg font-medium text-gray-900">{events?.length || 0}</div>
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
                    <div className="text-lg font-medium text-gray-900">{events && events.length > 0 ? countEventsByStatus('upcoming') : 0}</div>
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
                    <div className="text-lg font-medium text-gray-900">{events && events.length > 0 ? countEventsByStatus('ongoing') : 0}</div>
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
                    <div className="text-lg font-medium text-gray-900">{events && events.length > 0 ? countEventsByStatus('ended') : 0}</div>
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
            events={events || []}
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
        events={events || []}
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