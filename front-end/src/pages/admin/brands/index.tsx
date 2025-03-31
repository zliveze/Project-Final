import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiPlus, FiGrid, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import BrandTable from '@/components/admin/brands/BrandTable';
import BrandAddModal from '@/components/admin/brands/BrandAddModal';
import BrandEditModal from '@/components/admin/brands/BrandEditModal';
import BrandDetailModal from '@/components/admin/brands/BrandDetailModal';
import BrandDeleteModal from '@/components/admin/brands/BrandDeleteModal';
import Pagination from '@/components/admin/common/Pagination';
import { Brand } from '@/components/admin/brands/BrandForm';
import toast from 'react-hot-toast';

// Dữ liệu mẫu cho thương hiệu
const sampleBrands = [
  {
    id: 'BRD-001',
    name: 'Innisfree',
    slug: 'innisfree',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'Innisfree Logo'
    },
    description: 'Thương hiệu mỹ phẩm từ Hàn Quốc',
    origin: 'Hàn Quốc',
    website: 'https://www.innisfree.com',
    featured: true,
    status: 'active',
    socialMedia: {
      facebook: 'https://facebook.com/innisfree',
      instagram: 'https://instagram.com/innisfree',
      youtube: 'https://youtube.com/innisfree'
    },
    productCount: 28,
    createdAt: '2025-03-15T08:30:00Z',
    updatedAt: '2025-03-15T10:15:00Z'
  },
  {
    id: 'BRD-002',
    name: 'The Face Shop',
    slug: 'the-face-shop',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'The Face Shop Logo'
    },
    description: 'Thương hiệu mỹ phẩm từ Hàn Quốc',
    origin: 'Hàn Quốc',
    website: 'https://www.thefaceshop.com',
    featured: false,
    status: 'active',
    socialMedia: {
      facebook: 'https://facebook.com/thefaceshop',
      instagram: 'https://instagram.com/thefaceshop',
      youtube: ''
    },
    productCount: 22,
    createdAt: '2025-03-14T09:15:00Z',
    updatedAt: '2025-03-14T11:45:00Z'
  },
  {
    id: 'BRD-003',
    name: 'Laneige',
    slug: 'laneige',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'Laneige Logo'
    },
    description: 'Thương hiệu mỹ phẩm cao cấp từ Hàn Quốc',
    origin: 'Hàn Quốc',
    website: 'https://www.laneige.com',
    featured: true,
    status: 'active',
    socialMedia: {
      facebook: 'https://facebook.com/laneige',
      instagram: 'https://instagram.com/laneige',
      youtube: 'https://youtube.com/laneige'
    },
    productCount: 15,
    createdAt: '2025-03-13T10:20:00Z',
    updatedAt: '2025-03-13T14:30:00Z'
  },
  {
    id: 'BRD-004',
    name: 'Maybelline',
    slug: 'maybelline',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'Maybelline Logo'
    },
    description: 'Thương hiệu mỹ phẩm từ Mỹ',
    origin: 'Hoa Kỳ',
    website: 'https://www.maybelline.com',
    featured: false,
    status: 'active',
    socialMedia: {
      facebook: 'https://facebook.com/maybelline',
      instagram: 'https://instagram.com/maybelline',
      youtube: 'https://youtube.com/maybelline'
    },
    productCount: 32,
    createdAt: '2025-03-12T08:40:00Z',
    updatedAt: '2025-03-12T16:20:00Z'
  },
  {
    id: 'BRD-005',
    name: 'L\'Oréal',
    slug: 'loreal',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'L\'Oréal Logo'
    },
    description: 'Thương hiệu mỹ phẩm từ Pháp',
    origin: 'Pháp',
    website: 'https://www.loreal.com',
    featured: true,
    status: 'active',
    socialMedia: {
      facebook: 'https://facebook.com/loreal',
      instagram: 'https://instagram.com/loreal',
      youtube: 'https://youtube.com/loreal'
    },
    productCount: 40,
    createdAt: '2025-03-11T07:50:00Z',
    updatedAt: '2025-03-11T13:10:00Z'
  },
  {
    id: 'BRD-006',
    name: 'Nivea',
    slug: 'nivea',
    logo: {
      url: 'https://via.placeholder.com/150',
      alt: 'Nivea Logo'
    },
    description: 'Thương hiệu chăm sóc da từ Đức',
    origin: 'Đức',
    website: 'https://www.nivea.com',
    featured: false,
    status: 'inactive',
    socialMedia: {
      facebook: 'https://facebook.com/nivea',
      instagram: '',
      youtube: ''
    },
    productCount: 0,
    createdAt: '2025-03-10T11:30:00Z',
    updatedAt: '2025-03-10T15:45:00Z'
  }
];

