import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portals
import { FiSearch, FiX, FiPlus, FiCheck, FiFilter, FiChevronDown, FiChevronUp, FiAlertCircle, FiTag, FiAlertTriangle, FiShoppingBag } from 'react-icons/fi';
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
  const [discountPercent, setDiscountPercent] = useState<number>(0); // Added discount state

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
      setTempSelectedProducts(initialSelectedProducts.map(p => {
        const productOriginalPrice = p.originalPrice ?? 0;
        return {
          ...p,
          originalPrice: productOriginalPrice, // Ensure originalPrice is a number
          adjustedPrice: productOriginalPrice, 
          variants: p.variants?.map(v => {
            const variantOriginalPrice = v.originalPrice ?? 0;
            return {
              ...v,
              originalPrice: variantOriginalPrice, // Ensure originalPrice is a number
              adjustedPrice: variantOriginalPrice,
              combinations: v.combinations?.map(c => {
                const combinationOriginalPrice = c.originalPrice ?? 0;
                return {
                  ...c,
                  originalPrice: combinationOriginalPrice, // Ensure originalPrice is a number
                  adjustedPrice: combinationOriginalPrice,
                };
              })
            };
          })
        };
      }));
      setSearchTerm('');
      setFilters({ status: 'active' });
      setTempFilters({ status: 'active' });
      setPage(1);
      setShowAdvancedFilters(false);
      setDiscountPercent(0); // Reset discount on open
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

    const baseOriginalPrice = (typeof productDetails.originalPrice === 'number' ? productDetails.originalPrice : parseFloat(String(productDetails.originalPrice))) || (typeof productDetails.price === 'number' ? productDetails.price : parseFloat(String(productDetails.price))) || 0;
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
      const vOriginalPrice = (typeof vDetail.originalPrice === 'number' ? vDetail.originalPrice : parseFloat(String(vDetail.originalPrice))) || (typeof vDetail.price === 'number' ? vDetail.price : parseFloat(String(vDetail.price))) || 0;
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
        variantPrice: vOriginalPrice, // This might be 'currentPrice' from API, originalPrice is the base
        originalPrice: vOriginalPrice, // This is the true original price
        adjustedPrice: discountPercent > 0 ? Math.round(vOriginalPrice * (100 - discountPercent) / 100) : vOriginalPrice,
        image: vImage,
        combinations: (vDetail.combinations || []).map((combo: ProductFromApiVariantCombination) => {
          const cOriginalPriceFromData = (typeof combo.originalPrice === 'number' ? combo.originalPrice : parseFloat(String(combo.originalPrice))) || (typeof combo.price === 'number' ? combo.price : parseFloat(String(combo.price))) || 0;
          const cAdditionalPrice = typeof combo.additionalPrice === 'number' ? combo.additionalPrice : 0;
          
          // If combo has its own price, use it. Otherwise, it's additive to variant price or just variant price.
          const comboBasePrice = cOriginalPriceFromData > 0 ? cOriginalPriceFromData : (vOriginalPrice + cAdditionalPrice);

          return {
            combinationId: combo._id || combo.id || combo.combinationId || '',
            attributes: combo.attributes || {},
            combinationPrice: comboBasePrice, 
            originalPrice: comboBasePrice, 
            adjustedPrice: discountPercent > 0 ? Math.round(comboBasePrice * (100 - discountPercent) / 100) : comboBasePrice,
          };
        })
      });
    });
    
    const productToAdd: ProductInCampaign = {
      productId: definitiveProductId,
      name: productDetails.name,
      image: baseProductImage,
      originalPrice: baseOriginalPrice,
      adjustedPrice: discountPercent > 0 ? Math.round(baseOriginalPrice * (100 - discountPercent) / 100) : baseOriginalPrice,
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

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setDiscountPercent(value);
      // Update adjustedPrice for all currently selected products
      setTempSelectedProducts(prevSelected =>
        prevSelected.map(p => {
          const productOriginalPrice = p.originalPrice ?? 0;
          const newProductAdjustedPrice = Math.round(productOriginalPrice * (100 - value) / 100);
          return {
            ...p,
            adjustedPrice: newProductAdjustedPrice,
            variants: p.variants?.map(v => {
              const variantOriginalPrice = v.originalPrice ?? 0;
              const newVariantAdjustedPrice = Math.round(variantOriginalPrice * (100 - value) / 100);
              return {
                ...v,
                adjustedPrice: newVariantAdjustedPrice,
                combinations: v.combinations?.map(c => {
                  const combinationOriginalPrice = c.originalPrice ?? 0;
                  return {
                    ...c,
                    adjustedPrice: Math.round(combinationOriginalPrice * (100 - value) / 100),
                  };
                })
              };
            })
          };
        })
      );
    } else if (e.target.value === '') {
        setDiscountPercent(0); // Reset to 0 if input is cleared
        setTempSelectedProducts(prevSelected =>
            prevSelected.map(p => {
              const productOriginalPrice = p.originalPrice ?? 0;
              return {
                ...p,
                adjustedPrice: productOriginalPrice,
                variants: p.variants?.map(v => {
                  const variantOriginalPrice = v.originalPrice ?? 0;
                  return {
                    ...v,
                    adjustedPrice: variantOriginalPrice,
                    combinations: v.combinations?.map(c => {
                      const combinationOriginalPrice = c.originalPrice ?? 0;
                      return {
                        ...c,
                        adjustedPrice: combinationOriginalPrice,
                      };
                    })
                  };
                })
              };
            })
        );
    }
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

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isOpen) return null;

  const modalContent = (
    <div className={`fixed inset-0 z-[100] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0"> {/* Added flex-shrink-0 to header */}
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <FiPlus className="h-5 w-5 mr-2.5 text-pink-600" /> {/* Icon can be changed */}
              Chọn sản phẩm cho chiến dịch
            </h3>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
              className="text-slate-400 hover:text-pink-600 focus:outline-none transition-colors duration-200 p-1.5 rounded-md hover:bg-slate-100"
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col overflow-hidden"> 
            {/* Search, Discount, and Filters */}
            <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <p className="text-sm text-slate-600 mb-4">
                Tìm kiếm, lọc và chọn các sản phẩm hoặc biến thể sản phẩm để thêm vào chiến dịch. Bạn có thể điều chỉnh giá sau khi thêm.
              </p>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative flex-grow lg:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên, SKU..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="discountPercentCampaign" className="text-sm font-medium text-gray-700 whitespace-nowrap flex items-center">
                    <FiTag className="mr-1 h-4 w-4 text-pink-600" /> Giảm giá nhanh:
                  </label>
                  <div className="relative w-28">
                    <input
                      type="number"
                      id="discountPercentCampaign"
                      min="0"
                      max="100"
                      className="block w-full pl-3 pr-7 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors text-right"
                      value={discountPercent}
                      onChange={handleDiscountChange}
                      onClick={(e) => e.stopPropagation()} // Prevent modal close
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 flex items-center justify-center sm:justify-start transition-colors"
                >
                  <FiFilter className="mr-1 h-4 w-4" />
                  <span>Lọc nâng cao</span>
                  {showAdvancedFilters ? <FiChevronUp className="ml-1 h-4 w-4" /> : <FiChevronDown className="ml-1 h-4 w-4" />}
                </button>
              </div>
            </div>
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
                {/* Brand Filter */}
                <div>
                  <label htmlFor="brandFilterAdvCampaign" className="block text-xs font-medium text-slate-600 mb-1">Thương hiệu</label>
                  <select id="brandFilterAdvCampaign" name="brandId" value={tempFilters.brandId || ''} onChange={(e) => handleFilterChange('brandId', e.target.value || undefined)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-white">
                    <option value="">Tất cả</option> {brandsList.map((brand) => (<option key={brand.id} value={brand.id}>{brand.name}</option>))}
                  </select>
                </div>
                {/* Category Filter */}
                <div>
                  <label htmlFor="categoryFilterAdvCampaign" className="block text-xs font-medium text-slate-600 mb-1">Danh mục</label>
                  <select id="categoryFilterAdvCampaign" name="categoryId" value={tempFilters.categoryId || ''} onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-white">
                    <option value="">Tất cả</option> {categoriesList.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                  </select>
                </div>
                {/* Status Filter */}
                <div>
                  <label htmlFor="statusFilterAdvCampaign" className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
                  <select id="statusFilterAdvCampaign" name="status" value={tempFilters.status || 'active'} onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-white">
                    <option value="active">Hoạt động</option><option value="inactive">Ngừng</option><option value="draft">Nháp</option><option value="">Tất cả</option>
                  </select>
                </div>
                 {/* Price Range */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="minPriceFilterAdvCampaign" className="block text-xs font-medium text-slate-600 mb-1">Giá từ</label>
                        <input type="number" id="minPriceFilterAdvCampaign" name="minPrice" placeholder="0" value={tempFilters.minPrice?.toString() || ''} onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                               className="block w-full pl-3 pr-2 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="maxPriceFilterAdvCampaign" className="block text-xs font-medium text-slate-600 mb-1">Đến</label>
                        <input type="number" id="maxPriceFilterAdvCampaign" name="maxPrice" placeholder="Không giới hạn" value={tempFilters.maxPrice?.toString() || ''} onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                               className="block w-full pl-3 pr-2 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md"/>
                    </div>
                </div>
                {/* Actions */}
                <div className="col-span-full flex justify-end space-x-2.5 mt-3">
                  <button type="button" onClick={clearFilters} className="px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500">Xóa bộ lọc</button>
                  <button type="button" onClick={applyFilters} className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500">Áp dụng</button>
                </div>
              </div>
            )}
            </div>
            
            {/* Product List Area */}
            {/* Adjusted max-height.
                Header: ~60px
                Filter bar (closed state): ~100px (p-4 + text + inputs)
                Footer: ~80px (p-4 + text + buttons)
                Product List Padding (p-6 top/bottom): 48px
                Total fixed height elements approx: 60 + 100 + 80 + 48 = 288px.
                Using calc(100vh - 290px) for a bit of buffer.
            */}
            {/* Product List Area - Styled like EventProductAddModal */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-100/70" style={{minHeight: '200px', maxHeight: `calc(100vh - ${showAdvancedFilters ? 430 : 320}px)`}}>
              {loading && (
                <div className="flex flex-col justify-center items-center h-full py-10 text-slate-500">
                  <FiAlertCircle className="h-10 w-10 animate-spin text-pink-500 mb-3" />
                  <p>Đang tải sản phẩm...</p>
                </div>
              )}
              {error && !loading && (
                 <div className="flex flex-col justify-center items-center h-full py-10 text-red-600">
                   <FiAlertTriangle className="h-10 w-10 mb-3" />
                   <p>Lỗi: {error}</p>
                   <button onClick={fetchProductsCallback} className="mt-3 text-sm text-pink-600 hover:text-pink-500 focus:outline-none focus:underline">Thử lại</button>
                 </div>
               )}
              {!loading && !error && (
                <>
                  {productsInEvent.size > 0 && (
                     <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                       <div className="flex items-start">
                         <FiAlertCircle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0 h-5 w-5" />
                         <div>
                           <p className="text-sm text-yellow-700 font-medium">Lưu ý về sản phẩm trong Event</p>
                           <p className="text-xs text-yellow-600 mt-1">
                             Một số sản phẩm được đánh dấu màu vàng vì chúng đang thuộc về một Event.
                             Bạn không thể thêm các sản phẩm này vào Campaign khi chúng đang trong Event.
                           </p>
                         </div>
                       </div>
                     </div>
                   )}
                  {products.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full py-10 text-slate-500">
                      <FiShoppingBag className="h-12 w-12 mb-3 text-slate-400" />
                      <p className="font-medium">Không tìm thấy sản phẩm nào.</p>
                      <p className="text-sm">Vui lòng thử lại với bộ lọc khác hoặc bỏ bớt điều kiện lọc.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                      {products.map((product) => {
                        const productId = product._id || product.id || '';
                        if (!productId) return null; // Skip if no valid ID

                        const isSelected = isProductSelected(productId); // Simplified: check if product ID is in tempSelectedProducts
                        const isInEvent = productsInEvent.has(productId);
                        
                        const productOriginalPrice = (typeof product.originalPrice === 'number' ? product.originalPrice : parseFloat(String(product.originalPrice))) || (typeof product.price === 'number' ? product.price : parseFloat(String(product.price))) || 0;
                        
                        // Find this product in tempSelectedProducts to get its current adjustedPrice for display
                        const tempSelectedProduct = tempSelectedProducts.find(p => p.productId === productId);
                        const displayAdjustedPrice = tempSelectedProduct ? tempSelectedProduct.adjustedPrice : productOriginalPrice;
                        const actualDiscountApplied = discountPercent > 0 && displayAdjustedPrice < productOriginalPrice;

                        const productImage = product.images?.find(img => img.isPrimary)?.url || product.image || product.images?.[0]?.url || 'https://via.placeholder.com/150';


                        return (
                          <div
                            key={productId}
                            className={`bg-white border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl group ${
                              isSelected ? 'border-pink-500 ring-2 ring-pink-300 shadow-lg' : 'border-slate-200 hover:border-pink-300'
                            } ${isInEvent ? 'opacity-60 bg-yellow-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (!isInEvent) {
                                // Pass undefined for variant to select the whole product with its variants
                                handleSelectProduct(product, undefined); 
                              } else {
                                toast.error(`Sản phẩm "${product.name}" đang thuộc Event: ${productsInEvent.get(productId)}. Không thể thêm vào Campaign.`);
                              }
                            }}
                          >
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                              <Image 
                                src={productImage} 
                                alt={product.name} 
                                layout="fill" 
                                objectFit="cover" 
                                className="transition-transform duration-300 group-hover:scale-105"
                                unoptimized
                              />
                              {isSelected && !isInEvent && (
                                <div className="absolute top-2 right-2 bg-pink-500 text-white p-1.5 rounded-full shadow">
                                  <FiCheck className="h-4 w-4" />
                                </div>
                              )}
                              {actualDiscountApplied && !isSelected && !isInEvent && (
                                 <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                                    -{discountPercent}%
                                </div>
                              )}
                              {isInEvent && (
                                <div className="absolute inset-0 bg-yellow-400 bg-opacity-30 flex items-center justify-center">
                                  <FiAlertCircle className="h-8 w-8 text-yellow-700" />
                                </div>
                              )}
                            </div>
                            <div className="p-3.5">
                              <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 h-10" title={product.name}>{product.name}</h4>
                              {product.brand && (
                                <p className="text-xs text-slate-500 mb-1.5 line-clamp-1">
                                  Thương hiệu: {typeof product.brand === 'object' ? product.brand.name : product.brand}
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                <div className="text-xs text-slate-500">
                                  {productOriginalPrice > 0 && displayAdjustedPrice < productOriginalPrice && (
                                    <span className="line-through">{formatPrice(productOriginalPrice)}</span>
                                  )}
                                </div>
                                <div className={`text-base font-bold ${actualDiscountApplied ? 'text-pink-600' : 'text-slate-800'}`}>
                                  {formatPrice(displayAdjustedPrice)}
                                </div>
                              </div>
                               {/* Display SKU if available */}
                               {product.sku && <p className="text-xs text-slate-400 mt-1">SKU: {product.sku}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pagination and Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 mt-auto flex-shrink-0">
              <div className="flex-grow sm:flex-grow-0">
                {!loading && !error && totalPages > 0 && (
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={totalItems}
                      itemsPerPage={10} // Assuming 10 items per page for this table
                      showItemsInfo={true}
                      maxVisiblePages={5}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-700">
                  <span className={`font-semibold px-2 py-1 rounded-md mr-1.5 ${tempSelectedProducts.length > 0 ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-600'}`}>
                    {tempSelectedProducts.length}
                  </span>
                  sản phẩm/biến thể đã chọn
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
                  className="py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm(); }}
                  disabled={tempSelectedProducts.length === 0 || loading}
                  className={`py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white flex items-center justify-center
                    ${tempSelectedProducts.length === 0 || loading
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105'}`}
                >
                  {loading ? 'Đang xử lý...' : (
                    <>
                      <FiPlus className="h-4 w-4 mr-1.5" />
                      Thêm sản phẩm đã chọn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isClient) {
    return null; // Avoid rendering portal on server-side or before client is ready
  }

  // Ensure document.body is available before creating portal
  const portalContainer = typeof document !== 'undefined' ? document.body : null;

  return portalContainer ? ReactDOM.createPortal(modalContent, portalContainer) : null;
};

export default ProductSelectionTable;
