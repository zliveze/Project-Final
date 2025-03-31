import { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiStar, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import Image from 'next/image';
import Pagination from '@/components/admin/common/Pagination';

// Định nghĩa interface cho Category dựa trên model
export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId?: string | null;
  level: number;
  image: {
    url: string;
    alt: string;
  };
  status: 'active' | 'inactive';
  featured: boolean;
  order: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Dữ liệu mẫu cho danh mục
const sampleCategories: Category[] = [
  {
    id: 'CAT-001',
    name: 'Chăm sóc da',
    slug: 'cham-soc-da',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Chăm sóc da'
    },
    description: 'Các sản phẩm chăm sóc da mặt',
    level: 1,
    parentId: null,
    productCount: 45,
    status: 'active',
    featured: true,
    order: 1,
    createdAt: '15/03/2025',
    updatedAt: '15/03/2025'
  },
  {
    id: 'CAT-002',
    name: 'Trang điểm',
    slug: 'trang-diem',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Trang điểm'
    },
    description: 'Các sản phẩm trang điểm',
    level: 1,
    parentId: null,
    productCount: 32,
    status: 'active',
    featured: true,
    order: 2,
    createdAt: '14/03/2025',
    updatedAt: '14/03/2025'
  },
  {
    id: 'CAT-003',
    name: 'Chăm sóc tóc',
    slug: 'cham-soc-toc',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Chăm sóc tóc'
    },
    description: 'Các sản phẩm chăm sóc tóc',
    level: 1,
    parentId: null,
    productCount: 18,
    status: 'active',
    featured: false,
    order: 3,
    createdAt: '13/03/2025',
    updatedAt: '13/03/2025'
  },
  {
    id: 'CAT-004',
    name: 'Chống nắng',
    slug: 'chong-nang',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Chống nắng'
    },
    description: 'Các sản phẩm chống nắng',
    level: 2,
    parentId: 'CAT-001',
    productCount: 12,
    status: 'active',
    featured: false,
    order: 1,
    createdAt: '12/03/2025',
    updatedAt: '12/03/2025'
  },
  {
    id: 'CAT-005',
    name: 'Mặt nạ',
    slug: 'mat-na',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Mặt nạ'
    },
    description: 'Các loại mặt nạ dưỡng da',
    level: 2,
    parentId: 'CAT-001',
    productCount: 24,
    status: 'active',
    featured: false,
    order: 2,
    createdAt: '11/03/2025',
    updatedAt: '11/03/2025'
  },
  {
    id: 'CAT-006',
    name: 'Nước hoa',
    slug: 'nuoc-hoa',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Nước hoa'
    },
    description: 'Các loại nước hoa',
    level: 1,
    parentId: null,
    productCount: 0,
    status: 'inactive',
    featured: false,
    order: 4,
    createdAt: '10/03/2025',
    updatedAt: '10/03/2025'
  }
];

interface CategoryTableProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CategoryTable({ onView, onEdit, onDelete }: CategoryTableProps) {
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedFeatured, setSelectedFeatured] = useState<boolean | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 5;
  const [sortConfig, setSortConfig] = useState<{ key: keyof Category; direction: 'ascending' | 'descending' } | null>(null);

  // Hàm sắp xếp
  const sortedCategories = [...categories];
  if (sortConfig && sortConfig.key) {
    sortedCategories.sort((a, b) => {
      const aValue = String(a[sortConfig.key as keyof Category] || '');
      const bValue = String(b[sortConfig.key as keyof Category] || '');
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  // Xử lý sắp xếp khi click vào tiêu đề cột
  const requestSort = (key: keyof Category) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Hàm lọc danh mục
  const filteredCategories = sortedCategories.filter(category => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || category.status === selectedStatus;
    
    const matchesLevel = selectedLevel === 'all' || category.level === selectedLevel;
    
    const matchesFeatured = selectedFeatured === 'all' || category.featured === selectedFeatured;
    
    return matchesSearch && matchesStatus && matchesLevel && matchesFeatured;
  });

  // Phân trang
  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

  // Hàm để hiển thị màu sắc dựa trên trạng thái danh mục
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm để hiển thị tên trạng thái danh mục
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  // Hàm để lấy tên danh mục cha
  const getParentCategoryName = (parentId: string | null | undefined) => {
    if (!parentId) return 'Không có';
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : 'Không tìm thấy';
  };

  // Hiển thị icon sắp xếp
  const getSortIcon = (key: keyof Category) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FiChevronUp className="inline-block ml-1" /> : <FiChevronDown className="inline-block ml-1" />;
  };

  // Hàm chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedLevel === 'all' ? 'all' : selectedLevel.toString()}
              onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">Tất cả cấp độ</option>
              <option value="1">Cấp 1</option>
              <option value="2">Cấp 2</option>
              <option value="3">Cấp 3</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedFeatured === 'all' ? 'all' : selectedFeatured ? 'true' : 'false'}
              onChange={(e) => setSelectedFeatured(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="true">Nổi bật</option>
              <option value="false">Không nổi bật</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                Danh mục {getSortIcon('name')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('level')}
              >
                Cấp độ {getSortIcon('level')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục cha
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('order')}
              >
                Thứ tự {getSortIcon('order')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số sản phẩm
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('status')}
              >
                Trạng thái {getSortIcon('status')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('featured')}
              >
                Nổi bật {getSortIcon('featured')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('createdAt')}
              >
                Ngày tạo {getSortIcon('createdAt')}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                      <Image 
                        src={category.image.url} 
                        alt={category.image.alt}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.description.length > 50 
                    ? `${category.description.substring(0, 50)}...` 
                    : category.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.level}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getParentCategoryName(category.parentId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.productCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(category.status)}`}>
                    {getStatusText(category.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.featured ? (
                    <FiStar className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onView(category.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Xem chi tiết"
                    >
                      <FiEye className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onEdit(category.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(category.id)}
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
      
      {filteredCategories.length === 0 && (
        <div className="px-6 py-4 text-center text-gray-500">
          Không tìm thấy danh mục nào
        </div>
      )}
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredCategories.length}
          itemsPerPage={categoriesPerPage}
          showItemsInfo={true}
        />
      </div>
    </div>
  );
} 