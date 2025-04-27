import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

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
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  // Đã loại bỏ state notifications vì đã được xử lý trong NotificationSection.tsx
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // State cho tìm kiếm sản phẩm
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Hàm cập nhật trạng thái đăng nhập và thông tin người dùng
  const updateAuthState = (newIsLoggedIn: boolean, newUserProfile: UserProfile | null) => {
    setIsLoggedIn(newIsLoggedIn);
    setUserProfile(newUserProfile);
  };

  // Hàm thực hiện tìm kiếm sản phẩm
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);

      // Gọi API tìm kiếm sản phẩm
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Xử lý từ khóa tìm kiếm
      const processedTerm = term.trim();

      // Đảm bảo mã hóa URL đúng cách với từ khóa tiếng Việt
      const encodedTerm = encodeURIComponent(processedTerm);
      console.log('Tìm kiếm với từ khóa:', processedTerm, 'Đã mã hóa:', encodedTerm);

      // Tăng limit lên 20 để hiển thị nhiều kết quả hơn
      const searchUrl = `${API_URL}/products/light?search=${encodedTerm}&limit=20`;
      console.log('URL tìm kiếm:', searchUrl);

      const response = await fetch(searchUrl);

      if (!response.ok) {
        console.error('Lỗi khi tìm kiếm sản phẩm, status:', response.status);
        throw new Error(`Lỗi khi tìm kiếm sản phẩm: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Kết quả tìm kiếm:', data.products.length, 'sản phẩm');

      // Log chi tiết hơn nếu không tìm thấy kết quả
      if (data.products.length === 0) {
        console.log('Không tìm thấy sản phẩm nào với từ khóa:', processedTerm);

        // Thử tìm kiếm với từ khóa đơn giản hơn (loại bỏ dấu gạch dưới)
        if (processedTerm.includes('_')) {
          const simplifiedTerm = processedTerm.replace(/_/g, ' ');
          console.log('Thử tìm kiếm với từ khóa đơn giản hơn:', simplifiedTerm);

          // Gọi lại hàm tìm kiếm với từ khóa đơn giản hơn
          // Nhưng chỉ log, không thực sự thực hiện tìm kiếm để tránh vòng lặp vô hạn
        }
      } else {
        console.log('Danh sách sản phẩm tìm thấy:', data.products.map((p: any) => p.name).join(', '));
      }

      // Chuyển đổi dữ liệu từ API sang định dạng SearchProduct
      const formattedResults: SearchProduct[] = data.products.map((product: any) => ({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        currentPrice: product.currentPrice,
        imageUrl: product.imageUrl || '/placeholder.png',
        brandName: product.brandName
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Hàm xử lý khi người dùng muốn xem tất cả kết quả tìm kiếm
  const handleViewAllResults = useCallback(() => {
    if (searchTerm) {
      // Xử lý từ khóa tìm kiếm
      const processedTerm = searchTerm.trim();

      // Đảm bảo mã hóa URL đúng cách với từ khóa tiếng Việt
      const encodedTerm = encodeURIComponent(processedTerm);
      console.log('Chuyển hướng đến trang shop với từ khóa:', processedTerm, 'Đã mã hóa:', encodedTerm);

      // Tạo URL với tham số tìm kiếm
      const shopUrl = `/shop?search=${encodedTerm}`;
      console.log('URL chuyển hướng:', shopUrl);

      // Chuyển hướng đến trang shop với tham số tìm kiếm
      router.push(shopUrl);
      // Đóng kết quả tìm kiếm
      setShowSearchResults(false);
    }
  }, [searchTerm, router]);

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

    // TODO: Lấy số lượng sản phẩm trong giỏ hàng và wishlist
    // Giả lập dữ liệu
    setCartItemCount(0);
    setWishlistItemCount(0);
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