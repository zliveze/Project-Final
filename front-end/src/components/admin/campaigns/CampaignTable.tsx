import { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiPause, FiPlay } from 'react-icons/fi';
import Image from 'next/image';
import Pagination from '@/components/admin/common/Pagination';

// Dữ liệu mẫu cho chiến dịch và sự kiện
const sampleCampaigns = [
  {
    id: 'CP-001',
    name: 'Khuyến mãi mùa hè 2025',
    type: 'sale',
    image: 'https://via.placeholder.com/50',
    description: 'Giảm giá lên đến 50% cho tất cả sản phẩm chăm sóc da',
    startDate: '01/06/2025',
    endDate: '30/06/2025',
    discountPercent: 50,
    productCount: 45,
    status: 'active',
    createdAt: '15/03/2025'
  },
  {
    id: 'CP-002',
    name: 'Chào mừng thành viên mới',
    type: 'promotion',
    image: 'https://via.placeholder.com/50',
    description: 'Tặng voucher 50K cho thành viên mới đăng ký',
    startDate: '01/01/2025',
    endDate: '31/12/2025',
    discountPercent: null,
    productCount: null,
    status: 'active',
    createdAt: '14/03/2025'
  },
  {
    id: 'CP-003',
    name: 'Ngày hội làm đẹp',
    type: 'event',
    image: 'https://via.placeholder.com/50',
    description: 'Sự kiện tư vấn làm đẹp miễn phí tại cửa hàng',
    startDate: '15/04/2025',
    endDate: '16/04/2025',
    discountPercent: null,
    productCount: null,
    status: 'scheduled',
    createdAt: '13/03/2025'
  },
  {
    id: 'CP-004',
    name: 'Tết Nguyên Đán 2025',
    type: 'sale',
    image: 'https://via.placeholder.com/50',
    description: 'Khuyến mãi đặc biệt dịp Tết Nguyên Đán',
    startDate: '15/01/2025',
    endDate: '05/02/2025',
    discountPercent: 30,
    productCount: 120,
    status: 'completed',
    createdAt: '12/12/2024'
  },
  {
    id: 'CP-005',
    name: 'Flash Sale cuối tuần',
    type: 'flash_sale',
    image: 'https://via.placeholder.com/50',
    description: 'Giảm sốc 24h cho sản phẩm hot',
    startDate: '10/04/2025',
    endDate: '11/04/2025',
    discountPercent: 70,
    productCount: 15,
    status: 'scheduled',
    createdAt: '11/03/2025'
  },
  {
    id: 'CP-006',
    name: 'Sinh nhật cửa hàng',
    type: 'event',
    image: 'https://via.placeholder.com/50',
    description: 'Kỷ niệm 5 năm thành lập với nhiều ưu đãi đặc biệt',
    startDate: '20/05/2025',
    endDate: '25/05/2025',
    discountPercent: 25,
    productCount: 200,
    status: 'draft',
    createdAt: '10/03/2025'
  }
];

interface CampaignTableProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export default function CampaignTable({ onView, onEdit, onDelete, onToggleStatus }: CampaignTableProps) {
  const [campaigns, setCampaigns] = useState(sampleCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Lọc chiến dịch theo từ khóa tìm kiếm, trạng thái và loại
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    const matchesType = selectedType === 'all' || campaign.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Phân trang
  const indexOfLastCampaign = currentPage * itemsPerPage;
  const indexOfFirstCampaign = indexOfLastCampaign - itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstCampaign, indexOfLastCampaign);
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xử lý thay đổi số lượng hiển thị
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi số lượng hiển thị
  };

  // Hàm để hiển thị màu sắc dựa trên trạng thái chiến dịch
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm để hiển thị tên trạng thái chiến dịch
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      case 'scheduled':
        return 'Lên lịch';
      case 'draft':
        return 'Bản nháp';
      case 'paused':
        return 'Tạm dừng';
      default:
        return status;
    }
  };

  // Hàm để hiển thị tên loại chiến dịch
  const getTypeText = (type: string) => {
    switch (type) {
      case 'sale':
        return 'Khuyến mãi';
      case 'promotion':
        return 'Ưu đãi';
      case 'event':
        return 'Sự kiện';
      case 'flash_sale':
        return 'Flash Sale';
      default:
        return type;
    }
  };

  // Hàm để hiển thị nút toggle trạng thái phù hợp
  const getToggleButton = (campaign: any) => {
    if (campaign.status === 'active') {
      return (
        <button 
          onClick={() => onToggleStatus(campaign.id, campaign.status)}
          className="text-orange-600 hover:text-orange-900"
          title="Tạm dừng"
        >
          <FiPause className="h-5 w-5" />
        </button>
      );
    } else if (campaign.status === 'paused' || campaign.status === 'draft') {
      return (
        <button 
          onClick={() => onToggleStatus(campaign.id, campaign.status)}
          className="text-green-600 hover:text-green-900"
          title="Kích hoạt"
        >
          <FiPlay className="h-5 w-5" />
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm chiến dịch..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 flex-wrap">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="sale">Khuyến mãi</option>
              <option value="promotion">Ưu đãi</option>
              <option value="event">Sự kiện</option>
              <option value="flash_sale">Flash Sale</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang diễn ra</option>
              <option value="scheduled">Lên lịch</option>
              <option value="completed">Đã kết thúc</option>
              <option value="draft">Bản nháp</option>
              <option value="paused">Tạm dừng</option>
            </select>

            <div className="flex items-center">
              <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-600">Hiển thị:</label>
              <select
                id="items-per-page"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chiến dịch
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCampaigns.length > 0 ? (
              currentCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                        <Image 
                          src={campaign.image} 
                          alt={campaign.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTypeText(campaign.type)}</div>
                    {campaign.discountPercent && (
                      <div className="text-sm text-gray-500">Giảm {campaign.discountPercent}%</div>
                    )}
                    {campaign.productCount && (
                      <div className="text-sm text-gray-500">{campaign.productCount} sản phẩm</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">Từ: {campaign.startDate}</div>
                    <div className="text-sm text-gray-500">Đến: {campaign.endDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => onView(campaign.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Xem chi tiết"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      {getToggleButton(campaign)}
                      <button 
                        onClick={() => onEdit(campaign.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => onDelete(campaign.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy chiến dịch nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredCampaigns.length}
          itemsPerPage={itemsPerPage}
          showItemsInfo={true}
          className="mt-2"
        />
      </div>
    </div>
  );
} 