import { useState, useEffect } from 'react';
import { FiX, FiEye, FiClock, FiCheck, FiPercent, FiDollarSign, FiShoppingBag, FiList, FiUsers } from 'react-icons/fi';
import { Voucher } from './VoucherForm';

interface VoucherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: Partial<Voucher>;
}

const VoucherDetailModal: React.FC<VoucherDetailModalProps> = ({
  isOpen,
  onClose,
  voucherData
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

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format value
  const formatValue = () => {
    if (voucherData.discountType === 'percentage') {
      return `${voucherData.discountValue}%`;
    } else {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(voucherData.discountValue || 0);
    }
  };
  
  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <FiEye className="text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết voucher
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              {/* Header with voucher code */}
              <div className="bg-pink-100 px-4 py-3 border-b border-pink-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-pink-800">
                    {voucherData.code}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${voucherData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'}`}>
                    {voucherData.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
              
              {/* Voucher content */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Discount info */}
                  <div className="flex items-start p-3 border border-gray-200 rounded-md">
                    <div className="mr-3 mt-1">
                      {voucherData.discountType === 'percentage' ? (
                        <FiPercent className="h-5 w-5 text-pink-500" />
                      ) : (
                        <FiDollarSign className="h-5 w-5 text-pink-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">
                        Giảm giá
                      </h4>
                      <p className="text-lg font-bold text-pink-600">{formatValue()}</p>
                      <p className="text-sm text-gray-500">
                        {voucherData.discountType === 'percentage' ? 'Theo phần trăm' : 'Số tiền cố định'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Time info */}
                  <div className="flex items-start p-3 border border-gray-200 rounded-md">
                    <div className="mr-3 mt-1">
                      <FiClock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">
                        Thời gian áp dụng
                      </h4>
                      <p className="text-base font-medium">
                        {formatDate(voucherData.startDate)} - {formatDate(voucherData.endDate)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Minimum order */}
                  <div className="flex items-start p-3 border border-gray-200 rounded-md">
                    <div className="mr-3 mt-1">
                      <FiDollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">
                        Giá trị tối thiểu
                      </h4>
                      <p className="text-base font-medium">
                        {voucherData.minimumOrderValue && voucherData.minimumOrderValue > 0 
                          ? new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(voucherData.minimumOrderValue)
                          : 'Không giới hạn'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Usage */}
                  <div className="flex items-start p-3 border border-gray-200 rounded-md">
                    <div className="mr-3 mt-1">
                      <FiUsers className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">
                        Số lượt sử dụng
                      </h4>
                      <p className="text-base font-medium">
                        {voucherData.usedCount || 0} / {voucherData.usageLimit 
                          ? voucherData.usageLimit 
                          : 'Không giới hạn'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </h4>
                  <p className="text-gray-600 p-3 bg-gray-50 rounded-md">
                    {voucherData.description}
                  </p>
                </div>
                
                {/* Applicable items */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiShoppingBag className="mr-1 h-4 w-4" /> Sản phẩm áp dụng
                    </h4>
                    <div className="border border-gray-200 rounded-md p-2 min-h-[60px] bg-gray-50">
                      {voucherData.applicableProducts && voucherData.applicableProducts.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {voucherData.applicableProducts.map((product, index) => (
                            <li key={index} className="text-sm">
                              {product}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Áp dụng cho tất cả sản phẩm</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiList className="mr-1 h-4 w-4" /> Danh mục áp dụng
                    </h4>
                    <div className="border border-gray-200 rounded-md p-2 min-h-[60px] bg-gray-50">
                      {voucherData.applicableCategories && voucherData.applicableCategories.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {voucherData.applicableCategories.map((category, index) => (
                            <li key={index} className="text-sm">
                              {category}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Áp dụng cho tất cả danh mục</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
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