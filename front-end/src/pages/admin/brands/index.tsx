import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiPlus, FiGrid, FiCheckCircle, FiXCircle, FiStar, FiSearch } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import BrandTable from '@/components/admin/brands/BrandTable';
import BrandAddModal from '@/components/admin/brands/BrandAddModal';
import BrandEditModal from '@/components/admin/brands/BrandEditModal';
import BrandDetailModal from '@/components/admin/brands/BrandDetailModal';
import BrandDeleteModal from '@/components/admin/brands/BrandDeleteModal';
// Đã tích hợp phân trang vào BrandTable
import { Brand } from '@/components/admin/brands/BrandForm';
import { useBrands } from '@/contexts/BrandContext';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

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
  const { isAuthenticated, accessToken } = useAdminAuth();
  const {
    brands,
    statistics,
    pagination,
    loading,
    error,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    toggleBrandStatus,
    toggleBrandFeatured
  } = useBrands();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Lấy dữ liệu từ API khi trang được tải hoặc khi các tham số thay đổi
  useEffect(() => {
    const loadBrandsData = async () => {
      if (!isAuthenticated || !accessToken) {
        console.log('Chưa đăng nhập hoặc không có token, bỏ qua việc tải dữ liệu thương hiệu');
        return;
      }

      try {
        setLoadError(null);
        // Tạo đối tượng filters
        const filters: Record<string, any> = {};

        // Thêm tìm kiếm nếu có
        if (searchTerm.trim()) {
          filters.search = searchTerm.trim();
        }

        // Thêm lọc trạng thái nếu không phải 'all'
        if (statusFilter !== 'all') {
          if (statusFilter === 'featured') {
            filters.featured = true;
          } else {
            filters.status = statusFilter;
          }
        }

        await fetchBrands(currentPage, itemsPerPage, filters);
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Lỗi khi tải dữ liệu thương hiệu:', err);
        setLoadError(err.message || 'Có lỗi xảy ra khi tải dữ liệu thương hiệu');
        // Không hiển thị toast ở đây vì đã được xử lý trong context
      }
    };

    // Thêm delay cho tìm kiếm để tránh gọi API quá nhiều
    const delaySearch = setTimeout(() => {
      loadBrandsData();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [currentPage, itemsPerPage, isAuthenticated, accessToken, searchTerm, statusFilter]);

  // Tính toán tổng số trang
  const totalPages = useMemo(() => {
    return pagination.totalPages;
  }, [pagination.totalPages]);

  // Lấy brands từ API với phân trang
  const paginatedBrands = useMemo(() => {
    return brands;
  }, [brands]);

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
  const handleAddBrandSubmit = async (brandData: Partial<Brand>) => {
    try {
      await createBrand(brandData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Lỗi khi thêm thương hiệu:', error);
    }
  };

  // Cập nhật thương hiệu
  const handleEditBrandSubmit = async (brandData: Partial<Brand>) => {
    if (!selectedBrand) return;

    try {
      await updateBrand(selectedBrand.id, brandData);
      setShowEditModal(false);
    } catch (error) {
      console.error('Lỗi khi cập nhật thương hiệu:', error);
    }
  };

  // Xóa thương hiệu
  const handleDeleteBrandSubmit = async (id: string) => {
    try {
      await deleteBrand(id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Lỗi khi xóa thương hiệu:', error);
    }
  };

  // Thử tải lại dữ liệu khi có lỗi
  const handleRetry = async () => {
    try {
      setLoadError(null);
      // Tạo đối tượng filters
      const filters: Record<string, any> = {};

      // Thêm tìm kiếm nếu có
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      // Thêm lọc trạng thái nếu không phải 'all'
      if (statusFilter !== 'all') {
        if (statusFilter === 'featured') {
          filters.featured = true;
        } else {
          filters.status = statusFilter;
        }
      }

      await fetchBrands(currentPage, itemsPerPage, filters);
      setIsInitialized(true);
      toast.success('Đã tải lại dữ liệu thành công');
    } catch (err: any) {
      console.error('Lỗi khi tải lại dữ liệu thương hiệu:', err);
      setLoadError(err.message || 'Có lỗi xảy ra khi tải lại dữ liệu thương hiệu');
    }
  };

  // Xử lý thay đổi tìm kiếm
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi tìm kiếm
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
  };

  return (
    <AdminLayout>
      <Head>
        <title>Quản lý thương hiệu | Yumin Admin</title>
        <meta name="description" content="Quản lý thương hiệu mỹ phẩm" />
      </Head>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-medium text-gray-900">Quản lý thương hiệu</h1>
        <button
          onClick={handleAddBrand}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm thương hiệu mới
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Thống kê thương hiệu */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <FiGrid className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số thương hiệu
                  </dt>
                  <dd>
                    <div className="text-xl font-medium text-gray-900">{statistics.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <FiCheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Thương hiệu hoạt động
                  </dt>
                  <dd>
                    <div className="text-xl font-medium text-gray-900">{statistics.active}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <FiXCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Thương hiệu không hoạt động
                  </dt>
                  <dd>
                    <div className="text-xl font-medium text-gray-900">{statistics.inactive}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <FiStar className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Thương hiệu nổi bật
                  </dt>
                  <dd>
                    <div className="text-xl font-medium text-gray-900">{statistics.featured}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-opacity-50 border-t-blue-500"></div>
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col justify-center items-center h-64 bg-red-50 rounded-lg p-6 border border-red-100">
            <div className="text-red-500 text-lg font-medium mb-4">
              {loadError}
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {paginatedBrands.length === 0 && isInitialized && !loading ? (
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100 p-8 text-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <FiSearch className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy thương hiệu nào</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Không tìm thấy thương hiệu nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử với từ khóa khác hoặc xóa bộ lọc.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            ) : (
              <BrandTable
                brands={paginatedBrands}
                onView={handleViewBrand}
                onEdit={handleEditBrand}
                onDelete={handleDeleteBrand}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={pagination.total}
                onPageChange={handlePageChange}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
              />
            )}
          </>
        )}
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