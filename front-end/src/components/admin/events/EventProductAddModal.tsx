import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Search, Plus, Filter, ChevronDown, Package, AlertTriangle, ImageOff, CheckCircle, Loader2 } from 'lucide-react'; // Updated icons
import Pagination from '@/components/admin/common/Pagination';
import { useProduct } from '@/contexts/ProductContext';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { toast } from 'react-hot-toast';
import useProductPromotionCheck from '@/hooks/useProductPromotionCheck';
import axios from 'axios';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';

// Định nghĩa interface cho biến thể
interface Variant {
  variantId: string;
  name?: string;
  sku?: string;
  price?: number;
  options?: {
    color?: string;
    shades?: string[];
    sizes?: string[];
  };
  images?: Array<{url: string, alt?: string, isPrimary?: boolean}>;
  combinations?: Array<{
    combinationId: string;
    attributes: Record<string, string>;
    price?: number;
    additionalPrice?: number;
  }>;
}

// Định nghĩa interface cho sản phẩm từ API
interface Product {
  _id?: string;
  id?: string;
  name: string;
  image: string;
  price: number | string;
  currentPrice?: number | string;
  originalPrice?: number | string;
  brandId?: string;
  brand?: string;
  status?: string;
  sku?: string;
  categoryIds?: string[];
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  images?: Array<{url: string, alt?: string, isPrimary?: boolean}>;
  variants?: Variant[];
}

// Interface cho bộ lọc sản phẩm
interface ProductFilter {
  brandId?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  hasGifts?: boolean;
}

// Định nghĩa cho tham số fetchAdminProductList được sử dụng trong fetchProducts
// Không cần export vì chỉ sử dụng nội bộ trong component này

// Định nghĩa interface cho tổ hợp biến thể trong event
interface CombinationInEventData {
  combinationId: string;
  attributes: Record<string, string>;
  price?: number;
  adjustedPrice: number;
  originalPrice: number;
  combinationPrice?: number;
}

// Định nghĩa interface cho biến thể trong event
interface VariantInEventData {
  variantId: string;
  variantName?: string;
  variantSku?: string;
  variantPrice?: number;
  adjustedPrice: number;
  originalPrice: number;
  variantAttributes?: Record<string, string>;
  image?: string;
  combinations?: CombinationInEventData[];
}

// Định nghĩa interface cho sản phẩm trong event
interface ProductInEventData {
  productId: string;
  name: string;
  image?: string;
  originalPrice: number;
  adjustedPrice: number;
  sku?: string;
  status?: string;
  brandId?: string;
  brand?: string;
  variants?: VariantInEventData[];
}

interface EventProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (products: ProductInEventData[]) => void;
  excludedProductIds?: string[]; // Các sản phẩm đã được thêm vào sự kiện
}

