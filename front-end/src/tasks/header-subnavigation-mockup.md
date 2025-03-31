# Mockup MainHeader Component

Dưới đây là mockup cho component MainHeader mới, bao gồm các phần TopHeader, MiddleHeader, BottomHeader và MobileSideMenu.

## 1. HeaderContext.tsx

```tsx
// src/context/HeaderContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type HeaderContextType = {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  categories: any[];
  featuredBrands: any[];
  notifications: any[];
  cartItemCount: number;
  wishlistItemCount: number;
  isLoggedIn: boolean;
  userProfile: any | null;
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [featuredBrands, setFeaturedBrands] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Tải dữ liệu từ API khi component được mount
  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));

    // Fetch featured brands
    fetch('/api/brands?featured=true')
      .then(res => res.json())
      .then(data => setFeaturedBrands(data));

    // Fetch active notifications
    fetch('/api/notifications/active')
      .then(res => res.json())
      .then(data => setNotifications(data));

    // Kiểm tra trạng thái đăng nhập và lấy thông tin người dùng
    // Code kiểm tra đăng nhập và lấy thông tin giỏ hàng, wishlist
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
```

## 2. MainHeader.tsx

```tsx
// src/components/common/header/MainHeader.tsx
import React from 'react';
import TopHeader from './TopHeader';
import MiddleHeader from './MiddleHeader';
import BottomHeader from './BottomHeader';
import MobileSideMenu from './MobileSideMenu';
import { useHeader } from '@/context/HeaderContext';

export default function MainHeader() {
  const {
    isMobileMenuOpen,
    setMobileMenuOpen,
    notifications,
    categories,
    featuredBrands,
    cartItemCount,
    wishlistItemCount,
    isLoggedIn,
    userProfile,
  } = useHeader();

  return (
    <header className="w-full">
      {/* Thông báo hệ thống */}
      {notifications.length > 0 && <TopHeader notifications={notifications} />}

      {/* Logo, tìm kiếm, tài khoản, giỏ hàng */}
      <MiddleHeader
        onMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
        cartItemCount={cartItemCount}
        wishlistItemCount={wishlistItemCount}
      />

      {/* Navigation chính */}
      <BottomHeader
        categories={categories}
        featuredBrands={featuredBrands}
      />

      {/* Menu mobile */}
      <MobileSideMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        categories={categories}
        featuredBrands={featuredBrands}
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
      />
    </header>
  );
}
```

## 3. TopHeader.tsx (Thanh thông báo)

```tsx
// src/components/common/header/TopHeader.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';

interface TopHeaderProps {
  notifications: any[];
}

export default function TopHeader({ notifications }: TopHeaderProps) {
  const [currentNotification, setCurrentNotification] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Đổi thông báo theo thời gian
  useEffect(() => {
    if (notifications.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNotification((prev) => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications]);

  if (!isVisible || notifications.length === 0) return null;

  const notification = notifications[currentNotification];

  return (
    <div 
      className="w-full py-2 text-center text-sm"
      style={{
        backgroundColor: notification.backgroundColor || '#FFF1F6',
        color: notification.textColor || '#D53F8C'
      }}
    >
      <div className="container mx-auto px-4 relative">
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2"
          onClick={() => setIsVisible(false)}
        >
          <FiX className="w-4 h-4" />
        </button>
        
        {notification.link ? (
          <Link href={notification.link}>
            <span>{notification.content}</span>
          </Link>
        ) : (
          <span>{notification.content}</span>
        )}
      </div>
    </div>
  );
}
```

## 4. MiddleHeader.tsx (Logo, tìm kiếm, giỏ hàng)

