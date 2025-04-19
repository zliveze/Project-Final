import { useState, useEffect, useCallback } from 'react';
import { FiX, FiEye, FiClock, FiCheck, FiPercent, FiDollarSign, FiShoppingBag, FiList, FiUsers, FiInfo, FiTag, FiPackage, FiSettings, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Voucher } from '@/contexts/VoucherContext';
import { formatDate, formatPrice } from '@/utils/formatters';
import { TabInterface } from './TabInterface';
import { useVoucherSelections } from '@/hooks/useVoucherSelections';
import { useEvents } from '@/contexts/EventsContext';
import { SelectedItemsList } from './SelectedItemsList';

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
  const [activeTab, setActiveTab] = useState('basic');

  // State quản lý trạng thái mở/đóng của các accordion
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: false,
    brands: false,
    products: false,
    events: false,
    campaigns: false
  });

  // Sử dụng các hook để lấy dữ liệu
  const {
    brands, categories, products, campaigns,
    fetchBrands, fetchCategories, fetchProducts, fetchCampaigns
  } = useVoucherSelections();

  // Sử dụng EventsContext
  const { events } = useEvents();

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isOpen || !voucher || !isMounted) return;

      try {
        // Sử dụng Promise.all để tải dữ liệu song song
        const fetchPromises = [];

        if (voucher.applicableBrands?.length) {
          fetchPromises.push(fetchBrands(1, 100));
        }

        if (voucher.applicableCategories?.length) {
          fetchPromises.push(fetchCategories(1, 100));
        }

        if (voucher.applicableProducts?.length) {
          fetchPromises.push(fetchProducts(1, 100));
        }

        if (voucher.applicableCampaigns?.length) {
          fetchPromises.push(fetchCampaigns(1, 100));
        }

        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, voucher]);

  // Hàm toggle accordion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Hàm lấy thông tin chi tiết của các item
  const getSelectedBrands = useCallback(() => {
    if (!voucher?.applicableBrands?.length) return [];
    return voucher.applicableBrands.map(id => {
      // Tìm thương hiệu trong danh sách brands từ API
      const brand = brands?.find(b => (b._id || b.id) === id);
      // Nếu tìm thấy, sử dụng tên thực tế
      if (brand) {
        return { id, name: brand.name };
      }
      return {
        id,
        name: `Thương hiệu #${id.slice(0, 6)}`
      };
    });
  }, [voucher?.applicableBrands, brands]);

  const getSelectedCategories = useCallback(() => {
    if (!voucher?.applicableCategories?.length) return [];
    return voucher.applicableCategories.map(id => {
      // Tìm danh mục trong danh sách categories từ API
      const category = categories?.find(c => (c._id || c.id) === id);
      // Nếu tìm thấy, sử dụng tên thực tế
      if (category) {
        return { id, name: category.name };
      }
      return {
        id,
        name: `Danh mục #${id.slice(0, 6)}`
      };
    });
  }, [voucher?.applicableCategories, categories]);

  const getSelectedProducts = useCallback(() => {
    if (!voucher?.applicableProducts?.length) return [];
    return voucher.applicableProducts.map(id => {
      // Tìm sản phẩm trong danh sách products từ API
      const product = products?.find(p => (p._id || p.id) === id);
      // Nếu tìm thấy, sử dụng tên thực tế
      if (product) {
        return { id, name: product.sku ? `${product.name} (${product.sku})` : product.name };
      }
      return {
        id,
        name: `Sản phẩm #${id.slice(0, 6)}`
      };
    });
  }, [voucher?.applicableProducts, products]);

  const getSelectedEvents = useCallback(() => {
    if (!events || !voucher?.applicableEvents?.length) return [];

    return voucher.applicableEvents.map(id => {
      // Tìm sự kiện trong danh sách events từ API
      const event = events.find(e => e._id === id);
      // Nếu tìm thấy, sử dụng tên thực tế
      if (event) {
        return {
          id,
          name: event.title,
          description: `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`
        };
      }
      return {
        id,
        name: `Sự kiện #${id.slice(0, 6)}`
      };
    });
  }, [voucher?.applicableEvents, events]);

  const getSelectedCampaigns = useCallback(() => {
    if (!voucher?.applicableCampaigns?.length) return [];
    return voucher.applicableCampaigns.map(id => {
      // Tìm chiến dịch trong danh sách campaigns từ API
      const campaign = campaigns?.find(c => c._id === id);
      // Nếu tìm thấy, sử dụng tên thực tế
      if (campaign) {
        return { id, name: campaign.title };
      }
      return {
        id,
        name: `Chiến dịch #${id.slice(0, 6)}`
      };
    });
  }, [voucher?.applicableCampaigns, campaigns]);

  // Định nghĩa các tab
  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: <FiInfo /> },
    { id: 'conditions', label: 'Điều kiện áp dụng', icon: <FiSettings /> },
    { id: 'events', label: 'Sự kiện & Chiến dịch', icon: <FiPackage /> },
  ];

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      // Khi modal mở, ngăn scroll của body
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
      // Khi modal đóng, cho phép scroll lại
      document.body.style.overflow = 'unset';
    }

    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
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

  // Render tab nội dung
  const renderBasicInfoTab = () => (
    <div className="space-y-6">
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

      <div>
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
  );

  const renderConditionsTab = () => (
    <div className="space-y-6">
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
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <FiShoppingBag className="mr-2 text-pink-500" />
            Sản phẩm áp dụng
          </h5>

          {(!voucher.applicableProducts?.length && !voucher.applicableCategories?.length && !voucher.applicableBrands?.length) ? (
            <p className="text-sm text-gray-700">Áp dụng cho tất cả sản phẩm</p>
          ) : (
            <div className="space-y-2">
              {voucher.applicableCategories && voucher.applicableCategories.length > 0 && (
                <div className="p-2 bg-pink-50 rounded-md border border-pink-100">
                  <div
                    className="text-sm text-gray-700 font-medium mb-1 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('categories')}
                  >
                    <div className="flex items-center">
                      <FiTag className="mr-1.5 h-4 w-4 text-pink-500" />
                      Danh mục ({voucher.applicableCategories.length})
                    </div>
                    {expandedSections.categories ?
                      <FiChevronUp className="h-4 w-4 text-gray-500" /> :
                      <FiChevronDown className="h-4 w-4 text-gray-500" />}
                  </div>

                  {expandedSections.categories && (
                    <div className="mt-2">
                      <SelectedItemsList
                        items={getSelectedCategories()}
                        onRemove={() => {}}
                        emptyText="Chưa có danh mục nào được chọn"
                        maxDisplayItems={10}
                      />
                    </div>
                  )}
                </div>
              )}

              {voucher.applicableBrands && voucher.applicableBrands.length > 0 && (
                <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
                  <div
                    className="text-sm text-gray-700 font-medium mb-1 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('brands')}
                  >
                    <div className="flex items-center">
                      <FiTag className="mr-1.5 h-4 w-4 text-blue-500" />
                      Thương hiệu ({voucher.applicableBrands.length})
                    </div>
                    {expandedSections.brands ?
                      <FiChevronUp className="h-4 w-4 text-gray-500" /> :
                      <FiChevronDown className="h-4 w-4 text-gray-500" />}
                  </div>

                  {expandedSections.brands && (
                    <div className="mt-2">
                      <SelectedItemsList
                        items={getSelectedBrands()}
                        onRemove={() => {}}
                        emptyText="Chưa có thương hiệu nào được chọn"
                        maxDisplayItems={10}
                      />
                    </div>
                  )}
                </div>
              )}

              {voucher.applicableProducts && voucher.applicableProducts.length > 0 && (
                <div className="p-2 bg-green-50 rounded-md border border-green-100">
                  <div
                    className="text-sm text-gray-700 font-medium mb-1 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('products')}
                  >
                    <div className="flex items-center">
                      <FiTag className="mr-1.5 h-4 w-4 text-green-500" />
                      Sản phẩm ({voucher.applicableProducts.length})
                    </div>
                    {expandedSections.products ?
                      <FiChevronUp className="h-4 w-4 text-gray-500" /> :
                      <FiChevronDown className="h-4 w-4 text-gray-500" />}
                  </div>

                  {expandedSections.products && (
                    <div className="mt-2">
                      <SelectedItemsList
                        items={getSelectedProducts()}
                        onRemove={() => {}}
                        emptyText="Chưa có sản phẩm nào được chọn"
                        maxDisplayItems={10}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-md border">
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <FiClock className="mr-2 text-pink-500" />
            Sự kiện áp dụng
          </h5>
          {voucher.applicableEvents && voucher.applicableEvents.length > 0 ? (
            <div>
              <div
                className="text-sm text-gray-700 font-medium mb-1 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('events')}
              >
                <div className="flex items-center">
                  <FiClock className="mr-1.5 h-4 w-4 text-pink-500" />
                  Sự kiện ({voucher.applicableEvents.length})
                </div>
                {expandedSections.events ?
                  <FiChevronUp className="h-4 w-4 text-gray-500" /> :
                  <FiChevronDown className="h-4 w-4 text-gray-500" />}
              </div>

              {expandedSections.events && (
                <div className="mt-2">
                  <SelectedItemsList
                    items={getSelectedEvents()}
                    onRemove={() => {}}
                    emptyText="Chưa có sự kiện nào được chọn"
                    maxDisplayItems={10}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Không áp dụng cho sự kiện cụ thể</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md border">
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <FiList className="mr-2 text-pink-500" />
            Chiến dịch áp dụng
          </h5>
          {voucher.applicableCampaigns && voucher.applicableCampaigns.length > 0 ? (
            <div>
              <div
                className="text-sm text-gray-700 font-medium mb-1 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('campaigns')}
              >
                <div className="flex items-center">
                  <FiList className="mr-1.5 h-4 w-4 text-pink-500" />
                  Chiến dịch ({voucher.applicableCampaigns.length})
                </div>
                {expandedSections.campaigns ?
                  <FiChevronUp className="h-4 w-4 text-gray-500" /> :
                  <FiChevronDown className="h-4 w-4 text-gray-500" />}
              </div>

              {expandedSections.campaigns && (
                <div className="mt-2">
                  <SelectedItemsList
                    items={getSelectedCampaigns()}
                    onRemove={() => {}}
                    emptyText="Chưa có chiến dịch nào được chọn"
                    maxDisplayItems={10}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Không áp dụng cho chiến dịch cụ thể</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-filter backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}>
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

          {/* Header */}
          <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiEye className="text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết voucher: <span className="font-semibold">{voucher.code}</span>
              </h2>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                {status.text}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-4">
            <TabInterface
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Body - Scrollable */}
          <div className="p-6 pt-0 max-h-[80vh] overflow-y-auto">
            {activeTab === 'basic' && renderBasicInfoTab()}
            {activeTab === 'conditions' && renderConditionsTab()}
            {activeTab === 'events' && renderEventsTab()}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 px-6 py-3 bg-gray-50 border-t flex justify-end">
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