export default function AdminBrands() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>(sampleBrands);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    products: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const totalPages = Math.ceil(brands.length / itemsPerPage);

  // Tính toán dữ liệu phân trang 
  const paginatedBrands = useMemo(() => {
    const indexOfLastBrand = currentPage * itemsPerPage;
    const indexOfFirstBrand = indexOfLastBrand - itemsPerPage;
    return brands.slice(indexOfFirstBrand, indexOfLastBrand);
  }, [brands, currentPage, itemsPerPage]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Cập nhật thống kê khi brands thay đổi
  useEffect(() => {
    const total = brands.length;
    const active = brands.filter(b => b.status === 'active').length;
    const inactive = brands.filter(b => b.status === 'inactive').length;
    const products = brands.reduce((sum, brand) => sum + (brand.productCount || 0), 0);

    setStatistics({
      total,
      active,
      inactive,
      products
    });
    
    // Nếu trang hiện tại lớn hơn tổng số trang mới, chuyển về trang cuối
    if (currentPage > Math.ceil(total / itemsPerPage) && total > 0) {
      setCurrentPage(Math.ceil(total / itemsPerPage));
    }
  }, [brands, currentPage, itemsPerPage]);

  // Xử lý xem chi tiết thương hiệu
  const handleViewBrand = (id: string) => {
    const brand = brands.find(brand => brand.id === id);
    if (brand) {
      setSelectedBrand(brand);
      setShowDetailModal(true);
    }
  };

  // Xử lý chỉnh sửa thương hiệu
  const handleEditBrand = (id: string) => {
    const brand = brands.find(brand => brand.id === id);
    if (brand) {
      setSelectedBrand(brand);
      setShowEditModal(true);
    }
  };

  // Xử lý xóa thương hiệu
  const handleDeleteBrand = (id: string) => {
    const brand = brands.find(brand => brand.id === id);
    if (brand) {
      setSelectedBrand(brand);
      setShowDeleteModal(true);
    }
  };

  // Xử lý thêm thương hiệu mới
  const handleAddBrand = () => {
    setShowAddModal(true);
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xử lý thay đổi số lượng hiển thị trên mỗi trang
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi số lượng hiển thị
  };

  // Thêm thương hiệu mới
  const handleAddBrandSubmit = (brandData: Partial<Brand>) => {
    // Tạo ID mới theo quy tắc BRD-XXX
    const newId = `BRD-${(brands.length + 1).toString().padStart(3, '0')}`;
    
    // Tạo slug từ tên thương hiệu
    const slug = brandData.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || '';
    
    // Tạo thương hiệu mới với dữ liệu mặc định và dữ liệu đầu vào
    const newBrand: Brand = {
      id: newId,
      name: brandData.name || '',
      slug: slug,
      logo: brandData.logo || { url: 'https://via.placeholder.com/150', alt: '' },
      description: brandData.description || '',
      origin: brandData.origin || '',
      website: brandData.website || '',
      featured: brandData.featured || false,
      status: brandData.status || 'active',
      socialMedia: brandData.socialMedia || { facebook: '', instagram: '', youtube: '' },
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Thêm thương hiệu mới vào danh sách
    setBrands(prevBrands => [...prevBrands, newBrand]);
    
    // Chuyển đến trang cuối để xem thương hiệu mới
    setTimeout(() => {
      setCurrentPage(Math.ceil((brands.length + 1) / itemsPerPage));
    }, 100);
    
    // Đóng modal
    setShowAddModal(false);
    
    // Hiển thị thông báo thành công
    toast.success('Thêm thương hiệu mới thành công!');
  };

  // Cập nhật thương hiệu
  const handleEditBrandSubmit = (brandData: Partial<Brand>) => {
    if (!selectedBrand) return;
    
    // Cập nhật thương hiệu trong danh sách
    setBrands(prevBrands => prevBrands.map(brand => 
      brand.id === selectedBrand.id
        ? { 
            ...brand, 
            ...brandData, 
            updatedAt: new Date().toISOString() 
          }
        : brand
    ));
    
    // Đóng modal
    setShowEditModal(false);
    
    // Hiển thị thông báo thành công
    toast.success('Cập nhật thương hiệu thành công!');
  };

  // Xóa thương hiệu
  const handleDeleteBrandSubmit = (id: string) => {
    // Xóa thương hiệu khỏi danh sách
    setBrands(prevBrands => prevBrands.filter(brand => brand.id !== id));
    
    // Đóng modal
    setShowDeleteModal(false);
    
    // Hiển thị thông báo thành công
    toast.success('Xóa thương hiệu thành công!');
  };

  return (
    <AdminLayout title="Quản lý thương hiệu">
      <Head>
        <title>Quản lý thương hiệu | Yumin Admin</title>
      </Head>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <button
          onClick={handleAddBrand}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm thương hiệu mới
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thống kê thương hiệu */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiGrid className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số thương hiệu
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{statistics.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Thương hiệu hoạt động
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{statistics.active}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiXCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Thương hiệu không hoạt động
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{statistics.inactive}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiGrid className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số sản phẩm
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{statistics.products}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <BrandTable
          brands={paginatedBrands}
          onView={handleViewBrand}
          onEdit={handleEditBrand}
          onDelete={handleDeleteBrand}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
        
        {/* Phân trang */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={brands.length}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
            className="mt-6"
          />
        </div>
      </div>

      {/* Modal thêm thương hiệu */}
      <BrandAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddBrandSubmit}
      />

      {/* Modal chỉnh sửa thương hiệu */}
      <BrandEditModal
        brand={selectedBrand}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditBrandSubmit}
      />

      {/* Modal xem chi tiết thương hiệu */}
      <BrandDetailModal
        brand={selectedBrand}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={handleEditBrand}
        onDelete={handleDeleteBrand}
      />

      {/* Modal xác nhận xóa thương hiệu */}
      <BrandDeleteModal
        brand={selectedBrand}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteBrandSubmit}
      />
    </AdminLayout>
  );
} 