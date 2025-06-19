import { useState, useRef, useEffect, useCallback } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Image from 'next/image';
import * as XLSX from 'xlsx'; // Import thư viện xlsx
import AdminLayout from '@/components/admin/AdminLayout';
import { Toaster, toast } from 'react-hot-toast';
import { FiAlertCircle, FiUpload, FiDownload, FiX, FiCheck, FiEdit, FiEye, FiPlus } from 'react-icons/fi';
import Cookies from 'js-cookie'; // Keep for client-side token checks if needed
// import { useProduct } from '@/contexts/ProductContext';
import { useImportProgress } from '@/hooks/useImportProgress';
import ImportProgressModal from '@/components/admin/ui/ImportProgressModal';
import ImportSummaryModal from '@/components/admin/ui/ImportSummaryModal';


// Import các components mới
import ProductTable from '@/components/admin/products/components/ProductTable';
import ProductTableSummary from '@/components/admin/products/components/ProductTableSummary';
import { ProductFormData } from '@/components/admin/products/ProductForm/types'; // Added import for ProductFormData
import ProductFilter from '@/components/admin/products/components/ProductFilter';
import BulkActionBar from '@/components/admin/products/components/BulkActionBar';
import ProductStatusBadge from '@/components/admin/products/components/ProductStatusBadge'; // Added import

import ProductForm from '@/components/admin/products/ProductForm/index';
import { Pagination } from '@/components/admin/common';

// Import hooks
import { getCategories } from '@/components/admin/products/hooks/useProductTable';
import { ProductFilterState } from '@/components/admin/products/components/ProductFilter';
import { ProductStatus } from '@/components/admin/products/components/ProductStatusBadge';
import { useBranches } from '@/hooks/useBranches'; // Import hook useBranches
import { useProductAdmin, AdminProduct, ProductAdminFilter } from '@/hooks/useProductAdmin'; // Import types
import { useApiStats } from '@/hooks/useApiStats';
import { useProduct } from '@/contexts/ProductContext'; // ProductProvider đã được cung cấp bởi AppProviders
import { useBrands } from '@/contexts/BrandContext'; // Import useBrands hook
import { useCategory } from '@/contexts/CategoryContext'; // Import useCategory hook

// Define props type including SSR data
type AdminProductsProps = InferGetServerSidePropsType<typeof getServerSideProps>;

