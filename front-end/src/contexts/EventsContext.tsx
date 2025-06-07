import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAdminAuth } from './AdminAuthContext';
import { toast } from 'react-hot-toast';

// Cấu hình API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';

// Interface cho error response
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Interface cho event data từ API
interface EventApiData {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  startDate: string | Date;
  endDate: string | Date;
  products: ProductInEvent[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Định nghĩa interface cho tổ hợp biến thể trong event
export interface CombinationInEvent {
  combinationId: string;
  attributes: Record<string, string>;
  combinationPrice?: number;
  adjustedPrice: number;
  originalPrice?: number;
}

// Định nghĩa interface cho biến thể trong event
export interface VariantInEvent {
  variantId: string;
  variantName?: string;
  variantSku?: string;
  variantAttributes?: Record<string, string>;
  variantPrice?: number;
  adjustedPrice: number;
  originalPrice?: number;
  image?: string;
  combinations?: CombinationInEvent[];
}

// Định nghĩa interface cho sản phẩm trong event
export interface ProductInEvent {
  productId: string;
  variantId?: string;      // Added: ID của biến thể cụ thể (nếu có)
  combinationId?: string;  // Added: ID của tổ hợp cụ thể (nếu có)
  adjustedPrice: number;
  name?: string;
  image?: string;
  originalPrice?: number;
  sku?: string;
  status?: string;
  brandId?: string;
  brand?: string;
  variants?: VariantInEvent[];
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
  fetchEvents: () => Promise<Event[]>;
  fetchEventById: (id: string) => Promise<Event | null>;
  fetchActiveEvents: () => Promise<Event[]>;
  addEvent: (eventData: EventFormData) => Promise<Event | null>;
  updateEvent: (id: string, eventData: EventFormData) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  findEventsByProductId: (productId: string) => Promise<Event[]>;
  findEventsByVariantId: (variantId: string) => Promise<Event[]>;
  // Các phương thức mới cho quản lý sản phẩm trong event
  addProductsToEvent: (eventId: string, products: ProductInEvent[]) => Promise<Event | null>;
  removeProductFromEvent: (eventId: string, productId: string, variantId?: string, combinationId?: string) => Promise<Event | null>;
  updateProductPriceInEvent: (eventId: string, productId: string, adjustedPrice: number, variantId?: string, combinationId?: string, showToast?: boolean) => Promise<Event | null>;
}

// Tạo context
const EventsContext = createContext<EventsContextType>({} as EventsContextType);

// Hook để sử dụng context
export const useEvents = () => useContext(EventsContext);

// Provider component
export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, isAuthenticated } = useAdminAuth();

  // Hàm helper để format dữ liệu event
  const formatEventData = (event: EventApiData): Event => {
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
      const formattedEvents = (response.data as EventApiData[]).map(formatEventData);
      setEvents(formattedEvents);
      return formattedEvents;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Không thể tải dữ liệu sự kiện';
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
      return formatEventData(response.data as EventApiData);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || `Không thể tải thông tin sự kiện ID: ${id}`;
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
      // Thử endpoint /events/active trước, nếu không có thì dùng /events
      let response;
      try {
        response = await axios.get(`${API_URL}/events/active`);
      } catch {
        // Nếu endpoint /events/active không tồn tại, dùng /events và lọc events đang hoạt động
        console.log('Endpoint /events/active không khả dụng, sử dụng /events');
        response = await axios.get(`${API_URL}/events`);
      }

      const allEvents = (response.data as EventApiData[]).map(formatEventData);

      // Lọc chỉ lấy events đang hoạt động (trong khoảng thời gian hiện tại)
      const now = new Date();
      const activeEvents = allEvents.filter((event: Event) => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        return startDate <= now && now <= endDate;
      });

      // Cập nhật state events với danh sách events đang hoạt động
      setEvents(activeEvents);

      return activeEvents;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Không thể tải dữ liệu sự kiện đang hoạt động';
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

      const newEvent = formatEventData(response.data as EventApiData);
      setEvents(prev => [newEvent, ...prev]);
      toast.success('Thêm sự kiện mới thành công', { id: 'event-add-success' });
      return newEvent;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Không thể thêm sự kiện mới';
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

