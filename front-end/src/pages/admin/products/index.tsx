import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Toaster, toast } from 'react-hot-toast';
import { FiAlertCircle, FiUpload, FiDownload, FiX, FiCheck, FiEdit, FiEye, FiPlus } from 'react-icons/fi';

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
  // Sử dụng hook quản lý sản phẩm
  const {
    products,
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
    toggleSelectAll,
    toggleProductDetails,
    applyFilter,
    setPage,
    setItemsPerPage,
    clearSelectedProducts,
    fetchProducts,
    isAllSelected,
    filter
  } = useProductTable();

  // State chung
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([
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

  // Reload dữ liệu khi component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Hàm lấy thông tin sản phẩm theo ID (ví dụ)
  const getProductById = (id: string) => {
    // Trong thực tế sẽ gọi API để lấy thông tin sản phẩm
    // Ở đây giả lập bằng cách sử dụng dữ liệu mẫu
    const sampleProducts = [
      {
        id: 'PRD-001',
        name: 'Kem dưỡng ẩm Yumin',
        sku: 'SKU-001',
        image: 'https://via.placeholder.com/300',
        price: 350000,
        description: {
          short: 'Kem dưỡng ẩm dành cho da khô',
          full: 'Kem dưỡng ẩm Yumin là sản phẩm chăm sóc da cao cấp, giúp cung cấp độ ẩm sâu và duy trì làn da mềm mại, mịn màng suốt ngày dài.'
        },
        category: 'Chăm sóc da',
        categoryIds: ['1'],
        brandId: '1',
        brand: 'Yumin',
        inventory: [
          { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 25 },
          { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 15 },
          { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 5 }
        ],
        stock: 45,
        status: 'active',
        tags: ['dưỡng ẩm', 'da khô', 'chăm sóc da'],
        cosmetic_info: {
          skinType: ['Khô', 'Thường'],
          ingredients: ['Hyaluronic acid', 'Ceramide', 'Vitamin E'],
          volume: {
            value: 50,
            unit: 'ml'
          },
          madeIn: 'Hàn Quốc'
        },
        flags: {
          isBestSeller: true,
          isNew: false,
          isOnSale: false,
          hasGifts: false
        },
        createdAt: '2023-08-15T10:00:00Z',
        updatedAt: '2023-09-10T15:30:00Z'
      },
      {
        id: 'PRD-002',
        name: 'Sữa rửa mặt Yumin',
        sku: 'SKU-002',
        image: 'https://via.placeholder.com/300',
        price: 250000,
        description: {
          short: 'Sữa rửa mặt làm sạch sâu',
          full: 'Sữa rửa mặt Yumin giúp làm sạch sâu, loại bỏ bụi bẩn và dầu thừa, để lại làn da sạch mịn và tươi mát.'
        },
        category: 'Chăm sóc da',
        categoryIds: ['1'],
        brandId: '1',
        brand: 'Yumin',
        inventory: [
          { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 12 },
          { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 20 },
          { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
        ],
        stock: 32,
        status: 'active',
        tags: ['làm sạch', 'rửa mặt', 'chăm sóc da'],
        cosmetic_info: {
          skinType: ['Dầu', 'Hỗn hợp', 'Thường'],
          ingredients: ['Vitamin B5', 'Glycerin', 'Chamomile Extract'],
          volume: {
            value: 150,
            unit: 'ml'
          },
          madeIn: 'Hàn Quốc'
        },
        flags: {
          isBestSeller: false,
          isNew: true,
          isOnSale: false,
          hasGifts: false
        },
        createdAt: '2023-07-20T10:00:00Z',
        updatedAt: '2023-08-15T15:30:00Z'
      },
      {
        id: 'PRD-003',
        name: 'Serum Vitamin C Yumin',
        sku: 'SKU-003',
        image: 'https://via.placeholder.com/300',
        price: 450000,
        description: {
          short: 'Serum làm sáng da với Vitamin C',
          full: 'Serum Vitamin C Yumin giúp làm sáng da, mờ thâm nám và tăng cường độ đàn hồi cho làn da.'
        },
        category: 'Chăm sóc da',
        categoryIds: ['1'],
        brandId: '1',
        brand: 'Yumin',
        inventory: [
          { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 8 },
          { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 10 },
          { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
        ],
        stock: 18,
        status: 'active',
        tags: ['serum', 'vitamin c', 'làm sáng da'],
        cosmetic_info: {
          skinType: ['Mọi loại da'],
          ingredients: ['Vitamin C', 'Niacinamide', 'Hyaluronic Acid'],
          volume: {
            value: 30,
            unit: 'ml'
          },
          madeIn: 'Hàn Quốc'
        },
        flags: {
          isBestSeller: true,
          isNew: false,
          isOnSale: true,
          hasGifts: true
        },
        createdAt: '2023-06-10T10:00:00Z',
        updatedAt: '2023-07-20T15:30:00Z'
      },
      {
        id: 'PRD-004',
        name: 'Mặt nạ dưỡng ẩm Yumin',
        sku: 'SKU-004',
        image: 'https://via.placeholder.com/300',
        price: 50000,
        description: {
          short: 'Mặt nạ cấp ẩm chuyên sâu',
          full: 'Mặt nạ dưỡng ẩm Yumin giúp cung cấp độ ẩm tức thì, làm dịu da khô và mệt mỏi.'
        },
        category: 'Mặt nạ',
        categoryIds: ['1', '6'],
        brandId: '1',
        brand: 'Yumin',
        inventory: [
          { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 0 },
          { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 0 },
          { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
        ],
        stock: 0,
        status: 'out_of_stock',
        tags: ['mặt nạ', 'dưỡng ẩm', 'chăm sóc da'],
        cosmetic_info: {
          skinType: ['Khô', 'Thiếu nước'],
          ingredients: ['Hyaluronic Acid', 'Aloe Vera', 'Vitamin E'],
          volume: {
            value: 25,
            unit: 'ml'
          },
          madeIn: 'Hàn Quốc'
        },
        flags: {
          isBestSeller: false,
          isNew: false,
          isOnSale: false,
          hasGifts: false
        },
        createdAt: '2023-05-05T10:00:00Z',
        updatedAt: '2023-06-15T15:30:00Z'
      },
      {
        id: 'PRD-005',
        name: 'Kem chống nắng Yumin SPF50',
        sku: 'SKU-005',
        image: 'https://via.placeholder.com/300',
        price: 320000,
        description: {
          short: 'Kem chống nắng bảo vệ da tối ưu',
          full: 'Kem chống nắng Yumin SPF50 bảo vệ da khỏi tia UV, ngăn ngừa lão hóa và thâm nám do ánh nắng.'
        },
        category: 'Chống nắng',
        categoryIds: ['1', '7'],
        brandId: '1',
        brand: 'Yumin',
        inventory: [
          { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 7 },
          { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 15 },
          { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 5 }
        ],
        stock: 27,
        status: 'active',
        tags: ['chống nắng', 'spf50', 'bảo vệ da'],
        cosmetic_info: {
          skinType: ['Mọi loại da'],
          ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Vitamin E'],
          volume: {
            value: 50,
            unit: 'ml'
          },
          madeIn: 'Hàn Quốc'
        },
        flags: {
          isBestSeller: false,
          isNew: true,
          isOnSale: true,
          hasGifts: false
        },
        createdAt: '2023-04-01T10:00:00Z',
        updatedAt: '2023-05-10T15:30:00Z'
      },
      {
        id: 'PRD-006',
        name: 'Son môi Yumin màu đỏ',
        sku: 'SKU-006',
        image: 'https://via.placeholder.com/300',
        price: 180000,
        description: {
          short: 'Son lì mềm mịn, bền màu',
          full: 'Son môi Yumin màu đỏ mang đến đôi môi quyến rũ với màu sắc tươi tắn, công thức dưỡng ẩm và bền màu suốt ngày dài.'
        },
        category: 'Trang điểm',
        categoryIds: ['2'],
        brandId: '1',
        brand: 'Yumin',
        inventory: [
          { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 0 },
          { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 0 },
          { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
        ],
        stock: 0,
        status: 'discontinued',
        tags: ['son môi', 'trang điểm', 'màu đỏ'],
        cosmetic_info: {
          skinType: ['Mọi loại da'],
          ingredients: ['Shea Butter', 'Vitamin E', 'Jojoba Oil'],
          volume: {
            value: 4,
            unit: 'g'
          },
          madeIn: 'Hàn Quốc'
        },
        flags: {
          isBestSeller: false,
          isNew: false,
          isOnSale: false,
          hasGifts: false
        },
        createdAt: '2023-03-01T10:00:00Z',
        updatedAt: '2023-04-10T15:30:00Z'
      },
      {
        id: 'PRD-007',
        name: 'Sữa rửa mặt Yumin',
        sku: 'SKU-007',
        image: 'https://via.placeholder.com/300',
        price: 250000,
        description: {
          short: 'Sữa rửa mặt làm sạch sâu',
          full: 'Sữa rửa mặt Yumin giúp làm sạch sâu, loại bỏ bụi bẩn và dầu thừa, để lại làn da sạch mịn và tươi mát.'
        },
      },{
        id: 'PRD-008',
        name: 'Sữa rửa mặt Yumin',
        sku: 'SKU-008',
        image: 'https://via.placeholder.com/300',
        price: 250000,
        description: {
          short: 'Sữa rửa mặt làm sạch sâu',
          full: 'Sữa rửa mặt Yumin giúp làm sạch sâu, loại bỏ bụi bẩn và dầu thừa, để lại làn da sạch mịn và tươi mát.'
        },
      }
    ];

    // Tìm sản phẩm theo ID
    return sampleProducts.find(p => p.id === id) || null;
  };

  const handleEdit = (id: string) => {
    // Lấy thông tin sản phẩm
    console.log('Đang mở modal sửa sản phẩm với ID:', id);
    const product = getProductById(id);
    if (product) {
      console.log('Đã tìm thấy sản phẩm:', product);
      setSelectedProduct(product);
      setShowEditProductModal(true);
      toast.success(`Đang sửa sản phẩm: ${product.name}`, {
        duration: 2000,
        icon: <FiEdit className="text-blue-500" />
      });
    } else {
      console.error('Không tìm thấy sản phẩm với ID:', id);
      toast.error('Không tìm thấy thông tin sản phẩm!', {
        duration: 3000
      });
    }
  };

  const handleView = (id: string) => {
    // Lấy thông tin sản phẩm
    console.log('Đang mở modal xem sản phẩm với ID:', id);
    const product = getProductById(id);
    if (product) {
      console.log('Đã tìm thấy sản phẩm:', product);
      setSelectedProduct(product);
      setShowProductDetailModal(true);
      toast.success(`Đang xem sản phẩm: ${product.name}`, {
        duration: 2000,
        icon: <FiEye className="text-gray-500" />
      });
    } else {
      console.error('Không tìm thấy sản phẩm với ID:', id);
      toast.error('Không tìm thấy thông tin sản phẩm!', {
        duration: 3000
      });
    }
  };

  const handleDelete = (id: string) => {
    // Kiểm tra xem sản phẩm có tồn tại không
    console.log('Đang yêu cầu xóa sản phẩm với ID:', id);
    const product = getProductById(id);
    
    if (product) {
      console.log('Đã tìm thấy sản phẩm sẽ xóa:', product);
      // Hiển thị modal xác nhận xóa
      setProductToDelete(id);
      setSelectedProduct(product);
      setShowDeleteModal(true);
    } else {
      console.error('Không tìm thấy sản phẩm với ID:', id);
      toast.error('Không tìm thấy thông tin sản phẩm để xóa!', {
        duration: 3000
      });
    }
  };

  const confirmDelete = () => {
    // Xử lý xóa sản phẩm
    console.log(`Đã xóa sản phẩm ${productToDelete}`);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang xóa sản phẩm...');
    
    try {
      // Trong thực tế sẽ gọi API để xóa sản phẩm
      // API call goes here...
      
      // Mô phỏng delay của API call
      setTimeout(() => {
        // Cập nhật dữ liệu sau khi xóa (tùy thuộc vào API thực tế)
        // setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete));
        
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success('Đã xóa sản phẩm thành công!', {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        // Đóng modal
        setShowDeleteModal(false);
        setProductToDelete(null);
      }, 1000);
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

  const handleSaveNewProduct = (newProduct: any) => {
    console.log('Thêm sản phẩm mới:', newProduct);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang thêm sản phẩm mới...');
    
    try {
      // Trong thực tế sẽ gọi API để thêm sản phẩm mới
      // API call goes here...
      
      // Mô phỏng delay của API call
      setTimeout(() => {
        // Sau đó cập nhật danh sách sản phẩm
        // setProducts(prevProducts => [...prevProducts, newProduct]);
        
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success('Thêm sản phẩm mới thành công!', {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        // Đóng modal
        setShowAddProductModal(false);
      }, 1000);
    } catch (error) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi thêm sản phẩm!', {
        duration: 3000
      });
    }
  };

  const handleUpdateProduct = (updatedProduct: any) => {
    console.log('Cập nhật sản phẩm:', updatedProduct);
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading('Đang cập nhật sản phẩm...');
    
    try {
      // Trong thực tế sẽ gọi API để cập nhật sản phẩm
      // API call goes here...
      
      // Mô phỏng delay của API call
      setTimeout(() => {
        // Sau đó cập nhật danh sách sản phẩm
        // setProducts(prevProducts => prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success('Cập nhật sản phẩm thành công!', {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        // Đóng modal
        setShowEditProductModal(false);
      }, 1000);
    } catch (error) {
      // Xử lý lỗi
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi cập nhật sản phẩm!', {
        duration: 3000
      });
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
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    
    // Thông báo xác nhận
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) {
      // Hiển thị thông báo đang xử lý
      const loadingToast = toast.loading(`Đang xóa ${selectedProducts.length} sản phẩm...`);
      
      try {
        // Trong thực tế sẽ gọi API để xóa sản phẩm
        // Mock API call với timeout
        setTimeout(() => {
          // Thông báo thành công
          toast.dismiss(loadingToast);
          toast.success(`Đã xóa ${selectedProducts.length} sản phẩm thành công!`, {
            duration: 3000,
            icon: <FiCheck className="text-green-500" />
          });
          
          // Clear selection và reload dữ liệu
          clearSelectedProducts();
          fetchProducts();
        }, 1000);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Có lỗi xảy ra khi xóa sản phẩm!', {
          duration: 3000
        });
      }
    }
  };

  // Xử lý thay đổi trạng thái hàng loạt
  const handleBulkSetStatus = (status: ProductStatus) => {
    if (selectedProducts.length === 0) return;
    
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading(`Đang cập nhật trạng thái cho ${selectedProducts.length} sản phẩm...`);
    
    try {
      // Trong thực tế sẽ gọi API để cập nhật trạng thái
      // Mock API call với timeout
      setTimeout(() => {
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success(`Đã cập nhật trạng thái cho ${selectedProducts.length} sản phẩm thành công!`, {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        // Reload dữ liệu
        fetchProducts();
      }, 1000);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái sản phẩm!', {
        duration: 3000
      });
    }
  };

  // Xử lý thay đổi flag hàng loạt
  const handleBulkSetFlag = (flag: string, value: boolean) => {
    if (selectedProducts.length === 0) return;
    
    // Hiển thị thông báo đang xử lý
    const loadingToast = toast.loading(`Đang cập nhật nhãn cho ${selectedProducts.length} sản phẩm...`);
    
    try {
      // Trong thực tế sẽ gọi API để cập nhật flag
      // Mock API call với timeout
      setTimeout(() => {
        // Thông báo thành công
        toast.dismiss(loadingToast);
        toast.success(`Đã cập nhật nhãn cho ${selectedProducts.length} sản phẩm thành công!`, {
          duration: 3000,
          icon: <FiCheck className="text-green-500" />
        });
        
        // Reload dữ liệu
        fetchProducts();
      }, 1000);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Có lỗi xảy ra khi cập nhật nhãn sản phẩm!', {
        duration: 3000
      });
    }
  };

  // Xử lý nhân bản sản phẩm
  const handleDuplicate = (id: string) => {
    // Lấy thông tin sản phẩm
    console.log('Đang nhân bản sản phẩm với ID:', id);
    const product = getProductById(id);
    
    if (product) {
      // Tạo phiên bản copy của sản phẩm
      const duplicatedProduct = {
        ...product,
        id: `COPY-${product.id}`,
        name: `Bản sao - ${product.name}`,
        sku: `COPY-${product.sku}`
      };
      
      console.log('Sản phẩm sau khi nhân bản:', duplicatedProduct);
      setSelectedProduct(duplicatedProduct);
      setShowAddProductModal(true);
      
      toast.success(`Đang tạo bản sao của sản phẩm: ${product.name}`, {
        duration: 2000,
        icon: <FiCheck className="text-blue-500" />
      });
    } else {
      console.error('Không tìm thấy sản phẩm với ID:', id);
      toast.error('Không tìm thấy thông tin sản phẩm!', {
        duration: 3000
      });
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