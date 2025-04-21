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

export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  method: 'cod' | 'bank_transfer' | 'credit_card' | 'stripe';
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
  createStripePaymentIntent: (amount: number, orderId?: string) => Promise<StripePaymentIntent | null>;
  createOrderWithStripe: (orderData: CreateOrderDto) => Promise<{ order: Order; paymentIntent: StripePaymentIntent } | null>;
  createOrderWithCOD: (orderData: CreateOrderDto) => Promise<Order | null>;
  confirmPayment: (paymentId: string, orderId: string) => Promise<Payment | null>;
}

// Tạo context
const UserPaymentContext = createContext<UserPaymentContextType | undefined>(undefined);

// Provider component
export const UserPaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, accessToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stripePaymentIntent, setStripePaymentIntent] = useState<StripePaymentIntent | null>(null);

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
  ): Promise<{ order: Order; paymentIntent: StripePaymentIntent } | null> => {
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

      // Tạo payment intent trước
      const paymentIntent = await createStripePaymentIntent(orderWithStripe.finalPrice);

      if (!paymentIntent) {
        throw new Error('Không thể tạo Stripe Payment Intent');
      }

      // Tạo đơn hàng với trạng thái chờ thanh toán
      const orderResponse = await api().post('/orders', {
        ...orderWithStripe,
        paymentStatus: 'pending',
        paymentId: paymentIntent.id
      });

      return {
        order: orderResponse.data,
        paymentIntent
      };
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, createStripePaymentIntent, user, isAuthenticated]);

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

  return (
    <UserPaymentContext.Provider
      value={{
        loading,
        error,
        stripePaymentIntent,
        createStripePaymentIntent,
        createOrderWithStripe,
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
