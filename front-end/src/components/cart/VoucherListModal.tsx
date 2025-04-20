import React, { useState, useEffect } from 'react';
import { FiX, FiTag, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
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
  currentUserLevel: string;
}

const VoucherListModal: React.FC<VoucherListModalProps> = ({
  isOpen,
  onClose,
  availableVouchers,
  unavailableVouchers,
  onSelectVoucher,
  appliedVoucherCode,
  subtotal,
  currentUserLevel
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

  // Kiểm tra xem voucher có áp dụng được cho cấp độ khách hàng hiện tại không
  const isApplicableToUserLevel = (voucher: Voucher) => {
    const groups = voucher.applicableUserGroups;
    if (!groups) return true;
    if (groups.all) return true;
    return groups.levels && groups.levels.includes(currentUserLevel);
  };

  // Hiển thị lý do không khả dụng
  const getUnavailableReason = (voucher: Voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);

    if (!isApplicableToUserLevel(voucher)) {
      const groups = voucher.applicableUserGroups;
      return `Chỉ áp dụng cho ${groups?.levels?.join(', ') || 'nhóm khách hàng nhất định'}`;
    }
    if (startDate > now) return `Hiệu lực từ: ${formatDate(startDate)}`;
    if (endDate < now) return 'Đã hết hạn';
    if (voucher.usedCount >= voucher.usageLimit) return 'Đã hết lượt sử dụng';
    if (subtotal < voucher.minimumOrderValue) return `Đơn tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.minimumOrderValue)}đ`;
    return 'Không đủ điều kiện áp dụng';
  };

  // Helper function to calculate actual discount amount
  const calculateDiscountAmount = (voucher: Voucher, currentSubtotal: number): number => {
    if (!voucher || currentSubtotal <= 0) return 0;

    let discount = 0;
    if (voucher.discountType === 'percentage') {
      discount = (currentSubtotal * voucher.discountValue) / 100;
      // Apply max discount cap if it exists and is positive
      if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0 && discount > voucher.maxDiscountAmount) {
        discount = voucher.maxDiscountAmount;
      }
    } else { // Fixed amount
      discount = voucher.discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    return Math.min(discount, currentSubtotal);
  };

  // Find the best available voucher
  let bestVoucherId: string | null = null;
  let maxDiscount = 0;

  availableVouchers.forEach(voucher => {
    // Ensure the voucher meets minimum order value before considering it
    if (meetsMinimumOrder(voucher)) {
        const currentDiscount = calculateDiscountAmount(voucher, subtotal);
        if (currentDiscount > maxDiscount) {
        maxDiscount = currentDiscount;
        bestVoucherId = voucher._id;
        }
     }
   });

  // Sort available vouchers by discount amount (descending)
  const sortedAvailableVouchers = [...availableVouchers].sort((a, b) => {
    // Only consider vouchers that meet the minimum order value for sorting
    const discountA = meetsMinimumOrder(a) ? calculateDiscountAmount(a, subtotal) : -1;
    const discountB = meetsMinimumOrder(b) ? calculateDiscountAmount(b, subtotal) : -1;
    // If both don't meet minimum, keep original order (or sort by other criteria if needed)
    if (discountA === -1 && discountB === -1) return 0;
    return discountB - discountA; // Sort descending, vouchers not meeting minimum go last
  });

   const renderVoucher = (voucher: Voucher, isAvailable: boolean, isBestChoice: boolean) => {
     const isApplied = appliedVoucherCode === voucher.code;
     const reason = !isAvailable ? getUnavailableReason(voucher) : '';

    return (
      <div
        key={voucher._id}
        className={`border rounded-lg p-4 mb-3 transition-all duration-200 ease-in-out relative ${ // Thêm relative để định vị badge
          isApplied
            ? 'border-pink-500 bg-pink-50/50 shadow-sm'
            : isAvailable
            ? isBestChoice
              ? 'border-green-400 bg-green-50/50 hover:shadow-md shadow-sm ring-1 ring-green-300' // Kiểu cho lựa chọn tốt nhất
              : 'border-gray-200 hover:border-pink-300 hover:shadow-sm'
            : 'border-gray-200 bg-gray-50 opacity-70'
        }`}
      >
        {/* Best Choice Badge */}
        {isBestChoice && isAvailable && (
          <span className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold shadow">
            Tốt nhất
          </span>
        )}
        <div className="flex justify-between items-start">
          {/* Left side: Info */}
          <div className="flex-1 mr-4">
            <div className="flex items-center mb-1">
              <FiTag className={`mr-2 ${isAvailable ? (isBestChoice ? 'text-green-600' : 'text-pink-600') : 'text-gray-500'}`} size={16} />
              <span className={`font-semibold ${isAvailable ? (isBestChoice ? 'text-green-700' : 'text-pink-700') : 'text-gray-600'}`}>
                {formatDiscount(voucher)}
              </span>
            </div>
            {/* Hiển thị mô tả nếu có và khác với giá trị giảm giá */}
            {voucher.description && voucher.description !== formatDiscount(voucher) && (
              <div className="text-sm text-gray-700 mb-1 ml-6">
                {voucher.description}
              </div>
            )}
            {/* Khối div lặp đã được xóa */}
            <div className="text-xs text-gray-500 mb-1 ml-6"> {/* Thêm ml-6 để căn lề */}
              Mã: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{voucher.code}</span>
            </div>
            <div className="text-xs text-gray-500 ml-6"> {/* Thêm ml-6 để căn lề */}
              HSD: {formatDate(new Date(voucher.endDate))}
              {voucher.minimumOrderValue > 0 && (
                <span className="ml-2">
                  | Đơn tối thiểu: {new Intl.NumberFormat('vi-VN').format(voucher.minimumOrderValue)}đ
                </span>
              )}
            </div>
            {!isAvailable && reason && (
              <div className="mt-2 text-xs text-red-600 flex items-center ml-6"> {/* Thêm ml-6 để căn lề */}
                <FiInfo size={14} className="mr-1" />
                {reason}
              </div>
            )}
          </div>

          {/* Right side: Action/Status */}
          <div className="flex-shrink-0">
            {isAvailable ? (
              isApplied ? (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <FiCheckCircle size={16} className="mr-1" />
                  <span>Đang áp dụng</span>
                </div>
              ) : (
                <button
                  onClick={() => onSelectVoucher(voucher.code)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                >
                  Áp dụng
                </button>
              )
            ) : (
              <div className="flex items-center text-gray-500 text-sm font-medium">
                 <FiXCircle size={16} className="mr-1" />
                <span>Không khả dụng</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voucher-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="voucher-modal-title" className="text-lg font-semibold text-gray-800">Chọn mã giảm giá</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 -mr-1"
            aria-label="Đóng"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
          <button
            className={`flex-1 py-3 font-medium text-sm transition-colors ${
              activeTab === 'available'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('available')}
            role="tab"
            aria-selected={activeTab === 'available'}
          >
            Khả dụng ({availableVouchers.length})
          </button>
          <button
            className={`flex-1 py-3 font-medium text-sm transition-colors ${
              activeTab === 'unavailable'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('unavailable')}
            role="tab"
            aria-selected={activeTab === 'unavailable'}
          >
            Không khả dụng ({unavailableVouchers.length})
          </button>
        </div>

        {/* Voucher list */}
        <div className="overflow-y-auto flex-grow p-4">
           {activeTab === 'available' ? (
             sortedAvailableVouchers.length > 0 ? ( // Sử dụng mảng đã sắp xếp
               <div>
                 {/* Truyền isBestChoice vào renderVoucher */}
                 {sortedAvailableVouchers.map(voucher => renderVoucher(voucher, true, voucher._id === bestVoucherId))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <FiTag size={40} className="text-gray-300 mb-3" />
                <p>Không có mã giảm giá khả dụng.</p>
                <p className="text-sm text-gray-400 mt-1">Vui lòng kiểm tra lại sau.</p>
              </div>
            )
          ) : (
            unavailableVouchers.length > 0 ? (
              <div>
                {/* Voucher không khả dụng không thể là lựa chọn tốt nhất */}
                {unavailableVouchers.map(voucher => renderVoucher(voucher, false, false))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                 <FiTag size={40} className="text-gray-300 mb-3" />
                <p>Không có mã giảm giá nào không khả dụng.</p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-pink-600 text-white rounded-md font-semibold hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherListModal;
