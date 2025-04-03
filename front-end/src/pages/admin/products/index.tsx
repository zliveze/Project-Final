import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Toaster, toast } from 'react-hot-toast';
import { FiAlertCircle, FiUpload, FiDownload, FiX, FiCheck, FiEdit, FiEye, FiPlus } from 'react-icons/fi';
import { useProduct } from '@/contexts/ProductContext';

// Import các components mới
import ProductTable from '@/components/admin/products/components/ProductTable';
import ProductTableSummary from '@/components/admin/products/components/ProductTableSummary';
import ProductFilter from '@/components/admin/products/components/ProductFilter';
import BulkActionBar from '@/components/admin/products/components/BulkActionBar';

import ProductForm from '@/components/admin/products/ProductForm/index';
import { Pagination } from '@/components/admin/common';

// Import hooks
import { useProductTable, getCategories, getBrands } from '@/components/admin/products/hooks/useProductTable';
import { ProductFilterState } from '@/components/admin/products/components/ProductFilter';
import { ProductStatus } from '@/components/admin/products/components/ProductStatusBadge';

export default function AdminProducts() {
  // Get the product context
  const productContext = useProduct();

  // Sử dụng hook quản lý sản phẩm (now using ProductContext internally)
  const {
    // products, // Unused
    filteredProducts,
    isLoading,
    selectedProducts,
    expandedProduct,
    totalItems,
    totalActive,
    totalOutOfStock,
    totalDiscontinued,
    currentPage,
    itemsPerPage,
    toggleProductSelection,
    // toggleSelectAll, // Unused
    toggleProductDetails,
    applyFilter,
    setPage,
    setItemsPerPage,
    clearSelectedProducts,
    fetchProducts,
    // isAllSelected, // Unused
    filter
  } = useProductTable();

  // State chung
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches] = useState([
    { id: '1', name: 'Chi nhánh Hà Nội' },
    { id: '2', name: 'Chi nhánh Hồ Chí Minh' },
    { id: '3', name: 'Chi nhánh Đà Nẵng' },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State cho các modal product
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Lấy dữ liệu danh mục và thương hiệu
  const categories = getCategories();
  const brands = getBrands();

  // Component did mount - gọi fetchProducts để đảm bảo sản phẩm được tải
  useEffect(() => {
    console.log('Admin Products page mounted');
    
    // Tạo một hàm kiểm tra tình trạng backend và tải dữ liệu sản phẩm
    const initializeData = async () => {
      try {
        // Kiểm tra trạng thái API
        const isOnline = await productContext.checkApiHealth();
        
        if (!isOnline) {
          toast.error('Không thể kết nối đến server API. Vui lòng kiểm tra lại kết nối hoặc khởi động lại server.', {
            duration: 5000,
          });
          return;
        }
        
        // Đảm bảo dữ liệu được tải khi vào trang
        fetchProducts();
        
      } catch (error) {
        console.error('Lỗi kiểm tra kết nối API:', error);
      }
    };
    
    initializeData();
    
    // Thiết lập polling định kỳ để đảm bảo dữ liệu luôn được cập nhật
    const intervalId = setInterval(() => {
      fetchProducts();
    }, 60000); // Cập nhật mỗi 60 giây
    
    // Cleanup khi component bị unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array để chỉ chạy một lần khi component mount

  // Hàm lấy thông tin sản phẩm theo ID đã được thay thế bằng ProductContext.fetchProductById

  const handleEdit = async (id: string): Promise<boolean> => {
    try {
      // Lấy thông tin sản phẩm
      console.log('Đang mở modal sửa sản phẩm với ID:', id);

      // Use ProductContext to get the product by ID
      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');

      const product = await productContext.fetchProductById(id);
      toast.dismiss(loadingToast);
      console.log('Đã tìm thấy sản phẩm:', product);

      // Convert to the format expected by the form
      const formattedProduct = {
        ...product,
        id: product._id
      };

      setSelectedProduct(formattedProduct);
      setShowEditProductModal(true);
      toast.success(`Đang sửa sản phẩm: ${product.name}`, {
        duration: 2000,
        icon: <FiEdit className="text-blue-500" />
      });
      
      return true;
    } catch (error: any) {
      toast.error(`Không tìm thấy thông tin sản phẩm: ${error.message}`, {
        duration: 3000
      });
      console.error('Không tìm thấy sản phẩm với ID:', id, error);
      return false;
    }
  };

  const handleView = async (id: string): Promise<boolean> => {
    try {
      // Lấy thông tin sản phẩm
      console.log('Đang mở modal xem sản phẩm với ID:', id);

      // Use ProductContext to get the product by ID
      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');

      const product = await productContext.fetchProductById(id);
      toast.dismiss(loadingToast);
      console.log('Đã tìm thấy sản phẩm:', product);

      // Convert to the format expected by the form
      const formattedProduct = {
        ...product,
        id: product._id
      };

      setSelectedProduct(formattedProduct);
      setShowProductDetailModal(true);
      toast.success(`Đang xem sản phẩm: ${product.name}`, {
        duration: 2000,
        icon: <FiEye className="text-gray-500" />
      });
      
      return true;
    } catch (error: any) {
      toast.error(`Không tìm thấy thông tin sản phẩm: ${error.message}`, {
        duration: 3000
      });
      console.error('Không tìm thấy sản phẩm với ID:', id, error);
      return false;
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      // Kiểm tra xem sản phẩm có tồn tại không
      console.log('Đang yêu cầu xóa sản phẩm với ID:', id);

      // Use ProductContext to get the product by ID
      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');

      const product = await productContext.fetchProductById(id);
      toast.dismiss(loadingToast);
      console.log('Đã tìm thấy sản phẩm sẽ xóa:', product);

      // Convert to the format expected by the form
      const formattedProduct = {
        ...product,
        id: product._id
      };

      // Hiển thị modal xác nhận xóa
      setProductToDelete(id);
      setSelectedProduct(formattedProduct);
      setShowDeleteModal(true);
      
      return true;
    } catch (error: any) {
      toast.error(`Không tìm thấy thông tin sản phẩm để xóa: ${error.message}`, {
        duration: 3000
      });
      console.error('Không tìm thấy sản phẩm với ID:', id, error);
      return false;
    }
  };

  const confirmDelete = () => {
    // Xử lý xóa sản phẩm
    console.log(`Đã xóa sản phẩm ${productToDelete}`);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang xóa sản phẩm...');

    try {
      if (productToDelete) {
        // Use the ProductContext to delete the product
        productContext.deleteProduct(productToDelete)
          .then(() => {
            // Thông báo thành công
            toast.dismiss(loadingToast);
            toast.success('Đã xóa sản phẩm thành công!', {
              duration: 3000,
              icon: <FiCheck className="text-green-500" />
            });

            // Đóng modal
            setShowDeleteModal(false);
            setProductToDelete(null);

            // Refresh the product list
            fetchProducts();
          })
          .catch(error => {
            // Xử lý lỗi
            toast.dismiss(loadingToast);
            toast.error(`Có lỗi xảy ra khi xóa sản phẩm: ${error.message}`, {
              duration: 3000
            });
          });
      }
    } catch (error) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm!', {
        duration: 3000
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleImportSubmit = () => {
    if (!selectedFile || !selectedBranch) {
      toast.error('Vui lòng chọn file và chi nhánh trước khi import', {
        duration: 3000
      });
      return;
    }

    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading(`Đang import file ${selectedFile.name}...`);

    try {
      // Xử lý import file Excel
      console.log(`Đang import file ${selectedFile.name} cho chi nhánh ${selectedBranch}`);

      // Mô phỏng delay của API call
      setTimeout(() => {
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success('Import dữ liệu thành công!', {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });

        // Đóng modal và reset form
        setShowImportModal(false);
        setSelectedFile(null);
        setSelectedBranch('');

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1500);
    } catch (error) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi import dữ liệu!', {
        duration: 3000
      });
    }
  };

  const handleExportData = () => {
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang xuất dữ liệu ra file Excel...');

    try {
      // Xử lý export dữ liệu ra file Excel
      console.log('Đang xuất dữ liệu ra file Excel');

      // Mô phỏng delay của API call
      setTimeout(() => {
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success('Xuất dữ liệu thành công!', {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
      }, 1500);
    } catch (error) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi xuất dữ liệu!', {
        duration: 3000
      });
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowAddProductModal(true);
  };

  const handleSaveNewProduct = async (newProduct: any) => {
    console.log('Thêm sản phẩm mới:', newProduct);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang thêm sản phẩm mới...');

    try {
      // Process the product data before sending it to the API
      const productToCreate = { ...newProduct };

      // Remove file objects from images to avoid circular references
      if (productToCreate.images && Array.isArray(productToCreate.images)) {
        productToCreate.images = productToCreate.images.map((img: any) => ({
          url: img.url || img.preview || '',
          alt: img.alt || '',
          isPrimary: img.isPrimary || false,
          publicId: img.publicId || ''
        }));
      }

      // Use the ProductContext to create a new product
      const createdProduct = await productContext.createProduct(productToCreate);

      // Thông báo thành công
      toast.dismiss(loadingToast);
      toast.success('Thêm sản phẩm mới thành công!', {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Đóng modal
      setShowAddProductModal(false);

      // Refresh the product list
      fetchProducts();

      return createdProduct;
    } catch (error: any) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error(`Có lỗi xảy ra khi thêm sản phẩm: ${error.message}`, {
        duration: 3000
      });
      throw error;
    }
  };

  const handleUpdateProduct = async (updatedProduct: any) => {
    console.log('Cập nhật sản phẩm:', updatedProduct);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang cập nhật sản phẩm...');

    try {
      // Process the product data before sending it to the API
      const productToUpdate = { ...updatedProduct };

      // Remove file objects from images to avoid circular references
      if (productToUpdate.images && Array.isArray(productToUpdate.images)) {
        productToUpdate.images = productToUpdate.images.map((img: any) => ({
          url: img.url || img.preview || '',
          alt: img.alt || '',
          isPrimary: img.isPrimary || false,
          publicId: img.publicId || ''
        }));
      }

      // Xác định ID sản phẩm, ưu tiên id trước, sau đó mới dùng _id
      const productId = productToUpdate.id || productToUpdate._id;
      
      if (!productId) {
        throw new Error('Không tìm thấy ID sản phẩm');
      }
      
      // Xóa id và _id khỏi dữ liệu gửi đi để tránh lỗi
      delete productToUpdate.id;
      delete productToUpdate._id;

      // Use the ProductContext to update the product
      const updatedProductResult = await productContext.updateProduct(productId, productToUpdate);

      // Thông báo thành công
      toast.dismiss(loadingToast);
      toast.success('Cập nhật sản phẩm thành công!', {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Đóng modal
      setShowEditProductModal(false);

      // Refresh the product list
      fetchProducts();

      return updatedProductResult;
    } catch (error: any) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error(`Có lỗi xảy ra khi cập nhật sản phẩm: ${error.message}`, {
        duration: 3000
      });
      throw error;
    }
  };

  // Hàm xử lý lọc sản phẩm
  const handleFilterChange = (newFilter: ProductFilterState) => {
    applyFilter(newFilter);
  };

  // Xử lý tìm kiếm
  const handleSearch = (term: string) => {
    const newFilter = { ...filter, searchTerm: term };
    applyFilter(newFilter);
  };

  // Xử lý thao tác hàng loạt
  const handleBulkDelete = async (): Promise<boolean> => {
    if (selectedProducts.length === 0) return false;

    // Thông báo xác nhận
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) {
      try {
        // Hiển thị thông báo đang xử lý
        const loadingToast = toast.loading(`Đang xóa ${selectedProducts.length} sản phẩm...`);

        // Use ProductContext to delete multiple products
        const deletePromises = selectedProducts.map(id => productContext.deleteProduct(id));
        await Promise.all(deletePromises);
        
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success(`Đã xóa ${selectedProducts.length} sản phẩm thành công!`, {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });

        // Clear selection và reload dữ liệu
        clearSelectedProducts();
        fetchProducts();
        
        return true;
      } catch (error: any) {
        toast.error(`Có lỗi xảy ra khi xóa sản phẩm: ${error.message || 'Unknown error'}`, {
          duration: 3000
        });
        return false;
      }
    }
    return false;
  };

  // Xử lý thay đổi trạng thái hàng loạt
  const handleBulkSetStatus = async (newStatus: ProductStatus): Promise<boolean> => {
    if (selectedProducts.length === 0) return false;

    try {
      // Hiển thị thông báo đang xử lý
      const loadingToast = toast.loading(`Đang cập nhật trạng thái cho ${selectedProducts.length} sản phẩm...`);

      // Use ProductContext to update multiple products
      const updatePromises = selectedProducts.map(id =>
        productContext.updateProduct(id, { status: newStatus })
      );
      
      await Promise.all(updatePromises);
      
      // Thông báo thành công
      toast.dismiss(loadingToast);
      toast.success(`Đã cập nhật trạng thái cho ${selectedProducts.length} sản phẩm thành công!`, {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Reload dữ liệu
      fetchProducts();
      
      return true;
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi cập nhật trạng thái sản phẩm: ${error.message || 'Unknown error'}`, {
        duration: 3000
      });
      return false;
    }
  };

  // Xử lý thay đổi flag hàng loạt
  const handleBulkSetFlag = async (flagName: string, flagValue: boolean): Promise<boolean> => {
    if (selectedProducts.length === 0) return false;

    try {
      // Hiển thị thông báo đang xử lý
      const loadingToast = toast.loading(`Đang cập nhật nhãn cho ${selectedProducts.length} sản phẩm...`);

      // Use ProductContext to update flags for multiple products
      const updatePromises = selectedProducts.map(id => {
        // Create flags object with the specific flag to update
        const flagsUpdate = { flags: { [flagName]: flagValue } };
        return productContext.updateProductFlags(id, flagsUpdate);
      });
      
      await Promise.all(updatePromises);
      
      // Thông báo thành công
      toast.dismiss(loadingToast);
      toast.success(`Đã cập nhật nhãn cho ${selectedProducts.length} sản phẩm thành công!`, {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Reload dữ liệu
      fetchProducts();
      
      return true;
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi cập nhật nhãn sản phẩm: ${error.message || 'Unknown error'}`, {
        duration: 3000
      });
      return false;
    }
  };

  // Xử lý nhân bản sản phẩm
  const handleDuplicate = async (id: string): Promise<boolean> => {
    try {
      // Lấy thông tin sản phẩm
      console.log('Đang nhân bản sản phẩm với ID:', id);

      // Use ProductContext to get the product by ID
      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');

      const product = await productContext.fetchProductById(id);
      toast.dismiss(loadingToast);

      // Tạo phiên bản copy của sản phẩm
      const duplicatedProduct = {
        ...product,
        _id: undefined, // Remove ID so a new one will be generated
        name: `Bản sao - ${product.name}`,
        sku: `COPY-${product.sku}`
      };

      console.log('Sản phẩm sau khi nhân bản:', duplicatedProduct);

      // Convert to the format expected by the form
      const formattedProduct = {
        ...duplicatedProduct,
        id: undefined
      };

      setSelectedProduct(formattedProduct);
      setShowAddProductModal(true);

      toast.success(`Đang tạo bản sao của sản phẩm: ${product.name}`, {
        duration: 2000,
        icon: <FiCheck className="text-blue-500" />
      });
      
      return true;
    } catch (error: any) {
      toast.error(`Không tìm thấy thông tin sản phẩm: ${error.message}`, {
        duration: 3000
      });
      console.error('Không tìm thấy sản phẩm với ID:', id, error);
      return false;
    }
  };

  // Xử lý chọn tất cả sản phẩm trên trang hiện tại
  const handleToggleSelectAll = () => {
    const currentPageProducts = filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const allCurrentPageSelected = currentPageProducts.every(
      p => selectedProducts.includes(p.id)
    );

    if (allCurrentPageSelected) {
      // Bỏ chọn các sản phẩm trên trang hiện tại
      const newSelected = selectedProducts.filter(
        id => !currentPageProducts.some(p => p.id === id)
      );
      clearSelectedProducts();
      newSelected.forEach(id => toggleProductSelection(id));
    } else {
      // Chọn tất cả sản phẩm trên trang hiện tại
      const currentPageIds = currentPageProducts.map(p => p.id);

      // Xóa tất cả lựa chọn trước và chọn lại
      clearSelectedProducts();

      // Chọn lại các mục cũ đã được chọn
      const oldSelected = selectedProducts.filter(
        id => !currentPageProducts.some(p => p.id === id)
      );

      // Chọn tất cả các mục trên trang hiện tại cùng với các mục đã chọn trước đó
      [...oldSelected, ...currentPageIds].forEach(id => toggleProductSelection(id));
    }
  };

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <div className="space-y-6">
        <Toaster position="top-right" />

        {/* Phần thanh công cụ và nút thêm sản phẩm */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={handleExportData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FiDownload className="mr-2" />
              Xuất Excel
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FiUpload className="mr-2" />
              Import Excel
            </button>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <FiPlus className="mr-2" />
            Thêm sản phẩm
          </button>
        </div>

        {/* Hiển thị thống kê */}

        <ProductTableSummary
          totalItems={totalItems}
          totalActive={totalActive}
          totalOutOfStock={totalOutOfStock}
          totalDiscontinued={totalDiscontinued}
          filteredItems={filteredProducts.length}
          loading={isLoading}
        />

        {/* Bộ lọc sản phẩm */}
        <ProductFilter
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          categories={categories}
          brands={brands}
          loading={isLoading}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />

        {/* Bảng sản phẩm */}
        <ProductTable
          products={filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
          selectedProducts={selectedProducts}
          expandedProduct={expandedProduct}
          isLoading={isLoading}
          isAllSelected={filteredProducts.length > 0 &&
            filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .every(p => selectedProducts.includes(p.id))}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          toggleProductSelection={toggleProductSelection}
          toggleSelectAll={handleToggleSelectAll}
          toggleProductDetails={toggleProductDetails}
        />

        {/* Phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
          onPageChange={setPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
        />

        {/* Thanh thao tác hàng loạt */}
        <BulkActionBar
          selectedCount={selectedProducts.length}
          onClearSelection={clearSelectedProducts}
          onBulkDelete={handleBulkDelete}
          onBulkSetStatus={handleBulkSetStatus}
          onBulkSetFlag={handleBulkSetFlag}
          disabled={isLoading}
        />
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xóa sản phẩm
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa sản phẩm {selectedProduct?.name ? <strong>"{selectedProduct.name}"</strong> : ''}? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Import dữ liệu sản phẩm từ Excel
                    </h3>
                    <div className="mb-4">
                      <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn chi nhánh
                      </label>
                      <select
                        id="branch"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                      >
                        <option value="">-- Chọn chi nhánh --</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn file Excel
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Kéo thả file vào đây</span> hoặc click để chọn
                            </p>
                            <p className="text-xs text-gray-500">
                              (Hỗ trợ định dạng .xlsx, .xls)
                            </p>
                          </div>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            name="file-upload"
                            type="file"
                            multiple
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      {selectedFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          File đã chọn: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div className="mt-4">
                      <a
                        href="/templates/product-import-template.xlsx"
                        download
                        className="text-sm text-pink-600 hover:text-pink-800"
                      >
                        Tải xuống file mẫu
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleImportSubmit}
                >
                  Import
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowImportModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm sản phẩm mới */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Thêm sản phẩm mới
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-2 max-h-[80vh] overflow-y-auto">
                  <ProductForm
                    onSubmit={handleSaveNewProduct}
                    onCancel={() => setShowAddProductModal(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa sản phẩm */}
      {showEditProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chỉnh sửa sản phẩm
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEditProductModal(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-2 max-h-[80vh] overflow-y-auto">
                  <ProductForm
                    initialData={selectedProduct}
                    onSubmit={handleUpdateProduct}
                    onCancel={() => setShowEditProductModal(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết sản phẩm */}
      {showProductDetailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chi tiết sản phẩm
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProductDetailModal(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-2 max-h-[80vh] overflow-y-auto">
                  <ProductForm
                    initialData={selectedProduct}
                    onSubmit={() => {}}
                    onCancel={() => setShowProductDetailModal(false)}
                    isViewMode={true}
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowProductDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}