function AdminProducts({
  initialProducts,
  initialTotalItems,
  initialTotalPages,
  initialCurrentPage,
  initialItemsPerPage,
  apiError
}: AdminProductsProps) {

  // Sử dụng hook mới tối ưu hóa hiệu năng, truyền dữ liệu ban đầu từ SSR
  const {
    products,
    loading: isLoading,
    // error: productAdminError - removed as it's not used
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
    // hasSelection - removed as it's not used
    filters,
    checkApiHealth, // Keep for periodic checks if needed
    currentPage,
    itemsPerPage
  } = useProductAdmin({
    initialProducts,
    initialTotalItems,
    initialTotalPages,
    initialPage: initialCurrentPage,
    initialLimit: initialItemsPerPage,
  });

  // combinedError and setCombinedError - removed as they're not used

  // Sử dụng hook API stats - can potentially be moved to SSR too if needed
  const { statistics } = useApiStats();
  // statsLoading - removed as it's not used

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
  const [isApiOffline, setIsApiOffline] = useState(false);

  // Hàm toggle chi tiết sản phẩm
  const toggleProductDetails = (id: string) => {
    setExpandedProduct(prev => prev === id ? null : id);
  };

  // State chung
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  // Sử dụng hook useBranches để lấy thông tin chi nhánh
  // Đổi tên fetchBranches từ useBranches để tránh xung đột với fetchProducts từ useProductAdmin
  const { branches, loading: branchesLoading, fetchBranches: fetchBranchesList } = useBranches();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showExportBranchModal, setShowExportBranchModal] = useState(false);
  const [selectedBranchForExport, setSelectedBranchForExport] = useState<string>('');

  // Sử dụng hook useImportProgress để theo dõi tiến trình import
  const { task, startPolling, resetProgress } = useImportProgress();
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [importCompletedHandled, setImportCompletedHandled] = useState(false); // State mới để theo dõi hoàn thành

  // Cờ điều khiển việc hiển thị debug logs - đặt ở cấp độ component để dùng chung
  const DEBUG_MODE = false;

  // Hàm debug có điều kiện - wrapped in useCallback to prevent useEffect dependency changes
  const debugLog = useCallback((message: string, data?: unknown) => {
    if (DEBUG_MODE) {
      console.log(`[ProductsAdmin] ${message}`, data || '');
    }
  }, [DEBUG_MODE]);

  // Theo dõi trạng thái tiến trình để tự động đóng modal và làm mới dữ liệu
  useEffect(() => {
    debugLog('Task state changed:', task);

    if (task?.status === 'completed' && !importCompletedHandled) {
      debugLog('Nhận trạng thái hoàn thành, sẽ làm mới dữ liệu và hiển thị tổng kết');
      fetchProducts(); // Làm mới danh sách sản phẩm
      setShowProgressModal(false); // Đóng modal tiến trình

      if (task.summary) {
        setShowSummaryModal(true);
      }
      setImportCompletedHandled(true); // Đánh dấu đã xử lý
    } else if (task?.status === 'failed') {
      setShowProgressModal(false);
      toast.error(task.message || 'Import thất bại với lỗi không xác định.');
      setImportCompletedHandled(true);
    }
  }, [task, importCompletedHandled, fetchProducts, debugLog]);

  // State cho các modal product
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);

  // Lấy dữ liệu danh mục từ mock data (tạm thời)
  const categories = getCategories();

  // Lấy dữ liệu thương hiệu từ BrandContext
  const { brands: apiBrands } = useBrands();
  // brandsLoading - removed as it's not used

  // Lấy dữ liệu danh mục từ CategoryContext
  useCategory();

  // Chuyển đổi định dạng brands từ API để phù hợp với component
  const brands = apiBrands.map(brand => ({
    id: brand.id || brand._id || '',
    name: brand.name
  }));

  // Get productContext from useProduct hook
  const { uploadProductImage, fetchProductById, cloneProduct } = useProduct();
  // cleanupBase64Images - removed as it's not used

  // Removed the initial data fetching useEffect as it's handled by SSR and useProductAdmin
  // Keep periodic health check if desired
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    let intervalId: NodeJS.Timeout | null = null;
    const toastId = 'api-status-toast';

    if (adminToken) {
      const performCheck = () => {
        const currentToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
        if (!currentToken) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        checkApiHealth().then(isOnline => {
          if (!isOnline) {
            if (!isApiOffline) { // Only show toast if status changes from online to offline
              toast.error('Mất kết nối đến server API. Một số chức năng có thể không hoạt động.', {
                id: toastId,
                duration: Infinity, // Keep toast until connection is back
              });
              setIsApiOffline(true);
            }
          } else {
            if (isApiOffline) { // Only show toast if status changes from offline to online
              toast.success('Kết nối API đã được khôi phục.', {
                id: toastId, // This will dismiss the error toast and show a success one
                duration: 4000,
              });
              setIsApiOffline(false);
            }
          }
        });
      };

      // Initial check on mount
      performCheck();

      // Periodic health check
      intervalId = setInterval(performCheck, 300000); // Check every 5 minutes
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      toast.dismiss(toastId); // Clean up toast on component unmount
    };
  }, [checkApiHealth, isApiOffline]); // Dependency on checkApiHealth and isApiOffline

  // Display SSR error if present
  useEffect(() => {
    if (apiError) {
      toast.error(`Lỗi tải dữ liệu ban đầu: ${apiError}`, { duration: 5000 });
    }
  }, [apiError]);


  const handleEdit = async (id: string): Promise<boolean> => {
    debugLog('Opening edit modal for product ID:', id);

    try {
      // 🔧 FIX: Gọi API để lấy chi tiết đầy đủ sản phẩm (bao gồm inventory)
      const loadingToast = toast.loading('Đang tải chi tiết sản phẩm...', {
        icon: <FiEdit className="text-blue-500" />,
      });

      const detailedProduct = await fetchProductById(id);
      toast.dismiss(loadingToast);

      if (detailedProduct) {
        setSelectedProduct(detailedProduct);
        setShowEditProductModal(true);
        toast.success(`Đang sửa sản phẩm: ${detailedProduct.name}`, {
          duration: 2000,
          icon: <FiEdit className="text-blue-500" />,
        });
        return true;
      } else {
        toast.error('Không thể tải chi tiết sản phẩm!', { duration: 3000 });
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Lỗi khi tải chi tiết sản phẩm: ${errorMessage}`, { duration: 3000 });
      console.error('Error fetching product details:', error);
      return false;
    }
  };

  const handleView = async (id: string): Promise<boolean> => {
    debugLog('Opening view modal for product ID:', id);

    try {
      // 🔧 FIX: Gọi API để lấy chi tiết đầy đủ sản phẩm (bao gồm inventory)
      const loadingToast = toast.loading('Đang tải chi tiết sản phẩm...', {
        icon: <FiEye className="text-green-500" />,
      });

      const detailedProduct = await fetchProductById(id);
      toast.dismiss(loadingToast);

      if (detailedProduct) {
        setSelectedProduct(detailedProduct);
        setShowProductDetailModal(true);
        toast.success(`Đang xem sản phẩm: ${detailedProduct.name}`, {
          duration: 2000,
          icon: <FiEye className="text-gray-500" />,
        });
        return true;
      } else {
        toast.error('Không thể tải chi tiết sản phẩm!', { duration: 3000 });
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Lỗi khi tải chi tiết sản phẩm: ${errorMessage}`, { duration: 3000 });
      console.error('Error fetching product details:', error);
      return false;
    }
  };

  const handleDelete = (id: string): Promise<boolean> => {
    // Tìm sản phẩm trong danh sách để hiển thị thông tin xác nhận
    const product = products.find(p => p.id === id);

    if (product) {
      setSelectedProduct(product);
      setProductToDelete(id); // Thiết lập ID sản phẩm cần xóa
      setShowDeleteModal(true);
    } else {
      toast.error('Không tìm thấy thông tin sản phẩm!', { duration: 3000 });
    }

    // Trả về Promise để tương thích với interface
    return Promise.resolve(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    debugLog(`Đang xóa sản phẩm ${productToDelete}`);
    const loadingToast = toast.loading('Đang xóa sản phẩm...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `Lỗi khi xóa sản phẩm: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Ignore if response is not JSON
          console.warn('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }

      // Thông báo thành công
      toast.dismiss(loadingToast);
      toast.success('Đã xóa sản phẩm thành công!', {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Đóng modal và reset state
      setShowDeleteModal(false);
      setProductToDelete(null);
      setSelectedProduct(null); // Clear selected product as well

      // Refresh the product list
      fetchProducts();

    } catch (error: unknown) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi xóa sản phẩm: ${errorMessage}`, {
        duration: 4000
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportClick = () => {
    fetchBranchesList(true); // Gọi fetchBranches với force=true để làm mới danh sách
    setShowImportModal(true);
  };

  const handleImportSubmit = async () => {
    debugLog('Bắt đầu import Excel');
    if (!selectedFile || !selectedBranch) {
      toast.error('Vui lòng chọn file và chi nhánh trước khi import', {
        duration: 3000
      });
      return;
    }

    // Kiểm tra loại file có hợp lệ không
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Chỉ hỗ trợ file Excel (.xlsx, .xls)', {
        duration: 3000
      });
      return;
    }

    // Kiểm tra kích thước file (giới hạn 50MB)
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > 50) {
      toast.error('Kích thước file vượt quá 50MB', {
        duration: 3000
      });
      return;
    }

    // Reset tiến trình VÀ cờ hoàn thành trước khi bắt đầu import mới
    resetProgress();
    setImportCompletedHandled(false); // Reset cờ ở đây

    // Hiển thị modal tiến trình
    debugLog('Hiển thị modal tiến trình');
    setShowProgressModal(true);

    try {
      // Tạo FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('branchId', selectedBranch);

      debugLog('Đang gửi yêu cầu import Excel với:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        branchId: selectedBranch
      });

      // Gọi API import Excel
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/import/excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          // Không set Content-Type khi dùng FormData, browser sẽ tự set
        },
        body: formData,
      });

      // Kiểm tra kỹ lỗi
      if (!response.ok) {
        let errorMessage = `Lỗi: ${response.status} - ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Không thể parse lỗi JSON:', parseError);
          // Nếu không parse được JSON, thử lấy text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.error('Không thể lấy error text:', textError);
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.taskId) {
        debugLog(`API đã trả về taskId: ${result.taskId}, bắt đầu polling.`);
        startPolling(result.taskId);
        // Đóng modal import và reset form ngay lập tức
        setShowImportModal(false);
        setSelectedFile(null);
        setSelectedBranch('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Xử lý trường hợp API không trả về taskId
        throw new Error('API không trả về Task ID để theo dõi.');
      }
    } catch (error: unknown) {
      // Xử lý lỗi
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi import dữ liệu: ${errorMessage}`, {
        duration: 5000
      });
      console.error('Import error:', error);
    }
  };

  const handleOpenExportModal = () => {
    fetchBranchesList(true); // Lấy danh sách chi nhánh mới nhất
    setShowExportBranchModal(true);
  };

  const handleConfirmExportByBranch = async () => {
    // Gỡ bỏ kiểm tra bắt buộc chọn chi nhánh ở đây
    // if (!selectedBranchForExport) {
    //   toast.error('Vui lòng chọn một chi nhánh để xuất.');
    //   return;
    // }

    setShowExportBranchModal(false);
    const loadingToast = toast.loading(`Đang chuẩn bị dữ liệu xuất Excel cho chi nhánh...`);

    try {
      const exportFilters: Partial<ProductAdminFilter> = { ...filters };
      delete exportFilters.page;
      delete exportFilters.limit;

      const params = new URLSearchParams();
      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== false) {
          params.append(key, String(value));
        }
      });
      // Chỉ thêm branchId vào params nếu nó được chọn (không phải chuỗi rỗng)
      if (selectedBranchForExport) {
        params.append('branchId', selectedBranchForExport);
      }

      const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/products/export-data?${params.toString()}`;
      console.log('[Export Excel] Calling API:', apiUrl);
      console.log('[Export Excel] Token:', adminToken ? 'Token vorhanden' : 'Kein Token');
      console.log('[Export Excel] Selected Branch ID for export:', selectedBranchForExport || 'Tất cả (không có ID)');

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Export Excel] Response Status:', response.status);
      console.log('[Export Excel] Response OK:', response.ok);

      if (!response.ok) {
        toast.dismiss(loadingToast);
        interface ErrorData {
          message: string;
        }

        let errorData: ErrorData = { message: `Lỗi ${response.status} (${response.statusText}) khi lấy dữ liệu xuất.` };
        try {
          const errorText = await response.text();
          console.error('[Export Excel] Server Error Response Text:', errorText);
          try {
            errorData = JSON.parse(errorText); // Thử parse thành JSON
          } catch {
            errorData.message = errorText.substring(0, 500) || errorData.message; // Nếu không phải JSON, lấy text
            console.warn('Could not parse error response as JSON');
          }
        } catch {
          console.error('[Export Excel] Could not get error response body');
        }

        const displayMessage = errorData.message || `Lỗi ${response.status} (${response.statusText}) khi lấy dữ liệu xuất.`;
        console.error('[Export Excel] Error Data for Toast:', errorData);
        toast.error(displayMessage);
        return;
      }

      const allProductsToExport: AdminProduct[] = await response.json();

      if (!allProductsToExport || allProductsToExport.length === 0) {
        toast.dismiss(loadingToast); // Dismiss loading toast here
        toast.error('Không có dữ liệu sản phẩm để xuất.', { duration: 3000 });
        toast.dismiss(loadingToast);
        return;
      }

      toast.loading(`Đang tạo file Excel với ${allProductsToExport.length} sản phẩm...`, { id: loadingToast });

      // Định nghĩa 29 cột theo đúng thứ tự yêu cầu
      const desiredHeaders = [
        "Loại hàng",
        "Nhóm hàng (3 Cấp)",
        "Mã hàng",
        "Mã vạch",
        "Tên hàng",
        "Thương hiệu",
        "Giá bán",
        "Giá vốn",
        "Tồn kho",
        "KH đặt",
        "Dự kiến hết hàng",
        "Tồn nhỏ nhất",
        "Tồn lớn nhất",
        "Đơn vị tính (ĐVT)",
        "Mã ĐVT Cơ bản",
        "Quy đổi",
        "Thuộc tính",
        "Mã HH Liên quan",
        "Hình ảnh",
        "Trọng lượng",
        "Tích điểm",
        "Đang kinh doanh",
        "Được bán trực tiếp",
        "Mô tả",
        "Mẫu ghi chú",
        "Vị trí",
        "Hàng thành phần",
        "Bảo hành",
        "Bảo trì định kỳ"
      ];

      // Dữ liệu allProductsToExport từ backend đã là một mảng các object,
      // mỗi object có các key là tiếng Việt tương ứng với desiredHeaders.
      // Chúng ta có thể truyền trực tiếp vào json_to_sheet.
      const worksheet = XLSX.utils.json_to_sheet(allProductsToExport.map(p => p as unknown as Record<string, unknown>), { header: desiredHeaders });


      // Điều chỉnh độ rộng cột tự động dựa trên desiredHeaders và dữ liệu
      const cols = desiredHeaders.map((headerName) => {
        const headerLength = headerName.length;
        const dataLengths = allProductsToExport.map(product => {
          const value = (product as unknown as Record<string, unknown>)[headerName];
          return value !== null && value !== undefined ? String(value).length : 0;
        });
        const maxLength = Math.max(headerLength, ...dataLengths);
        return { wch: maxLength + 2 }; // Thêm chút padding
      });
      worksheet['!cols'] = cols;

      // Tạo workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sản phẩm');

      // Đặt tên file
      const fileName = `danh_sach_san_pham_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Xuất file
      XLSX.writeFile(workbook, fileName);

      toast.dismiss(loadingToast);

      // Đếm số categories phân cấp được xuất
      const hierarchicalCategories = new Set<string>();
      allProductsToExport.forEach(product => {
        const productData = product as unknown as Record<string, unknown>;
        const categoryPath = productData['Nhóm hàng (3 cấp)'] as string;
        if (categoryPath && categoryPath !== 'N/A' && categoryPath.includes('>>')) {
          hierarchicalCategories.add(categoryPath);
        }
      });

      const successMessage = (
        <div className="flex flex-col">
          <span>Xuất dữ liệu thành công!</span>
          <span className="text-sm mt-1">📊 {allProductsToExport.length} sản phẩm</span>
          {hierarchicalCategories.size > 0 && (
            <span className="text-sm mt-1 text-blue-600">
              🏷️ {hierarchicalCategories.size} danh mục phân cấp
            </span>
          )}
        </div>
      );

      toast.success(successMessage, {
        duration: 5000,
        icon: <FiCheck className="text-green-500" />
      });

    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
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

  interface ProductImage {
    file?: File;
    url?: string;
    alt?: string;
    isPrimary?: boolean;
    publicId?: string;
  }

  const handleSaveNewProduct = async (newProduct: ProductFormData): Promise<void> => {
    console.log('Thêm sản phẩm mới:', newProduct);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang thêm sản phẩm mới...');

    // 1. Extract image files to upload separately
    const imagesToUpload = newProduct.images?.filter((img: ProductImage) => img.file) || [];
    console.log(`Tìm thấy ${imagesToUpload.length} hình ảnh cần tải lên sau khi tạo sản phẩm.`);

    try {
      // 2. Prepare product data *without* images for the initial creation
      const productToCreate = { ...newProduct };
      delete productToCreate.images; // Remove images array for the initial create request
      if (productToCreate.id) delete productToCreate.id;     // Ensure no ID is sent for creation
      if ((productToCreate as { _id?: string })._id) delete (productToCreate as { _id?: string })._id;    // Ensure no _id is sent for creation
      debugLog('Dữ liệu gửi đi cho POST request (tạo sản phẩm):', productToCreate);


      // 3. Send the create request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productToCreate)
      });

      if (!response.ok) {
        let errorMessage = `Lỗi khi tạo sản phẩm: ${response.status}`;
        try {
          const errorData = await response.json();
          // Check if the error data has a message property (common in NestJS)
          if (errorData && errorData.message) {
            // Handle potential array of messages
            errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
          } else {
             // Fallback if no specific message found
             const textResponse = await response.text(); // Try getting raw text
             if (textResponse) {
               errorMessage = textResponse.substring(0, 200); // Limit length
             }
          }
        } catch (parseError) {
          // If parsing fails, use the status text or default message
          errorMessage = response.statusText || `Lỗi không xác định (${response.status})`;
          console.error('Failed to parse error response:', parseError);
         }
         // Log the specific error before throwing
         console.error("Backend error details:", errorMessage);
         throw new Error(errorMessage);
       }

       const createdProduct: AdminProduct = await response.json();
      debugLog('Sản phẩm đã được tạo thành công:', createdProduct);

      // 4. Upload images if creation was successful and there are images
      if (imagesToUpload.length > 0 && createdProduct.id) {
        toast.loading(`Đang tải lên ${imagesToUpload.length} hình ảnh...`, { id: 'image-upload-toast' });
        let uploadSuccessCount = 0;
        for (const image of imagesToUpload) {
          if (image.file) {
            try {
              console.log(`Đang tải lên file: ${image.file.name} cho sản phẩm ID: ${createdProduct.id}`);
              // Use the uploadProductImage function from the context
              await uploadProductImage(image.file, createdProduct.id, image.isPrimary);
              uploadSuccessCount++;
              console.log(`Tải lên thành công: ${image.file.name}`);
            } catch (uploadError: unknown) {
              const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
              console.error(`Lỗi khi tải lên hình ảnh ${image.alt || image.file.name}:`, uploadError);
              toast.error(`Lỗi tải lên ảnh: ${image.alt || image.file.name} - ${errorMessage}`, { duration: 5000 });
              // Optionally continue uploading other images or stop
            }
          }
        }
        toast.dismiss('image-upload-toast');
        if (uploadSuccessCount === imagesToUpload.length) {
          toast.success(`Đã tải lên ${uploadSuccessCount} hình ảnh mới thành công!`);
        } else {
          toast.error(`Chỉ tải lên được ${uploadSuccessCount}/${imagesToUpload.length} hình ảnh mới.`);
        }
      }

      // Thông báo thành công chung
      toast.dismiss(loadingToast);
      toast.success('Thêm sản phẩm mới thành công!', {
        duration: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Đóng modal
      setShowAddProductModal(false);

      // 5. Fetch final product data *after* uploads to get correct image URLs
      if (imagesToUpload.length > 0 && createdProduct.id) {
        try {
          debugLog(`Fetching final product data for ID: ${createdProduct.id} after image uploads.`);
          // Assuming fetchProductById exists in the scope or context
          await fetchProductById(createdProduct.id);
          debugLog('Fetched final product data.');
        } catch (fetchError: unknown) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
          console.error(`Failed to fetch final product data after upload: ${errorMessage}`);
          // Proceed with the product data we have, but log the error
        }
      }

      // Refresh the product list
      fetchProducts();

      // return finalProduct; // No return needed for Promise<void>
    } catch (error: unknown) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.dismiss('image-upload-toast'); // Ensure upload toast is dismissed on error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi thêm sản phẩm: ${errorMessage}`, {
        duration: 3000
      });
       // Log the caught error object as well for more context
       console.error("Error during product creation fetch:", error);
       throw error; // Re-throw to be caught by ProductForm if needed, or handle appropriately
     }
   };

   const handleUpdateProduct = async (updatedProduct: ProductFormData): Promise<void> => {
    debugLog('Cập nhật sản phẩm (dữ liệu gốc từ form):', updatedProduct);
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
          .filter((img: ProductImage) => img.url && !img.file && !img.url.startsWith('blob:')) // Keep only existing images with valid URLs
          .map((img: ProductImage) => ({ // Clean up unnecessary client-side props
            url: img.url as string, // Cast to string as filter ensures it's defined
            alt: img.alt,
            isPrimary: img.isPrimary,
            publicId: img.publicId,
          }));
      }
      debugLog('Dữ liệu gửi đi cho PATCH request:', productDataForPatch);


      // Xác định ID sản phẩm, ưu tiên id trước, sau đó mới dùng _id
      const productId = productDataForPatch.id || (productDataForPatch as { _id?: string })._id;

      if (!productId) {
        throw new Error('Không tìm thấy ID sản phẩm');
      }

      // Xóa id và _id khỏi dữ liệu gửi đi để tránh lỗi
      if (productDataForPatch.id) delete productDataForPatch.id;
      if ((productDataForPatch as { _id?: string })._id) delete (productDataForPatch as { _id?: string })._id;

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

      await response.json(); // Get the result of the main update

      // 2. Upload any new images that have a 'file' property
      const imagesToUpload = originalImages.filter((img: ProductImage) => img.file);
      if (imagesToUpload.length > 0) {
        debugLog(`Tìm thấy ${imagesToUpload.length} hình ảnh mới cần tải lên.`);
        toast.loading(`Đang tải lên ${imagesToUpload.length} hình ảnh mới...`, { id: 'image-upload-toast' });

        let uploadSuccessCount = 0;
        for (const image of imagesToUpload) {
          if (image.file) {
            try {
              debugLog(`Đang tải lên file: ${image.file.name} cho sản phẩm ID: ${productId}`);
              await uploadProductImage(image.file, productId, image.isPrimary);
              uploadSuccessCount++;
              debugLog(`Tải lên thành công: ${image.file.name}`);
            } catch (uploadError: unknown) {
              const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
              console.error(`Lỗi khi tải lên hình ảnh ${image.alt || image.file.name}:`, uploadError);
              toast.error(`Lỗi tải lên ảnh: ${image.alt || image.file.name} - ${errorMessage}`, { duration: 5000 });
              // Optionally continue uploading other images or stop
            }
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

      // 3. Fetch final product data *after* uploads
      if (imagesToUpload.length > 0 && productId) {
         try {
           debugLog(`Fetching final product data for ID: ${productId} after image uploads.`);
           // Assuming fetchProductById exists in the scope or context
           const finalProduct = await fetchProductById(productId);
           debugLog('Fetched final product data:', finalProduct);
           // Optionally update the selectedProduct state if the modal might stay open
           // setSelectedProduct(finalProduct);
         } catch (fetchError: unknown) {
           const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
           console.error(`Failed to fetch final product data after upload: ${errorMessage}`);
           // Proceed with the product data we have
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

      // return finalProduct; // No return needed for Promise<void>
    } catch (error: unknown) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.dismiss('image-upload-toast'); // Ensure upload toast is dismissed on error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi cập nhật sản phẩm: ${errorMessage}`, {
        duration: 3000
      });
      // throw error; // Avoid throwing error if the function is Promise<void>
    }
  };

  // Hàm xử lý lọc sản phẩm
  const handleFilterChange = (newFilter: ProductFilterState) => {
    // Chuyển đổi brands từ ProductFilterState sang ProductAdminFilter
    const adminFilters: Partial<ProductAdminFilter> = {
      search: newFilter.searchTerm,
      // Nếu có brands được chọn, chuyển thành chuỗi các ID cách nhau bằng dấu phẩy
      // Nếu không có brands được chọn, đặt rõ ràng là undefined để loại bỏ tham số này khỏi URL
      brandId: newFilter.brands.length > 0 ? newFilter.brands.join(',') : undefined,
      // Nếu có categories được chọn, chuyển thành chuỗi các ID cách nhau bằng dấu phẩy
      // Nếu không có categories được chọn, đặt rõ ràng là undefined để loại bỏ tham số này khỏi URL
      categoryId: newFilter.categories.length > 0 ? newFilter.categories.join(',') : undefined,
      // Trạng thái sản phẩm
      status: newFilter.status,
      // Các flags - chỉ gửi khi giá trị là true
      isBestSeller: newFilter.flags.isBestSeller || undefined,
      isNew: newFilter.flags.isNew || undefined,
      isOnSale: newFilter.flags.isOnSale || undefined,
      hasGifts: newFilter.flags.hasGifts || undefined
    };

    // Log để debug
    console.log('Applying filters to products:', adminFilters);
    applyFilter(adminFilters);
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Có lỗi xảy ra khi xóa sản phẩm: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi cập nhật trạng thái sản phẩm: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi cập nhật nhãn sản phẩm: ${errorMessage}`, {
        duration: 3000
      });
      return false;
    }
  };

  // Xử lý nhân bản sản phẩm
  const handleDuplicate = async (id: string): Promise<boolean> => {
    try {
      // Hiển thị toast loading
      const loadingToast = toast.loading('Đang nhân bản sản phẩm...');

      try {
        // Sử dụng context API để gọi phương thức clone
        const clonedProduct = await cloneProduct(id);

        // Ngừng hiển thị toast loading
        toast.dismiss(loadingToast);
        debugLog('Sản phẩm đã được nhân bản thành công:', clonedProduct);

        // Làm mới danh sách để hiển thị sản phẩm mới
        await fetchProducts();

        toast.success(`Đã nhân bản thành công sản phẩm: ${clonedProduct.name}`, {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });

        return true;
      } catch (error: unknown) {
        // Xử lý lỗi khi gọi API clone
        toast.dismiss(loadingToast);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Không thể nhân bản sản phẩm: ${errorMessage}`, {
          duration: 3000
        });
        console.error('Lỗi khi nhân bản sản phẩm:', error);
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Không thể nhân bản sản phẩm: ${errorMessage}`, {
        duration: 3000
      });
      console.error('Lỗi khi nhân bản sản phẩm với ID:', id, error);
      return false;
    }
  };

  // Xử lý chọn tất cả sản phẩm trên trang hiện tại
  const handleToggleSelectAll = () => {
    toggleSelectAll();
  };

  // isCleaningBase64 and handleCleanupBase64 - removed as they're not used

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <div className="space-y-6">
        <Toaster position="top-right" />

        {/* Phần thanh công cụ và nút thêm sản phẩm */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleOpenExportModal}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FiDownload className="mr-2" />
              Xuất Excel
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FiUpload className="mr-2" />
              Nhập Excel
            </button>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
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

            {/* Updated Delete Confirmation Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Xóa sản phẩm
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-5">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Xác nhận xóa sản phẩm
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Bạn có chắc chắn muốn xóa sản phẩm {selectedProduct?.name ? <strong className="text-gray-700">&quot;{selectedProduct.name}&quot;</strong> : 'này'}? Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>

                {/* Product Info Box */}
                {selectedProduct && (
                  <div className="mt-5 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex items-start space-x-4">
                      {selectedProduct.image && (
                        <Image
                          src={selectedProduct.image}
                          alt={selectedProduct.name || 'Product image'}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-md object-cover border border-gray-200 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{selectedProduct.name}</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {selectedProduct.sku || 'N/A'}</p>
                        {/* Add other relevant details if needed and available */}
                        {/* <p className="text-xs text-gray-500 mt-1">Tạo lúc: {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString('vi-VN') : 'N/A'}</p> */}
                        <div className="mt-2">
                          <ProductStatusBadge status={selectedProduct.status as ProductStatus} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Important Notes */}
                <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-red-800">Lưu ý quan trọng</h4>
                      <ul className="mt-2 list-disc list-inside text-sm text-red-700 space-y-1">
                        <li>Sản phẩm sẽ bị xóa vĩnh viễn khỏi hệ thống.</li>
                        <li>Các hình ảnh liên quan (nếu có) sẽ bị xóa khỏi storage.</li>
                        <li>Không thể khôi phục lại sau khi xóa.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
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
                      <div className="relative">
                        <select
                          id="branch"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                          <option value="">-- Chọn chi nhánh --</option>
                          {branchesLoading ? (
                            <option value="" disabled>Đang tải chi nhánh...</option>
                          ) : branches.map((branch) => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                      {selectedBranch && (
                        <div className="mt-2 flex items-center bg-pink-50 px-3 py-2 rounded-md border border-pink-100">
                          <span className="text-sm text-pink-700">
                            Chi nhánh đã chọn: <span className="font-medium">{branches.find(b => b._id === selectedBranch)?.name || 'Chi nhánh không xác định'}</span>
                          </span>
                        </div>
                      )}
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
                        href={`${process.env.NEXT_PUBLIC_API_URL}/admin/products/templates/import-excel`}
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl w-full">
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
                    initialData={undefined}
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl w-full">
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
                    initialData={selectedProduct ? {
                      ...selectedProduct,
                      price: Number(selectedProduct.price || selectedProduct.originalPrice || 0),
                      images: selectedProduct.image ? [{ url: selectedProduct.image, isPrimary: true }] : [],
                    } as Partial<ProductFormData> : undefined}
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl w-full">
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
                    initialData={selectedProduct ? {
                      ...selectedProduct,
                      price: Number(selectedProduct.price || selectedProduct.originalPrice || 0),
                      images: selectedProduct.image ? [{ url: selectedProduct.image, isPrimary: true }] : [],
                    } as Partial<ProductFormData> : undefined}
                    onSubmit={async () => {}} // Use dummy async function for view mode
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

      {/* Modal hiển thị tiến trình import */}
      <ImportProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          resetProgress(); // Dừng polling và reset khi người dùng đóng modal
        }}
        task={task}
        selectedBranchName={branches.find(b => b._id === selectedBranch)?.name}
      />

      {/* Modal hiển thị tổng kết import */}
      <ImportSummaryModal
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false);
          resetProgress();
        }}
        summary={task?.summary ? {
          success: true,
          created: task.summary.created || 0,
          updated: task.summary.updated || 0,
          brandsCreated: task.summary.brandsCreated || 0,
          categoriesCreated: task.summary.categoriesCreated || 0,
          errors: task.summary.errors || [],
          totalProducts: task.summary.totalProducts || 0,
          statusChanges: task.summary.statusChanges ? {
            toOutOfStock: task.summary.statusChanges.toOutOfStock || 0,
            toActive: task.summary.statusChanges.toActive || 0
          } : undefined
        } : null}
      />

      {/* Modal chọn chi nhánh để Export Excel */}
      {showExportBranchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Chọn chi nhánh để xuất Excel
                </h3>
                <select
                  value={selectedBranchForExport}
                  onChange={(e) => setSelectedBranchForExport(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={branchesLoading}
                >
                  <option value="">-- Tất cả chi nhánh (Mặc định) --</option>
                  {branchesLoading ? (
                    <option disabled>Đang tải chi nhánh...</option>
                  ) : (
                    branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Nếu không chọn, hệ thống sẽ xuất sản phẩm từ tất cả chi nhánh.</p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConfirmExportByBranch}
                  disabled={branchesLoading} // Chỉ disable khi đang tải chi nhánh
                >
                  Xuất Excel
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowExportBranchModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ProductProvider đã được cung cấp bởi AppProviders cho đường dẫn /admin/products
// Không cần wrapper component nữa
export default AdminProducts;

const ITEMS_PER_PAGE = 10; // Default items per page for initial load

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const token = req.cookies.adminToken; // Get token from cookies

  if (!token) {
    // Redirect to login if no token
    return {
      redirect: {
        destination: '/admin/auth/login',
        permanent: false,
      },
    };
  }

  // Construct API URL for initial fetch
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app';
  // Ensure API_URL does not duplicate /api if BASE_URL already ends with it
  const API_URL = BASE_URL.replace(/\/api$/, '') + '/api';
  const ADMIN_PRODUCTS_API = `${API_URL}/admin/products/list`;

  const params = new URLSearchParams({
    page: '1',
    limit: String(ITEMS_PER_PAGE),
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  let initialProducts: AdminProduct[] = [];
  let initialTotalItems = 0;
  let initialTotalPages = 0;
  let initialCurrentPage = 1;
  let initialItemsPerPage = ITEMS_PER_PAGE;
  let apiError: string | null = null;

  try {
    const response = await fetch(`${ADMIN_PRODUCTS_API}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Handle API errors (e.g., unauthorized, server error)
      if (response.status === 401) {
        // Redirect to login on authorization error
        return {
          redirect: {
            destination: '/admin/auth/login?error=unauthorized',
            permanent: false,
          },
        };
      }
      // For other errors, pass an error message to the page
      const errorData = await response.json().catch(() => ({ message: `API Error: ${response.status}` }));
      apiError = errorData.message || `API Error: ${response.status}`;
    } else {
      const data = await response.json();
      initialProducts = data.items;
      initialTotalItems = data.total;
      initialTotalPages = data.totalPages;
      initialCurrentPage = data.page;
      initialItemsPerPage = data.limit;
    }
  } catch (error: unknown) {
    console.error('SSR Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to API during SSR';
    apiError = errorMessage;
  }

  return {
    props: {
      initialProducts,
      initialTotalItems,
      initialTotalPages,
      initialCurrentPage,
      initialItemsPerPage,
      apiError, // Pass error to the component
    },
  };
};
