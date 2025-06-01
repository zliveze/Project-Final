import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronRight, FiGift } from 'react-icons/fi';

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
  gifts?: Array<{
    giftId: string;
    name: string;
    description?: string;
    value: number;
    image: {
      url: string;
      alt: string;
    };
  }>;
}

import { ShippingService } from '@/contexts/user/UserOrderContext';

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  voucherCode?: string;
  shippingError?: string | null;
  calculatedShipping?: number; // Thêm trường phí vận chuyển đã tính
  availableServices?: ShippingService[];
  selectedServiceCode?: string; // Mã dịch vụ vận chuyển được chọn
  onSelectShippingService: (serviceCode: string, fee: number) => void; // Hàm xử lý khi chọn dịch vụ vận chuyển
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
  shippingError,
  calculatedShipping,
  availableServices,
  selectedServiceCode,
  onSelectShippingService,
  onPlaceOrder,
  isProcessing
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>

      {/* Danh sách sản phẩm */}
      <div className="max-h-80 overflow-y-auto mb-4 pr-2">
        {items.map((item) => (
          <div key={item._id} className="py-3 border-b border-gray-100">
            <div className="flex">
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
                <Link href={`/product/${item.slug}`} className="text-sm font-medium text-gray-800 hover:text-pink-600 line-clamp-2">
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

            {/* Hiển thị quà tặng */}
            {item.gifts && item.gifts.length > 0 && (
              <div className="mt-2 ml-19">
                <div className="flex items-center gap-1 mb-1">
                  <FiGift className="text-pink-500" size={12} />
                  <span className="text-xs font-medium text-pink-600">Quà tặng kèm:</span>
                </div>
                <div className="space-y-1">
                  {item.gifts.map((gift) => (
                    <div key={gift.giftId} className="flex items-center gap-2 bg-pink-50 px-2 py-1 rounded-md border border-pink-100">
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image
                          src={gift.image.url}
                          alt={gift.image.alt}
                          fill
                          className="object-cover rounded-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-pink-700 truncate">{gift.name}</div>
                        {gift.description && (
                          <div className="text-xs text-pink-600 truncate">{gift.description}</div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-pink-600">
                        {new Intl.NumberFormat('vi-VN').format(gift.value)}đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          {shippingError ? (
            <span className="text-red-500 text-xs italic">{shippingError}</span>
          ) : shipping > 0 ? (
            <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(shipping)}đ</span>
          ) : (
            <span className="text-green-600">Miễn phí</span>
          )}
        </div>

        {/* Thông báo về phí vận chuyển */}
        <div className="text-xs text-gray-500 mt-1 italic">
          {calculatedShipping ? (
            <>
              Phí vận chuyển đã tính: {new Intl.NumberFormat('vi-VN').format(calculatedShipping)}đ
              {calculatedShipping !== shipping && (
                <span className="text-pink-500"> (Cập nhật: {new Intl.NumberFormat('vi-VN').format(shipping)}đ)</span>
              )}
            </>
          ) : (
            <>Phí vận chuyển được tính dựa trên trọng lượng sản phẩm và địa chỉ giao hàng</>
          )}
        </div>

        {/* Hiển thị các dịch vụ vận chuyển khả dụng */}
        {availableServices && availableServices.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Chọn dịch vụ vận chuyển:</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableServices.map((service, index) => (
                <div
                  key={index}
                  className={`flex justify-between text-xs border-b pb-2 pt-1 px-2 rounded cursor-pointer ${selectedServiceCode === service.serviceCode ? 'bg-pink-50 border-pink-300' : 'hover:bg-gray-50'}`}
                  onClick={() => onSelectShippingService(service.serviceCode, service.fee)}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${selectedServiceCode === service.serviceCode ? 'border-pink-500 bg-pink-500' : 'border-gray-300'}`}>
                      {selectedServiceCode === service.serviceCode && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={`${selectedServiceCode === service.serviceCode ? 'font-medium text-pink-700' : 'text-gray-600'}`}>
                      {service.serviceName}
                    </span>
                  </div>
                  <span className={`font-medium ${selectedServiceCode === service.serviceCode ? 'text-pink-600' : ''}`}>
                    {new Intl.NumberFormat('vi-VN').format(service.fee)}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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