import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiX, FiTag, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Voucher } from '@/hooks/useUserVoucher';
import { formatDate } from '@/utils/dateUtils';
// import Image from 'next/image'; // Removed unused import
import { FaSearch } from 'react-icons/fa'; // Removed FaPercent, FaTimes, FaCheck
import Portal from '@/components/common/Portal';

// Thêm interface mở rộng cho Voucher để bổ sung thuộc tính hasUserUsed
interface VoucherWithUserStatus extends Voucher {
  hasUserUsed: boolean;
}

interface VoucherListModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableVouchers: Voucher[];
  unavailableVouchers: Voucher[];
  onSelectVoucher: (code: string) => void;
  appliedVoucherCode?: string;
  subtotal: number;
  currentUserLevel: string;
  // userId?: string; // Removed unused prop
  user?: { _id: string; [key: string]: unknown }; // Specified a more concrete type for user
}

export function VoucherListModal({
  isOpen,
  onClose,
  availableVouchers,
  unavailableVouchers,
  onSelectVoucher,
  appliedVoucherCode,
  subtotal,
  currentUserLevel,
  // userId, // Removed unused prop
  user,
}: VoucherListModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Hàm kiểm tra xem voucher đã được sử dụng bởi người dùng hiện tại chưa
  const isVoucherUsedByUser = useCallback((voucher: Voucher): boolean => {
    // Kiểm tra xem voucher có mảng usedByUsers không và user có ID không
    if (!voucher.usedByUsers || !user?._id) return false;

    // Trong trường hợp mảng usedByUsers chứa các ObjectId từ MongoDB
    // Cần kiểm tra cả trường hợp ID đơn giản và trường hợp ID là object có chứa $oid
    return voucher.usedByUsers.some(userId => {
      // Trường hợp ID là chuỗi đơn giản
      if (typeof userId === 'string') {
        return userId === user._id;
      }

      // Trường hợp ID là object từ MongoDB với $oid
      // @ts-expect-error - Bỏ qua kiểm tra kiểu dữ liệu cho trường hợp đặc biệt MongoDB ObjectId
      if (userId && userId.$oid) {
        // @ts-expect-error - MongoDB ObjectId có thuộc tính $oid
        return userId.$oid === user._id;
      }

      return false;
    });
  }, [user?._id]);

  // Xử lý và phân loại voucher dựa trên trạng thái sử dụng
  const { actualAvailableVouchers, actualUnavailableVouchers } = useMemo(() => {
    if (!isOpen || !isMounted) {
      return {
        actualAvailableVouchers: [] as VoucherWithUserStatus[],
        actualUnavailableVouchers: [] as VoucherWithUserStatus[]
      };
    }

    // Thêm trạng thái đã sử dụng vào tất cả voucher
    const availableWithStatus = availableVouchers.map(voucher => {
      const hasUsed = isVoucherUsedByUser(voucher);
      return {
        ...voucher,
        hasUserUsed: hasUsed
      };
    }) as VoucherWithUserStatus[];

    const unavailableWithStatus = unavailableVouchers.map(voucher => ({
      ...voucher,
      hasUserUsed: isVoucherUsedByUser(voucher)
    })) as VoucherWithUserStatus[];

    // Phân loại: Chuyển voucher đã dùng sang danh sách không khả dụng
    const available = availableWithStatus.filter(voucher => !voucher.hasUserUsed);
    const unavailable = [
      ...unavailableWithStatus,
      ...availableWithStatus.filter(voucher => voucher.hasUserUsed)
    ];

    return {
      actualAvailableVouchers: available,
      actualUnavailableVouchers: unavailable
    };
  }, [availableVouchers, unavailableVouchers, isOpen, isMounted, isVoucherUsedByUser]);

  // Lọc voucher theo điều kiện tìm kiếm
  const filteredAvailableVouchers = useMemo(() => {
    if (!isOpen || !isMounted) return [] as VoucherWithUserStatus[];
    return actualAvailableVouchers.filter(
      (voucher) =>
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [actualAvailableVouchers, searchTerm, isOpen, isMounted]);

  const filteredUnavailableVouchers = useMemo(() => {
    if (!isOpen || !isMounted) return [] as VoucherWithUserStatus[];
    return actualUnavailableVouchers.filter(
      (voucher) =>
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [actualUnavailableVouchers, searchTerm, isOpen, isMounted]);

  // Tìm voucher tốt nhất dựa trên giá trị giảm giá
  const bestVoucher = useMemo(() => {
    if (!isOpen || !isMounted || filteredAvailableVouchers.length === 0) return null;

    return [...filteredAvailableVouchers].sort((a, b) => {
      const valueA = a.discountType === 'percentage' ? subtotal * (a.discountValue / 100) : a.discountValue;
      const valueB = b.discountType === 'percentage' ? subtotal * (b.discountValue / 100) : b.discountValue;
      return valueB - valueA;
    })[0];
  }, [filteredAvailableVouchers, subtotal, isOpen, isMounted]);

  if (!isOpen) return null;

  // Format giá trị giảm giá
  const formatDiscount = (voucher: VoucherWithUserStatus) => {
    if (voucher.discountType === 'percentage') {
      return `Giảm ${voucher.discountValue}%`;
    } else {
      return `Giảm ${new Intl.NumberFormat('vi-VN').format(voucher.discountValue)}đ`;
    }
  };

  // Kiểm tra xem voucher có đáp ứng điều kiện đơn hàng tối thiểu không
  // const meetsMinimumOrder = (voucher: VoucherWithUserStatus) => { // Removed unused function
  //   return subtotal >= voucher.minimumOrderValue;
  // };

  // Kiểm tra xem voucher có áp dụng được cho cấp độ khách hàng hiện tại không
  const isApplicableToUserLevel = (voucher: VoucherWithUserStatus) => {
    const groups = voucher.applicableUserGroups;
    if (!groups) return true;
    if (groups.all) return true;
    return groups.levels && groups.levels.includes(currentUserLevel);
  };

  // Hiển thị lý do không khả dụng
  const getUnavailableReason = (voucher: VoucherWithUserStatus) => {
    if (voucher.hasUserUsed) return 'Bạn đã sử dụng voucher này rồi';

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

  const renderVoucher = (voucher: VoucherWithUserStatus, isAvailable: boolean, isBestChoice: boolean) => {
    const isApplied = appliedVoucherCode === voucher.code;
    const reason = !isAvailable ? getUnavailableReason(voucher) : '';

    return (
      <div
        key={voucher._id}
        className={`border rounded-lg p-4 mb-3 transition-all duration-200 ease-in-out relative ${
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
            <div className="text-xs text-gray-500 mb-1 ml-6">
              Mã: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{voucher.code}</span>
            </div>
            <div className="text-xs text-gray-500 ml-6">
              HSD: {formatDate(new Date(voucher.endDate))}
              {voucher.minimumOrderValue > 0 && (
                <span className="ml-2">
                  | Đơn tối thiểu: {new Intl.NumberFormat('vi-VN').format(voucher.minimumOrderValue)}đ
                </span>
              )}
            </div>
            {!isAvailable && reason && (
              <div className="mt-2 text-xs text-red-600 flex items-center ml-6">
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
    <Portal>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
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

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm mã giảm giá..."
              className="w-full px-4 py-2 border rounded-lg pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
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
            Khả dụng ({filteredAvailableVouchers.length})
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
            Không khả dụng ({filteredUnavailableVouchers.length})
          </button>
        </div>

        {/* Voucher list */}
        <div className="overflow-y-auto flex-grow p-4">
           {activeTab === 'available' ? (
             filteredAvailableVouchers.length > 0 ? (
               <div>
                 {filteredAvailableVouchers.map(voucher => renderVoucher(
                   voucher,
                   true,
                   bestVoucher !== null && voucher._id === bestVoucher._id
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <FiTag size={40} className="text-gray-300 mb-3" />
                <p>Không có mã giảm giá khả dụng.</p>
                <p className="text-sm text-gray-400 mt-1">Vui lòng kiểm tra lại sau.</p>
              </div>
            )
          ) : (
            filteredUnavailableVouchers.length > 0 ? (
              <div>
                {filteredUnavailableVouchers.map(voucher => renderVoucher(voucher, false, false))}
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
    </Portal>
  );
}

export default VoucherListModal;
