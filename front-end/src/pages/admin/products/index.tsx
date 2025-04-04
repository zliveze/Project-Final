import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Toaster, toast } from 'react-hot-toast';
import { FiAlertCircle, FiUpload, FiDownload, FiX, FiCheck, FiEdit, FiEye, FiPlus } from 'react-icons/fi';
import Cookies from 'js-cookie';
// import { useProduct } from '@/contexts/ProductContext';

// Import các components mới
import ProductTable from '@/components/admin/products/components/ProductTable';
import ProductTableSummary from '@/components/admin/products/components/ProductTableSummary';
import ProductFilter from '@/components/admin/products/components/ProductFilter';
import BulkActionBar from '@/components/admin/products/components/BulkActionBar';

import ProductForm from '@/components/admin/products/ProductForm/index';
import { Pagination } from '@/components/admin/common';

// Import hooks
import { getCategories, getBrands } from '@/components/admin/products/hooks/useProductTable';
import { ProductFilterState } from '@/components/admin/products/components/ProductFilter';
import { ProductStatus } from '@/components/admin/products/components/ProductStatusBadge';
import { useProductAdmin } from '@/hooks/useProductAdmin';
import { useApiStats } from '@/hooks/useApiStats';
import { useProduct } from '@/contexts/ProductContext'; // Already imported, good.

