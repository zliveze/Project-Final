import React, { useState, useEffect } from 'react';
import NotificationSection from '../NotificationSection';
import MiddleHeader from './MiddleHeader';
import BottomHeader from './BottomHeader';
import MobileSideMenu from './MobileSideMenu';
import MobileSearch from './MobileSearch';
import { useHeader } from '@/contexts/HeaderContext';
import { useCart } from '@/contexts/user/cart/CartContext';
import { useWishlist } from '@/contexts/user/wishlist/WishlistContext';
import { FiSearch } from 'react-icons/fi';

export default function MainHeader() {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Lấy thông tin từ các context
  const {
    isMobileMenuOpen,
    setMobileMenuOpen,
    categories,
    featuredBrands,
    isLoggedIn,
    userProfile,
  } = useHeader();

  // Lấy trực tiếp số lượng sản phẩm từ CartContext và WishlistContext
  const { itemCount: cartItemCount } = useCart();
  const { itemCount: wishlistItemCount } = useWishlist();

  return (
    <header className="w-full bg-white relative">
      {/* Thông báo hệ thống */}
      <div className="relative">
        <NotificationSection />
      </div>

      {/* Logo, tìm kiếm, tài khoản, giỏ hàng */}
      <div className="relative">
        <MiddleHeader
          onMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          cartItemCount={cartItemCount}
          wishlistItemCount={wishlistItemCount}
        />
      </div>

      {/* Navigation chính */}
      <div className="relative">
        <BottomHeader
          categories={categories}
          featuredBrands={featuredBrands}
        />
      </div>

      {/* Menu mobile */}
      <div className="relative">
        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          categories={categories}
          featuredBrands={featuredBrands}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
        />
      </div>

      {/* Mobile search */}
      <MobileSearch
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      {/* Mobile search button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-pink-600 text-white shadow-lg flex items-center justify-center"
        onClick={() => setIsMobileSearchOpen(true)}
        aria-label="Tìm kiếm"
      >
        <FiSearch className="w-5 h-5" />
      </button>
    </header>
  );
}