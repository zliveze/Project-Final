import React, { createContext, useContext, useState, useEffect } from 'react';

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

export interface Notification {
  content: string;
  link: string;
  backgroundColor: string;
  textColor: string;
  priority: number;
}

export interface UserProfile {
  name?: string;
  email?: string;
  avatar?: string;
}

export type HeaderContextType = {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  categories: Category[];
  featuredBrands: Brand[];
  notifications: Notification[];
  cartItemCount: number;
  wishlistItemCount: number;
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  updateAuthState: (isLoggedIn: boolean, userProfile: UserProfile | null) => void;
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Hàm cập nhật trạng thái đăng nhập và thông tin người dùng
  const updateAuthState = (newIsLoggedIn: boolean, newUserProfile: UserProfile | null) => {
    setIsLoggedIn(newIsLoggedIn);
    setUserProfile(newUserProfile);
  };

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

    // Mock data cho notifications
    const mockNotifications: Notification[] = [
      { 
        content: 'Giảm 50% cho tất cả sản phẩm trong hôm nay!', 
        link: '/khuyen-mai', 
        backgroundColor: '#FFF1F6',
        textColor: '#D53F8C',
        priority: 1 
      },
      { 
        content: 'Miễn phí vận chuyển cho đơn hàng trên 500k', 
        link: '/chinh-sach-van-chuyen', 
        backgroundColor: '#EBFBEE',
        textColor: '#276749',
        priority: 2
      }
    ];

    // Cập nhật state
    setCategories(mockCategories);
    setFeaturedBrands(mockBrands.filter(brand => brand.featured));
    setNotifications(mockNotifications);

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
    notifications,
    cartItemCount,
    wishlistItemCount,
    isLoggedIn,
    userProfile,
    updateAuthState,
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