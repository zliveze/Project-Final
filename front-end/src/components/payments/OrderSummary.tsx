import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';

interface OrderItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: {
    url: string;
    alt: string;
  };
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  voucherCode?: string;
  onPlaceOrder: () => void;
  isProcessing: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  discount,
  shipping,
  total,
  voucherCode,
  onPlaceOrder,
  isProcessing
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
      
      {/* Danh sách sản phẩm */}
      <div className="max-h-80 overflow-y-auto mb-4 pr-2">
        {items.map((item) => (
          <div key={item._id} className="flex py-3 border-b border-gray-100">
            <div className="w-16 h-16 relative flex-shrink-0">
              <Image
                src={item.image.url}
                alt={item.image.alt}
                fill
                className="object-cover rounded-md"
              />
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs">
                {item.quantity}
              </div>
            </div>
            <div className="ml-3 flex-grow">
              <Link href={`/products/${item.slug}`} className="text-sm font-medium text-gray-800 hover:text-pink-600 line-clamp-2">
                {item.name}
              </Link>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-500">
                  {new Intl.NumberFormat('vi-VN').format(item.price)}đ x {item.quantity}
                </span>
                <span className="text-sm font-medium text-pink-600">
                  {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Thông tin giá */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tạm tính</span>
          <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Giảm giá {voucherCode && <span className="text-orange-500">({voucherCode})</span>}
          </span>
          <span className="text-orange-500">-{new Intl.NumberFormat('vi-VN').format(discount)}đ</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Phí vận chuyển</span>
          {shipping > 0 ? (
            <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(shipping)}đ</span>
          ) : (
            <span className="text-green-600">Miễn phí</span>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="font-semibold">Tổng cộng</span>
          <span className="text-pink-600 font-semibold text-lg">
            {new Intl.NumberFormat('vi-VN').format(total)}đ
          </span>
        </div>
      </div>
      
      {/* Nút đặt hàng */}
      <button
        onClick={onPlaceOrder}
        disabled={isProcessing}
        className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
          isProcessing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity'
        }`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang xử lý...
          </>
        ) : (
          <>
            Đặt hàng
            <FiChevronRight className="ml-1" />
          </>
        )}
      </button>
      
      {/* Thông tin bổ sung */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Bằng cách nhấn "Đặt hàng", bạn đồng ý với <Link href="/terms" className="text-pink-600 hover:underline">Điều khoản dịch vụ</Link> và <Link href="/privacy" className="text-pink-600 hover:underline">Chính sách bảo mật</Link> của chúng tôi.</p>
      </div>
    </div>
  );
};

export default OrderSummary; 