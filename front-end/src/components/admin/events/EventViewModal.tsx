import React, { useState, useEffect } from 'react';
import { FiX, FiExternalLink, FiCalendar, FiTag, FiClock } from 'react-icons/fi';
import { format, formatDistanceToNow, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Event, ProductInEvent } from '@/contexts/EventsContext';

interface EventViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
}

type EventStatus = 'upcoming' | 'ongoing' | 'ended';

const EventViewModal: React.FC<EventViewModalProps> = ({
  isOpen,
  onClose,
  event
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'products'
  
  // Hiển thị/ẩn modal với animation
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);
  
  if (!modalVisible || !event) return null;
  
  // Tính toán trạng thái của sự kiện
  const getEventStatus = (event: Event): EventStatus => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (isBefore(now, startDate)) return 'upcoming';
    if (isAfter(now, endDate)) return 'ended';
    return 'ongoing';
  };
  
  // Lấy màu cho trạng thái
  const getStatusColor = (status: EventStatus): string => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Lấy text cho trạng thái
  const getStatusText = (status: EventStatus): string => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'ended':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  };
  
  // Tính toán thời gian còn lại hoặc đã kết thúc
  const getTimeInfo = (event: Event): string => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (isBefore(now, startDate)) {
      return `Bắt đầu sau ${formatDistanceToNow(startDate)}`;
    }
    
    if (isWithinInterval(now, { start: startDate, end: endDate })) {
      return `Kết thúc sau ${formatDistanceToNow(endDate)}`;
    }
    
    return `Đã kết thúc ${formatDistanceToNow(endDate, { addSuffix: true })}`;
  };
  
  // Tính % giảm giá trung bình
  const calculateAverageDiscount = (): number => {
    if (!event.products || event.products.length === 0) return 0;
    
    // Giả sử chúng ta có thông tin về giá gốc và giá khuyến mãi
    // Trong thực tế, cần lấy thông tin này từ API
    // Ở đây chỉ là demo với giá trị cố định
    return 30; // Giả sử giảm giá trung bình là 30%
  };
  
  const status = getEventStatus(event);

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Chi tiết sự kiện
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sản phẩm ({event.products.length})
              </button>
            </nav>
          </div>

          {/* Body */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {activeTab === 'info' ? (
              <div className="space-y-6">
                {/* Tiêu đề và trạng thái */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{event.description}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                  </div>
                </div>
                
                {/* Thông tin thời gian và thời lượng */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Bắt đầu</div>
                        <div className="text-sm font-medium">
                          {format(new Date(event.startDate), 'HH:mm - dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Kết thúc</div>
                        <div className="text-sm font-medium">
                          {format(new Date(event.endDate), 'HH:mm - dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiClock className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Thời gian</div>
                        <div className="text-sm font-medium">{getTimeInfo(event)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex items-start">
                    <FiTag className="h-5 w-5 text-gray-400 mt-1 mr-2" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Thống kê nhanh */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <div className="text-xs text-pink-500 font-medium">Số sản phẩm</div>
                    <div className="text-2xl font-bold text-pink-700">{event.products.length}</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-500 font-medium">Giảm giá TB</div>
                    <div className="text-2xl font-bold text-green-700">{calculateAverageDiscount()}%</div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-500 font-medium">Tổng xem</div>
                    <div className="text-2xl font-bold text-blue-700">1,287</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-xs text-yellow-500 font-medium">Đơn hàng</div>
                    <div className="text-2xl font-bold text-yellow-700">86</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Sản phẩm trong sự kiện</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sản phẩm
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá gốc
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá khuyến mãi
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giảm giá
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {event.products.map((product, index) => {
                          // Tính phần trăm giảm giá (nếu có originalPrice)
                          const discountPercent = product.originalPrice 
                            ? Math.round(((product.originalPrice - product.adjustedPrice) / product.originalPrice) * 100)
                            : 0;
                            
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  {product.image ? (
                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                      <img 
                                        className="h-10 w-10 rounded-md object-cover" 
                                        src={product.image} 
                                        alt={product.name || 'Sản phẩm'}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">No image</span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                      {product.name || `Sản phẩm #${product.productId.substring(0, 8)}...`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {product.productId.substring(0, 8)}...
                                      {product.variantId && (
                                        <span className="ml-2">Variant: {product.variantId.substring(0, 6)}...</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {product.originalPrice
                                  ? new Intl.NumberFormat('vi-VN').format(product.originalPrice) + ' ₫'
                                  : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-pink-600">
                                {new Intl.NumberFormat('vi-VN').format(product.adjustedPrice) + ' ₫'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {product.originalPrice ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    -{discountPercent}%
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-500">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {event.products.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                              Chưa có sản phẩm nào trong sự kiện này
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Tạo lúc: {format(new Date(event.createdAt), 'HH:mm - dd/MM/yyyy')}
            </div>
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              onClick={onClose}
            >
              <FiExternalLink className="mr-1.5 h-4 w-4" />
              Xem trên trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventViewModal; 