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
    <header className="w-full bg-white relative">
      {/* Thông báo hệ thống */}
      <div className="relative z-[52]">
        <NotificationSection />
      </div>

      {/* Logo, tìm kiếm, tài khoản, giỏ hàng */}
      <div className="relative z-[51]">
        <MiddleHeader
          onMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          cartItemCount={cartItemCount}
          wishlistItemCount={wishlistItemCount}
        />
      </div>

      {/* Navigation chính */}
      <div className="relative z-[50]">
        <BottomHeader
          categories={categories}
          featuredBrands={featuredBrands}
        />
      </div>

      {/* Menu mobile */}
      <div className="relative z-[53]">
        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          categories={categories}
          featuredBrands={featuredBrands}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
        />
      </div>
    </header>
  );
}