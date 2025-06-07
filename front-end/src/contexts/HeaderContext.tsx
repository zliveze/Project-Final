import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useCart } from './user/cart/CartContext';
import { useWishlist } from './user/wishlist/WishlistContext';
import { useAuth } from './AuthContext';
import axiosInstance from '@/lib/axiosInstance';

// Định nghĩa các kiểu dữ liệu
export interface CategoryItem {
  name: string;
  slug: string;
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

  // Danh sách các từ khóa phổ biến
  const [popularSearchTerms] = useState<string[]>([
    'Sữa rửa mặt',
    'Kem chống nắng',
    'Serum vitamin C',
    'Cetaphil',
    'Mặt nạ dưỡng da',
    'Nước tẩy trang',
    'Innisfree',
    'Tẩy tế bào chết',
    'Son môi',
    'Dưỡng ẩm',
    'La Roche-Posay',
    'Lotion dưỡng ẩm',
    'Kem dưỡng ban đêm',
    'Phấn phủ kiềm dầu',
    'Mascara chống trôi'
  ]);

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

      // Fallback to mock data in case of API error
      const mockProducts: SearchProduct[] = [
        {
          _id: 'mock1',
          name: 'Son Kem Lì Black Rouge Air Fit Velvet Tint Ver.9',
          slug: 'son-kem-li-black-rouge-air-fit-velvet-tint-ver-9',
          price: 180000,
          currentPrice: 159000,
          imageUrl: '/images/products/son-black-rouge-ver9.jpg',
          brandName: 'Black Rouge',
        },
        {
          _id: 'mock2',
          name: 'Nước Tẩy Trang L\'Oreal Revitalift Hyaluronic Acid',
          slug: 'nuoc-tay-trang-loreal-revitalift-hyaluronic-acid',
          price: 250000,
          imageUrl: '/images/products/tay-trang-loreal-ha.jpg',
          brandName: 'L\'Oréal',
        },
        {
          _id: 'mock3',
          name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400',
          slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
          price: 550000,
          currentPrice: 495000,
          imageUrl: '/images/products/kcn-laroche-posay-uvmune400.jpg',
          brandName: 'La Roche-Posay',
        }
      ];

      // Lọc dữ liệu giả theo từ khóa tìm kiếm
      const lowerCaseTerm = term.toLowerCase();
      const results = mockProducts.filter(product =>
        product.name.toLowerCase().includes(lowerCaseTerm) ||
        (product.brandName && product.brandName.toLowerCase().includes(lowerCaseTerm))
      );

      console.log('Fallback to mock data:', results.length);
      setSearchResults(results);
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
    // Mock data cho categories
    const mockCategories: Category[] = [
      {
        name: 'Chăm Sóc Da Mặt',
        slug: 'cham-soc-da-mat',
        children: [
          { name: 'Kem Chống Nắng', slug: 'kem-chong-nang' },
          { name: 'Sữa Rửa Mặt', slug: 'sua-rua-mat' },
          { name: 'Nước Tẩy Trang', slug: 'nuoc-tay-trang' },
          { name: 'Mặt Nạ', slug: 'mat-na' },
        ]
      },
      {
        name: 'Trang Điểm',
        slug: 'trang-diem',
        children: [
          { name: 'Son Môi', slug: 'son-moi' },
          { name: 'Kem Nền - Cushion', slug: 'kem-nen-cushion' },
          { name: 'Mascara', slug: 'mascara' },
          { name: 'Phấn Phủ', slug: 'phan-phu' },
        ]
      },
      {
        name: 'Chăm Sóc Cơ Thể',
        slug: 'cham-soc-co-the',
        children: [
          { name: 'Sữa Tắm', slug: 'sua-tam' },
          { name: 'Dưỡng Thể', slug: 'duong-the' },
          { name: 'Kem Chống Nắng Body', slug: 'kem-chong-nang-body' },
          { name: 'Tẩy Tế Bào Chết', slug: 'tay-te-bao-chet' },
        ]
      },
      {
        name: 'Chăm Sóc Tóc',
        slug: 'cham-soc-toc',
        children: [
          { name: 'Dầu Gội', slug: 'dau-goi' },
          { name: 'Dầu Xả', slug: 'dau-xa' },
          { name: 'Kem Ủ Tóc', slug: 'kem-u-toc' },
          { name: 'Dưỡng Tóc', slug: 'duong-toc' },
        ]
      },
    ];

    // Mock data cho brands
    const mockBrands: Brand[] = [
      { name: 'Innisfree', slug: 'innisfree', featured: true },
      { name: 'The Face Shop', slug: 'the-face-shop', featured: true },
      { name: 'Laneige', slug: 'laneige', featured: true },
      { name: 'Maybelline', slug: 'maybelline', featured: true },
    ];

    // Đã loại bỏ mock data cho notifications vì đã được xử lý trong NotificationSection.tsx

    // Cập nhật state
    setCategories(mockCategories);
    setFeaturedBrands(mockBrands.filter(brand => brand.featured));

    // TODO: Lấy dữ liệu từ local storage hoặc API
    // Kiểm tra xem người dùng đã đăng nhập chưa
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

    // Không cần thiết lập giá trị mặc định cho cartItemCount và wishlistItemCount
    // vì chúng sẽ được cập nhật từ CartContext và WishlistContext
  }, []);

  const value = {
    isMobileMenuOpen,
    setMobileMenuOpen,
    categories,
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