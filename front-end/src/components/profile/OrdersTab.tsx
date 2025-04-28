import React, { useState, useEffect } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { Order as ProfileOrder, OrderStatusType } from './types';
import OrderFilters from './OrderFilters';
import OrderHistory from './OrderHistory';
import { useOrder } from '../../contexts';
import { toast } from 'react-hot-toast';

interface OrdersTabProps {
  orders: ProfileOrder[];
  onViewOrderDetails: (orderId: string) => void;
  onDownloadInvoice: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onReturnOrder: (orderId: string) => void;
  onBuyAgain: (orderId: string) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({
  orders: profileOrders,
  onViewOrderDetails,
  onDownloadInvoice,
  onCancelOrder,
  onReturnOrder,
  onBuyAgain
}) => {
  // Sử dụng OrderContext
  const {
    orders,
    loading,
    orderStatusFilter: contextOrderStatusFilter,
    searchOrderQuery: contextSearchQuery,
    setOrderStatusFilter,
    setSearchOrderQuery: setContextSearchQuery,
    searchOrders,
    fetchOrders
  } = useOrder();

  // Chuyển đổi từ Order của OrderContext sang Order của ProfileContext
  const convertOrders = (apiOrders: any[]): ProfileOrder[] => {
    return apiOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      products: order.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        image: item.image || '',
        options: item.options,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: order.totalPrice,
      finalPrice: order.finalPrice,
      voucher: order.voucher ? {
        voucherId: order.voucher.voucherId,
        discountAmount: order.voucher.discountAmount
      } : undefined,
      shippingInfo: {
        address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`,
        contact: `${order.shippingAddress.fullName} - ${order.shippingAddress.phone}`
      },
      tracking: order.tracking ? {
        status: order.tracking.history.map((hist: any) => ({
          state: hist.status,
          description: hist.description || '',
          timestamp: hist.timestamp
        })),
        shippingCarrier: order.tracking.carrier ? {
          name: order.tracking.carrier.name,
          trackingNumber: order.tracking.carrier.trackingNumber,
          trackingUrl: order.tracking.carrier.trackingUrl || ''
        } : undefined,
        estimatedDelivery: order.tracking.estimatedDelivery,
        actualDelivery: order.tracking.actualDelivery
      } : undefined
    }));
  };

  const [displayOrders, setDisplayOrders] = useState<ProfileOrder[]>(profileOrders);

  // Cập nhật displayOrders khi orders từ context thay đổi
  useEffect(() => {
    if (orders && orders.length > 0) {
      setDisplayOrders(convertOrders(orders));
    } else {
      setDisplayOrders(profileOrders);
    }
  }, [orders, profileOrders]);

  const handleOrderStatusFilterChange = (status: OrderStatusType) => {
    setOrderStatusFilter(status);
  };

  const handleSearchOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContextSearchQuery(e.target.value);
  };

  const handleSearchOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchOrders();
  };

  const handleClearFilters = () => {
    setOrderStatusFilter('all');
    setContextSearchQuery('');
    fetchOrders(1, 10, 'all');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Lịch sử đơn hàng</h2>

      <OrderFilters
        orderStatusFilter={contextOrderStatusFilter}
        searchOrderQuery={contextSearchQuery}
        onFilterChange={handleOrderStatusFilterChange}
        onSearchChange={handleSearchOrderChange}
        onSearchSubmit={handleSearchOrderSubmit}
        onClearFilters={handleClearFilters}
      />

      {/* Hiển thị trạng thái loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      )}

      {/* Hiển thị số lượng đơn hàng tìm thấy */}
      {!loading && displayOrders.length > 0 ? (
        <p className="text-sm text-gray-500 mb-4">Tìm thấy {displayOrders.length} đơn hàng</p>
      ) : !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <FaShoppingBag className="text-gray-400 text-2xl" />
          </div>
          <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
          <button
            onClick={handleClearFilters}
            className="mt-3 px-4 py-2 text-sm text-pink-600 hover:text-pink-800"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {!loading && displayOrders.length > 0 && (
        <OrderHistory
          orders={displayOrders}
          onViewOrderDetails={onViewOrderDetails}
          onDownloadInvoice={onDownloadInvoice}
          onCancelOrder={onCancelOrder}
          onReturnOrder={onReturnOrder}
          onBuyAgain={onBuyAgain}
        />
      )}
    </div>
  );
};

export default OrdersTab;