import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Import next/image
import { X, CalendarDays, Tag, Clock, Info, ShoppingBag, Percent, Eye, CheckCircle, Edit2 } from 'lucide-react'; // Removed ExternalLink
import { format, formatDistanceToNow, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Campaign, ProductInCampaign } from '@/contexts/CampaignContext';

interface CampaignViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  campaign: Partial<Campaign>;
}

type CampaignStatus = 'upcoming' | 'ongoing' | 'ended';

const CampaignViewModal: React.FC<CampaignViewModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  campaign
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'products'>('info');
  
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      if (!campaign) setActiveTab('info');
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen, campaign]);

  const handleEdit = () => {
    if (campaign._id) {
      onEdit(campaign._id);
      onClose();
    }
  };

  const getCampaignStatus = (currentCampaign: Partial<Campaign>): CampaignStatus => {
    if (!currentCampaign.startDate || !currentCampaign.endDate) return 'upcoming';
    
    const now = new Date();
    const startDate = new Date(currentCampaign.startDate);
    const endDate = new Date(currentCampaign.endDate);
    
    if (isBefore(now, startDate)) return 'upcoming';
    if (isAfter(now, endDate)) return 'ended';
    return 'ongoing';
  };

  const getStatusAppearance = (status: CampaignStatus): { text: string; color: string; icon: React.ElementType } => {
    switch (status) {
      case 'upcoming': return { text: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-700', icon: Clock };
      case 'ongoing': return { text: 'Đang diễn ra', color: 'bg-green-100 text-green-700', icon: CalendarDays };
      case 'ended': return { text: 'Đã kết thúc', color: 'bg-slate-100 text-slate-700', icon: CheckCircle };
      default: return { text: 'Không xác định', color: 'bg-slate-100 text-slate-700', icon: Info };
    }
  };
  
  const getTimeInfo = (currentCampaign: Partial<Campaign>): string => {
    if (!currentCampaign.startDate || !currentCampaign.endDate) return 'Chưa có thông tin';
    
    const now = new Date();
    const startDate = new Date(currentCampaign.startDate);
    const endDate = new Date(currentCampaign.endDate);
    
    if (isBefore(now, startDate)) return `Bắt đầu sau ${formatDistanceToNow(startDate, { locale: vi })}`;
    if (isWithinInterval(now, { start: startDate, end: endDate })) return `Kết thúc sau ${formatDistanceToNow(endDate, { locale: vi })}`;
    return `Đã kết thúc ${formatDistanceToNow(endDate, { addSuffix: true, locale: vi })}`;
  };

  const calculateAverageDiscount = (): number => {
    if (!campaign.products || campaign.products.length === 0) return 0;
    
    let totalDiscountPercent = 0;
    let countProductsWithPrice = 0;
    
    campaign.products.forEach((product) => {
      if (product.originalPrice && product.adjustedPrice && product.originalPrice > 0) {
        totalDiscountPercent += ((product.originalPrice - product.adjustedPrice) / product.originalPrice) * 100;
        countProductsWithPrice++;
      }
    });
    
    return countProductsWithPrice > 0 ? Math.round(totalDiscountPercent / countProductsWithPrice) : 0;
  };

  const statusDetails = getStatusAppearance(getCampaignStatus(campaign));
  const formatCurrency = (value?: number) => value !== undefined ? new Intl.NumberFormat('vi-VN').format(value) + ' ₫' : 'N/A';

  const StatCard = ({ title, value, icon: Icon, iconColorClass }: { title: string, value: string | number, icon: React.ElementType, iconColorClass: string }) => (
    <div className="bg-slate-100/80 p-4 rounded-lg flex items-start">
      <div className={`p-2.5 rounded-lg ${iconColorClass.replace('text-', 'bg-').replace('-700', '-100').replace('-600','-100')}`}>
        <Icon className={`h-5 w-5 ${iconColorClass}`} />
      </div>
      <div className="ml-3">
        <dt className="text-xs font-medium text-slate-500">{title}</dt>
        <dd className="text-xl font-semibold text-slate-800">{value}</dd>
      </div>
    </div>
  );

  if (!modalVisible || !campaign) return null;

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl lg:max-w-4xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <Eye className="h-5 w-5 mr-2.5 text-pink-600" />
              Chi tiết chiến dịch
            </h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-150"
                title="Chỉnh sửa"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors duration-150"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white">
            <nav className="flex px-4 -mb-px">
              {['info', 'products'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'info' | 'products')}
                  className={`py-3.5 px-5 text-center border-b-2 font-medium text-sm transition-colors focus:outline-none
                    ${activeTab === tab
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  {tab === 'info' ? 'Thông tin chung' : `Sản phẩm (${campaign.products?.length || 0})`}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white px-6 pt-6 pb-8 sm:p-7 max-h-[calc(100vh-240px)] overflow-y-auto">
            {activeTab === 'info' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-200">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-2xl font-bold text-slate-800">{campaign.title}</h2>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${statusDetails.color}`}>
                      <statusDetails.icon className="h-3.5 w-3.5 mr-1.5" />
                      {statusDetails.text}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{campaign.description || 'Không có mô tả'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                  <div className="flex items-center bg-slate-50 p-3 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-slate-500 mr-2.5 flex-shrink-0" />
                    <div><strong className="font-medium text-slate-700">Bắt đầu:</strong> {campaign.startDate ? format(new Date(campaign.startDate), 'HH:mm, dd/MM/yyyy', { locale: vi }) : 'N/A'}</div>
                  </div>
                  <div className="flex items-center bg-slate-50 p-3 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-slate-500 mr-2.5 flex-shrink-0" />
                    <div><strong className="font-medium text-slate-700">Kết thúc:</strong> {campaign.endDate ? format(new Date(campaign.endDate), 'HH:mm, dd/MM/yyyy', { locale: vi }) : 'N/A'}</div>
                  </div>
                  <div className="flex items-center bg-slate-50 p-3 rounded-lg">
                    <Clock className="h-5 w-5 text-slate-500 mr-2.5 flex-shrink-0" />
                    <div><strong className="font-medium text-slate-700">Thời gian:</strong> {getTimeInfo(campaign)}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Tag className="h-5 w-5 text-slate-500 mt-0.5 mr-2.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-medium">Loại chiến dịch</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-pink-100 text-pink-700">
                        {campaign.type || 'Không xác định'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Số sản phẩm" value={campaign.products?.length || 0} icon={ShoppingBag} iconColorClass="text-purple-600" />
                  <StatCard title="Giảm giá TB" value={`${calculateAverageDiscount()}%`} icon={Percent} iconColorClass="text-green-600" />
                  {campaign.startDate && campaign.endDate && (
                    <StatCard 
                      title="Thời lượng" 
                      value={`${Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))} ngày`} 
                      icon={Clock} 
                      iconColorClass="text-blue-600" 
                    />
                  )}
                  <StatCard title="Loại" value={campaign.type || 'N/A'} icon={Tag} iconColorClass="text-orange-600" />
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <h3 className="text-base font-semibold text-slate-800 mb-3">Sản phẩm trong chiến dịch ({campaign.products?.length || 0})</h3>
                {campaign.products && campaign.products.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sản phẩm</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Biến thể</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Giá gốc</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Giá KM</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Giảm</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {campaign.products.map((product: ProductInCampaign) => (
                          <tr key={`${product.productId}-${product.variants?.[0]?.variantId || ''}`} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <Image
                                  src={product.image || '/placeholder-image.png'} 
                                  alt={product.name || 'product image'} 
                                  className="h-10 w-10 rounded-md object-cover border border-slate-200 mr-3"
                                  width={40}
                                  height={40}
                                />
                                <div>
                                  <div className="text-sm font-medium text-slate-800 line-clamp-1">{product.name || 'Sản phẩm không tên'}</div>
                                  {product.sku && <div className="text-xs text-slate-500">SKU: {product.sku}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{product.variants?.[0]?.variantName || 'Mặc định'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 text-right">{formatCurrency(product.originalPrice)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-pink-600 text-right">{formatCurrency(product.adjustedPrice)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {product.originalPrice && product.originalPrice > 0 && product.adjustedPrice !== undefined ? (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${((product.originalPrice - product.adjustedPrice) / product.originalPrice) >= 0.3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  -{Math.round(((product.originalPrice - product.adjustedPrice) / product.originalPrice) * 100)}%
                                </span>
                              ) : <span className="text-xs text-slate-400">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p>Chưa có sản phẩm nào trong chiến dịch này.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
            <div className="text-xs text-slate-500">
              {campaign.createdAt && `Tạo lúc: ${format(new Date(campaign.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}`}
            </div>
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500"
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

export default CampaignViewModal;
