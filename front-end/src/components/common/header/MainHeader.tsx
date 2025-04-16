import React from 'react';
import NotificationSection from '../NotificationSection';
import MiddleHeader from './MiddleHeader';
import BottomHeader from './BottomHeader';
import MobileSideMenu from './MobileSideMenu';
import { useHeader } from '@/contexts/HeaderContext';

export default function MainHeader() {
  const {
    isMobileMenuOpen,
    setMobileMenuOpen,
    categories,
    featuredBrands,
    cartItemCount,
    wishlistItemCount,
    isLoggedIn,
    userProfile,
  } = useHeader();

  return (
    <header className="w-full relative z-40">
      {/* Thông báo hệ thống */}
      <NotificationSection />

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