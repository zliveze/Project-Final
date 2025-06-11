import React from 'react';
import NotificationSection from '../NotificationSection';
import MiddleHeader from './MiddleHeader';
import BottomHeader from './BottomHeader';
import MobileSideMenu from './MobileSideMenu';
import { useHeader } from '@/contexts/HeaderContext';

export default function MainHeader() {

  // Lấy thông tin từ HeaderContext bao gồm cả cartItemCount và wishlistItemCount
  const {
    isMobileMenuOpen,
    setMobileMenuOpen,
    categories,
    allCategories,
    isLoggedIn,
    userProfile,
    cartItemCount,
    wishlistItemCount,
  } = useHeader();

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
          allCategories={allCategories}
          // featuredBrands={featuredBrands} // Removed as it's no longer a prop of BottomHeader
        />
      </div>

      {/* Menu mobile */}
      <div className="relative">
        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          categories={categories}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
        />
      </div>

      {/* Mobile search - Ẩn vì đã có thanh search trong header */}
      {/* <MobileSearch
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      <button
        className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-pink-600 text-white shadow-lg flex items-center justify-center"
        onClick={() => setIsMobileSearchOpen(true)}
        aria-label="Tìm kiếm"
      >
        <FiSearch className="w-5 h-5" />
      </button> */}
    </header>
  );
}