```tsx
// src/components/common/header/MiddleHeader.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiSearch, FiUser, FiShoppingCart, FiHeart } from 'react-icons/fi';

interface MiddleHeaderProps {
  onMenuToggle: () => void;
  isLoggedIn: boolean;
  userProfile: any | null;
  cartItemCount: number;
  wishlistItemCount: number;
}

export default function MiddleHeader({
  onMenuToggle,
  isLoggedIn,
  userProfile,
  cartItemCount,
  wishlistItemCount,
}: MiddleHeaderProps) {
  return (
    <div className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-2.5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Menu button for mobile */}
          <button 
            className="lg:hidden text-white"
            onClick={onMenuToggle}
          >
            <FiMenu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-white text-xl font-semibold tracking-wide">YUMIN</span>
          </Link>

          {/* Search bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8 bg-white rounded-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu bạn mong muốn..."
                className="w-full pl-4 pr-12 py-2 rounded-md focus:outline-none text-sm"
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-r-md hover:opacity-90 transition-opacity">
                <span className="text-white text-sm">Tìm kiếm</span>
              </button>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* User account - desktop */}
            <div className="hidden lg:block">
              <Link href={isLoggedIn ? "/profile" : "/auth/login"} className="flex items-center text-white group">
                <FiUser className="w-5 h-5 mr-1.5" />
                <div className="flex flex-col">
                  <span className="text-sm">{isLoggedIn ? (userProfile?.name || 'Tài khoản') : 'Đăng nhập'}</span>
                  <span className="text-xs opacity-80">{isLoggedIn ? 'Quản lý' : 'Tài khoản'}</span>
                </div>
              </Link>
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative text-white">
              <FiHeart className="w-5 h-5" />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-300 text-pink-700 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
            
            {/* Cart */}
            <Link href="/cart" className="relative text-white">
              <FiShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-300 text-pink-700 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 5. BottomHeader.tsx (Danh mục, navigation)

```tsx
// src/components/common/header/BottomHeader.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { FiMenu } from 'react-icons/fi';
import CategoryMegaMenu from './CategoryMegaMenu';

interface BottomHeaderProps {
  categories: any[];
  featuredBrands: any[];
}

