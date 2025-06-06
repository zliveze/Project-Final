import React, { useState, useEffect } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { Order as ProfileOrder, OrderStatusType } from './types';
import OrderFilters from './OrderFilters';
import OrderHistory from './OrderHistory';
import { useOrder } from '../../contexts'; 
import { Order as ApiOrder } from '../../contexts/user/OrderContext'; // Corrected import path for ApiOrder

interface OrdersTabProps {
  orders: ProfileOrder[];
  onViewOrderDetails: (orderId: string) => void;
  onDownloadInvoice: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onReturnOrder: (orderId: string) => void;
  onBuyAgain: (orderId: string) => Promise<void>; // Added onBuyAgain
}

const OrdersTab: React.FC<OrdersTabProps> = ({
  orders: profileOrders,
  onViewOrderDetails,
  onDownloadInvoice,
  onCancelOrder,
  onReturnOrder,
  onBuyAgain // Destructure onBuyAgain
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
  const convertOrders = (apiOrders: ApiOrder[]): ProfileOrder[] => {
    return apiOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      products: order.items.map((item: { productId: string; variantId?: string; name: string; image?: string; options?: Record<string, unknown>; quantity: number; price: number }) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        image: item.image || '',
        options: item.options ? {
          shade: typeof item.options.shade === 'string' ? item.options.shade : undefined,
          size: typeof item.options.size === 'string' ? item.options.size : undefined,
        } : undefined,
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
      // ApiOrder (from OrderContext) only has trackingCode. 
      // ProfileOrder (for OrderHistory) expects a more complex tracking object with status array.
      // This conversion cannot create that from trackingCode alone.
      // Setting to undefined to resolve type errors. Detailed tracking should be handled differently.
      tracking: undefined 
    }));
  };

  const [displayOrders, setDisplayOrders] = useState<ProfileOrder[]>(profileOrders);

  // Cập nhật displayOrders khi orders từ context thay đổi
  useEffect(() => {
    if (orders && Array.isArray(orders) && orders.length > 0) {
      setDisplayOrders(convertOrders(orders));
    } else if (profileOrders && Array.isArray(profileOrders)) {
      setDisplayOrders(profileOrders);
    } else {
      setDisplayOrders([]);
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
      {!loading && displayOrders && Array.isArray(displayOrders) && displayOrders.length > 0 ? (
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

      {!loading && displayOrders && Array.isArray(displayOrders) && displayOrders.length > 0 && (
        <OrderHistory
          orders={displayOrders}
          onViewOrderDetails={onViewOrderDetails}
          onDownloadInvoice={onDownloadInvoice}
          onCancelOrder={onCancelOrder}
          onReturnOrder={onReturnOrder}
          onBuyAgain={onBuyAgain} // Pass onBuyAgain to OrderHistory
        />
      )}
    </div>
  );
};

export default OrdersTab;
