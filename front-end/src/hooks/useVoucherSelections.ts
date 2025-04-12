import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { useProduct } from '@/contexts/ProductContext';

// Define types for the data we'll be fetching
interface Brand {
  _id?: string;
  id?: string;  // Add id field to support both formats
  name: string;
  status?: string;
}

interface Category {
  _id?: string;
  id?: string;  // Add id field to support both formats
  name: string;
  status?: string;
  slug?: string;
}

interface Product {
  _id?: string;
  id?: string;  // Add id field to support both formats
  name: string;
  sku: string;
  status?: string;
  price?: number;
  currentPrice?: number;
}

interface UseVoucherSelectionsResult {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  brandsLoading: boolean;
  categoriesLoading: boolean;
  productsLoading: boolean;
  brandsError: string | null;
  categoriesError: string | null;
  productsError: string | null;
  fetchBrands: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProducts: (page?: number, limit?: number, search?: string) => Promise<void>;
  productsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useVoucherSelections = (): UseVoucherSelectionsResult => {
  // Use the BrandContext to get brands data
  const brandContext = useBrands();

  // Use the CategoryContext to get categories data
  const categoryContext = useCategory();

  // Use the ProductContext to get products data
  const productContext = useProduct();

  // State for brands (will be populated from context)
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  // State for categories (will be populated from context)
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // State for products (will be populated from context)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsPagination, setProductsPagination] = useState({
    page: 1,
    limit: 100, // Fetch more products at once for selection
    total: 0,
    totalPages: 1
  });

  // API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    console.log('Using admin token:', token ? 'Token exists' : 'No token found');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Fetch brands from context
  const fetchBrands = useCallback(async () => {
    try {
      setBrandsLoading(true);
      setBrandsError(null);

      console.log('Fetching brands from BrandContext');

      // Check if we have brands in the context
      if (brandContext && brandContext.brands && brandContext.brands.length > 0) {
        console.log('Using brands from context:', brandContext.brands.length);

        // Transform the brands from context format to the format expected by the voucher component
        const transformedBrands = brandContext.brands.map(brand => ({
          _id: brand.id || brand._id || '',
          name: brand.name || '',
          status: brand.status || 'active'
        }));

        setBrands(transformedBrands);
        console.log('Brands loaded from context:', transformedBrands.length);
      } else {
        console.log('No brands in context, fetching from API...');

        // If no brands in context, try to fetch them
        if (brandContext && typeof brandContext.fetchBrands === 'function') {
          await brandContext.fetchBrands(1, 100);

          // After fetching, check if we have brands now
          if (brandContext.brands && brandContext.brands.length > 0) {
            const transformedBrands = brandContext.brands.map(brand => ({
              _id: brand.id || brand._id || '',
              name: brand.name || '',
              status: brand.status || 'active'
            }));

            setBrands(transformedBrands);
            console.log('Brands loaded after context fetch:', transformedBrands.length);
          } else {
            // If still no brands, use mock data
            console.warn('No brands found in context after fetch, using mock data');
            const mockBrands = [
              { _id: 'brand1', name: 'Nike', status: 'active' },
              { _id: 'brand2', name: 'Adidas', status: 'active' },
              { _id: 'brand3', name: 'Puma', status: 'active' },
              { _id: 'brand4', name: 'Reebok', status: 'active' },
              { _id: 'brand5', name: 'Under Armour', status: 'active' }
            ];
            setBrands(mockBrands);
          }
        } else {
          // If no fetchBrands function in context, use mock data
          console.warn('No fetchBrands function in context, using mock data');
          const mockBrands = [
            { _id: 'brand1', name: 'Nike', status: 'active' },
            { _id: 'brand2', name: 'Adidas', status: 'active' },
            { _id: 'brand3', name: 'Puma', status: 'active' },
            { _id: 'brand4', name: 'Reebok', status: 'active' },
            { _id: 'brand5', name: 'Under Armour', status: 'active' }
          ];
          setBrands(mockBrands);
        }
      }
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      setBrandsError(error.message || 'Failed to fetch brands');

      // Use mock data as fallback in case of error
      const mockBrands = [
        { _id: 'brand1', name: 'Nike', status: 'active' },
        { _id: 'brand2', name: 'Adidas', status: 'active' },
        { _id: 'brand3', name: 'Puma', status: 'active' },
        { _id: 'brand4', name: 'Reebok', status: 'active' },
        { _id: 'brand5', name: 'Under Armour', status: 'active' }
      ];
      setBrands(mockBrands);
    } finally {
      setBrandsLoading(false);
    }
  }, [brandContext]);

  // Fetch categories from context
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      console.log('Fetching categories from CategoryContext');

      // Check if we have categories in the context
      if (categoryContext && categoryContext.categories && categoryContext.categories.length > 0) {
        console.log('Using categories from context:', categoryContext.categories.length);

        // Transform the categories from context format to the format expected by the voucher component
        const transformedCategories = categoryContext.categories.map(category => ({
          _id: category._id || category.id || '',
          name: category.name || '',
          status: category.status || 'active',
          slug: category.slug || ''
        }));

        setCategories(transformedCategories);
        console.log('Categories loaded from context:', transformedCategories.length);
      } else {
        console.log('No categories in context, fetching from API...');

        // If no categories in context, try to fetch them
        if (categoryContext && typeof categoryContext.fetchCategories === 'function') {
          await categoryContext.fetchCategories(1, 100);

          // After fetching, check if we have categories now
          if (categoryContext.categories && categoryContext.categories.length > 0) {
            const transformedCategories = categoryContext.categories.map(category => ({
              _id: category._id || category.id || '',
              name: category.name || '',
              status: category.status || 'active',
              slug: category.slug || ''
            }));

            setCategories(transformedCategories);
            console.log('Categories loaded after context fetch:', transformedCategories.length);
          } else {
            // If still no categories, use mock data
            console.warn('No categories found in context after fetch, using mock data');
            const mockCategories = [
              { _id: 'cat1', name: 'Electronics', status: 'active' },
              { _id: 'cat2', name: 'Clothing', status: 'active' },
              { _id: 'cat3', name: 'Home & Kitchen', status: 'active' },
              { _id: 'cat4', name: 'Books', status: 'active' },
              { _id: 'cat5', name: 'Sports', status: 'active' }
            ];
            setCategories(mockCategories);
          }
        } else {
          // If no fetchCategories function in context, use mock data
          console.warn('No fetchCategories function in context, using mock data');
          const mockCategories = [
            { _id: 'cat1', name: 'Electronics', status: 'active' },
            { _id: 'cat2', name: 'Clothing', status: 'active' },
            { _id: 'cat3', name: 'Home & Kitchen', status: 'active' },
            { _id: 'cat4', name: 'Books', status: 'active' },
            { _id: 'cat5', name: 'Sports', status: 'active' }
          ];
          setCategories(mockCategories);
        }
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setCategoriesError(error.message || 'Failed to fetch categories');

      // Use mock data as fallback in case of error
      const mockCategories = [
        { _id: 'cat1', name: 'Electronics', status: 'active' },
        { _id: 'cat2', name: 'Clothing', status: 'active' },
        { _id: 'cat3', name: 'Home & Kitchen', status: 'active' },
        { _id: 'cat4', name: 'Books', status: 'active' },
        { _id: 'cat5', name: 'Sports', status: 'active' }
      ];
      setCategories(mockCategories);
    } finally {
      setCategoriesLoading(false);
    }
  }, [categoryContext]);

  // Fetch products from context
  const fetchProducts = useCallback(async (page = 1, limit = 100, search = '') => {
    try {
      setProductsLoading(true);
      setProductsError(null);

      console.log('Fetching products from ProductContext');

      // Check if we have products in the context
      if (productContext && productContext.products && productContext.products.length > 0) {
        console.log('Using products from context:', productContext.products.length);

        // Transform the products from context format to the format expected by the voucher component
        const transformedProducts = productContext.products.map(product => ({
          _id: product._id || product.id || '',
          name: product.name || '',
          sku: product.sku || '',
          status: product.status || 'active',
          price: product.price,
          currentPrice: product.currentPrice
        }));

        setProducts(transformedProducts);
        console.log('Products loaded from context:', transformedProducts.length);

        // Update pagination info
        setProductsPagination({
          page: productContext.currentPage || 1,
          limit: productContext.itemsPerPage || limit,
          total: productContext.totalProducts || transformedProducts.length,
          totalPages: productContext.totalPages || 1
        });
      } else {
        console.log('No products in context, fetching from API...');

        // If no products in context, try to fetch them
        if (productContext && typeof productContext.fetchLightProducts === 'function') {
          await productContext.fetchLightProducts(page, limit, search);

          // After fetching, check if we have products now
          if (productContext.products && productContext.products.length > 0) {
            const transformedProducts = productContext.products.map(product => ({
              _id: product._id || product.id || '',
              name: product.name || '',
              sku: product.sku || '',
              status: product.status || 'active',
              price: product.price,
              currentPrice: product.currentPrice
            }));

            setProducts(transformedProducts);
            console.log('Products loaded after context fetch:', transformedProducts.length);

            // Update pagination info
            setProductsPagination({
              page: productContext.currentPage || 1,
              limit: productContext.itemsPerPage || limit,
              total: productContext.totalProducts || transformedProducts.length,
              totalPages: productContext.totalPages || 1
            });
          } else {
            // If still no products, use mock data
            console.warn('No products found in context after fetch, using mock data');
            const mockProducts = [
              { _id: 'prod1', name: 'Smartphone X', sku: 'SP-001', status: 'active' },
              { _id: 'prod2', name: 'Laptop Pro', sku: 'LP-002', status: 'active' },
              { _id: 'prod3', name: 'Wireless Headphones', sku: 'WH-003', status: 'active' },
              { _id: 'prod4', name: 'Smart Watch', sku: 'SW-004', status: 'active' },
              { _id: 'prod5', name: 'Bluetooth Speaker', sku: 'BS-005', status: 'active' }
            ];
            setProducts(mockProducts);
            setProductsPagination({
              page: 1,
              limit: limit,
              total: mockProducts.length,
              totalPages: 1
            });
          }
        } else {
          // If no fetchProducts function in context, use mock data
          console.warn('No fetchLightProducts function in context, using mock data');
          const mockProducts = [
            { _id: 'prod1', name: 'Smartphone X', sku: 'SP-001', status: 'active' },
            { _id: 'prod2', name: 'Laptop Pro', sku: 'LP-002', status: 'active' },
            { _id: 'prod3', name: 'Wireless Headphones', sku: 'WH-003', status: 'active' },
            { _id: 'prod4', name: 'Smart Watch', sku: 'SW-004', status: 'active' },
            { _id: 'prod5', name: 'Bluetooth Speaker', sku: 'BS-005', status: 'active' }
          ];
          setProducts(mockProducts);
          setProductsPagination({
            page: 1,
            limit: limit,
            total: mockProducts.length,
            totalPages: 1
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProductsError(error.message || 'Failed to fetch products');

      // Use mock data as fallback in case of error
      const mockProducts = [
        { _id: 'prod1', name: 'Smartphone X', sku: 'SP-001', status: 'active' },
        { _id: 'prod2', name: 'Laptop Pro', sku: 'LP-002', status: 'active' },
        { _id: 'prod3', name: 'Wireless Headphones', sku: 'WH-003', status: 'active' },
        { _id: 'prod4', name: 'Smart Watch', sku: 'SW-004', status: 'active' },
        { _id: 'prod5', name: 'Bluetooth Speaker', sku: 'BS-005', status: 'active' }
      ];
      setProducts(mockProducts);
      setProductsPagination({
        page: 1,
        limit: limit,
        total: mockProducts.length,
        totalPages: 1
      });
    } finally {
      setProductsLoading(false);
    }
  }, [productContext]);

  return {
    brands,
    categories,
    products,
    brandsLoading,
    categoriesLoading,
    productsLoading,
    brandsError,
    categoriesError,
    productsError,
    fetchBrands,
    fetchCategories,
    fetchProducts,
    productsPagination
  };
};