export default function AdminProducts() {

  
  // Sử dụng hook mới tối ưu hóa hiệu năng
  const {
    products,
    loading: isLoading,
    error,
    totalItems,
    totalPages,
    selectedProductIds: selectedProducts,
    fetchProducts,
    changePage: setPage,
    changeLimit: setItemsPerPage,
    searchProducts,
    applyFilters: applyFilter,
    toggleProductSelection,
    selectAllProducts: toggleSelectAll,
    clearSelection: clearSelectedProducts,
    deleteMultipleProducts: bulkDelete,
    updateMultipleProductsStatus: bulkSetStatus,
    updateMultipleProductsFlag: bulkSetFlag,
    isAllSelected,
    hasSelection,
    filters,
    checkApiHealth,
    currentPage,
    itemsPerPage
  } = useProductAdmin();

  // Sử dụng hook API stats
  const { statistics, loading: statsLoading } = useApiStats();

  // Dữ liệu thống kê
  const [statisticsData, setStatisticsData] = useState({
    totalActive: 0,
    totalOutOfStock: 0,
    totalDiscontinued: 0
  });

  // Lấy thông tin thống kê khi trang được tải
  useEffect(() => {
    if (statistics) {
      setStatisticsData({
        totalActive: statistics.active || 0,
        totalOutOfStock: statistics.outOfStock || 0,
        totalDiscontinued: statistics.discontinued || 0
      });
    }
  }, [statistics]);

  // State để theo dõi sản phẩm đang mở rộng chi tiết
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  // Hàm toggle chi tiết sản phẩm
  const toggleProductDetails = (id: string) => {
    setExpandedProduct(prev => prev === id ? null : id);
  };

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

  // Get productContext from useProduct hook
  const { cleanupBase64Images, uploadProductImage } = useProduct(); // Add uploadProductImage

  // Component did mount - kiểm tra kết nối API
  useEffect(() => {
    console.log('Admin Products page mounted');
    
    // Kiểm tra xem người dùng đã đăng nhập chưa trước khi thực hiện bất kỳ yêu cầu API nào
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    if (!adminToken) {
      console.log('Người dùng chưa đăng nhập, không gọi API');
      return; // Thoát sớm nếu không có token
    }
    
    // Đánh dấu trang đang được xem để cải thiện trải nghiệm
    const PRODUCTS_PAGE_VIEWED = 'admin_products_page_viewed';
    const wasViewedRecently = localStorage.getItem(PRODUCTS_PAGE_VIEWED);
    const currentTime = Date.now();
    
    // Chỉ kiểm tra API và không fetchProducts nếu đã xem trang gần đây (trong 5 phút)
    if (wasViewedRecently && currentTime - parseInt(wasViewedRecently) < 5 * 60 * 1000) {
      console.log('Trang sản phẩm đã được xem gần đây, chỉ kiểm tra kết nối API');
      checkApiHealth();
    } else {
      // Tạo một hàm kiểm tra tình trạng backend
      const initializeData = async () => {
        try {
          // Kiểm tra trạng thái API - chỉ kiểm tra, không tải dữ liệu
          const isOnline = await checkApiHealth();
          
          if (!isOnline) {
            toast.error('Không thể kết nối đến server API. Vui lòng kiểm tra lại kết nối hoặc khởi động lại server.', {
              duration: 5000,
            });
            return;
          }
          
          console.log('Kết nối API thành công, đang để useProductAdmin xử lý tải dữ liệu sản phẩm');
          
        } catch (error) {
          console.error('Lỗi kiểm tra kết nối API:', error);
        }
      };
      
      initializeData();
    }
    
    // Cập nhật thời gian xem trang
    localStorage.setItem(PRODUCTS_PAGE_VIEWED, currentTime.toString());
    
    // Kiểm tra token trước khi thiết lập interval
    let intervalId: NodeJS.Timeout | null = null;
    
    if (adminToken) {
      // Không cần polling liên tục, chỉ cần kiểm tra kết nối API định kỳ
      intervalId = setInterval(() => {
        // Kiểm tra lại token trước mỗi lần gọi API
        const currentToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
        if (currentToken) {
          checkApiHealth();
        } else {
          // Nếu token không còn, xóa interval
          if (intervalId) clearInterval(intervalId);
        }
      }, 300000); // Kiểm tra kết nối API mỗi 5 phút
    }
    
    // Cleanup khi component bị unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // Empty dependency array để chỉ chạy một lần khi component mount

  const handleEdit = async (id: string): Promise<boolean> => {
    try {
      console.log('Đang mở modal sửa sản phẩm với ID:', id);
      
      // Hiển thị toast loading trước
      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');
      
      try {
        // Thay vì lấy từ danh sách, gọi API để lấy thông tin chi tiết sản phẩm
        // Sửa đường dẫn API - loại bỏ /api phía trước vì đó là routing của Next.js
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.status}`);
        }
        
        const productDetails = await response.json();
        
        // Ngừng hiển thị toast loading
        toast.dismiss(loadingToast);
        console.log('Đã tải thông tin chi tiết sản phẩm:', productDetails);

        // Cập nhật dữ liệu và hiển thị modal
        setSelectedProduct(productDetails);
        setShowEditProductModal(true);
        
        toast.success(`Đang sửa sản phẩm: ${productDetails.name}`, {
          duration: 2000,
          icon: <FiEdit className="text-blue-500" />
        });
        
        return true;
      } catch (fetchError) {
        console.error('Lỗi khi tải thông tin chi tiết sản phẩm:', fetchError);
        
        // Nếu không lấy được từ API, thử tìm từ danh sách hiện tại
        const productInList = products.find(p => p.id === id);
        
        if (!productInList) {
          toast.dismiss(loadingToast);
          toast.error('Không tìm thấy thông tin sản phẩm!', { duration: 3000 });
          return false;
        }
        
        // Ngừng hiển thị toast loading
        toast.dismiss(loadingToast);
        console.log('Không thể tải chi tiết, sử dụng sản phẩm từ danh sách:', productInList);

        // Cập nhật dữ liệu và hiển thị modal
        setSelectedProduct(productInList);
        setShowEditProductModal(true);
        
        toast.success(`Đang sửa sản phẩm: ${productInList.name}`, {
          duration: 2000,
          icon: <FiEdit className="text-blue-500" />
        });
        
        return true;
      }
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

      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');

      // Tìm sản phẩm trong danh sách hiện tại hoặc tải từ API nếu cần
      const productInList = products.find(p => p.id === id);
      
      if (!productInList) {
        toast.dismiss(loadingToast);
        toast.error('Không tìm thấy thông tin sản phẩm!', { duration: 3000 });
        return false;
      }
      
      toast.dismiss(loadingToast);
      console.log('Đã tìm thấy sản phẩm:', productInList);

      setSelectedProduct(productInList);
      setShowProductDetailModal(true);
      toast.success(`Đang xem sản phẩm: ${productInList.name}`, {
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

      const loadingToast = toast.loading('Đang tải thông tin sản phẩm...');

      // Tìm sản phẩm trong danh sách hiện tại
      const productInList = products.find(p => p.id === id);
      
      if (!productInList) {
        toast.dismiss(loadingToast);
        toast.error('Không tìm thấy thông tin sản phẩm!', { duration: 3000 });
        return false;
      }
      
      toast.dismiss(loadingToast);
      console.log('Đã tìm thấy sản phẩm sẽ xóa:', productInList);

      // Hiển thị modal xác nhận xóa
      setProductToDelete(id);
      setSelectedProduct(productInList);
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

  const confirmDelete = async () => {
    // Xử lý xóa sản phẩm
    console.log(`Đang xóa sản phẩm ${productToDelete}`);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang xóa sản phẩm...');

    try {
      if (productToDelete) {
        // Xóa sản phẩm bằng các sản phẩm được chọn
        const success = await bulkDelete();
        
        if (success) {
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
        } else {
          toast.dismiss(loadingToast);
          toast.error('Có lỗi xảy ra khi xóa sản phẩm!', {
            duration: 3000
          });
        }
      }
    } catch (error: any) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error(`Có lỗi xảy ra khi xóa sản phẩm: ${error.message}`, {
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

      // Sử dụng API trực tiếp thay vì productContext
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productToCreate)
      });

      if (!response.ok) {
        throw new Error(`Lỗi khi tạo sản phẩm: ${response.status}`);
      }

      const createdProduct = await response.json();

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
    console.log('Cập nhật sản phẩm (dữ liệu gốc từ form):', updatedProduct);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang cập nhật sản phẩm...');

    // Keep the original images array to check for files later
    const originalImages = updatedProduct.images || [];

    try {
      // Process the product data for the main PATCH request
      // Filter out images that have a 'file' property (new uploads)
      // Only send images that already have a valid URL
      const productDataForPatch = { ...updatedProduct };
      if (productDataForPatch.images && Array.isArray(productDataForPatch.images)) {
        productDataForPatch.images = productDataForPatch.images
          .filter((img: any) => img.url && !img.file && !img.url.startsWith('blob:')) // Keep only existing images with valid URLs
          .map((img: any) => ({ // Clean up unnecessary client-side props
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            publicId: img.publicId,
          }));
      }
      console.log('Dữ liệu gửi đi cho PATCH request:', productDataForPatch);


      // Xác định ID sản phẩm, ưu tiên id trước, sau đó mới dùng _id
      const productId = productDataForPatch.id || productDataForPatch._id;
      
      if (!productId) {
        throw new Error('Không tìm thấy ID sản phẩm');
      }
      
      // Xóa id và _id khỏi dữ liệu gửi đi để tránh lỗi
      delete productDataForPatch.id;
      delete productDataForPatch._id;

      // 1. Send the main PATCH request with filtered data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productDataForPatch)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi cập nhật sản phẩm: ${response.status} - ${errorText}`);
      }

      const updatedProductResult = await response.json(); // Get the result of the main update

      // 2. Upload any new images that have a 'file' property
      const imagesToUpload = originalImages.filter((img: any) => img.file);
      if (imagesToUpload.length > 0) {
        console.log(`Tìm thấy ${imagesToUpload.length} hình ảnh mới cần tải lên.`);
        toast.loading(`Đang tải lên ${imagesToUpload.length} hình ảnh mới...`, { id: 'image-upload-toast' });

        let uploadSuccessCount = 0;
        for (const image of imagesToUpload) {
          try {
            console.log(`Đang tải lên file: ${image.file.name} cho sản phẩm ID: ${productId}`);
            await uploadProductImage(image.file, productId, image.isPrimary);
            uploadSuccessCount++;
            console.log(`Tải lên thành công: ${image.file.name}`);
          } catch (uploadError: any) {
            console.error(`Lỗi khi tải lên hình ảnh ${image.alt || image.file.name}:`, uploadError);
            toast.error(`Lỗi tải lên ảnh: ${image.alt || image.file.name} - ${uploadError.message}`, { duration: 5000 });
            // Optionally continue uploading other images or stop
          }
        }
         toast.dismiss('image-upload-toast');
         if (uploadSuccessCount === imagesToUpload.length) {
           toast.success(`Đã tải lên ${uploadSuccessCount} hình ảnh mới thành công!`);
         } else {
           toast.error(`Chỉ tải lên được ${uploadSuccessCount}/${imagesToUpload.length} hình ảnh mới.`); // Changed warning to error
         }
       }

      // Thông báo thành công chung
      toast.dismiss(loadingToast);
      toast.success('Cập nhật sản phẩm thành công!', {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Đóng modal
      setShowEditProductModal(false);

      // Refresh the product list to show updated data including new images
      fetchProducts();

      return updatedProductResult; // Return the result from the main PATCH
    } catch (error: any) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.dismiss('image-upload-toast'); // Ensure upload toast is dismissed on error
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
    searchProducts(term);
  };

  // Xử lý thao tác hàng loạt
  const handleBulkDelete = async (): Promise<boolean> => {
    if (selectedProducts.length === 0) return false;

    // Thông báo xác nhận
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) {
      try {
        // Hiển thị thông báo đang xử lý
        const loadingToast = toast.loading(`Đang xóa ${selectedProducts.length} sản phẩm...`);

        // Sử dụng hàm bulkDelete từ hook
        const success = await bulkDelete();
        
        if (success) {
          // Thông báo thành công
          toast.dismiss(loadingToast);
          toast.success(`Đã xóa ${selectedProducts.length} sản phẩm thành công!`, {
            duration: 3000,
            icon: <FiCheck className="text-green-500" />
          });
          
          return true;
        } else {
          toast.dismiss(loadingToast);
          toast.error('Có lỗi xảy ra khi xóa sản phẩm!', {
            duration: 3000
          });
          return false;
        }
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

      // Sử dụng hàm bulkSetStatus từ hook
      const success = await bulkSetStatus(newStatus);
      
      if (success) {
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success(`Đã cập nhật trạng thái cho ${selectedProducts.length} sản phẩm thành công!`, {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        return true;
      } else {
        toast.dismiss(loadingToast);
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái sản phẩm!', {
          duration: 3000
        });
        return false;
      }
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

      // Sử dụng hàm bulkSetFlag từ hook
      const success = await bulkSetFlag(flagName, flagValue);
      
      if (success) {
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success(`Đã cập nhật nhãn cho ${selectedProducts.length} sản phẩm thành công!`, {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        return true;
      } else {
        toast.dismiss(loadingToast);
        toast.error('Có lỗi xảy ra khi cập nhật nhãn sản phẩm!', {
          duration: 3000
        });
        return false;
      }
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

      // Tìm sản phẩm trong danh sách hiện tại
      const productInList = products.find(p => p.id === id);
      
      if (!productInList) {
        toast.error('Không tìm thấy thông tin sản phẩm!', { duration: 3000 });
        return false;
      }

      // Tạo phiên bản copy của sản phẩm
      const duplicatedProduct = {
        ...productInList,
        id: undefined, // Remove ID so a new one will be generated
        name: `Bản sao - ${productInList.name}`,
        sku: `COPY-${productInList.sku}`
      };

      console.log('Sản phẩm sau khi nhân bản:', duplicatedProduct);

      setSelectedProduct(duplicatedProduct);
      setShowAddProductModal(true);

      toast.success(`Đang tạo bản sao của sản phẩm: ${productInList.name}`, {
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
    toggleSelectAll();
  };

  // Thêm state và handler cho cleanupBase64
  const [isCleaningBase64, setIsCleaningBase64] = useState(false);
  
  // Handler để dọn dẹp dữ liệu base64
  const handleCleanupBase64 = async () => {
    try {
      setIsCleaningBase64(true);
      const result = await cleanupBase64Images();
      toast.success(`${result.message} (${result.count} sản phẩm đã được xử lý)`);
    } catch (error) {
      console.error('Lỗi khi dọn dẹp base64:', error);
      toast.error('Lỗi khi dọn dẹp dữ liệu base64');
    } finally {
      setIsCleaningBase64(false);
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
          totalActive={statisticsData.totalActive}
          totalOutOfStock={statisticsData.totalOutOfStock}
          totalDiscontinued={statisticsData.totalDiscontinued}
          filteredItems={products.length}
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
          products={products}
          selectedProducts={selectedProducts}
          expandedProduct={expandedProduct}
          isLoading={isLoading}
          isAllSelected={isAllSelected}
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
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
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
