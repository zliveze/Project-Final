import React, { useState } from 'react';
import Link from 'next/link';
import { FiChevronRight, FiShield, FiTruck, FiRefreshCw } from 'react-icons/fi';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  voucherCode: string;
  onApplyVoucher: (code: string) => void;
  onProceedToCheckout: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  voucherCode,
  onApplyVoucher,
  onProceedToCheckout
}) => {
  const [code, setCode] = useState(voucherCode || '');

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onApplyVoucher(code.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
      
      {/* Thông tin giá */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tạm tính ({itemCount} sản phẩm)</span>
          <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Giảm giá</span>
          <span className="text-pink-500">-{new Intl.NumberFormat('vi-VN').format(discount)}đ</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Phí vận chuyển</span>
          {shipping > 0 ? (
            <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(shipping)}đ</span>
          ) : (
            <span className="text-pink-600">Miễn phí</span>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="font-semibold">Tổng cộng</span>
          <span className="text-pink-600 font-semibold text-lg">
            {new Intl.NumberFormat('vi-VN').format(total)}đ
          </span>
        </div>
      </div>
      
      {/* Form mã giảm giá */}
      <form onSubmit={handleApplyVoucher} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã giảm giá"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-r-md hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Áp dụng
          </button>
        </div>
      </form>
      
      {/* Nút thanh toán */}
      <button
        onClick={onProceedToCheckout}
        disabled={itemCount === 0}
        className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
          itemCount === 0
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity'
        }`}
      >
        Tiến hành thanh toán
        <FiChevronRight className="ml-1" />
      </button>
      
      {/* Thông tin bổ sung */}
      <div className="mt-6 space-y-3">
        <div className="flex items-start text-xs text-gray-600">
          <FiShield className="mt-0.5 mr-2 text-pink-500 flex-shrink-0" />
          <span>Thanh toán an toàn và bảo mật. Thông tin của bạn được mã hóa.</span>
        </div>
        
        <div className="flex items-start text-xs text-gray-600">
          <FiTruck className="mt-0.5 mr-2 text-pink-500 flex-shrink-0" />
          <span>Miễn phí vận chuyển cho đơn hàng từ 500.000đ tại khu vực nội thành.</span>
        </div>
        
        <div className="flex items-start text-xs text-gray-600">
          <FiRefreshCw className="mt-0.5 mr-2 text-pink-500 flex-shrink-0" />
          <span>Đổi trả miễn phí trong vòng 30 ngày nếu sản phẩm có vấn đề.</span>
        </div>
      </div>
      
      {/* Liên kết tiếp tục mua sắm */}
      <div className="mt-4 text-center">
        <Link href="/shop" className="text-sm text-pink-600 hover:underline">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
};

export default CartSummary; 