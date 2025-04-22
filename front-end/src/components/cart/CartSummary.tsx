import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronRight, FiShield, FiTruck, FiRefreshCw, FiX, FiCheck, FiTag } from 'react-icons/fi';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  voucherCode: string;
  onApplyVoucher: (code: string) => void;
  onProceedToCheckout: () => void;
  onClearVoucher?: () => void; // Optional prop to clear voucher
  onShowVoucherList?: () => void; // Optional prop to show voucher list
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  voucherCode,
  onApplyVoucher,
  onProceedToCheckout,
  onClearVoucher,
  onShowVoucherList
}) => {
  const [code, setCode] = useState('');

  // Cập nhật code khi voucherCode thay đổi từ props
  useEffect(() => {
    if (voucherCode) {
      setCode(voucherCode);
    }
  }, [voucherCode]);

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

        {/* Phí vận chuyển sẽ được tính ở trang thanh toán */}

        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="font-semibold">Tổng cộng</span>
          <span className="text-pink-600 font-semibold text-lg">
            {new Intl.NumberFormat('vi-VN').format(total)}đ
          </span>
        </div>
      </div>

      {/* Hiển thị voucher đã áp dụng hoặc form nhập mã */}
      {voucherCode ? (
        <div className="mb-6 p-3 bg-pink-50 rounded-md border border-pink-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiCheck className="text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-800">Mã giảm giá đã áp dụng</p>
                <p className="text-xs text-pink-600 font-bold">{voucherCode}</p>
              </div>
            </div>
            {onClearVoucher && (
              <button
                onClick={onClearVoucher}
                className="text-gray-500 hover:text-gray-700"
                title="Xóa mã giảm giá"
              >
                <FiX />
              </button>
            )}
          </div>
          {discount > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Bạn đã tiết kiệm được {new Intl.NumberFormat('vi-VN').format(discount)}đ
            </p>
          )}

          {/* Nút chọn mã giảm giá khác */}
          {onShowVoucherList && (
            <button
              onClick={onShowVoucherList}
              className="w-full mt-2 py-1.5 border border-pink-300 text-pink-600 rounded-md text-sm font-medium hover:bg-pink-50 transition-colors flex items-center justify-center"
            >
              <FiTag className="mr-1.5" size={14} />
              Chọn mã giảm giá khác
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <form onSubmit={handleApplyVoucher} className="mb-2">
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

          {/* Nút hiển thị danh sách mã giảm giá */}
          {onShowVoucherList && (
            <button
              onClick={onShowVoucherList}
              className="w-full py-2 border border-pink-300 text-pink-600 rounded-md text-sm font-medium hover:bg-pink-50 transition-colors flex items-center justify-center"
            >
              <FiTag className="mr-1.5" size={14} />
              Chọn mã giảm giá của bạn
            </button>
          )}
        </div>
      )}

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