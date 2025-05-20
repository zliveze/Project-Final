import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiPlus, FiCheck, FiFilter, FiChevronDown, FiChevronUp, FiAlertCircle } from 'react-icons/fi';
import Image from 'next/image';
import { ProductInCampaign, VariantInCampaign, CombinationInCampaign } from '@/contexts/CampaignContext';
import { useProduct } from '@/contexts/ProductContext';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { toast } from 'react-hot-toast';
import Pagination from '@/components/admin/common/Pagination';
import useProductPromotionCheck from '@/hooks/useProductPromotionCheck';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ProductFromApiVariantCombination {
  id?: string;
  _id?: string;
  combinationId?: string;
  attributes: Record<string, string>;
  price?: number;
  originalPrice?: number;
  additionalPrice?: number;
}

interface ProductFromApiVariant {
  id?: string;
  _id?: string;
  variantId?: string;
  sku?: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  image?: string;
  images?: Array<{ url: string; alt: string; isPrimary?: boolean }>;
  options?: Record<string, string>;
  combinations?: ProductFromApiVariantCombination[];
}
interface ProductFromApi {
  _id?: string;
  id?: string;
  name: string;
  image: string;
  images?: Array<{ url: string; alt: string; isPrimary?: boolean }>;
  price: number | string;
  currentPrice?: number | string;
  originalPrice?: number | string;
  brandId?: string;
  brand?: string | { _id: string; name: string };
  status?: string;
  sku?: string;
  categoryIds?: string[];
  categories?: Array<{ _id: string; name: string }>;
  variants?: ProductFromApiVariant[];
}

interface ProductFilter {
  brandId?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

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
}

interface ProductSelectionTableProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: ProductInCampaign[]) => void;
  initialSelectedProducts: ProductInCampaign[];
}

