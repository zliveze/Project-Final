import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiPlus, FiGrid, FiCheckCircle, FiXCircle, FiList, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import CategoryTable from '@/components/admin/categories/CategoryTable';
import CategoryHierarchy from '@/components/admin/categories/CategoryHierarchy';
import CategoryAddModal from '@/components/admin/categories/CategoryAddModal';
import CategoryEditModal from '@/components/admin/categories/CategoryEditModal';
import CategoryDetailModal from '@/components/admin/categories/CategoryDetailModal';
import CategoryDeleteModal from '@/components/admin/categories/CategoryDeleteModal';
import { Category } from '@/components/admin/categories/CategoryTable';

// Giả lập dữ liệu mẫu
const sampleCategories: Category[] = [
  {
    id: 'CAT-001',
    name: 'Chăm sóc da',
    slug: 'cham-soc-da',
    image: {
      url: 'https://via.placeholder.com/50',
      alt: 'Chăm sóc da'
    },
    description: 'Các sản phẩm chăm sóc da mặt chất lượng cao, giúp dưỡng ẩm và phục hồi da.',
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
    description: 'Các sản phẩm trang điểm cao cấp, giúp tôn lên vẻ đẹp tự nhiên.',
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
    description: 'Các sản phẩm chăm sóc tóc chuyên nghiệp, giúp phục hồi và nuôi dưỡng mái tóc.',
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
    description: 'Các sản phẩm chống nắng hiệu quả, bảo vệ da khỏi tác hại của tia UV.',
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
    description: 'Các loại mặt nạ dưỡng da đa dạng, phù hợp với nhiều loại da.',
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
    description: 'Các loại nước hoa cao cấp từ các thương hiệu nổi tiếng.',
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

type ViewMode = 'list' | 'hierarchy';

export default function AdminCategories() {
  // State cho dữ liệu
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  
  // State cho chế độ xem
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // State cho các modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State cho category đang được thao tác
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Xử lý mở modal thêm danh mục mới
  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };
  
  // Xử lý xem chi tiết danh mục
  const handleViewCategory = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category) {
      setSelectedCategory(category);
      setShowDetailModal(true);
    }
  };

  // Xử lý mở modal chỉnh sửa danh mục
  const handleEditCategory = (id: string) => {
    // Đóng modal chi tiết trước nếu đang mở
    if (showDetailModal) {
      setShowDetailModal(false);
    }

    const category = categories.find(cat => cat.id === id);
    if (category) {
      setSelectedCategory(category);
      setShowEditModal(true);
    }
  };

  // Xử lý mở modal xóa danh mục
  const handleDeleteCategory = (id: string) => {
    // Đóng modal chi tiết trước nếu đang mở
    if (showDetailModal) {
      setShowDetailModal(false);
    }
    
    const category = categories.find(cat => cat.id === id);
    if (category) {
      setSelectedCategory(category);
      setShowDeleteModal(true);
    }
  };

  // Xử lý thêm danh mục mới
  const handleAddCategory = (categoryData: Partial<Category>) => {
    // Tạo ID mới
    const newId = `CAT-${(categories.length + 1).toString().padStart(3, '0')}`;
    
    // Tạo thời gian hiện tại
    const currentDate = new Date().toLocaleDateString('vi-VN');
    
    // Tạo category mới
    const newCategory: Category = {
      id: newId,
      name: categoryData.name || '',
      slug: categoryData.slug || '',
      description: categoryData.description || '',
      parentId: categoryData.parentId || null,
      level: categoryData.level || 1,
      image: categoryData.image || { url: '', alt: '' },
      status: categoryData.status as 'active' | 'inactive' || 'active',
      featured: categoryData.featured || false,
      order: categoryData.order || 0,
      productCount: 0,
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    // Cập nhật state
    setCategories(prev => [...prev, newCategory]);
    
    // Đóng modal
    setShowAddModal(false);
    
    // Hiển thị thông báo thành công
    toast.success('Thêm danh mục mới thành công!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  // Xử lý cập nhật danh mục
  const handleUpdateCategory = (categoryData: Partial<Category>) => {
    if (!categoryData.id) return;
    
    // Cập nhật state
    setCategories(prev => prev.map(cat => 
      cat.id === categoryData.id 
        ? { ...cat, ...categoryData, updatedAt: new Date().toLocaleDateString('vi-VN') } 
        : cat
    ));
    
    // Đóng modal
    setShowEditModal(false);
    
    // Hiển thị thông báo thành công
    toast.success('Cập nhật danh mục thành công!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  // Xử lý xóa danh mục
  const handleConfirmDelete = (id: string) => {
    // Xóa danh mục khỏi state
    setCategories(prev => prev.filter(cat => cat.id !== id));
    
    // Đóng modal
    setShowDeleteModal(false);
    setSelectedCategory(null);
    
    // Hiển thị thông báo thành công
    toast.success('Xóa danh mục thành công!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  // Lấy danh mục cha (nếu có)
  const getParentCategory = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    return categories.find(cat => cat.id === parentId) || null;
  };

  // Lấy các danh mục con (nếu có)
  const getChildCategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  // Tính toán số lượng danh mục theo trạng thái
  const activeCategories = categories.filter(cat => cat.status === 'active').length;
  const inactiveCategories = categories.filter(cat => cat.status === 'inactive').length;
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);

  return (
    <AdminLayout title="Quản lý danh mục">
      <Head>
        <title>Quản lý danh mục | Yumin Admin</title>
      </Head>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục sản phẩm</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý các danh mục sản phẩm của cửa hàng
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-md border border-gray-300 p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiList className="mr-1.5 -ml-0.5 h-5 w-5" />
                Danh sách
              </button>
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'hierarchy'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiLayers className="mr-1.5 -ml-0.5 h-5 w-5" />
                Phân cấp
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Thêm danh mục mới
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Thống kê danh mục */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiGrid className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tổng số danh mục
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{categories.length}</div>
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
                      Danh mục hoạt động
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{activeCategories}</div>
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
                      Danh mục không hoạt động
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{inactiveCategories}</div>
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
                      <div className="text-lg font-medium text-gray-900">{totalProducts}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {viewMode === 'list' ? (
            <CategoryTable
              onView={handleViewCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          ) : (
            <CategoryHierarchy
              categories={categories}
              onView={handleViewCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          )}
        </div>
      </div>
      
      {/* Modal Thêm danh mục mới */}
      <CategoryAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCategory}
        categories={categories}
      />
      
      {/* Modal Chỉnh sửa danh mục */}
      <CategoryEditModal
        category={selectedCategory}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateCategory}
        categories={categories}
      />
      
      {/* Modal Xem chi tiết danh mục */}
      <CategoryDetailModal
        category={selectedCategory}
        parentCategory={selectedCategory ? getParentCategory(selectedCategory.parentId) : null}
        childCategories={selectedCategory ? getChildCategories(selectedCategory.id) : []}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
      
      {/* Modal Xóa danh mục */}
      <CategoryDeleteModal
        category={selectedCategory}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
      />
    </AdminLayout>
  );
} 