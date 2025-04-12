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
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900 mr-3">
                Chi tiết voucher: {voucher.code}
              </h3>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                {status.text}
              </span>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            {/* Basic Information Section - Horizontal Layout */}
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Thông tin cơ bản</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${voucher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {voucher.isActive ? <FiCheck className="mr-1" /> : <FiX className="mr-1" />}
                    {voucher.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap -mx-2">
                {/* Left Column */}
                <div className="w-full md:w-1/2 px-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mã voucher</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{voucher.code}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Loại giảm giá</p>
                      <p className="mt-1 text-sm text-gray-900">{getTypeText(voucher.discountType)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Giá trị giảm giá</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{getValueText(voucher)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Đơn hàng tối thiểu</p>
                      <p className="mt-1 text-sm text-gray-900">{getMinOrderValueText(voucher.minimumOrderValue)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="w-full md:w-1/2 px-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày kết thúc</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Số lần sử dụng</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {voucher.usedCount} / {voucher.usageLimit === 0 ? '∞' : voucher.usageLimit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mô tả</p>
                      <p className="mt-1 text-sm text-gray-700 line-clamp-2">{voucher.description || 'Không có mô tả'}</p>
                    </div>
                  </div>
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

                  <div className="flex flex-wrap gap-2">
                    {/* User targeting options */}
                    <div className={`flex-1 min-w-[150px] p-2 rounded-md ${voucher.applicableUserGroups?.all ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
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

                    <div className={`flex-1 min-w-[150px] p-2 rounded-md ${voucher.applicableUserGroups?.new ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
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
                    
                    <div className={`flex-1 min-w-[150px] p-2 rounded-md ${voucher.applicableUserGroups?.levels?.length ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                      <p className="text-sm flex items-center">
                        <span className={voucher.applicableUserGroups?.levels?.length ? 'text-green-600' : 'text-gray-400'}>
                          {voucher.applicableUserGroups?.levels?.length ?
                            <FiCheck className="inline mr-1.5 h-4 w-4" /> :
                            <FiX className="inline mr-1.5 h-4 w-4" />}
                        </span>
                        <span className={`${voucher.applicableUserGroups?.levels?.length ? 'font-medium text-green-800' : 'text-gray-500'}`}>
                          Theo cấp độ khách hàng
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* User levels */}
                  {voucher.applicableUserGroups?.levels && voucher.applicableUserGroups?.levels.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-2">Cấp độ khách hàng:</p>
                      <div className="flex flex-wrap gap-2">
                        {voucher.applicableUserGroups.levels.map((level, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sản phẩm áp dụng */}
                <div className="bg-white p-4 rounded-md border shadow-sm">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <FiShoppingBag className="mr-2 text-pink-500" />
                    Sản phẩm áp dụng
                  </h5>

                  <div className="flex flex-wrap gap-2">
                    <div className={`flex-1 min-w-[150px] p-2 rounded-md ${!voucher.applicableProducts?.length ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                      <p className="text-sm flex items-center">
                        <span className={!voucher.applicableProducts?.length ? 'text-green-600' : 'text-gray-400'}>
                          {!voucher.applicableProducts?.length ?
                            <FiCheck className="inline mr-1.5 h-4 w-4" /> :
                            <FiX className="inline mr-1.5 h-4 w-4" />}
                        </span>
                        <span className={`${!voucher.applicableProducts?.length ? 'font-medium text-green-800' : 'text-gray-500'}`}>
                          Tất cả sản phẩm
                        </span>
                      </p>
                    </div>

                    <div className={`flex-1 min-w-[150px] p-2 rounded-md ${voucher.applicableProducts?.length ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                      <p className="text-sm flex items-center">
                        <span className={voucher.applicableProducts?.length ? 'text-green-600' : 'text-gray-400'}>
                          {voucher.applicableProducts?.length ?
                            <FiCheck className="inline mr-1.5 h-4 w-4" /> :
                            <FiX className="inline mr-1.5 h-4 w-4" />}
                        </span>
                        <span className={`${voucher.applicableProducts?.length ? 'font-medium text-green-800' : 'text-gray-500'}`}>
                          Sản phẩm cụ thể
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Specific products */}
                  {voucher.applicableProducts && voucher.applicableProducts.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {voucher.applicableProducts.length} sản phẩm được chọn
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDetailModal;
