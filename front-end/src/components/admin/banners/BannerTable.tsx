import { useState } from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2, FiEye, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Banner } from '@/components/admin/banners/BannerForm';

// Định nghĩa kiểu dữ liệu cho props
interface BannerTableProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeOrder: (id: string, direction: 'up' | 'down') => void;
  banners?: Banner[];
}

export default function BannerTable({ 
  onView, 
  onEdit, 
  onDelete, 
  onChangeOrder,
  banners: propBanners
}: BannerTableProps) {
  // Sử dụng sample data nếu không có props.banners
  const sampleBanners: Banner[] = [
    {
      _id: 'banner1',
      title: 'Valentine - Chạm tim deal ngọt ngào',
      desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg1.png?v=608',
      mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile2.png?v=608',
      alt: 'Valentine Campaign',
      campaignId: 'valentine-2024',
      href: '/shop?campaign=valentine-2024',
      active: true,
      order: 1,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: 'banner2',
      title: 'Tết rộn ràng - Sale cực khủng',
      desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg2.png?v=608',
      mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile1.png?v=608',
      alt: 'Tết Campaign',
      campaignId: 'tet-2024',
      href: '/shop?campaign=tet-2024',
      active: true,
      order: 2,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      _id: 'banner3',
      title: 'Năm mới - Deal hời',
      desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg3.png?v=608',
      mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile3.png?v=608',
      alt: 'New Year Campaign',
      campaignId: 'new-year-2024',
      href: '/shop?campaign=new-year-2024',
      active: true,
      order: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'banner4',
      title: 'Đẹp chuẩn - Giá tốt',
      desktopImage: 'https://theme.hstatic.net/200000868185/1001288884/14/showsliderimg4.png?v=608',
      mobileImage: 'https://theme.hstatic.net/200000868185/1001288884/14/wsliderimgmobile4.png?v=608',
      alt: 'Beauty Campaign',
      campaignId: 'beauty-special',
      href: '/shop?campaign=beauty-special',
      active: false,
      order: 4,
      createdAt: new Date('2023-12-20'),
      updatedAt: new Date('2023-12-20')
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Sử dụng banners từ props hoặc sample data
  const banners = propBanners || sampleBanners;

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Lọc banner theo từ khóa tìm kiếm và trạng thái
  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.campaignId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeFilter === 'all' || 
                         (activeFilter === 'active' && banner.active) ||
                         (activeFilter === 'inactive' && !banner.active);
    
    return matchesSearch && matchesStatus;
  });

  // Sắp xếp banner theo thứ tự
  const sortedBanners = [...filteredBanners].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm banner..."
              className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeFilter === 'all' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeFilter === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveFilter('active')}
            >
              Đang hiển thị
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeFilter === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveFilter('inactive')}
            >
              Đã ẩn
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thứ tự
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Banner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiêu đề
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chiến dịch
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedBanners.map((banner) => (
              <tr key={banner._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900 mr-2">{banner.order}</span>
                    <div className="flex flex-col">
                      <button 
                        onClick={() => onChangeOrder(banner._id || '', 'up')}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={banner.order === 1}
                      >
                        <FiArrowUp className={`h-4 w-4 ${banner.order === 1 ? 'opacity-30' : ''}`} />
                      </button>
                      <button 
                        onClick={() => onChangeOrder(banner._id || '', 'down')}
                        className="text-gray-500 hover:text-gray-700 mt-1"
                        disabled={banner.order === banners.length}
                      >
                        <FiArrowDown className={`h-4 w-4 ${banner.order === banners.length ? 'opacity-30' : ''}`} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative w-24 h-12 rounded overflow-hidden">
                    <Image
                      src={banner.desktopImage || 'https://via.placeholder.com/120x60?text=No+Image'}
                      alt={banner.title || 'Banner image'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                  <div className="text-xs text-gray-500">{banner.href}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{banner.campaignId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    banner.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {banner.active ? 'Đang hiển thị' : 'Đã ẩn'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {banner.createdAt && formatDate(banner.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onView(banner._id || '')}
                      className="text-blue-600 hover:text-blue-900"
                      title="Xem chi tiết"
                    >
                      <FiEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onEdit(banner._id || '')}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(banner._id || '')}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hiển thị khi không có dữ liệu */}
      {sortedBanners.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">Không tìm thấy banner nào phù hợp với điều kiện tìm kiếm.</p>
        </div>
      )}
    </div>
  );
} 