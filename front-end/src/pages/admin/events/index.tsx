import { useState, useEffect } from 'react';
// useRouter removed as it's not used
import { Plus, CalendarDays, Clock, CheckCircle2, FileText, Package } from 'lucide-react'; // Updated icons
import AdminLayout from '@/components/admin/AdminLayout';
import EventsTable from '@/components/admin/events/EventsTable';
import EventAddModal from '@/components/admin/events/EventAddModal';
import EventEditModal from '@/components/admin/events/EventEditModal';
import EventViewModal from '@/components/admin/events/EventViewModal';
import EventDeleteModal from '@/components/admin/events/EventDeleteModal';
import { EventFormData } from '@/components/admin/events/EventForm';
// toast removed as it's not used
import { useEvents, Event } from '@/contexts/EventsContext';

export default function AdminEvents() {
  // router removed as it's not used
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
    const result = await addEvent(data);
    if (result) {
      setShowAddModal(false);
    }
  };

  // Xử lý chỉnh sửa sự kiện
  const handleEditEvent = async (id: string, data: EventFormData) => {
    const result = await updateEvent(id, data);
    if (result) {
      setShowEditModal(false);
      if (currentEvent && currentEvent._id === id) {
        setCurrentEvent(result);
      }
    }
  };

  // Xử lý xóa sự kiện
  const handleDeleteEvent = async (id: string) => {
    const success = await deleteEvent(id);
    if (success) {
      setShowDeleteModal(false);
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

  // Helper component for Stat Card
  const StatCard = ({ title, value, icon: Icon, iconColor }: { title: string, value: string | number, icon: React.ElementType, iconColor?: string }) => (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md bg-pink-100 ${iconColor ? '' : 'text-pink-600'}`}>
          <Icon className={`h-6 w-6 ${iconColor || 'text-pink-600'}`} />
        </div>
        <div className="ml-4 flex-1">
          <dt className="text-sm font-medium text-slate-500 truncate">
            {title}
          </dt>
          <dd className="text-2xl font-semibold text-slate-900">
            {value}
          </dd>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Quản lý Sự kiện">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Danh sách Sự kiện</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm sự kiện mới
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Tổng số sự kiện" value={events?.length || 0} icon={CalendarDays} />
        <StatCard title="Sắp diễn ra" value={events && events.length > 0 ? countEventsByStatus('upcoming') : 0} icon={Clock} iconColor="text-blue-600" />
        <StatCard title="Đang diễn ra" value={events && events.length > 0 ? countEventsByStatus('ongoing') : 0} icon={CheckCircle2} iconColor="text-green-600" />
        <StatCard title="Đã kết thúc" value={events && events.length > 0 ? countEventsByStatus('ended') : 0} icon={FileText} iconColor="text-slate-600" />
        <StatCard title="Tổng sản phẩm" value={totalProducts} icon={Package} iconColor="text-purple-600" />
      </div>

      <div className="mt-6">
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