const ProductSelectionTable: React.FC<ProductSelectionTableProps> = ({
  isOpen,
  onClose,
  onAddProducts,
  initialSelectedProducts = [],
}) => {
  const { fetchAdminProductList } = useProduct();
  const { brands, fetchBrands } = useBrands();
  const { categories, fetchCategories } = useCategory();
  const { checkProducts } = useProductPromotionCheck();

  const [products, setProducts] = useState<ProductFromApi[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [tempSelectedProducts, setTempSelectedProducts] = useState<ProductInCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productsInEvent, setProductsInEvent] = useState<Map<string, string>>(new Map());

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [brandsList, setBrandsList] = useState<{ id: string; name: string }[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<ProductFilter>({ status: 'active' });
  const [tempFilters, setTempFilters] = useState<ProductFilter>({ status: 'active' });

  useEffect(() => {
    if (brands && brands.length > 0) {
      setBrandsList(brands.map(brand => ({ id: brand.id || '', name: brand.name })));
    } else if (isOpen) {
      fetchBrands(1, 100);
    }
  }, [brands, isOpen, fetchBrands]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories.map(category => ({ id: category._id || '', name: category.name })));
    } else if (isOpen) {
      fetchCategories(1, 100);
    }
  }, [categories, isOpen, fetchCategories]);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedProducts(initialSelectedProducts);
      setSearchTerm('');
      setFilters({ status: 'active' });
      setTempFilters({ status: 'active' });
      setPage(1);
      setShowAdvancedFilters(false);
    }
  }, [isOpen, initialSelectedProducts]);

  const fetchProductsCallback = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    const params: AdminProductListParams = {
      page, limit: 10, search: searchTerm, status: filters.status || 'active',
      brandId: filters.brandId, categoryId: filters.categoryId,
      minPrice: filters.minPrice, maxPrice: filters.maxPrice,
      sortBy: 'name', sortOrder: 'asc',
    };
    try {
      const result = await fetchAdminProductList(params);
      if (result && result.products) {
        const fetchedProductIds = result.products.map(p => (p._id || p.id || '').toString()).filter(id => id);
        if (fetchedProductIds.length > 0) {
          const checkResults = await checkProducts(fetchedProductIds);
          const productEventMap = new Map<string, string>();
          if (Array.isArray(checkResults)) {
            checkResults.forEach(res => {
              if (res.inEvent) productEventMap.set(res.productId, res.eventName || 'Unknown Event');
            });
          }
          setProductsInEvent(productEventMap);
        }
        setProducts(result.products);
        setTotalItems(result.total);
        setTotalPages(Math.ceil(result.total / 10));
      } else {
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Lỗi khi tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, page, searchTerm, filters, fetchAdminProductList, checkProducts]);

  useEffect(() => {
    fetchProductsCallback();
  }, [fetchProductsCallback]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };
  const handleFilterChange = (name: keyof ProductFilter, value: any) => setTempFilters(prev => ({ ...prev, [name]: value }));
  const applyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    setShowAdvancedFilters(false);
  };
  const clearFilters = () => {
    const defaultFilters = { status: 'active' };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setPage(1);
    setShowAdvancedFilters(false);
  };

  const isProductSelected = (productId: string, variantId?: string) => {
    const productEntry = tempSelectedProducts.find(p => p.productId === productId);
    if (!productEntry) return false;
    if (!variantId) { // Checking if the base product (without specific variant) is selected
      return !productEntry.variants || productEntry.variants.length === 0;
    }
    return productEntry.variants?.some(v => v.variantId === variantId) || false;
  };

  const fetchProductDetails = async (productId: string): Promise<ProductFromApi | null> => {
    if (!productId) {
        toast.error("ID sản phẩm không hợp lệ để lấy chi tiết.");
        return null;
    }
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
        return null;
      }
      const response = await axios.get(`${API_URL}/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      toast.error(`Không thể lấy thông tin chi tiết sản phẩm ID: ${productId}`);
      console.error("fetchProductDetails error:", error);
      return null;
    }
  };

  const handleSelectProduct = async (productFromList: ProductFromApi, selectedVariantFromList?: ProductFromApiVariant) => {
    const productIdFromListItem = productFromList._id || productFromList.id;
    if (!productIdFromListItem) {
      toast.error("Sản phẩm trong danh sách không có ID hợp lệ.");
      console.warn("ProductFromList is missing _id and id:", productFromList);
      return;
    }

    const selectedVariantId = selectedVariantFromList?._id || selectedVariantFromList?.id || selectedVariantFromList?.variantId;
    const isCurrentlySelected = isProductSelected(productIdFromListItem, selectedVariantId);

    if (isCurrentlySelected) {
      if (selectedVariantId) {
        setTempSelectedProducts(prev =>
          prev.map(p => {
            if (p.productId === productIdFromListItem) {
              const updatedVariants = p.variants?.filter(v => v.variantId !== selectedVariantId);
              return { ...p, variants: updatedVariants?.length ? updatedVariants : undefined };
            }
            return p;
          }).filter(p => p.productId !== productIdFromListItem || (p.variants !== undefined && p.variants.length > 0))
        );
      } else {
        setTempSelectedProducts(prev => prev.filter(p => p.productId !== productIdFromListItem));
      }
      return;
    }

    setLoading(true);
    const productDetails = await fetchProductDetails(productIdFromListItem);
    setLoading(false);

    if (!productDetails) return;

    const definitiveProductId = productDetails._id || productDetails.id;
    if (!definitiveProductId) {
      toast.error("ID sản phẩm chi tiết không hợp lệ.");
      return;
    }

    const baseOriginalPrice = typeof productDetails.originalPrice === 'number' ? productDetails.originalPrice : (typeof productDetails.price === 'string' ? parseFloat(productDetails.price) : 0);
    let baseProductImage = productDetails.image || '';
    if (productDetails.images && productDetails.images.length > 0) {
      const primaryImg = productDetails.images.find(img => img.isPrimary);
      baseProductImage = primaryImg ? primaryImg.url : productDetails.images[0].url;
    }

    const campaignVariants: VariantInCampaign[] = [];

    // Logic to populate campaignVariants based on selection
    const variantsToProcess = selectedVariantId 
      ? productDetails.variants?.filter(v => (v._id || v.id || v.variantId) === selectedVariantId) 
      : productDetails.variants;

    (variantsToProcess || []).forEach((vDetail: ProductFromApiVariant) => {
      const vOriginalPrice = typeof vDetail.originalPrice === 'number' ? vDetail.originalPrice : (typeof vDetail.price === 'number' ? vDetail.price : 0);
      let vImage = vDetail.image || baseProductImage;
      if (vDetail.images && vDetail.images.length > 0) {
        const primaryVImg = vDetail.images.find(img => img.isPrimary);
        vImage = primaryVImg ? primaryVImg.url : vDetail.images[0].url;
      }
      campaignVariants.push({
        variantId: vDetail._id || vDetail.id || vDetail.variantId || '',
        variantName: vDetail.name || '',
        variantSku: vDetail.sku || '',
        variantAttributes: vDetail.options || {},
        variantPrice: vOriginalPrice,
        originalPrice: vOriginalPrice,
        adjustedPrice: vOriginalPrice,
        image: vImage,
        combinations: (vDetail.combinations || []).map((combo: ProductFromApiVariantCombination) => {
          const cOriginalPrice = typeof combo.originalPrice === 'number' ? combo.originalPrice : (typeof combo.price === 'number' ? combo.price : 0);
          return {
            combinationId: combo._id || combo.id || combo.combinationId || '',
            attributes: combo.attributes || {},
            combinationPrice: cOriginalPrice,
            originalPrice: cOriginalPrice,
            adjustedPrice: cOriginalPrice,
          };
        })
      });
    });
    
    const productToAdd: ProductInCampaign = {
      productId: definitiveProductId,
      name: productDetails.name, // Use name from productDetails
      image: baseProductImage,
      originalPrice: baseOriginalPrice,
      adjustedPrice: baseOriginalPrice,
      sku: productDetails.sku,
      status: productDetails.status,
      brandId: typeof productDetails.brand === 'object' ? productDetails.brand._id : productDetails.brandId,
      brand: typeof productDetails.brand === 'object' ? productDetails.brand.name : productDetails.brand,
      variants: campaignVariants.length > 0 ? campaignVariants : undefined,
    };

    setTempSelectedProducts(prev => {
      const existingProductIndex = prev.findIndex(p => p.productId === definitiveProductId);
      if (existingProductIndex >= 0) {
        const updatedProducts = [...prev];
        const existingProduct = { ...updatedProducts[existingProductIndex] };
        
        if (selectedVariantId) { // Adding/updating a specific variant
            const newVariantToAdd = productToAdd.variants ? productToAdd.variants[0] : undefined;
            if (newVariantToAdd) {
                existingProduct.variants = [
                    ...(existingProduct.variants?.filter(v => v.variantId !== selectedVariantId) || []),
                    newVariantToAdd
                ];
            }
        } else { // Adding/updating the base product (with all its variants)
            existingProduct.variants = productToAdd.variants; 
        }
        // Update other base product fields
        existingProduct.name = productToAdd.name;
        existingProduct.image = productToAdd.image;
        existingProduct.originalPrice = productToAdd.originalPrice;
        existingProduct.adjustedPrice = productToAdd.adjustedPrice;
        existingProduct.sku = productToAdd.sku;
        // ... etc.

        updatedProducts[existingProductIndex] = existingProduct;
        return updatedProducts;
      } else {
        return [...prev, productToAdd];
      }
    });
  };

  const handleConfirm = () => {
    console.log("[ProductSelectionTable] Confirming products:", JSON.stringify(tempSelectedProducts, null, 2));
    onAddProducts(tempSelectedProducts);
    onClose();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return 'N/A';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'N/A';
    return numericPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div
        className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-6xl mx-auto z-50 flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            Chọn sản phẩm cho chiến dịch
          </h3>
          <button
            type="button"
            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 p-1"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          >
            <span className="sr-only">Đóng</span>
            <FiX className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 flex-grow overflow-hidden flex flex-col">
          <p className="text-sm text-gray-500 mb-4 flex-shrink-0">
            Tìm kiếm, lọc và chọn các sản phẩm hoặc biến thể sản phẩm để thêm vào chiến dịch. Bạn có thể điều chỉnh giá sau khi thêm.
          </p>
          <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-3 items-center">
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
             {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
          {loading && (
            <div className="text-center py-10 flex-grow flex items-center justify-center">
              <p>Đang tải sản phẩm...</p>
            </div>
          )}
          {error && !loading && (
             <div className="text-center py-10 flex-grow flex items-center justify-center text-red-600">
               <p>Lỗi: {error}</p>
             </div>
           )}
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
                         <td colSpan={5} className="text-center py-10 text-gray-500">
                           <p>Không tìm thấy sản phẩm phù hợp.</p>
                         </td>
                       </tr>
                     ) : (
                       <>
                         {productsInEvent.size > 0 && (
                           <tr>
                             <td colSpan={5} className="px-4 py-3">
                               <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                 <div className="flex items-start">
                                   <FiAlertCircle className="text-yellow-500 mt-0.5 mr-2" />
                                   <div>
                                     <p className="text-sm text-yellow-700 font-medium">Lưu ý về sản phẩm</p>
                                     <p className="text-xs text-yellow-600 mt-1">
                                       Sản phẩm đã thuộc về Event sẽ được đánh dấu màu vàng trong danh sách.
                                       Bạn không thể thêm sản phẩm này vào Campaign khi nó đang thuộc về Event.
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             </td>
                           </tr>
                         )}
                         {products.map((product: ProductFromApi) => { 
                            const productId = product._id || product.id || '';
                            const isInEvent = productsInEvent.has(productId);

                            if (product.variants && product.variants.length > 0) {
                              return product.variants.map((variant: ProductFromApiVariant, index: number) => { 
                                const currentVariantId = variant._id || variant.id || variant.variantId;
                                const isSelected = isProductSelected(productId, currentVariantId);
                                return (
                                  <tr
                                    key={`${productId}-${currentVariantId || index}`}
                                    className={`${isSelected ? 'bg-pink-50' : ''} ${isInEvent ? 'bg-yellow-50' : ''} hover:bg-gray-50`}
                                  >
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
                                              unoptimized 
                                            />
                                          </div>
                                          <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-500">ID: {productId}</div>
                                            {isInEvent && (
                                              <div className="text-xs text-orange-500 mt-1">
                                                Đang thuộc về Event: {productsInEvent.get(productId)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    ) : (
                                      <td className="px-4 py-3 border-t border-gray-200"></td>
                                    )}
                                    <td className="px-4 py-3 text-sm text-gray-700 align-top">
                                      <div>{variant.name}</div>
                                      <div className="text-xs text-gray-500">SKU: {variant.sku || 'N/A'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 align-top">{formatPrice(variant.originalPrice ?? variant.price)}</td>
                                    {index === 0 ? (
                                      <td className={`px-4 py-3 text-sm text-gray-500 align-top ${product.variants && product.variants.length > 1 ? `row-span-${product.variants.length}` : ''}`}>
                                        {typeof product.brand === 'object' ? product.brand.name : product.brand}
                                      </td>
                                    ) : (
                                      <td className="px-4 py-3 border-t border-gray-200"></td>
                                    )}
                                    <td className="px-4 py-3 text-center align-top">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault(); 
                                          e.stopPropagation(); 
                                          if (!isInEvent) {
                                            handleSelectProduct(product, variant);
                                          } else {
                                            toast.error('Không thể thêm sản phẩm đang thuộc về Event');
                                          }
                                        }}
                                        disabled={isInEvent}
                                        type="button" 
                                        className={`p-1.5 rounded-full transition-colors duration-150 ${
                                          isInEvent
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isSelected
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
                              });
                            } else {
                              return (
                                <tr
                                  key={productId}
                                  className={`${isProductSelected(productId) ? 'bg-pink-50' : ''} ${isInEvent ? 'bg-yellow-50' : ''} hover:bg-gray-50`}
                                >
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
                                        <div className="text-xs text-gray-500">ID: {productId}</div>
                                        <div className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</div>
                                        {isInEvent && (
                                          <div className="text-xs text-orange-500 mt-1">
                                            Đang thuộc về Event: {productsInEvent.get(productId)}
                                          </div>
                                        )}
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
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!isInEvent) {
                                          handleSelectProduct(product, undefined);
                                        } else {
                                          toast.error('Không thể thêm sản phẩm đang thuộc về Event');
                                        }
                                      }}
                                      disabled={isInEvent}
                                      type="button"
                                      className={`p-1.5 rounded-full transition-colors duration-150 ${
                                        isInEvent
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : isProductSelected(productId)
                                            ? 'bg-pink-500 text-white hover:bg-pink-600'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                      aria-label={isProductSelected(productId) ? 'Bỏ chọn' : 'Chọn'}
                                    >
                                      {isProductSelected(productId) ? <FiCheck size={14} /> : <FiPlus size={14} />}
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                          })}
                       </>
                     )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            <div className="mt-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-3">
             {!loading && !error && totalPages > 0 && (
               <div className="mb-3 sm:mb-0" onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
               }}>
                 <div onClick={(e) => {
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
                   e.preventDefault(); 
                   e.stopPropagation(); 
                   onClose();
                 }}
                 className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
               >
                 Hủy
               </button>
               <button
                 type="button"
                 onClick={(e) => {
                   e.preventDefault(); 
                   e.stopPropagation(); 
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
