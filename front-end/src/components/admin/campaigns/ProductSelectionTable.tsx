import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiPlus, FiCheck, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Image from 'next/image';
import { CampaignProduct } from '@/contexts/CampaignContext'; // Đã import đúng
import { useProduct } from '@/contexts/ProductContext'; // Thêm context Product
import { useBrands } from '@/contexts/BrandContext'; // Thêm context Brand
import { useCategory } from '@/contexts/CategoryContext'; // Thêm context Category
import { toast } from 'react-hot-toast'; // Thêm toast
import Pagination from '@/components/admin/common/Pagination'; // Import component Pagination

// Định nghĩa interface cho sản phẩm từ API (tương tự EventProductAddModal)
interface ProductFromApi {
  _id?: string;
  id?: string; // Giữ lại id nếu API ProductContext trả về id
  name: string;
  image: string; // URL ảnh chính
  images?: Array<{url: string, alt: string, isPrimary?: boolean}>; // Thêm mảng images
  price: number | string;
  currentPrice?: number | string;
  originalPrice?: number | string; // Giá gốc (có thể là price hoặc originalPrice tùy API)
  brandId?: string;
  brand?: string | { _id: string, name: string }; // Brand có thể là string hoặc object
  status?: string;
  sku?: string;
  categoryIds?: string[];
  categories?: Array<{ _id: string, name: string }>; // Categories có thể là mảng object
  // Thêm variants nếu API trả về
  variants?: Array<{
    id?: string; // ID của variant
    _id?: string;
    sku: string;
    name: string; // Tên variant (vd: 50ml, Red)
    price: number; // Giá của variant
    originalPrice?: number; // Giá gốc của variant nếu có
    stock?: number;
    image?: string; // Ảnh riêng của variant nếu có
  }>;
}

// Interface cho bộ lọc sản phẩm (tương tự EventProductAddModal)
interface ProductFilter {
  brandId?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Thêm định nghĩa cho tham số fetchAdminProductList (từ ProductContext)
interface AdminProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  // Thêm các flags nếu cần lọc
  // isBestSeller?: boolean;
  // isNew?: boolean;
  // isOnSale?: boolean;
  // hasGifts?: boolean;
}


interface ProductSelectionTableProps {
  isOpen: boolean; // Thêm prop isOpen để biết khi nào modal mở
  onClose: () => void;
  onAddProducts: (products: CampaignProduct[]) => void;
  initialSelectedProducts: CampaignProduct[]; // Đổi tên để rõ ràng hơn
}

