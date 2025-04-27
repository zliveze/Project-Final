import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAuth } from '../AuthContext';
import { CreateOrderDto, Order } from './UserOrderContext';

// Định nghĩa các interface
export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
}

export interface MomoPaymentResponse {
  resultCode: number;
  message: string;
  payUrl: string;
  requestId: string;
  orderId: string;
  extraData: string;
  requestType: string;
  ipnUrl: string;
  redirectUrl: string;
}

export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  method: 'cod' | 'bank_transfer' | 'credit_card' | 'stripe' | 'momo';
  returnUrl: string;
}

export interface Payment {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  paymentDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserPaymentContextType {
  loading: boolean;
  error: string | null;
  stripePaymentIntent: StripePaymentIntent | null;
  momoPaymentResponse: MomoPaymentResponse | null;
  createStripePaymentIntent: (amount: number, orderId?: string) => Promise<StripePaymentIntent | null>;
  createStripeCheckoutSession: (amount: number, orderId?: string) => Promise<StripeCheckoutSession | null>;
  createMomoPayment: (amount: number, orderId: string, returnUrl: string, orderData?: any) => Promise<MomoPaymentResponse | null>;
  createOrderWithStripe: (orderData: CreateOrderDto) => Promise<{ order?: Order; checkoutUrl: string } | null>;
  createOrderWithMomo: (orderData: CreateOrderDto) => Promise<{ payUrl: string } | null>;
  createOrderWithCOD: (orderData: CreateOrderDto) => Promise<Order | null>;
  confirmPayment: (paymentId: string, orderId: string) => Promise<Payment | null>;
}

// Tạo context
const UserPaymentContext = createContext<UserPaymentContextType | undefined>(undefined);

// Provider component
export const UserPaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stripePaymentIntent, setStripePaymentIntent] = useState<StripePaymentIntent | null>(null);
  const [stripeCheckoutSession, setStripeCheckoutSession] = useState<StripeCheckoutSession | null>(null);
  const [momoPaymentResponse, setMomoPaymentResponse] = useState<MomoPaymentResponse | null>(null);

  // Cấu hình Axios với Auth token
  const api = useCallback(() => {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');

    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
  }, []);

  // Xử lý lỗi
  const handleError = (error: any) => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  // Tạo Stripe Checkout Session
  const createStripeCheckoutSession = useCallback(async (
    amount: number,
    orderId?: string
  ): Promise<StripeCheckoutSession | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        amount,
        currency: 'vnd',
        orderId
      };

      const response = await api().post('/payments/stripe/create-checkout-session', payload);

      setStripeCheckoutSession(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Tạo Stripe Payment Intent
  const createStripePaymentIntent = useCallback(async (
    amount: number,
    orderId?: string
  ): Promise<StripePaymentIntent | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        amount,
        currency: 'vnd',
        orderId
      };

      const response = await api().post('/payments/stripe/create-payment-intent', payload);

      setStripePaymentIntent(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Tạo đơn hàng với Stripe
  const createOrderWithStripe = useCallback(async (
    orderData: CreateOrderDto
  ): Promise<{ order?: Order; checkoutUrl: string } | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Đảm bảo phương thức thanh toán là Stripe
      const orderWithStripe = {
        ...orderData,
        paymentMethod: 'stripe'
      };

      // Đảm bảo mã địa chỉ đúng định dạng cho ViettelPost
      if (orderWithStripe.shippingAddress) {
        // Kiểm tra và gán mã địa chỉ mặc định nếu cần
        if (!orderWithStripe.shippingAddress.provinceCode || !orderWithStripe.shippingAddress.districtCode || !orderWithStripe.shippingAddress.wardCode) {
          console.log('Sử dụng mã địa chỉ mặc định cho ViettelPost trong UserPaymentContext (Stripe)');
          orderWithStripe.shippingAddress.provinceCode = '1'; // Hà Nội
          orderWithStripe.shippingAddress.districtCode = '4'; // Quận Hoàng Mai
          orderWithStripe.shippingAddress.wardCode = '0'; // Mã mặc định cho phường/xã
        }

        // Chuyển đổi mã tỉnh/thành phố sang định dạng số nếu cần
        if (orderWithStripe.shippingAddress.provinceCode === '2' || orderWithStripe.shippingAddress.provinceCode === 'HCM') {
          // Hồ Chí Minh
          orderWithStripe.shippingAddress.provinceCode = '2';
        } else if (orderWithStripe.shippingAddress.provinceCode === '1' || orderWithStripe.shippingAddress.provinceCode === 'HNI') {
          // Hà Nội
          orderWithStripe.shippingAddress.provinceCode = '1';
        }

        console.log('Mã địa chỉ đã chuyển đổi trong UserPaymentContext (Stripe):', {
          provinceCode: orderWithStripe.shippingAddress.provinceCode,
          districtCode: orderWithStripe.shippingAddress.districtCode,
          wardCode: orderWithStripe.shippingAddress.wardCode
        });
      }

      // Tạo mã đơn hàng tạm thời
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `YM${year}${month}${day}${random}`;
      console.log(`Generated temporary order number for Stripe order: ${orderNumber}`);

      // Thêm orderNumber vào orderWithStripe
      const orderWithStripeAndNumber = {
        ...orderWithStripe,
        orderNumber
      };

      // Tạo Stripe Checkout Session với dữ liệu đơn hàng
      const checkoutSession = await api().post('/payments/stripe/create-checkout-session', {
        amount: orderWithStripeAndNumber.finalPrice,
        currency: 'vnd',
        orderId: 'new',
        description: `Thanh toán đơn hàng Yumin #${orderNumber}`,
        returnUrl: `${window.location.origin}/payments/success`,
        orderData: {
          ...orderWithStripeAndNumber,
          userId: user._id
        }
      });

      if (!checkoutSession.data || !checkoutSession.data.url) {
        throw new Error('Không thể tạo phiên thanh toán Stripe');
      }

      // Lưu thông tin đơn hàng vào localStorage để sử dụng ở trang success
      localStorage.setItem('orderNumber', orderNumber);
      localStorage.setItem('orderCreatedAt', new Date().toISOString());

      return {
        checkoutUrl: checkoutSession.data.url
      };
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Tạo đơn hàng với COD
  const createOrderWithCOD = useCallback(async (
    orderData: CreateOrderDto
  ): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Đảm bảo phương thức thanh toán là COD
      const orderWithCOD = {
        ...orderData,
        paymentMethod: 'cod'
      };

      // Đảm bảo mã địa chỉ đúng định dạng cho ViettelPost
      if (orderWithCOD.shippingAddress) {
        // Kiểm tra và gán mã địa chỉ mặc định nếu cần
        if (!orderWithCOD.shippingAddress.provinceCode || !orderWithCOD.shippingAddress.districtCode || !orderWithCOD.shippingAddress.wardCode) {
          console.log('Sử dụng mã địa chỉ mặc định cho ViettelPost trong UserPaymentContext');
          orderWithCOD.shippingAddress.provinceCode = '1'; // Hà Nội
          orderWithCOD.shippingAddress.districtCode = '4'; // Quận Hoàng Mai
          orderWithCOD.shippingAddress.wardCode = '0'; // Mã mặc định cho phường/xã
        }

        // Chuyển đổi mã tỉnh/thành phố sang định dạng số nếu cần
        if (orderWithCOD.shippingAddress.provinceCode === '2' || orderWithCOD.shippingAddress.provinceCode === 'HCM') {
          // Hồ Chí Minh
          orderWithCOD.shippingAddress.provinceCode = '2';
        } else if (orderWithCOD.shippingAddress.provinceCode === '1' || orderWithCOD.shippingAddress.provinceCode === 'HNI') {
          // Hà Nội
          orderWithCOD.shippingAddress.provinceCode = '1';
        }

        console.log('Mã địa chỉ đã chuyển đổi trong UserPaymentContext:', {
          provinceCode: orderWithCOD.shippingAddress.provinceCode,
          districtCode: orderWithCOD.shippingAddress.districtCode,
          wardCode: orderWithCOD.shippingAddress.wardCode
        });
      }

      // Tạo đơn hàng với COD
      const response = await api().post('/orders', orderWithCOD);

      toast.success('Đặt hàng thành công');

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Xác nhận thanh toán
  const confirmPayment = useCallback(async (
    paymentId: string,
    orderId: string
  ): Promise<Payment | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await api().post(`/payments/confirm`, {
        paymentId,
        orderId
      });

      toast.success('Thanh toán thành công');

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Tạo thanh toán MoMo
  const createMomoPayment = useCallback(async (
    amount: number,
    orderId: string,
    returnUrl: string,
    orderData?: any
  ): Promise<MomoPaymentResponse | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Tạo mã đơn hàng tạm thời nếu là đơn hàng mới
      let orderNumber = '';
      if (orderId === 'new' && orderData) {
        // Tạo mã đơn hàng tạm thời theo cùng định dạng với backend
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        orderNumber = `YM${year}${month}${day}${random}`;
        console.log(`Generated temporary order number: ${orderNumber}`);
      }

      // Tạo orderInfo bao gồm mã đơn hàng
      const orderInfo = orderNumber
        ? `Thanh toán đơn hàng Yumin #${orderNumber}`
        : 'Thanh toán đơn hàng Yumin';

      const payload = {
        amount,
        orderId,
        returnUrl,
        orderInfo,
        orderData: {
          ...orderData,
          ...(orderNumber && { orderNumber }) // Thêm orderNumber vào orderData
        }
      };

      const response = await api().post('/payments/momo', payload);

      setMomoPaymentResponse(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Tạo đơn hàng với MoMo
  const createOrderWithMomo = useCallback(async (
    orderData: CreateOrderDto
  ): Promise<{ payUrl: string } | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Đảm bảo phương thức thanh toán là MoMo
      const orderWithMomo = {
        ...orderData,
        paymentMethod: 'momo'
      };

      // Đảm bảo mã địa chỉ đúng định dạng cho ViettelPost
      if (orderWithMomo.shippingAddress) {
        // Kiểm tra và gán mã địa chỉ mặc định nếu cần
        if (!orderWithMomo.shippingAddress.provinceCode || !orderWithMomo.shippingAddress.districtCode || !orderWithMomo.shippingAddress.wardCode) {
          console.log('Sử dụng mã địa chỉ mặc định cho ViettelPost trong UserPaymentContext (MoMo)');
          orderWithMomo.shippingAddress.provinceCode = '1'; // Hà Nội
          orderWithMomo.shippingAddress.districtCode = '4'; // Quận Hoàng Mai
          orderWithMomo.shippingAddress.wardCode = '0'; // Mã mặc định cho phường/xã
        }

        // Chuyển đổi mã tỉnh/thành phố sang định dạng số nếu cần
        if (orderWithMomo.shippingAddress.provinceCode === '2' || orderWithMomo.shippingAddress.provinceCode === 'HCM') {
          // Hồ Chí Minh
          orderWithMomo.shippingAddress.provinceCode = '2';
        } else if (orderWithMomo.shippingAddress.provinceCode === '1' || orderWithMomo.shippingAddress.provinceCode === 'HNI') {
          // Hà Nội
          orderWithMomo.shippingAddress.provinceCode = '1';
        }

        console.log('Mã địa chỉ đã chuyển đổi trong UserPaymentContext (MoMo):', {
          provinceCode: orderWithMomo.shippingAddress.provinceCode,
          districtCode: orderWithMomo.shippingAddress.districtCode,
          wardCode: orderWithMomo.shippingAddress.wardCode
        });
      }

      // Tạo mã đơn hàng tạm thời
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `YM${year}${month}${day}${random}`;
      console.log(`Generated temporary order number for MoMo order: ${orderNumber}`);

      // Thêm orderNumber vào orderWithMomo
      const orderWithMomoAndNumber = {
        ...orderWithMomo,
        orderNumber
      };

      // Tạo thanh toán MoMo
      const momoResponse = await createMomoPayment(
        orderWithMomoAndNumber.finalPrice,
        'new', // Tạo đơn hàng mới
        `${window.location.origin}/payments/success`,
        {
          ...orderWithMomoAndNumber,
          userId: user._id
        }
      );

      if (!momoResponse || !momoResponse.payUrl) {
        throw new Error('Không thể tạo thanh toán MoMo');
      }

      // Lưu thông tin đơn hàng vào localStorage để sử dụng ở trang success
      localStorage.setItem('currentOrder', JSON.stringify(orderWithMomoAndNumber));
      localStorage.setItem('orderNumber', orderNumber);

      return {
        payUrl: momoResponse.payUrl
      };
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, createMomoPayment, user, isAuthenticated]);

  return (
    <UserPaymentContext.Provider
      value={{
        loading,
        error,
        stripePaymentIntent,
        momoPaymentResponse,
        createStripePaymentIntent,
        createStripeCheckoutSession,
        createMomoPayment,
        createOrderWithStripe,
        createOrderWithMomo,
        createOrderWithCOD,
        confirmPayment
      }}
    >
      {children}
    </UserPaymentContext.Provider>
  );
};

// Hook để sử dụng context
export const useUserPayment = (): UserPaymentContextType => {
  const context = useContext(UserPaymentContext);
  if (context === undefined) {
    throw new Error('useUserPayment must be used within a UserPaymentProvider');
  }
  return context;
};
