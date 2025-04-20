import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiCopy, FiTag, FiInfo } from 'react-icons/fi';
import { Voucher } from '@/hooks/useUserVoucher';
import { formatDate } from '@/utils/dateUtils';

interface VoucherListModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableVouchers: Voucher[];
  unavailableVouchers: Voucher[];
  onSelectVoucher: (code: string) => void;
  appliedVoucherCode?: string;
  subtotal: number;
}

const VoucherListModal: React.FC<VoucherListModalProps> = ({
  isOpen,
  onClose,
  availableVouchers,
  unavailableVouchers,
  onSelectVoucher,
  appliedVoucherCode,
  subtotal
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'unavailable'>('available');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Format giá trị giảm giá
  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discountType === 'percentage') {
      return `Giảm ${voucher.discountValue}%`;
    } else {
      return `Giảm ${new Intl.NumberFormat('vi-VN').format(voucher.discountValue)}đ`;
    }
  };

  // Kiểm tra xem voucher có đáp ứng điều kiện đơn hàng tối thiểu không
  const meetsMinimumOrder = (voucher: Voucher) => {
    return subtotal >= voucher.minimumOrderValue;
  };

  // Hiển thị lý do không khả dụng
  const getUnavailableReason = (voucher: Voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);

    // Kiểm tra thời gian
    if (startDate > now) {
      return `Chưa đến thời gian sử dụng (${formatDate(startDate)})`;
    }

    if (endDate < now) {
      return 'Đã hết hạn';
    }

    // Kiểm tra số lượng sử dụng
    if (voucher.usedCount >= voucher.usageLimit) {
      return 'Đã hết lượt sử dụng';
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (subtotal < voucher.minimumOrderValue) {
      return `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.minimumOrderValue)}đ`;
    }

    return 'Không áp dụng được cho đơn hàng này';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-300/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white/80 backdrop-blur-sm rounded-lg max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Mã giảm giá</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'available'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('available')}
          >
            Khả dụng ({availableVouchers.length})
          </button>
          <button
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'unavailable'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('unavailable')}
          >
            Không khả dụng ({unavailableVouchers.length})
          </button>
        </div>

        {/* Voucher list */}
        <div className="overflow-y-auto flex-grow p-4">
          {activeTab === 'available' ? (
            availableVouchers.length > 0 ? (
              <div className="space-y-3">
                {availableVouchers.map((voucher) => (
                  <div
                    key={voucher._id}
                    className={`border rounded-lg overflow-hidden ${
                      appliedVoucherCode === voucher.code
                        ? 'border-pink-500'
                        : 'border-gray-200 hover:border-pink-300'
                    } transition-colors`}
                  >
                    <div className="flex items-center h-14">
                      {/* Left side - discount */}
                      <div className="bg-pink-500 text-white h-full flex items-center justify-center min-w-[100px]">
                        <div className="text-center font-bold text-lg">
                          {formatDiscount(voucher)}
                        </div>
                      </div>

                      {/* Center - code and date */}
                      <div className="flex-1 px-4">
                        <div className="font-mono font-medium text-gray-700">
                          {voucher.code}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          HSD: {formatDate(new Date(voucher.endDate))}
                        </div>
                      </div>

                      {/* Right side - status */}
                      <div className="pr-4">
                        {appliedVoucherCode === voucher.code ? (
                          <span className="text-green-600 text-sm font-medium">
                            Đang áp dụng
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectVoucher(voucher.code)}
                            className="text-pink-600 text-sm font-medium hover:text-pink-700"
                          >
                            Áp dụng
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FiInfo size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500">Không có mã giảm giá khả dụng</p>
                <p className="text-sm text-gray-400 mt-1">Vui lòng quay lại sau</p>
              </div>
            )
          ) : (
            unavailableVouchers.length > 0 ? (
              <div className="space-y-3">
                {unavailableVouchers.map((voucher) => (
                  <div
                    key={voucher._id}
                    className="border border-gray-200 rounded-lg overflow-hidden opacity-75"
                  >
                    <div className="flex items-stretch">
                      {/* Left side - discount info */}
                      <div className="bg-gray-400 text-white p-3 flex flex-col justify-center items-center min-w-[100px]">
                        <FiTag className="mb-1" size={18} />
                        <div className="text-center">
                          <div className="font-bold text-sm">
                            {formatDiscount(voucher)}
                          </div>
                          <div className="text-xs opacity-80">
                            {voucher.minimumOrderValue > 0
                              ? `Đơn ≥ ${new Intl.NumberFormat('vi-VN').format(voucher.minimumOrderValue)}đ`
                              : 'Không giới hạn'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Right side - details */}
                      <div className="flex-1 p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-700">{voucher.description || formatDiscount(voucher)}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                HSD: {formatDate(new Date(voucher.endDate))}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center">
                            <div className="bg-gray-100 rounded px-2 py-1 text-xs font-mono font-medium text-gray-600">
                              {voucher.code}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs text-red-500">
                            {getUnavailableReason(voucher)}
                          </span>
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                          >
                            Không khả dụng
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FiInfo size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500">Không có mã giảm giá không khả dụng</p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 bg-pink-600 text-white rounded-md font-medium hover:bg-pink-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherListModal;