      const updatedEvent = formatEventData(response.data as EventApiData);
      setEvents(prev => prev.map(event => event._id === id ? updatedEvent : event));
      toast.success('Cập nhật sự kiện thành công', { id: 'event-update-success' });
      return updatedEvent;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || `Không thể cập nhật sự kiện ID: ${id}`;
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
      toast.success('Xóa sự kiện thành công', { id: 'event-delete-success' });
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || `Không thể xóa sự kiện ID: ${id}`;
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
      return (response.data as EventApiData[]).map(formatEventData);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || `Không thể tìm sự kiện cho sản phẩm ID: ${productId}`;
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
      return (response.data as EventApiData[]).map(formatEventData);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || `Không thể tìm sự kiện cho biến thể sản phẩm ID: ${variantId}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm để thêm sản phẩm vào event
  const addProductsToEvent = useCallback(async (
    eventId: string,
    products: ProductInEvent[]
  ): Promise<Event | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Đảm bảo mỗi sản phẩm có cấu trúc chuẩn và giữ lại variantId/combinationId nếu có
      const restructuredProducts = products.map(product => ({
        ...product, // Giữ lại tất cả các trường từ product đầu vào (bao gồm productId, variantId, combinationId, adjustedPrice, etc.)
        variants: product.variants || [] // Đảm bảo trường variants luôn là một mảng
      }));

      const response = await axios.post(
        `${API_URL}/events/${eventId}/products`,
        { products: restructuredProducts },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const updatedEvent = formatEventData(response.data as EventApiData);

      // Cập nhật state events
      setEvents(prev => prev.map(event =>
        event._id === eventId ? updatedEvent : event
      ));

      toast.success('Đã thêm sản phẩm vào sự kiện thành công', { id: 'event-add-product-success' });
      return updatedEvent;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Không thể thêm sản phẩm vào sự kiện';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  // Hàm để xóa sản phẩm khỏi event
  const removeProductFromEvent = useCallback(async (
    eventId: string,
    productId: string,
    variantId?: string,
    combinationId?: string
  ): Promise<Event | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Tạo query params nếu có variantId hoặc combinationId
      let url = `${API_URL}/events/${eventId}/products/${productId}`;
      const params = new URLSearchParams();

      if (variantId) {
        params.append('variantId', variantId);
      }

      if (combinationId) {
        params.append('combinationId', combinationId);
      }

      // Thêm query params vào URL nếu có
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await axios.delete(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const updatedEvent = formatEventData(response.data as EventApiData);

      // Cập nhật state events
      setEvents(prev => prev.map(event =>
        event._id === eventId ? updatedEvent : event
      ));

      toast.success('Đã xóa sản phẩm khỏi sự kiện thành công', { id: 'event-remove-product-success' });
      return updatedEvent;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Không thể xóa sản phẩm khỏi sự kiện';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  // Hàm để cập nhật giá sản phẩm trong event
  const updateProductPriceInEvent = useCallback(async (
    eventId: string,
    productId: string,
    adjustedPrice: number,
    variantId?: string,
    combinationId?: string,
    showToast: boolean = false
  ): Promise<Event | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Bạn cần đăng nhập với quyền admin để thực hiện thao tác này');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Tạo payload với các thông tin cần thiết
      const payload: {
        adjustedPrice: number;
        variantId?: string;
        combinationId?: string;
      } = {
        adjustedPrice
      };

      // Thêm variantId và combinationId vào payload nếu có
      if (variantId) {
        payload.variantId = variantId;
      }

      if (combinationId) {
        payload.combinationId = combinationId;
      }

      const response = await axios.patch(
        `${API_URL}/events/${eventId}/products/${productId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const updatedEvent = formatEventData(response.data as EventApiData);

      // Cập nhật state events
      setEvents(prev => prev.map(event =>
        event._id === eventId ? updatedEvent : event
      ));

      // Hiển thị thông báo nếu được yêu cầu
      if (showToast) {
        toast.success('Đã cập nhật giá sản phẩm trong sự kiện thành công', { id: 'event-update-price-success' });
      }

      return updatedEvent;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Không thể cập nhật giá sản phẩm trong sự kiện';
      setError(errorMessage);
      // Luôn hiển thị thông báo lỗi
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  // Tự động tải dữ liệu khi component được mount hoặc route thay đổi
  useEffect(() => {
    const loadData = async () => {
      // Load events cho các trang liên quan
      const isUserRelatedPage = !router.pathname.startsWith('/admin') &&
                               !router.pathname.startsWith('/auth');
      const isAdminVouchersPage = router.pathname.startsWith('/admin/vouchers');
      const isAdminEventsPage = router.pathname.startsWith('/admin/events');

      if (isUserRelatedPage || isAdminVouchersPage || isAdminEventsPage) {
        await fetchEvents();
      }
    };

    loadData();
  }, [router.pathname, fetchEvents]);

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
    findEventsByVariantId,
    addProductsToEvent,
    removeProductFromEvent,
    updateProductPriceInEvent
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
};
