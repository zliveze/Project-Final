import { useState, useEffect } from 'react';
import { FiX, FiEye, FiClock, FiCheck, FiPercent, FiDollarSign, FiShoppingBag, FiList, FiUsers } from 'react-icons/fi';
import { Voucher } from '@/contexts/VoucherContext';
import { formatDate, formatPrice } from '@/utils/formatters';

interface VoucherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: Voucher | null;
}

const VoucherDetailModal: React.FC<VoucherDetailModalProps> = ({
  isOpen,
  onClose,
  voucher
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen || !voucher) return null;

  const getTypeText = (type: string) => {
    return type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định';
  };

  const getValueText = (voucher: Voucher) => {
    return voucher.discountType === 'percentage'
      ? `${voucher.discountValue}%`
      : formatPrice(voucher.discountValue);
  };

  const getMinOrderValueText = (value: number) => {
    return value > 0 ? formatPrice(value) : 'Không giới hạn';
  };

  // Tính trạng thái voucher
  const getVoucherStatus = () => {
    const now = new Date();

    if (!voucher.isActive) {
      return { text: 'Vô hiệu hóa', color: 'bg-gray-100 text-gray-800' };
    }

    if (now < new Date(voucher.startDate)) {
      return { text: 'Chưa đến thời gian', color: 'bg-blue-100 text-blue-800' };
    }

    if (now > new Date(voucher.endDate)) {
      return { text: 'Đã hết hạn', color: 'bg-red-100 text-red-800' };
    }

    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return { text: 'Đã hết lượt sử dụng', color: 'bg-orange-100 text-orange-800' };
    }

    return { text: 'Đang hoạt động', color: 'bg-green-100 text-green-800' };
  };

  const status = getVoucherStatus();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Chi tiết voucher: {voucher.code}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin cơ bản</h4>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mã voucher</p>
                      <p className="mt-1 text-sm text-gray-900">{voucher.code}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {voucher.isActive ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <FiCheck className="mr-1" /> Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <FiX className="mr-1" /> Không hoạt động
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Loại giảm giá</p>
                      <p className="mt-1 text-sm text-gray-900">{getTypeText(voucher.discountType)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Giá trị giảm giá</p>
                      <p className="mt-1 text-sm text-gray-900">{getValueText(voucher)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Đơn hàng tối thiểu</p>
                      <p className="mt-1 text-sm text-gray-900">{getMinOrderValueText(voucher.minimumOrderValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Số lần sử dụng</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {voucher.usedCount} / {voucher.usageLimit === 0 ? '∞' : voucher.usageLimit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày kết thúc</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.endDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Mô tả</h4>
                <div className="bg-gray-50 p-4 rounded-md border h-full">
                  <p className="text-sm text-gray-700">{voucher.description || 'Không có mô tả'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Điều kiện áp dụng</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Đối tượng người dùng */}
                <div className="bg-white p-4 rounded-md border shadow-sm">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <FiUsers className="mr-2 text-pink-500" />
                    Đối tượng người dùng
                  </h5>

                  <div className="space-y-3">
                    {/* User targeting options */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className={`p-2 rounded-md ${voucher.applicableUserGroups?.all ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                        <p className="text-sm flex items-center">
                          <span className={voucher.applicableUserGroups?.all ? 'text-green-600' : 'text-gray-400'}>
                            {voucher.applicableUserGroups?.all ?
                              <FiCheck className="inline mr-1.5 h-4 w-4" /> :
                              <FiX className="inline mr-1.5 h-4 w-4" />}
                          </span>
                          <span className={`${voucher.applicableUserGroups?.all ? 'font-medium text-green-800' : 'text-gray-500'}`}>
                            Tất cả người dùng
                          </span>
                        </p>
                      </div>

                      <div className={`p-2 rounded-md ${voucher.applicableUserGroups?.new ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                        <p className="text-sm flex items-center">
                          <span className={voucher.applicableUserGroups?.new ? 'text-green-600' : 'text-gray-400'}>
                            {voucher.applicableUserGroups?.new ?
                              <FiCheck className="inline mr-1.5 h-4 w-4" /> :
                              <FiX className="inline mr-1.5 h-4 w-4" />}
                          </span>
                          <span className={`${voucher.applicableUserGroups?.new ? 'font-medium text-green-800' : 'text-gray-500'}`}>
                            Chỉ người dùng mới
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Specific users */}
                    {voucher.applicableUserGroups?.specific && voucher.applicableUserGroups?.specific.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FiUsers className="mr-1.5 h-4 w-4 text-gray-500" />
                          Người dùng cụ thể
                        </p>
                        <p className="text-sm text-gray-500">
                          {voucher.applicableUserGroups.specific.length} người dùng được chọn
                        </p>
                      </div>
                    )}

                    {/* User levels */}
                    {voucher.applicableUserGroups?.levels && voucher.applicableUserGroups?.levels.length > 0 && (
                      <div className="mt-3 p-3 bg-pink-50 rounded-md border border-pink-100">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <svg className="mr-1.5 h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Cấp độ khách hàng áp dụng
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {voucher.applicableUserGroups.levels.map((level, index) => {
                            // Define colors based on level
                            let bgColor = 'bg-gray-100';
                            let textColor = 'text-gray-800';

                            if (level === 'Khách hàng bạc') {
                              bgColor = 'bg-gray-200';
                              textColor = 'text-gray-800';
                            } else if (level === 'Khách hàng vàng') {
                              bgColor = 'bg-yellow-100';
                              textColor = 'text-yellow-800';
                            } else if (level === 'Khách hàng thân thiết') {
                              bgColor = 'bg-pink-100';
                              textColor = 'text-pink-800';
                            }

                            return (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
                              >
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${textColor.replace('text', 'bg')}`}></span>
                                {level}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sản phẩm */}
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h5 className="font-medium text-gray-700 mb-2">Sản phẩm áp dụng</h5>

                  {(!voucher.applicableProducts?.length && !voucher.applicableCategories?.length && !voucher.applicableBrands?.length) ? (
                    <p className="text-sm text-gray-700">Áp dụng cho tất cả sản phẩm</p>
                  ) : (
                    <div className="space-y-2">
                      {voucher.applicableCategories && voucher.applicableCategories.length > 0 && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Danh mục:</span> {voucher.applicableCategories.length} danh mục
                        </p>
                      )}

                      {voucher.applicableBrands && voucher.applicableBrands.length > 0 && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Thương hiệu:</span> {voucher.applicableBrands.length} thương hiệu
                        </p>
                      )}

                      {voucher.applicableProducts && voucher.applicableProducts.length > 0 && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Sản phẩm:</span> {voucher.applicableProducts.length} sản phẩm
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sự kiện và chiến dịch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h5 className="font-medium text-gray-700 mb-2">Sự kiện áp dụng</h5>
                  {voucher.applicableEvents && voucher.applicableEvents.length > 0 ? (
                    <p className="text-sm text-gray-700">{voucher.applicableEvents.length} sự kiện được áp dụng</p>
                  ) : (
                    <p className="text-sm text-gray-500">Không áp dụng cho sự kiện cụ thể</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-md border">
                  <h5 className="font-medium text-gray-700 mb-2">Chiến dịch áp dụng</h5>
                  {voucher.applicableCampaigns && voucher.applicableCampaigns.length > 0 ? (
                    <p className="text-sm text-gray-700">{voucher.applicableCampaigns.length} chiến dịch được áp dụng</p>
                  ) : (
                    <p className="text-sm text-gray-500">Không áp dụng cho chiến dịch cụ thể</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin khác</h4>
              <div className="bg-gray-50 p-4 rounded-md border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDetailModal;