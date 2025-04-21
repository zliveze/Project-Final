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
