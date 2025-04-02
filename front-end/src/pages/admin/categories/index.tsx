import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiPlus, FiGrid, FiCheckCircle, FiXCircle, FiList, FiLayers, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import CategoryTable from '@/components/admin/categories/CategoryTable';
import CategoryHierarchy from '@/components/admin/categories/CategoryHierarchy';
import CategoryAddModal from '@/components/admin/categories/CategoryAddModal';
import CategoryEditModal from '@/components/admin/categories/CategoryEditModal';
import CategoryDetailModal from '@/components/admin/categories/CategoryDetailModal';
import CategoryDeleteModal from '@/components/admin/categories/CategoryDeleteModal';
import { useCategory, Category } from '@/contexts/CategoryContext';

type ViewMode = 'list' | 'hierarchy';

export default function AdminCategories() {
  const { 
    categories, 
    loading, 
    error, 
    totalCategories,
    currentPage,
    totalPages,
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadImage,
    changeCategoryOrder,
    toggleCategoryStatus,
    toggleCategoryFeatured,
    statistics,
    fetchStatistics
  } = useCategory();
  
  // State cho chế độ xem
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // State cho các modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State cho category đang được thao tác
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchCategories();
    fetchStatistics();
  }, [fetchCategories, fetchStatistics]);
  
  // Xử lý mở modal thêm danh mục mới
  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };
  
  // Xử lý xem chi tiết danh mục
  const handleViewCategory = async (id: string) => {
    try {
      setLoadingDetails(true);
      const category = await fetchCategoryById(id);
      if (category) {
        setSelectedCategory(category);
        
        // Lấy thông tin danh mục cha nếu có
        if (category.parentId) {
          const parent = await fetchCategoryById(category.parentId);
          setParentCategory(parent);
        } else {
          setParentCategory(null);
        }
        
        // Lấy danh mục con
        const childCats = categories.filter(cat => cat.parentId === id);
        setChildCategories(childCats);
        
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin danh mục:', error);
      toast.error('Không thể tải thông tin danh mục');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Xử lý mở modal chỉnh sửa danh mục
  const handleEditCategory = async (id: string) => {
    try {
      // Đóng modal chi tiết trước nếu đang mở
      if (showDetailModal) {
        setShowDetailModal(false);
      }

      setLoadingDetails(true);
      const category = await fetchCategoryById(id);
      if (category) {
        setSelectedCategory(category);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin danh mục:', error);
      toast.error('Không thể tải thông tin danh mục');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Xử lý mở modal xóa danh mục
  const handleDeleteCategory = async (id: string) => {
    try {
      // Đóng modal chi tiết trước nếu đang mở
      if (showDetailModal) {
        setShowDetailModal(false);
      }
      
      setLoadingDetails(true);
      const category = await fetchCategoryById(id);
      if (category) {
        setSelectedCategory(category);
        setShowDeleteModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin danh mục:', error);
      toast.error('Không thể tải thông tin danh mục');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Xử lý thêm danh mục mới
  const handleAddCategory = async (categoryData: Partial<Category>) => {
    try {
      const newCategory = await createCategory(categoryData);
      
      // Đóng modal
      setShowAddModal(false);
      
      // Refresh danh sách
      fetchCategories();
      fetchStatistics();
      
      // Hiển thị thông báo thành công
      toast.success('Thêm danh mục mới thành công!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error);
      toast.error('Không thể thêm danh mục mới');
    }
  };

  // Xử lý cập nhật danh mục
  const handleUpdateCategory = async (categoryData: Partial<Category> & { imageData?: string }) => {
    try {
      if (!categoryData._id) {
        console.error('Không thể cập nhật danh mục khi không có ID');
        toast.error('Thiếu ID danh mục');
        return;
      }
      
      console.log('Nhận dữ liệu cập nhật danh mục:', JSON.stringify({
        ...categoryData,
        imageData: categoryData.imageData ? '[base64 data]' : undefined
      }, null, 2));
      
      // Tách imageData ra khỏi categoryData trước khi cập nhật
      const { imageData, ...dataToUpdate } = categoryData;
      
      console.log('Dữ liệu đã xử lý để gửi đến API:', JSON.stringify(dataToUpdate, null, 2));
      
      try {
        const updatedCategory = await updateCategory(categoryData._id, dataToUpdate);
        console.log('Phản hồi từ API cập nhật:', JSON.stringify(updatedCategory, null, 2));
        
        // Xử lý upload ảnh nếu có
        if (imageData && categoryData._id) {
          console.log('Phát hiện dữ liệu hình ảnh, tiếp tục upload ảnh...');
          const uploadResult = await uploadImage(
            categoryData._id, 
            imageData, 
            categoryData.image?.alt
          );
          console.log('Kết quả upload ảnh:', JSON.stringify(uploadResult, null, 2));
        }
        
        // Đóng modal
        setShowEditModal(false);
        
        // Refresh danh sách
        await fetchCategories();
        
        // Hiển thị thông báo thành công
        toast.success('Cập nhật danh mục thành công!', {
          duration: 3000,
          position: 'top-right',
        });
      } catch (apiError: any) {
        console.error('Lỗi API khi cập nhật danh mục:', apiError);
        toast.error(`Lỗi: ${apiError.message || 'Không thể cập nhật danh mục'}`);
      }
    } catch (error: any) {
      console.error('Lỗi tổng thể khi cập nhật danh mục:', error);
      toast.error(`Lỗi cập nhật: ${error.message || 'Không thể cập nhật danh mục'}`);
    }
  };

  // Xử lý xóa danh mục
  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      
      // Đóng modal
      setShowDeleteModal(false);
      setSelectedCategory(null);
      
      // Refresh danh sách
      fetchCategories();
      fetchStatistics();
      
      // Hiển thị thông báo thành công
      toast.success('Xóa danh mục thành công!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error);
      toast.error('Không thể xóa danh mục');
    }
  };

  // Xử lý thay đổi trạng thái
  const handleToggleStatus = async (id: string) => {
    try {
      await toggleCategoryStatus(id);
      fetchCategories();
      toast.success('Đã thay đổi trạng thái danh mục!');
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái:', error);
      toast.error('Không thể thay đổi trạng thái danh mục');
    }
  };

  // Xử lý thay đổi trạng thái nổi bật
  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleCategoryFeatured(id);
      fetchCategories();
      toast.success('Đã thay đổi trạng thái nổi bật!');
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái nổi bật:', error);
      toast.error('Không thể thay đổi trạng thái nổi bật');
    }
  };

  // Xử lý thay đổi thứ tự
  const handleChangeOrder = async (id: string, order: number) => {
    try {
      await changeCategoryOrder(id, order);
      fetchCategories();
      toast.success('Đã thay đổi thứ tự danh mục!');
    } catch (error) {
      console.error('Lỗi khi thay đổi thứ tự:', error);
      toast.error('Không thể thay đổi thứ tự danh mục');
    }
  };

  if (error) {
    return (
      <AdminLayout title="Quản lý danh mục">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
          <h3 className="text-lg font-medium">Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchCategories()} 
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
          >
            Thử lại
          </button>
        </div>
      </AdminLayout>
    );
  }

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
                      <div className="text-lg font-medium text-gray-900">
                        {statistics?.total || categories.length}
                      </div>
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
                      <div className="text-lg font-medium text-gray-900">
                        {statistics?.active || categories.filter(c => c.status === 'active').length}
                      </div>
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
                      <div className="text-lg font-medium text-gray-900">
                        {statistics?.inactive || categories.filter(c => c.status === 'inactive').length}
                      </div>
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
                  <FiStar className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Danh mục nổi bật
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {statistics?.featured || categories.filter(c => c.featured).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading || loadingDetails ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-pink-600 border-t-transparent" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="ml-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="mt-8">
            {viewMode === 'list' ? (
              <CategoryTable
                categories={categories}
                onView={handleViewCategory}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onToggleStatus={handleToggleStatus}
                onToggleFeatured={handleToggleFeatured}
                onChangeOrder={handleChangeOrder}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page: number) => fetchCategories(page)}
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
        )}
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
        parentCategory={parentCategory}
        childCategories={childCategories}
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