const EventProductAddModal: React.FC<EventProductAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  excludedProductIds = []
}) => {
  const { fetchAdminProductList } = useProduct();
  const { brands, fetchBrands } = useBrands();
  const { categories, fetchCategories } = useCategory();
  const { checkProducts } = useProductPromotionCheck();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<ProductInEventData[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const productsInCampaign = new Map<string, string>();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [brandsList, setBrands] = useState<{id: string, name: string}[]>([]);
  const [categoriesList, setCategories] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState<ProductFilter>({
    status: 'active',
  });
  const [tempFilters, setTempFilters] = useState<ProductFilter>({
    status: 'active',
  });

  // Chỉ cập nhật danh sách brandsList và categoriesList khi brands hoặc categories thay đổi
  useEffect(() => {
    if (brands && brands.length > 0) {
      const brandItems = brands.map(brand => ({
        id: brand.id || '',
        name: brand.name
      }));
      setBrands(brandItems);
    } else if (isOpen) {
      // Tải brands nếu chưa có khi modal mở
      console.log('Tải danh sách thương hiệu...');
      fetchBrands(1, 100); // Tải tối đa 100 brands
    }
  }, [brands, isOpen, fetchBrands]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      const categoryItems = categories.map(category => ({
        id: category._id || '',
        name: category.name
      }));
      setCategories(categoryItems);
    } else if (isOpen) {
      // Tải categories nếu chưa có khi modal mở
      console.log('Tải danh sách danh mục...');
      fetchCategories(1, 100); // Tải tối đa 100 categories
    }
  }, [categories, isOpen, fetchCategories]);

  // Effect for modal visibility and resetting state
  useEffect(() => {
    let visibilityTimer: NodeJS.Timeout | null = null;
    if (isOpen) {
      setModalVisible(true);
      setSelectedProducts([]); // Reset selection when modal opens
      setIsInitialLoad(true); // Reset initial load flag
    } else {
      // Delay hiding for animation
      visibilityTimer = setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
    };
  }, [isOpen]);

  // Hàm để lấy danh sách sản phẩm từ API
  const fetchProducts = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdminProductList({
        page,
        limit: 12,
        search: searchTerm,
        brandId: filters.brandId,
        categoryId: filters.categoryId,
        status: filters.status,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        isBestSeller: filters.isBestSeller,
        isNew: filters.isNew,
        isOnSale: filters.isOnSale,
        hasGifts: filters.hasGifts,
      });

      if (result && result.products) {
        // Lấy danh sách product IDs
        const fetchedProductIds = result.products.map((product: Product) => {
          // Đảm bảo luôn có một ID hợp lệ để tham chiếu
          return (product._id || product.id || '').toString();
        }).filter(id => id !== ''); // Loại bỏ các ID rỗng

        try {
          // Thay vì sử dụng filterProductsNotInCampaign, sử dụng checkProducts trực tiếp
          const checkResults = await checkProducts(fetchedProductIds);

          // Lọc ra các sản phẩm không thuộc về Campaign
          const validProductIds = Array.isArray(checkResults)
            ? checkResults
              .filter(result => !result.inCampaign)
              .map(result => result.productId)
            : fetchedProductIds; // Nếu checkResults không phải mảng, giữ nguyên danh sách

          // Lọc danh sách sản phẩm chỉ lấy những sản phẩm không thuộc về Campaign
          const filteredProductsFromAPI = result.products.filter((product: Product) => {
            const productId = (product._id || product.id || '').toString();
            return validProductIds.includes(productId);
          });

          setProducts(filteredProductsFromAPI as Product[]);
        } catch (filterError) {
          console.error('Lỗi khi lọc sản phẩm theo Campaign:', filterError);
          // Nếu lọc thất bại, hiển thị tất cả sản phẩm
          setProducts(result.products);
        }

        setTotalPages(Math.ceil(result.total / 12));
      }
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      console.error('Lỗi khi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAdminProductList, page, filters, searchTerm, isOpen, checkProducts]);

  // Effect for fetching data (initial with delay, subsequent immediately)
  useEffect(() => {
    let fetchTimer: NodeJS.Timeout | null = null;
    // Fetch only when modal is open and visible
    if (isOpen && modalVisible) {
      const delay = isInitialLoad ? 150 : 0; // Apply delay only on initial load

      // Set initial load to false *before* the timeout to prevent potential re-trigger issues
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      fetchTimer = setTimeout(() => {
        fetchProducts();
      }, delay);
    }

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (fetchTimer) clearTimeout(fetchTimer);
    };
  // Fetch when modal is open/visible, page/search changes, or on initial load flag change
  }, [isOpen, modalVisible, page, searchTerm, fetchProducts, isInitialLoad, filters]);

  // Xử lý tìm kiếm với debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset về trang 1 khi tìm kiếm
  };

  // Xử lý thay đổi filter
  const handleFilterChange = (name: keyof ProductFilter, value: string | number | boolean | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Áp dụng bộ lọc
  const applyFilters = () => {
    console.log('Applying filters:', tempFilters);
    // Đảm bảo các giá trị lọc được chuyển đúng định dạng
    const sanitizedFilters = {
      ...tempFilters,
      brandId: tempFilters.brandId || undefined,
      categoryId: tempFilters.categoryId || undefined,
      isBestSeller: tempFilters.isBestSeller === true ? true : undefined,
      isNew: tempFilters.isNew === true ? true : undefined,
      isOnSale: tempFilters.isOnSale === true ? true : undefined,
      hasGifts: tempFilters.hasGifts === true ? true : undefined,
    };

    console.log('Sanitized filters:', sanitizedFilters);
    setFilters(sanitizedFilters);
    setPage(1); // Reset về trang 1 khi áp dụng bộ lọc
    setShowAdvancedFilters(false); // Đóng bộ lọc nâng cao
  };

  // Xóa bộ lọc
  const clearFilters = () => {
    const defaultFilters = { status: 'active' };
    console.log('Clearing filters, setting to:', defaultFilters);
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setPage(1);
  };

  // Lọc sản phẩm đã được thêm vào sự kiện hoặc đã thuộc về Campaign
  const filteredProducts = products.filter(product => {
    const productId = product._id || product.id || '';
    // Loại bỏ sản phẩm đã được thêm vào sự kiện
    if (excludedProductIds.includes(productId)) {
      return false;
    }
    // Loại bỏ sản phẩm đã thuộc về Campaign
    if (productsInCampaign.has(productId)) {
      return false;
    }
    return true;
  });

  // Kiểm tra xem sản phẩm đã được chọn chưa
  const isProductSelected = (productId: string) => {
    return selectedProducts.some(product => product.productId === productId);
  };

  // State để theo dõi trạng thái loading khi lấy thông tin chi tiết sản phẩm
  const [loadingProductDetails, setLoadingProductDetails] = useState<Record<string, boolean>>({});

  // Hàm để lấy thông tin chi tiết sản phẩm từ API
  const fetchProductDetails = async (productId: string): Promise<Product | null> => {
    setLoadingProductDetails(prev => ({ ...prev, [productId]: true }));
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
        return null;
      }

      const response = await axios.get(`${API_URL}/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch {
      toast.error('Không thể lấy thông tin chi tiết sản phẩm');
      return null;
    } finally {
      setLoadingProductDetails(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Xử lý chọn/bỏ chọn sản phẩm
  const toggleProductSelection = async (product: Product) => {
    const productId = product._id || product.id || '';

    if (isProductSelected(productId)) {
      // Bỏ chọn sản phẩm và tất cả biến thể của nó
      setSelectedProducts(prev => prev.filter(item => item.productId !== productId));
    } else {
      // Lấy thông tin chi tiết sản phẩm từ API
      const productDetails = await fetchProductDetails(productId);

      if (!productDetails) {
        toast.error('Không thể lấy thông tin chi tiết sản phẩm');
        return;
      }

      // Tạo sản phẩm mới với cấu trúc phân cấp
      const newProduct = createProductWithVariants(productDetails);

      // Thêm sản phẩm vào danh sách đã chọn
      setSelectedProducts(prev => [...prev, newProduct]);
    }
  };

  // Hàm tạo sản phẩm với cấu trúc phân cấp (bao gồm biến thể và tổ hợp)
  const createProductWithVariants = (product: Product): ProductInEventData => {
    const productId = product._id || product.id || '';

    // Ưu tiên lấy giá từ originalPrice (giá thực trong DB) nếu có
    let productPrice = 0;

    if (product.originalPrice) {
      productPrice = typeof product.originalPrice === 'string' ?
        parseFloat(product.originalPrice) : product.originalPrice;
    } else if (product.price) {
      productPrice = typeof product.price === 'string' ?
        parseFloat(product.price) : (product.price || 0);
    }

    const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);

    // Lấy ảnh đầu tiên hoặc ảnh được đánh dấu là primary từ mảng images nếu có
    let productImage = product.image;
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      productImage = primaryImage ? primaryImage.url : product.images[0].url;
    }

    // Tạo đối tượng sản phẩm mới
    const newProduct: ProductInEventData = {
      productId: productId,
      name: product.name,
      image: productImage,
      originalPrice: productPrice,
      adjustedPrice,
      sku: product.sku,
      status: product.status,
      brandId: product.brandId,
      brand: product.brand,
      variants: []
    };

    // Nếu sản phẩm có biến thể, thêm tất cả biến thể và tổ hợp biến thể
    if (product.variants && product.variants.length > 0) {
      newProduct.variants = product.variants.map(variant => {
        // Lấy ảnh từ biến thể hoặc sản phẩm
        let variantImage = product.image;
        if (variant.images && variant.images.length > 0) {
          const primaryImage = variant.images.find(img => img.isPrimary);
          variantImage = primaryImage ? primaryImage.url : variant.images[0].url;
        } else if (product.images && product.images.length > 0) {
          const primaryImage = product.images.find(img => img.isPrimary);
          variantImage = primaryImage ? primaryImage.url : product.images[0].url;
        }

        // Tạo đối tượng thuộc tính biến thể
        const variantAttributes: Record<string, string> = {};
        if (variant.options) {
          if (variant.options.color) {
            variantAttributes['Màu'] = variant.options.color;
          }
          if (variant.options.sizes && variant.options.sizes.length > 0) {
            variantAttributes['Kích thước'] = variant.options.sizes.join(', ');
          }
          if (variant.options.shades && variant.options.shades.length > 0) {
            variantAttributes['Tông màu'] = variant.options.shades.join(', ');
          }
        }

        // Tính giá cho biến thể
        const variantPrice = variant.price || 0;
        const adjustedPrice = Math.round(variantPrice * (100 - discountPercent) / 100);

        // Tạo đối tượng biến thể mới
        const newVariant: VariantInEventData = {
          variantId: variant.variantId,
          variantName: variant.name || '',
          variantSku: variant.sku || '',
          variantPrice: variantPrice,
          adjustedPrice,
          originalPrice: variantPrice,
          variantAttributes: variantAttributes,
          image: variantImage,
          combinations: []
        };

        // Nếu biến thể có tổ hợp, thêm tất cả tổ hợp
        if (variant.combinations && variant.combinations.length > 0) {
          newVariant.combinations = variant.combinations.map(combination => {
            // Tạo đối tượng thuộc tính tổ hợp (kết hợp với thuộc tính biến thể)
            const combinationAttributes = { ...variantAttributes };
            if (combination.attributes) {
              Object.entries(combination.attributes).forEach(([key, value]) => {
                combinationAttributes[key] = value;
              });
            }

            // Tính giá cho tổ hợp
            let combinationPrice = 0;
            if (combination.price) {
              combinationPrice = combination.price;
            } else if (combination.additionalPrice && variant.price) {
              combinationPrice = variant.price + combination.additionalPrice;
            } else if (variant.price) {
              combinationPrice = variant.price;
            }

            const combinationAdjustedPrice = Math.round(combinationPrice * (100 - discountPercent) / 100);

            // Tạo đối tượng tổ hợp mới
            return {
              combinationId: combination.combinationId,
              attributes: combinationAttributes,
              price: combinationPrice,
              adjustedPrice: combinationAdjustedPrice,
              originalPrice: combinationPrice
            };
          });
        }

        return newVariant;
      });
    }

    return newProduct;
  };

  // Xử lý thay đổi % giảm giá
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setDiscountPercent(value);

      // Cập nhật giá của tất cả sản phẩm đã chọn
      setSelectedProducts(prev => prev.map(product => {
        // Tính giá mới cho sản phẩm gốc
        const productAdjustedPrice = Math.round(product.originalPrice * (100 - value) / 100);

        // Tạo bản sao của sản phẩm với giá mới
        const updatedProduct = {
          ...product,
          adjustedPrice: productAdjustedPrice
        };

        // Nếu sản phẩm có biến thể, cập nhật giá cho tất cả biến thể
        if (product.variants && product.variants.length > 0) {
          updatedProduct.variants = product.variants.map(variant => {
            // Tính giá mới cho biến thể
            const variantAdjustedPrice = Math.round(variant.originalPrice * (100 - value) / 100);

            // Tạo bản sao của biến thể với giá mới
            const updatedVariant = {
              ...variant,
              adjustedPrice: variantAdjustedPrice
            };

            // Nếu biến thể có tổ hợp, cập nhật giá cho tất cả tổ hợp
            if (variant.combinations && variant.combinations.length > 0) {
              updatedVariant.combinations = variant.combinations.map(combination => {
                // Tính giá mới cho tổ hợp
                const combinationAdjustedPrice = Math.round(combination.originalPrice * (100 - value) / 100);

                // Tạo bản sao của tổ hợp với giá mới
                return {
                  ...combination,
                  adjustedPrice: combinationAdjustedPrice
                };
              });
            }

            return updatedVariant;
          });
        }

        return updatedProduct;
      }));
    }
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    // Tránh việc gọi API liên tục khi đang ở cùng trang
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      console.log('Chuyển đến trang:', newPage);
      setPage(newPage);
    }
  };

  // Xử lý thêm sản phẩm vào sự kiện
  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setSubmitting(true);

      // Sử dụng cấu trúc dữ liệu phân cấp mới
      const restructuredProducts = selectedProducts.map(product => {
        // Tạo đối tượng sản phẩm mới
        const newProduct = {
          productId: product.productId,
          adjustedPrice: product.adjustedPrice,
          name: product.name,
          image: product.image,
          originalPrice: product.originalPrice,
          sku: product.sku,
          status: product.status,
          brandId: product.brandId,
          brand: product.brand,
          variants: [] as VariantInEventData[]
        };

        // Nếu sản phẩm có biến thể, thêm tất cả biến thể
        if (product.variants && product.variants.length > 0) {
          newProduct.variants = product.variants.map(variant => {
            // Tạo đối tượng biến thể mới
            const newVariant: VariantInEventData = {
              variantId: variant.variantId,
              variantName: variant.variantName,
              variantSku: variant.variantSku,
              variantPrice: variant.variantPrice,
              adjustedPrice: variant.adjustedPrice,
              originalPrice: variant.originalPrice,
              variantAttributes: variant.variantAttributes,
              image: variant.image,
              combinations: []
            };

            // Nếu biến thể có tổ hợp, thêm tất cả tổ hợp
            if (variant.combinations && variant.combinations.length > 0) {
              newVariant.combinations = variant.combinations.map(combination => {
                // Tạo đối tượng tổ hợp mới
                return {
                  combinationId: combination.combinationId,
                  attributes: combination.attributes,
                  combinationPrice: combination.price,
                  adjustedPrice: combination.adjustedPrice,
                  originalPrice: combination.originalPrice
                };
              });
            }

            return newVariant;
          });
        }

        return newProduct;
      });

      // Phân tích thông tin về sản phẩm, biến thể và tổ hợp biến thể
      const stats = {
        uniqueProductCount: restructuredProducts.length,
        variantCount: restructuredProducts.reduce((total, product) =>
          total + (product.variants?.length || 0), 0),
        combinationCount: restructuredProducts.reduce((total, product) => {
          let count = 0;
          product.variants?.forEach(variant => {
            count += variant.combinations?.length || 0;
          });
          return total + count;
        }, 0)
      };

      // Hiển thị thông báo chi tiết
      const message = `Đã thêm ${stats.uniqueProductCount} sản phẩm với ${stats.variantCount} biến thể và ${stats.combinationCount} tổ hợp biến thể vào sự kiện`;
      toast.success(message);

      // Thêm sản phẩm vào sự kiện (gọi callback)
      onAdd(restructuredProducts);

      // Reset state sau khi thêm
      setSelectedProducts([]);

      // Đóng modal sau khi thêm thành công
      setTimeout(() => {
        onClose();
      }, 100);
    } catch {
      toast.error('Đã xảy ra lỗi khi thêm sản phẩm vào sự kiện!');
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm định dạng giá tiền
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    // Không nhân lên 1000 nữa vì giá trong DB đã đúng (150000)
    return new Intl.NumberFormat('vi-VN').format(numPrice) + ' ₫';
  };

  if (!modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          {/* Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <Package className="h-5 w-5 mr-2.5 text-pink-600" />
              Thêm sản phẩm vào sự kiện
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-pink-600 focus:outline-none transition-colors duration-200 p-1.5 rounded-md hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search, Discount, and Filters */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-grow lg:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên, SKU sản phẩm..."
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="discountPercent" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    Giảm giá:
                  </label>
                  <div className="relative w-28">
                    <input
                      type="number"
                      id="discountPercent"
                      min="0"
                      max="100"
                      className="block w-full pl-3 pr-7 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors text-right"
                      value={discountPercent}
                      onChange={handleDiscountChange}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 flex items-center justify-center sm:justify-start transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Lọc nâng cao
                  <ChevronDown className={`h-4 w-4 ml-1.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
                {/* Filters: Brand, Category, Status, Price Range, Flags */}
                {/* Brand Filter */}
                <div>
                  <label htmlFor="brandFilterAdv" className="block text-xs font-medium text-slate-600 mb-1">Thương hiệu</label>
                  <select id="brandFilterAdv" name="brandId" value={tempFilters.brandId || ''} onChange={(e) => handleFilterChange('brandId', e.target.value || undefined)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-white">
                    <option value="">Tất cả</option> {brandsList.map((brand) => (<option key={brand.id} value={brand.id}>{brand.name}</option>))}
                  </select>
                </div>
                {/* Category Filter */}
                <div>
                  <label htmlFor="categoryFilterAdv" className="block text-xs font-medium text-slate-600 mb-1">Danh mục</label>
                  <select id="categoryFilterAdv" name="categoryId" value={tempFilters.categoryId || ''} onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-white">
                    <option value="">Tất cả</option> {categoriesList.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                  </select>
                </div>
                {/* Status Filter */}
                <div>
                  <label htmlFor="statusFilterAdv" className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
                  <select id="statusFilterAdv" name="status" value={tempFilters.status || 'active'} onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-white">
                    <option value="active">Hoạt động</option><option value="inactive">Ngừng</option><option value="draft">Nháp</option><option value="">Tất cả</option>
                  </select>
                </div>
                 {/* Price Range */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="minPriceFilterAdv" className="block text-xs font-medium text-slate-600 mb-1">Giá từ</label>
                        <input type="number" id="minPriceFilterAdv" name="minPrice" placeholder="0" value={tempFilters.minPrice?.toString() || ''} onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                               className="block w-full pl-3 pr-2 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="maxPriceFilterAdv" className="block text-xs font-medium text-slate-600 mb-1">Đến</label>
                        <input type="number" id="maxPriceFilterAdv" name="maxPrice" placeholder="Không giới hạn" value={tempFilters.maxPrice?.toString() || ''} onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                               className="block w-full pl-3 pr-2 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md"/>
                    </div>
                </div>
                {/* Flags */}
                <div className="col-span-full mt-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Đặc điểm</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {['isBestSeller', 'isNew', 'isOnSale', 'hasGifts'].map(flag => (
                            <div key={flag} className="flex items-center">
                                <input id={flag} name={flag} type="checkbox" checked={tempFilters[flag as keyof ProductFilter] as boolean || false} onChange={(e) => handleFilterChange(flag as keyof ProductFilter, e.target.checked)}
                                       className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-slate-300 rounded"/>
                                <label htmlFor={flag} className="ml-2 block text-sm text-slate-700">
                                    {flag === 'isBestSeller' ? 'Bán chạy' : flag === 'isNew' ? 'Mới' : flag === 'isOnSale' ? 'Đang giảm giá' : 'Có quà tặng'}
                                </label>
                            </div>
                        ))}
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
          <div className="max-h-[calc(100vh-380px)] min-h-[200px] overflow-y-auto p-6 bg-slate-100/70">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-full py-10 text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-3" />
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-full py-10 text-red-600">
                 <AlertTriangle className="h-10 w-10 mb-3" />
                <p>{error}</p>
                <button onClick={fetchProducts} className="mt-3 text-sm text-pink-600 hover:text-pink-500 focus:outline-none focus:underline">Thử lại</button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full py-10 text-slate-500">
                <Package className="h-12 w-12 mb-3 text-slate-400" />
                <p className="font-medium">Không tìm thấy sản phẩm nào.</p>
                <p className="text-sm">Vui lòng thử lại với bộ lọc khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredProducts.map((product) => {
                  const productId = product._id || product.id || '';
                  const isSelected = isProductSelected(productId);
                  const productPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : (product.originalPrice || (typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0));
                  const adjustedPrice = Math.round(productPrice * (100 - discountPercent) / 100);
                  const actualDiscount = productPrice > 0 ? Math.round(((productPrice - adjustedPrice) / productPrice) * 100) : 0;
                  const productImage = product.images?.find(img => img.isPrimary)?.url || product.image || product.images?.[0]?.url;

                  return (
                    <div
                      key={productId}
                      className={`bg-white border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl group ${
                        isSelected ? 'border-pink-500 ring-2 ring-pink-300 shadow-lg' : 'border-slate-200 hover:border-pink-300'
                      }`}
                      onClick={() => toggleProductSelection(product)}
                    >
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {loadingProductDetails[productId] && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                            <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
                          </div>
                        )}
                        {productImage ? (
                          <Image src={productImage} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-200">
                            <ImageOff className="h-10 w-10 text-slate-400" />
                          </div>
                        )}
                         {isSelected && (
                            <div className="absolute top-2 right-2 bg-pink-500 text-white p-1.5 rounded-full shadow">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                        )}
                        {actualDiscount > 0 && !isSelected && (
                             <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                                -{actualDiscount}%
                            </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 h-10">{product.name}</h4>
                        {product.brand && (<p className="text-xs text-slate-500 mb-1.5 line-clamp-1">Thương hiệu: {product.brand}</p>)}
                        
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-slate-500">
                            {productPrice > 0 && <span className="line-through">{formatPrice(productPrice)}</span>}
                          </div>
                          <div className="text-base font-bold text-pink-600">
                            {formatPrice(adjustedPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-200 flex justify-center bg-white">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} maxVisiblePages={5} />
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-slate-700">
              <span className={`font-semibold px-2 py-1 rounded-md mr-1.5 ${selectedProducts.length > 0 ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-600'}`}>
                {selectedProducts.length}
              </span>
              sản phẩm đã chọn
              {selectedProducts.length > 0 && (
                <span className="text-xs text-slate-500 ml-2">
                  (Tổng số biến thể: {selectedProducts.reduce((total, p) => total + (p.variants?.length || 0), 0)},
                  Tổ hợp: {selectedProducts.reduce((total, p) => total + (p.variants?.reduce((vt, v) => vt + (v.combinations?.length || 0), 0) || 0), 0)})
                </span>
              )}
              {selectedProducts.length > 10 && (
                <span className="text-orange-600 ml-2 flex items-center text-xs mt-1 sm:mt-0">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Nên chọn tối đa 10 sản phẩm/lần.
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`py-2.5 px-5 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50'
                } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 transition-colors`}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddProducts}
                disabled={selectedProducts.length === 0 || submitting}
                className={`py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white flex items-center justify-center
                  ${selectedProducts.length === 0 || submitting
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105'}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Thêm ({selectedProducts.length}) vào sự kiện
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventProductAddModal;