export default function BottomHeader({ categories, featuredBrands }: BottomHeaderProps) {
  const [showCategories, setShowCategories] = useState(false);

  return (
    <div className="w-full border-b relative bg-white">
      <div className="container mx-auto px-4">
        <div className="hidden lg:flex items-center justify-between h-[40px]">
          {/* Left side menu */}
          <div className="flex items-center space-x-6">
            <div 
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button className="flex items-center text-sm font-medium hover:text-pink-600">
                <FiMenu className="w-5 h-5 mr-2" />
                DANH MỤC
              </button>
              {showCategories && <CategoryMegaMenu categories={categories} />}
            </div>
            
            <Link href="/thuong-hieu" className="text-sm hover:text-pink-600">
              THƯƠNG HIỆU
            </Link>
            
            <Link href="/hang-moi-ve" className="text-sm hover:text-pink-600">
              HÀNG MỚI VỀ
            </Link>
            
            <Link href="/ban-chay" className="text-sm hover:text-pink-600">
              BÁN CHẠY
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/tra-cuu-don-hang" className="hover:text-pink-600">
              Tra cứu đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 6. CategoryMegaMenu.tsx (Menu danh mục nâng cao)

```tsx
// src/components/common/header/CategoryMegaMenu.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CategoryMegaMenuProps {
  categories: any[];
}

export default function CategoryMegaMenu({ categories }: CategoryMegaMenuProps) {
  return (
    <div className="absolute top-full left-0 bg-white shadow-lg rounded-b-md z-50 w-full max-w-screen-lg">
      <div className="grid grid-cols-4 gap-4 p-6">
        {categories.map((category, index) => (
          <div key={index} className="space-y-2">
            <Link 
              href={`/danh-muc/${category.slug}`}
              className="block font-medium text-sm hover:text-pink-600"
            >
              {category.name}
            </Link>
            
            <ul className="space-y-1">
              {category.children?.map((subCategory: any, subIndex: number) => (
                <li key={subIndex}>
                  <Link 
                    href={`/danh-muc/${subCategory.slug}`}
                    className="block text-sm text-gray-600 hover:text-pink-600"
                  >
                    {subCategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Featured/promo section */}
      <div className="p-4 bg-pink-50 rounded-b-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-sm mb-1">Ưu đãi đặc biệt</h3>
            <p className="text-xs text-gray-600">Giảm đến 50% cho sản phẩm mới</p>
            <Link href="/khuyen-mai" className="inline-block mt-2 text-xs text-pink-600 hover:underline">
              Xem ngay
            </Link>
          </div>
          
          <div className="w-24 h-24 relative">
            <Image
              src="/images/promo-cosmetics.jpg"
              alt="Ưu đãi đặc biệt"
              fill
              className="object-cover rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 7. MobileSideMenu.tsx (Menu mobile tích hợp)

```tsx
// src/components/common/header/MobileSideMenu.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { FiX, FiUser, FiShoppingCart, FiHeart, FiMapPin, FiPhone, FiChevronDown } from 'react-icons/fi';

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  featuredBrands: any[];
  isLoggedIn: boolean;
  userProfile: any | null;
}

export default function MobileSideMenu({
  isOpen,
  onClose,
  categories,
  featuredBrands,
  isLoggedIn,
  userProfile,
}: MobileSideMenuProps) {
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-50 z-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <span className="text-lg font-medium">Menu</span>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-pink-600 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Tài khoản */}
          <div className="p-4 border-b bg-gray-50">
            {isLoggedIn ? (
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                    <FiUser className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="font-medium">{userProfile?.name || 'Người dùng'}</div>
                    <div className="text-xs text-gray-500">{userProfile?.email || ''}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Link 
                    href="/profile" 
                    className="text-center py-1.5 text-sm border border-pink-500 text-pink-500 rounded-md"
                    onClick={onClose}
                  >
                    Tài khoản
                  </Link>
                  <Link 
                    href="/auth/logout" 
                    className="text-center py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md"
                    onClick={onClose}
                  >
                    Đăng xuất
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/auth/login" 
                  className="text-center py-2 text-sm bg-pink-500 text-white rounded-md"
                  onClick={onClose}
                >
                  Đăng nhập
                </Link>
                <Link 
                  href="/auth/register" 
                  className="text-center py-2 text-sm border border-pink-500 text-pink-500 rounded-md"
                  onClick={onClose}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              {/* Danh mục */}
              <div className="px-4 py-2 border-b">
                <div className="text-xs uppercase text-gray-500 mb-2">Danh mục sản phẩm</div>
                {categories.map((category, index) => (
                  <div key={index} className="mb-1">
                    <button
                      className="w-full flex items-center justify-between py-2 text-sm"
                      onClick={() => setOpenCategory(openCategory === index ? null : index)}
                    >
                      <span>{category.name}</span>
                      <FiChevronDown 
                        className={`w-4 h-4 transform transition-transform ${
                          openCategory === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {openCategory === index && category.children && (
                      <div className="pl-4 py-2 space-y-2 bg-gray-50">
                        {category.children.map((sub: any, subIndex: number) => (
                          <Link
                            key={subIndex}
                            href={`/danh-muc/${sub.slug}`}
                            className="block py-1.5 text-sm text-gray-600 hover:text-pink-600"
                            onClick={onClose}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="px-4 py-2">
                <Link 
                  href="/thuong-hieu" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>THƯƠNG HIỆU</span>
                </Link>
                
                <Link 
                  href="/hang-moi-ve" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>HÀNG MỚI VỀ</span>
                </Link>
                
                <Link 
                  href="/ban-chay" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>BÁN CHẠY</span>
                </Link>
                
                <Link 
                  href="/tra-cuu-don-hang" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <span>Tra cứu đơn hàng</span>
                </Link>
                
                <Link 
                  href="/wishlist" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <FiHeart className="w-5 h-5 mr-3" />
                  <span>Danh sách yêu thích</span>
                </Link>
                
                <Link 
                  href="/cart" 
                  className="flex items-center py-3 border-b"
                  onClick={onClose}
                >
                  <FiShoppingCart className="w-5 h-5 mr-3" />
                  <span>Giỏ hàng</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="space-y-3">
              <Link href="/stores" className="flex items-center text-sm">
                <FiMapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span>Hệ thống cửa hàng</span>
              </Link>
              
              <Link href="/support" className="flex items-center text-sm">
                <FiPhone className="w-4 h-4 mr-2 text-gray-500" />
                <span>Hỗ trợ khách hàng</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

## Tích Hợp Vào Layout

```tsx
// src/layout/MainLayout.tsx
import { HeaderProvider } from '@/context/HeaderContext';
import MainHeader from '@/components/common/header/MainHeader';
import Footer from '@/components/common/Footer';

export default function MainLayout({ children }) {
  return (
    <HeaderProvider>
      <div className="flex flex-col min-h-screen">
        <MainHeader />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </HeaderProvider>
  );
}
``` 