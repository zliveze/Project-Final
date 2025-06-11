import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useCart } from './user/cart/CartContext';
import { useWishlist } from './user/wishlist/WishlistContext';
import { useAuth } from './AuthContext';
import axiosInstance from '@/lib/axiosInstance';

// Định nghĩa các kiểu dữ liệu
export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  level: number;
  parentId?: string;
  childrenCount?: number;
  image?: {
    url: string;
    alt?: string;
  };
}

export interface Category extends CategoryItem {
  children?: CategoryItem[];
}

export interface Brand {
  name: string;
  slug: string;
  featured: boolean;
}

// Đã loại bỏ interface Notification vì đã được xử lý trong NotificationSection.tsx

export interface UserProfile {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice?: number;
  imageUrl: string;
  brandName?: string;
}

export type HeaderContextType = {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  categories: Category[];
  allCategories: CategoryItem[]; // Thêm để lưu tất cả categories (flat)
  featuredBrands: Brand[];
  cartItemCount: number;
  wishlistItemCount: number;
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  updateAuthState: (isLoggedIn: boolean, userProfile: UserProfile | null) => void;
  // Tìm kiếm sản phẩm
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: SearchProduct[];
  isSearching: boolean;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  performSearch: (term: string) => Promise<void>;
  handleViewAllResults: () => void;
  // Từ khóa phổ biến
  popularSearchTerms: string[];
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]); // Thêm state cho tất cả categories
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  // Đã loại bỏ state notifications vì đã được xử lý trong NotificationSection.tsx
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Sử dụng CartContext và WishlistContext để lấy số lượng sản phẩm
  // Không cần try-catch nữa vì chúng ta đảm bảo CartProvider và WishlistProvider
  // đã được khởi tạo trước HeaderProvider trong cấu trúc component
  const cart = useCart();
  const wishlist = useWishlist();

  // State cho tìm kiếm sản phẩm
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Force reset showSearchResults when pathname changes
  useEffect(() => {
    setShowSearchResults(false);
    setSearchTerm('');
  }, [router.pathname]);

  // Danh sách các từ khóa phổ biến - Sẽ được lấy từ API trong tương lai
  const [popularSearchTerms] = useState<string[]>([]);

  // Hàm xây dựng cây phân cấp từ dữ liệu phẳng
  const buildCategoryTree = useCallback((flatCategories: CategoryItem[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Tạo map của tất cả categories
    flatCategories.forEach(cat => {
      const category: Category = {
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level || 1,
        parentId: cat.parentId,
        childrenCount: cat.childrenCount || 0,
        image: cat.image,
        children: []
      };
      categoryMap.set(cat._id, category);
    });

    // Xây dựng cây phân cấp
    flatCategories.forEach(cat => {
      const category = categoryMap.get(cat._id);
      if (!category) return;

      if (cat.parentId && categoryMap.has(cat.parentId)) {
        // Có parent, thêm vào children của parent
        const parent = categoryMap.get(cat.parentId);
        if (parent && parent.children) {
          parent.children.push(category);
        }
      } else {
        // Không có parent, đây là root category
        rootCategories.push(category);
      }
    });

    // Sắp xếp theo order và name
    const sortCategories = (categories: Category[]): Category[] => {
      return categories.sort((a, b) => {
        // Sắp xếp theo level trước, sau đó theo name
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        return a.name.localeCompare(b.name);
      }).map(cat => ({
        ...cat,
        children: cat.children ? sortCategories(cat.children) : []
      }));
    };

    return sortCategories(rootCategories);
  }, []);

  // Hàm cập nhật trạng thái đăng nhập và thông tin người dùng
  const updateAuthState = (newIsLoggedIn: boolean, newUserProfile: UserProfile | null) => {
    setIsLoggedIn(newIsLoggedIn);
    setUserProfile(newUserProfile);
  };

  // Log changes to searchTerm and showSearchResults to help with debugging
  useEffect(() => {
    console.log('HeaderContext - searchTerm changed:', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    console.log('HeaderContext - showSearchResults changed:', showSearchResults);
  }, [showSearchResults]);

  // Hàm thực hiện tìm kiếm sản phẩm
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      console.log('Performing search for term:', term);

      // Gọi API tìm kiếm sản phẩm
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';
      const searchUrl = `${API_URL}/products/light?search=${encodeURIComponent(term.trim())}&limit=6`;

      console.log('Calling API:', searchUrl);
      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      // Chuyển đổi dữ liệu từ API sang định dạng SearchProduct
      const products: SearchProduct[] = data.products.map((product: {
        _id: string;
        name: string;
        slug: string;
        price: number;
        currentPrice?: number;
        imageUrl?: string;
        brandName?: string;
      }) => ({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        currentPrice: product.currentPrice,
        imageUrl: product.imageUrl || '/placeholder.png',
        brandName: product.brandName
      }));

      console.log('Processed search results:', products.length);
      setSearchResults(products);

      // Ghi lại hoạt động tìm kiếm nếu người dùng đã đăng nhập
      if (isAuthenticated && term.trim()) {
        try {
          await axiosInstance.post('/recommendations/log/search', {
            searchQuery: term.trim()
          });
        } catch (trackingError) {
          console.error('Error logging search activity:', trackingError);
        }
      }

    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      setSearchResults([]);
      // Không sử dụng dữ liệu giả nữa
    } finally {
      setIsSearching(false);
    }
  }, [isAuthenticated]);

  // Add useEffect to reset search results when router pathname changes
  useEffect(() => {
    if (router.pathname === '/shop') {
      // Delay clearing search results to prevent flickering
      const timer = setTimeout(() => {
        setSearchResults([]);
        setShowSearchResults(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [router.pathname, router.query]);

  // Hàm xử lý khi người dùng muốn xem tất cả kết quả tìm kiếm
  const handleViewAllResults = useCallback(() => {
    if (searchTerm) {
      const encodedTerm = encodeURIComponent(searchTerm.trim());
      console.log('Chuyển hướng đến trang shop với từ khóa:', searchTerm);

      // Thêm random query param để đảm bảo router phát hiện thay đổi
      const timestamp = new Date().getTime();

      // Sử dụng router.push với options và callback để đảm bảo chuyển hướng hoàn tất
      router.push({
        pathname: '/shop',
        query: {
          search: encodedTerm,
          _: timestamp
        }
      }, undefined, { shallow: false }).then(() => {
        console.log('Đã chuyển hướng đến trang shop thành công');
        // Reset state
        setShowSearchResults(false);
      }).catch(err => {
        console.error('Lỗi khi chuyển hướng:', err);
      });
    }
  }, [searchTerm, router]);

  // Cập nhật số lượng sản phẩm trong giỏ hàng từ CartContext
  useEffect(() => {
    if (cart && cart.itemCount !== undefined) {
      setCartItemCount(cart.itemCount);
    }
  }, [cart, cart?.itemCount]);

  // Cập nhật số lượng sản phẩm trong wishlist từ WishlistContext
  useEffect(() => {
    if (wishlist && wishlist.itemCount !== undefined) {
      setWishlistItemCount(wishlist.itemCount);
    }
  }, [wishlist, wishlist?.itemCount]);

  // Tải dữ liệu từ API khi component được mount
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        // Lấy dữ liệu categories - lấy tất cả với limit lớn
        const categoriesResponse = await axiosInstance.get('/categories?limit=1000');
        if (categoriesResponse.data && categoriesResponse.data.items && categoriesResponse.data.items.length > 0) {
          // Lưu tất cả categories (flat) để sử dụng trong CategoryMegaMenu
          setAllCategories(categoriesResponse.data.items);
          // Xây dựng cây phân cấp từ dữ liệu phẳng
          const hierarchicalCategories = buildCategoryTree(categoriesResponse.data.items);
          setCategories(hierarchicalCategories);
        }

        // Lấy dữ liệu brands nổi bật
        const brandsResponse = await axiosInstance.get('/brands/featured');
        if (brandsResponse.data && Array.isArray(brandsResponse.data)) {
            setFeaturedBrands(brandsResponse.data);
        }

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu cho header:', error);
      }
    };

    fetchHeaderData();

    // Kiểm tra trạng thái đăng nhập từ local storage
    const userDataFromStorage = localStorage.getItem('user');
    if (userDataFromStorage) {
      try {
        const userData = JSON.parse(userDataFromStorage);
        setIsLoggedIn(true);
        setUserProfile(userData);
      } catch(error) {
        console.error('Failed to parse user data', error);
      }
    }
  }, [buildCategoryTree]);

  const value = {
    isMobileMenuOpen,
    setMobileMenuOpen,
    categories,
    allCategories, // Thêm allCategories vào value
    featuredBrands,
    cartItemCount,
    wishlistItemCount,
    isLoggedIn,
    userProfile,
    updateAuthState,
    // Tìm kiếm sản phẩm
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    showSearchResults,
    setShowSearchResults,
    performSearch,
    handleViewAllResults,
    popularSearchTerms
  };

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
};

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
