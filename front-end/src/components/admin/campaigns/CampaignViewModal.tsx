import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiCalendar, FiClock, FiTag } from 'react-icons/fi';
import { format } from 'date-fns';
import Image from 'next/image';
import { Campaign, Product } from './CampaignForm';

interface CampaignViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  campaign: Partial<Campaign>;
}

const CampaignViewModal: React.FC<CampaignViewModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  campaign
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);

  const handleEdit = () => {
    if (campaign._id) {
      onEdit(campaign._id);
      onClose();
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Tính tổng số sản phẩm và phần trăm giảm giá trung bình
  const calculateStats = () => {
    if (!campaign.products || campaign.products.length === 0) {
      return { totalProducts: 0, avgDiscount: 0 };
    }

    const totalProducts = campaign.products.length;
    let totalDiscountPercent = 0;
    let countWithDiscount = 0;

    campaign.products.forEach(product => {
      if (product.originalPrice && product.adjustedPrice && product.originalPrice > product.adjustedPrice) {
        const discountPercent = (product.originalPrice - product.adjustedPrice) / product.originalPrice * 100;
        totalDiscountPercent += discountPercent;
        countWithDiscount++;
      }
    });

    const avgDiscount = countWithDiscount > 0 ? Math.round(totalDiscountPercent / countWithDiscount) : 0;
    return { totalProducts, avgDiscount };
  };

  const { totalProducts, avgDiscount } = calculateStats();

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
      <div className={`relative bg-white rounded-lg shadow-xl w-[90vw] max-w-6xl mx-auto z-50 ${
        isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
      } transition-all duration-300`}>
        <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiEye className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết chiến dịch
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-1.5 border border-pink-300 rounded-md shadow-sm text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiEdit2 className="mr-2 -ml-1 h-4 w-4" />
              Chỉnh sửa
            </button>
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                className={`${
                  activeTab === 'info'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('info')}
              >
                Thông tin chung
              </button>
              <button
                className={`${
                  activeTab === 'products'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('products')}
              >
                Sản phẩm ({totalProducts})
              </button>
            </nav>
          </div>

          {/* Nội dung tab */}
          {activeTab === 'info' ? (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Thông tin chiến dịch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Tiêu đề</div>
                      <div className="mt-1 text-base text-gray-900">{campaign.title}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Loại chiến dịch</div>
                      <div className="mt-1 text-base text-gray-900 flex items-center">
                        <FiTag className="mr-1.5 h-4 w-4 text-gray-400" />
                        {campaign.type || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Thời gian bắt đầu</div>
                      <div className="mt-1 text-base text-gray-900 flex items-center">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                        {formatDate(campaign.startDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Thời gian kết thúc</div>
                      <div className="mt-1 text-base text-gray-900 flex items-center">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                        {formatDate(campaign.endDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Ngày tạo</div>
                      <div className="mt-1 text-base text-gray-900 flex items-center">
                        <FiClock className="mr-1.5 h-4 w-4 text-gray-400" />
                        {formatDate(campaign.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Cập nhật lần cuối</div>
                      <div className="mt-1 text-base text-gray-900 flex items-center">
                        <FiClock className="mr-1.5 h-4 w-4 text-gray-400" />
                        {formatDate(campaign.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Mô tả</h3>
                  <div className="prose max-w-none">
                    <p className="text-base text-gray-700 whitespace-pre-line">
                      {campaign.description || 'Không có mô tả.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Tổng quan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Tổng số sản phẩm</div>
                      <div className="mt-1 text-2xl font-semibold text-green-900">{totalProducts}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Giảm giá trung bình</div>
                      <div className="mt-1 text-2xl font-semibold text-blue-900">{avgDiscount}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {campaign.products && campaign.products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sản phẩm
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Biến thể
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá gốc
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá campaign
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giảm giá
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {campaign.products.map((product: Product) => (
                          <tr key={`${product.productId}-${product.variantId}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <Image
                                    src={product.image || 'https://via.placeholder.com/48'}
                                    alt={product.productName || 'Product image'}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                  />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.productName || `Sản phẩm`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {product.variantName || 'Mặc định'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {product.originalPrice?.toLocaleString('vi-VN')}₫
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {product.adjustedPrice?.toLocaleString('vi-VN')}₫
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {product.originalPrice ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  ((product.originalPrice - product.adjustedPrice) / product.originalPrice * 100) > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {Math.round((product.originalPrice - product.adjustedPrice) / product.originalPrice * 100)}%
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 px-4 text-center">
                    <p className="text-gray-500">Không có sản phẩm nào trong chiến dịch này.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignViewModal; 