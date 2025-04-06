import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAdminAuth } from './AdminAuthContext';
import { toast } from 'react-hot-toast';

// Cấu hình API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Định nghĩa interface cho sản phẩm trong event
export interface ProductInEvent {
  productId: string;
  variantId?: string;
  adjustedPrice: number;
}

// Định nghĩa interface cho event
export interface Event {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  startDate: Date;
  endDate: Date;
  products: ProductInEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa interface cho form data event
export interface EventFormData {
  title: string;
  description: string;
  tags: string[];
  startDate: string | Date;
  endDate: string | Date;
  products: ProductInEvent[];
}

// Định nghĩa interface cho context
interface EventsContextType {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<Event | null>;
  fetchActiveEvents: () => Promise<Event[]>;
  addEvent: (eventData: EventFormData) => Promise<Event | null>;
  updateEvent: (id: string, eventData: EventFormData) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  findEventsByProductId: (productId: string) => Promise<Event[]>;
  findEventsByVariantId: (variantId: string) => Promise<Event[]>;
}

// Tạo context
const EventsContext = createContext<EventsContextType>({} as EventsContextType);

// Hook để sử dụng context
export const useEvents = () => useContext(EventsContext);

// Provider component
export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, isAuthenticated } = useAdminAuth();

  // Hàm helper để format dữ liệu event
  const formatEventData = (event: any): Event => {
    return {
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    };
  };

  // Hàm để lấy danh sách events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/events`);
      const formattedEvents = response.data.map(formatEventData);
      setEvents(formattedEvents);
      return formattedEvents;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tải dữ liệu sự kiện';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm để lấy chi tiết event theo ID
  const fetchEventById = useCallback(async (id: string): Promise<Event | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/events/${id}`);
      return formatEventData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Không thể tải thông tin sự kiện ID: ${id}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm để lấy danh sách events đang hoạt động
  const fetchActiveEvents = useCallback(async (): Promise<Event[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/events/active`);
      return response.data.map(formatEventData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tải dữ liệu sự kiện đang hoạt động';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm để thêm event mới (cần xác thực admin)
  const addEvent = useCallback(async (eventData: EventFormData): Promise<Event | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/events`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const newEvent = formatEventData(response.data);
      setEvents(prev => [newEvent, ...prev]);
      toast.success('Thêm sự kiện mới thành công');
      return newEvent;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể thêm sự kiện mới';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  // Hàm để cập nhật event (cần xác thực admin)
  const updateEvent = useCallback(async (id: string, eventData: EventFormData): Promise<Event | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.patch(
        `${API_URL}/events/${id}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const updatedEvent = formatEventData(response.data);
      setEvents(prev => prev.map(event => event._id === id ? updatedEvent : event));
      toast.success('Cập nhật sự kiện thành công');
      return updatedEvent;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Không thể cập nhật sự kiện ID: ${id}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  // Hàm để xóa event (cần xác thực admin)
  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.delete(
        `${API_URL}/events/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      setEvents(prev => prev.filter(event => event._id !== id));
      toast.success('Xóa sự kiện thành công');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Không thể xóa sự kiện ID: ${id}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  // Hàm để tìm events theo productId
  const findEventsByProductId = useCallback(async (productId: string): Promise<Event[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/events/product/${productId}`);
      return response.data.map(formatEventData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Không thể tìm sự kiện cho sản phẩm ID: ${productId}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm để tìm events theo variantId
  const findEventsByVariantId = useCallback(async (variantId: string): Promise<Event[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/events/variant/${variantId}`);
      return response.data.map(formatEventData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Không thể tìm sự kiện cho biến thể sản phẩm ID: ${variantId}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load events khi component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const contextValue: EventsContextType = {
    events,
    isLoading,
    error,
    fetchEvents,
    fetchEventById,
    fetchActiveEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    findEventsByProductId,
    findEventsByVariantId
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
}; 