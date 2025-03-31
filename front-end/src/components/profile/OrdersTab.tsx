import React, { useState, useEffect } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { Order, OrderStatusType } from './types';
import OrderFilters from './OrderFilters';
import OrderHistory from './OrderHistory';

interface OrdersTabProps {
  orders: Order[];
  onViewOrderDetails: (orderId: string) => void;
  onDownloadInvoice: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onReturnOrder: (orderId: string) => void;
  onBuyAgain: (orderId: string) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onViewOrderDetails,
  onDownloadInvoice,
  onCancelOrder,
  onReturnOrder,
  onBuyAgain
}) => {
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusType>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);

  useEffect(() => {
    let result = [...orders];
    
    // Lọc theo trạng thái
    if (orderStatusFilter !== 'all') {
      result = result.filter(order => order.status === orderStatusFilter);
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchOrderQuery) {
      const query = searchOrderQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(query) || 
        order.products.some(product => 
          product.name.toLowerCase().includes(query)
        )
      );
    }
    
    setFilteredOrders(result);
  }, [orders, orderStatusFilter, searchOrderQuery]);

  const handleOrderStatusFilterChange = (status: OrderStatusType) => {
    setOrderStatusFilter(status);
  };

  const handleSearchOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchOrderQuery(e.target.value);
  };

  const handleSearchOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tìm kiếm đã được xử lý bởi useEffect
  };

  const handleClearFilters = () => {
    setOrderStatusFilter('all');
    setSearchOrderQuery('');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Lịch sử đơn hàng</h2>
      
      <OrderFilters
        orderStatusFilter={orderStatusFilter}
        searchOrderQuery={searchOrderQuery}
        onFilterChange={handleOrderStatusFilterChange}
        onSearchChange={handleSearchOrderChange}
        onSearchSubmit={handleSearchOrderSubmit}
        onClearFilters={handleClearFilters}
      />
      
      {/* Hiển thị số lượng đơn hàng tìm thấy */}
      {filteredOrders.length > 0 ? (
        <p className="text-sm text-gray-500 mb-4">Tìm thấy {filteredOrders.length} đơn hàng</p>
      ) : (
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
      
      {filteredOrders.length > 0 && (
        <OrderHistory
          orders={filteredOrders}
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