const ProductSelectionTable: React.FC<ProductSelectionTableProps> = ({
  isOpen,
  onClose,
  onAddProducts,
  initialSelectedProducts = []
}) => {
  // Sử dụng Contexts
  const { fetchAdminProductList, error: productError } = useProduct();
  const { brands, fetchBrands } = useBrands(); // Lấy brands và hàm fetchBrands
  const { categories, fetchCategories } = useCategory(); // Lấy categories và hàm fetchCategories

  // States
  const [products, setProducts] = useState<ProductFromApi[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Thêm state để lưu tổng số sản phẩm
  const [tempSelectedProducts, setTempSelectedProducts] = useState<CampaignProduct[]>([]);
  const [loading, setLoading] = useState(false); // State loading riêng cho component này
  const [error, setError] = useState<string | null>(null);

  // State cho filter nâng cao
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [brandsList, setBrandsList] = useState<{id: string, name: string}[]>([]);
  const [categoriesList, setCategoriesList] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState<ProductFilter>({
    status: 'active', // Mặc định lấy sản phẩm active
  });
  const [tempFilters, setTempFilters] = useState<ProductFilter>({
    status: 'active',
  });

  // Cập nhật danh sách brandsList và categoriesList từ context
  useEffect(() => {
    if (brands && brands.length > 0) {
      const brandItems = brands.map(brand => ({
        id: brand.id || '', // Đảm bảo id là string và không null
        name: brand.name
      }));
      setBrandsList(brandItems);
    } else if (isOpen) {
      // Tải brands nếu chưa có khi modal mở
      fetchBrands(1, 100); // Tải tối đa 100 brands
    }
  }, [brands, isOpen, fetchBrands]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      // Lọc chỉ lấy category cha (level 0 hoặc 1 tùy cấu trúc) hoặc tất cả nếu cần
      const categoryItems = categories
        // .filter(cat => cat.level <= 1) // Ví dụ: chỉ lấy level 0 và 1
        .map(category => ({
          id: category._id || '', // Đảm bảo id là string và không null
          name: category.name
        }));
      setCategoriesList(categoryItems);
    } else if (isOpen) {
      // Tải categories nếu chưa có khi modal mở
      fetchCategories(1, 100); // Tải tối đa 100 categories
    }
  }, [categories, isOpen, fetchCategories]);

  // Reset state và tải lại selected products khi modal mở/đóng hoặc initialSelectedProducts thay đổi
  useEffect(() => {
    if (isOpen) {
      setTempSelectedProducts(initialSelectedProducts);
      setSearchTerm('');
      setFilters({ status: 'active' });
      setTempFilters({ status: 'active' });
      setPage(1);
      setShowAdvancedFilters(false);
      // Fetch products sẽ được trigger bởi useEffect bên dưới khi page=1 và filters được set
    } else {
      // Reset khi đóng modal (tùy chọn)
      // setProducts([]);
      // setTotalPages(1);
      // setError(null);
    }
  }, [isOpen, initialSelectedProducts]);


  // Hàm lấy danh sách sản phẩm từ API
  const fetchProductsCallback = useCallback(async () => {
    // Chỉ fetch khi modal đang mở
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    const params: AdminProductListParams = {
      page: page,
      limit: 10, // Số lượng sản phẩm mỗi trang
      search: searchTerm,
      status: filters.status || 'active',
      brandId: filters.brandId,
      categoryId: filters.categoryId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: 'name', // Sắp xếp theo tên (tùy chọn)
      sortOrder: 'asc',
    };

    try {
      console.log('Fetching products with params:', params);
      const result = await fetchAdminProductList(params);
      console.log('API Result:', result);

      if (result && result.products) {
        // Chuẩn hóa dữ liệu trả về nếu cần
        const formattedProducts = result.products.map(p => ({
            ...p,
            _id: p.id, // Sử dụng p.id thay vì p._id hoặc p.id || p._id
            // Lấy ảnh chính từ p.image
            image: p.image || 'https://via.placeholder.com/50',
            // Chuẩn hóa giá về number
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            originalPrice: p.originalPrice !== undefined
                ? (typeof p.originalPrice === 'string' ? parseFloat(p.originalPrice) : p.originalPrice)
                : (typeof p.price === 'string' ? parseFloat(p.price) : p.price),
            // Giả sử brand là string trả về từ API product
            brand: p.brand || 'N/A',
            // Bỏ qua categories nếu không có sẵn hoặc không cần thiết
            // categories: p.categories?.map(c => c.name).join(', ')
        }));

        setProducts(formattedProducts);
        setTotalPages(result.totalPages);
        setTotalItems(result.total || 0); // Lưu tổng số sản phẩm
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0); // Reset tổng số sản phẩm
        // Có thể setError nếu result không như mong đợi ngay cả khi không có lỗi API
        // setError("Không tìm thấy sản phẩm.");
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err?.response?.data?.message || productError || 'Không thể tải danh sách sản phẩm.';
      setError(errorMessage);
      toast.error(`Lỗi tải sản phẩm: ${errorMessage}`);
      setProducts([]); // Xóa sản phẩm cũ khi có lỗi
      setTotalPages(1);
      setTotalItems(0); // Reset tổng số sản phẩm
    } finally {
      setLoading(false);
    }
  }, [isOpen, fetchAdminProductList, page, searchTerm, filters, productError]); // Thêm productError vào dependencies

  // Effect for fetching data
  useEffect(() => {
    fetchProductsCallback();
  }, [fetchProductsCallback]); // fetchProductsCallback đã bao gồm dependencies cần thiết


  // Tìm kiếm sản phẩm
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset về trang 1 khi tìm kiếm
  };

  // Xử lý thay đổi filter tạm thời
  const handleFilterChange = (name: keyof ProductFilter, value: any) => {
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };

  // Áp dụng filter
  const applyFilters = () => {
    setFilters(tempFilters);
    setPage(1); // Reset về trang 1 khi áp dụng filter
    setShowAdvancedFilters(false); // Đóng modal filter
  };

  // Xóa filter
  const clearFilters = () => {
    const defaultFilters = { status: 'active' };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setPage(1);
    setShowAdvancedFilters(false);
  };


  // Kiểm tra sản phẩm/variant đã được chọn chưa
  const isProductSelected = (productId: string, variantId?: string) => {
    // Nếu sản phẩm không có variant (hoặc không quản lý variant), chỉ kiểm tra productId
    if (!variantId) {
      return tempSelectedProducts.some(p => p.productId === productId && !p.variantId);
    }
    // Nếu có variant, kiểm tra cả hai
    return tempSelectedProducts.some(
      p => p.productId === productId && p.variantId === variantId
    );
  };

  // Thêm/Xóa sản phẩm/variant khỏi danh sách tạm thời
  const handleSelectProduct = (product: ProductFromApi, variant?: any) => {
    const productId = product._id || ''; // Sử dụng _id đã chuẩn hóa
    const variantId = variant?._id || variant?.id;
    const selected = isProductSelected(productId, variantId);

    let productToAddOrRemove: CampaignProduct;

    if (variant) {
      // Trường hợp có variant
      const variantPrice = typeof variant.price === 'number' ? variant.price : 0;
      const variantOriginalPrice = typeof variant.originalPrice === 'number' ? variant.originalPrice : variantPrice;
      const productOriginalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : (typeof product.price === 'number' ? product.price : 0);

      productToAddOrRemove = {
        productId: productId,
        productName: product.name,
        variantId: variantId,
        variantName: variant.name,
        // Lấy giá gốc của variant nếu có, fallback về giá gốc sản phẩm
        originalPrice: variantOriginalPrice || productOriginalPrice,
        // Giá điều chỉnh ban đầu có thể bằng giá gốc
        adjustedPrice: variantOriginalPrice || productOriginalPrice,
        image: variant.image || product.image // Ưu tiên ảnh variant
      };
    } else {
      // Trường hợp không có variant (hoặc không chọn variant cụ thể)
      const productPrice = typeof product.price === 'number' ? product.price : 0;
      const productOriginalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : productPrice;

      productToAddOrRemove = {
        productId: productId,
        productName: product.name,
        // variantId và variantName là undefined
        originalPrice: productOriginalPrice,
        adjustedPrice: productOriginalPrice,
        image: product.image
      };
    }


    if (selected) {
      // Nếu đã chọn rồi thì xóa khỏi danh sách
      setTempSelectedProducts(prev =>
        prev.filter(p => !(p.productId === productId && p.variantId === variantId))
      );
    } else {
      // Nếu chưa chọn thì thêm vào danh sách
      // Kiểm tra xem sản phẩm (không có variant) đã tồn tại chưa nếu đang thêm variant
       if (variantId && tempSelectedProducts.some(p => p.productId === productId && !p.variantId)) {
         // Nếu sản phẩm gốc đã được chọn, xóa nó đi trước khi thêm variant
         setTempSelectedProducts(prev => [
           ...prev.filter(p => !(p.productId === productId && !p.variantId)),
           productToAddOrRemove
         ]);
       } else if (!variantId && tempSelectedProducts.some(p => p.productId === productId && p.variantId)) {
           // Nếu đang thêm sản phẩm gốc mà đã có variant được chọn, xóa các variant đó đi
            setTempSelectedProducts(prev => [
                ...prev.filter(p => p.productId !== productId),
                productToAddOrRemove
            ]);
       }
       else {
           setTempSelectedProducts(prev => [...prev, productToAddOrRemove]);
       }
    }
  };


  // Xác nhận thêm sản phẩm
  const handleConfirm = () => {
    // Gọi callback để thêm sản phẩm
    onAddProducts(tempSelectedProducts);

    // Không reset state ngay lập tức
    // setTempSelectedProducts([]);

    // Đóng modal chọn sản phẩm
    onClose();
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    // Ngăn chặn sự kiện submit form
    // Không cần e.preventDefault() vì hàm này được gọi từ Pagination component
    console.log('Chuyển đến trang:', newPage);

    // Tránh việc gọi API liên tục khi đang ở cùng trang
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  // Định dạng giá tiền
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return 'N/A';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'N/A';
    return numericPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };


  // Danh sách danh mục (giờ đã lấy từ context)
  // const categories = ['Skin Care', 'Sun Care', 'Cleansers', 'Toners', 'Masks'];


  // ---- RENDER ----
  if (!isOpen) return null; // Không render nếu modal đóng

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-6xl mx-auto z-50 flex flex-col h-[90vh]"
        onClick={(e) => {
          // Ngăn chặn sự kiện lan truyền đến form cha
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            Chọn sản phẩm cho chiến dịch
          </h3>
          <button
            type="button"
            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 p-1"
            onClick={(e) => {
              e.preventDefault(); // Ngăn chặn sự kiện mặc định
              e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
              onClose();
            }}
          >
            <span className="sr-only">Đóng</span>
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-grow overflow-hidden flex flex-col">
          <p className="text-sm text-gray-500 mb-4 flex-shrink-0">
            Tìm kiếm, lọc và chọn các sản phẩm hoặc biến thể sản phẩm để thêm vào chiến dịch. Bạn có thể điều chỉnh giá sau khi thêm.
          </p>

          {/* Search and Filter Bar - Đồng bộ giao diện từ EventProductAddModal */}
          <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FiSearch className="h-5 w-5 text-gray-400" />
                 </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, SKU..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Filter Button - Thay đổi class và vị trí */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 flex items-center text-sm"
              >
                <FiFilter className="mr-1 h-4 w-4" />
                <span>Lọc nâng cao</span>
                {showAdvancedFilters ? <FiChevronUp className="ml-1 h-4 w-4" /> : <FiChevronDown className="ml-1 h-4 w-4" />}
              </button>
            </div>

             {/* Advanced Filters Popup - Cập nhật layout và class */}
             {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 {/* Brand Filter */}
                 <div>
                   <label htmlFor="brandFilter" className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                   <select
                     id="brandFilter"
                     name="brandId"
                     value={tempFilters.brandId || ''}
                     onChange={(e) => handleFilterChange('brandId', e.target.value || undefined)}
                     className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                   >
                     <option value="">Tất cả thương hiệu</option>
                     {brandsList.map((brand) => (
                       <option key={brand.id} value={brand.id}>{brand.name}</option>
                     ))}
                   </select>
                 </div>
                 {/* Category Filter */}
                 <div>
                   <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                   <select
                     id="categoryFilter"
                     name="categoryId"
                     value={tempFilters.categoryId || ''}
                     onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                     className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                   >
                     <option value="">Tất cả danh mục</option>
                     {categoriesList.map((category) => (
                       <option key={category.id} value={category.id}>{category.name}</option>
                     ))}
                   </select>
                 </div>
                 {/* Status Filter */}
                 <div>
                   <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                   <select
                     id="statusFilter"
                     name="status"
                     value={tempFilters.status || 'active'}
                     onChange={(e) => handleFilterChange('status', e.target.value)}
                     className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                   >
                     <option value="active">Đang hoạt động</option>
                     <option value="inactive">Ngừng hoạt động</option>
                     <option value="draft">Bản nháp</option>
                     <option value="">Tất cả</option>
                   </select>
                 </div>
                 {/* Price Range Filter */}
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <label htmlFor="minPriceFilter" className="block text-sm font-medium text-gray-700 mb-1">Giá từ</label>
                     <input
                       type="number"
                       id="minPriceFilter"
                       name="minPrice"
                       placeholder="0đ"
                       value={tempFilters.minPrice?.toString() || ''}
                       onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                       className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                     />
                   </div>
                   <div>
                     <label htmlFor="maxPriceFilter" className="block text-sm font-medium text-gray-700 mb-1">Đến</label>
                     <input
                       type="number"
                       id="maxPriceFilter"
                       name="maxPrice"
                       placeholder="1,000,000đ"
                       value={tempFilters.maxPrice?.toString() || ''}
                       onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                       className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                     />
                   </div>
                 </div>
                 {/* Filter Actions - Cập nhật class nút */}
                 <div className="col-span-full flex justify-end space-x-2 mt-2">
                   <button
                     type="button"
                     onClick={clearFilters}
                     className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                   >
                     Xóa bộ lọc
                   </button>
                   <button
                     type="button"
                     onClick={applyFilters}
                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                   >
                     Áp dụng
                   </button>
                 </div>
               </div>
             )}
           </div>

          {/* Loading and Error State */}
          {loading && (
            <div className="text-center py-10 flex-grow flex items-center justify-center">
              <p>Đang tải sản phẩm...</p>
              {/* Optionally add a spinner */}
            </div>
          )}
          {error && !loading && (
             <div className="text-center py-10 flex-grow flex items-center justify-center text-red-600">
               <p>Lỗi: {error}</p>
             </div>
           )}

          {/* Product Table */}
          {!loading && !error && (
            <div className="flex-grow overflow-hidden border border-gray-200 rounded-md">
              <div className="h-full overflow-y-auto">
                <table className="w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Sản phẩm</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Biến thể / SKU</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Giá gốc</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Thương hiệu</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Chọn</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="text-center py-10 text-gray-500">Không tìm thấy sản phẩm phù hợp.</td>
                       </tr>
                     ) : (
                       products.map((product) => (
                        // Nếu API trả về variants, lặp qua variants. Nếu không, hiển thị product chính.
                        (product.variants && product.variants.length > 0) ? (
                          product.variants.map((variant, index) => {
                            const currentVariantId = variant._id || variant.id;
                            const isSelected = isProductSelected(product._id || '', currentVariantId);
                            return (
                             <tr key={`${product._id}-${currentVariantId || index}`} className={`${isSelected ? 'bg-pink-50' : ''} hover:bg-gray-50`}>
                               {/* Chỉ hiển thị thông tin sản phẩm ở dòng đầu tiên của variants */}
                               {index === 0 ? (
                                <td className={`px-4 py-3 align-top ${product.variants && product.variants.length > 1 ? `row-span-${product.variants.length}` : ''}`}>
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 h-12 w-12">
                                      <Image
                                        src={product.image || 'https://via.placeholder.com/50'}
                                        alt={product.name}
                                        width={48}
                                        height={48}
                                        className="rounded-md object-cover"
                                        unoptimized // Bỏ qua tối ưu hóa Next.js nếu URL từ Cloudinary
                                      />
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-xs text-gray-500">ID: {product._id}</div>
                                      {/* Có thể thêm description ngắn nếu cần */}
                                    </div>
                                  </div>
                                </td>
                              ) : (
                                // Các dòng variant sau chỉ cần ô trống hoặc border
                                <td className="px-4 py-3 border-t border-gray-200"></td>
                              )}
                              {/* Thông tin Variant */}
                              <td className="px-4 py-3 text-sm text-gray-700 align-top">
                                <div>{variant.name}</div>
                                <div className="text-xs text-gray-500">SKU: {variant.sku || 'N/A'}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 align-top">{formatPrice(variant.originalPrice ?? variant.price)}</td>
                              {/* Chỉ hiển thị thương hiệu ở dòng đầu tiên */}
                              {index === 0 ? (
                                 <td className={`px-4 py-3 text-sm text-gray-500 align-top ${product.variants && product.variants.length > 1 ? `row-span-${product.variants.length}` : ''}`}>
                                   {typeof product.brand === 'object' ? product.brand.name : product.brand}
                                  </td>
                              ) : (
                                  <td className="px-4 py-3 border-t border-gray-200"></td>
                              )}
                              {/* Nút chọn Variant */}
                              <td className="px-4 py-3 text-center align-top">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault(); // Ngăn chặn sự kiện mặc định
                                    e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
                                    handleSelectProduct(product, variant);
                                  }}
                                  type="button" // Đảm bảo nút không submit form
                                  className={`p-1.5 rounded-full transition-colors duration-150 ${
                                    isSelected
                                      ? 'bg-pink-500 text-white hover:bg-pink-600'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  aria-label={isSelected ? 'Bỏ chọn' : 'Chọn'}
                                >
                                  {isSelected ? <FiCheck size={14} /> : <FiPlus size={14} />}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                        ) : (
                          // Trường hợp sản phẩm không có variants
                          <tr key={product._id} className={`${isProductSelected(product._id || '') ? 'bg-pink-50' : ''} hover:bg-gray-50`}>
                             <td className="px-4 py-3">
                               <div className="flex items-center">
                                 <div className="flex-shrink-0 h-12 w-12">
                                   <Image
                                     src={product.image || 'https://via.placeholder.com/50'}
                                     alt={product.name}
                                     width={48}
                                     height={48}
                                     className="rounded-md object-cover"
                                     unoptimized
                                   />
                                 </div>
                                 <div className="ml-3">
                                   <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    <div className="text-xs text-gray-500">ID: {product._id}</div>
                                    <div className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</div>
                                 </div>
                               </div>
                             </td>
                             <td className="px-4 py-3 text-sm text-gray-500 italic">Sản phẩm gốc</td>
                             <td className="px-4 py-3 text-sm text-gray-500">{formatPrice(product.originalPrice ?? product.price)}</td>
                             <td className="px-4 py-3 text-sm text-gray-500">
                                {typeof product.brand === 'object' ? product.brand.name : product.brand}
                             </td>
                             <td className="px-4 py-3 text-center">
                               <button
                                 onClick={(e) => {
                                   e.preventDefault(); // Ngăn chặn sự kiện mặc định
                                   e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
                                   handleSelectProduct(product, undefined);
                                 }}
                                 type="button" // Đảm bảo nút không submit form
                                 className={`p-1.5 rounded-full transition-colors duration-150 ${
                                    isProductSelected(product._id || '')
                                      ? 'bg-pink-500 text-white hover:bg-pink-600'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                   aria-label={isProductSelected(product._id || '') ? 'Bỏ chọn' : 'Chọn'}
                                >
                                  {isProductSelected(product._id || '') ? <FiCheck size={14} /> : <FiPlus size={14} />}
                                </button>
                             </td>
                           </tr>
                        )
                       ))
                     )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


           {/* Footer with Pagination and Actions */}
            <div className="mt-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-3">
             {/* Pagination */}
             {!loading && !error && totalPages > 0 && (
               <div className="mb-3 sm:mb-0" onClick={(e) => {
                 // Ngăn chặn sự kiện lan truyền đến form
                 e.preventDefault();
                 e.stopPropagation();
               }}>
                 <div onClick={(e) => {
                   // Ngăn chặn sự kiện lan truyền đến form
                   e.preventDefault();
                   e.stopPropagation();
                 }}>
                   <Pagination
                     currentPage={page}
                     totalPages={totalPages}
                     onPageChange={handlePageChange}
                     totalItems={totalItems}
                     itemsPerPage={10}
                     showItemsInfo={true}
                     maxVisiblePages={5}
                   />
                 </div>
               </div>
             )}
             <div className="sm:ml-auto flex items-center space-x-3">
               <span className="text-sm text-gray-600">
                 Đã chọn: {tempSelectedProducts.length} sản phẩm/biến thể
               </span>
               <button
                 type="button"
                 onClick={(e) => {
                   e.preventDefault(); // Ngăn chặn sự kiện mặc định
                   e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
                   onClose();
                 }}
                 className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
               >
                 Hủy
               </button>
               <button
                 type="button"
                 onClick={(e) => {
                   e.preventDefault(); // Ngăn chặn sự kiện mặc định
                   e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
                   handleConfirm();
                 }}
                 disabled={tempSelectedProducts.length === 0 || loading}
                 className="px-4 py-2 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Thêm sản phẩm đã chọn
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionTable;
