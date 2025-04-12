import React, { ReactNode } from 'react';
import { CategoryProvider } from './categories/CategoryContext';
import { BrandProvider } from './brands/BrandContext';
import { ShopProductProvider } from './shop/ShopProductContext';
import { CartProvider } from './cart/CartContext';
import { WishlistProvider } from './wishlist/WishlistContext'; // Import WishlistProvider

interface UserContextProviderProps {
  children: ReactNode;
}

/**
 * Provider tích hợp tất cả các context phía người dùng
 * Sử dụng trong index.tsx để cung cấp context cho các trang người dùng
 */
export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children }) => {
  return (
    <CategoryProvider>
      <BrandProvider>
        <ShopProductProvider>
          <CartProvider>
            <WishlistProvider> {/* Wrap with WishlistProvider */}
              {children}
            </WishlistProvider>
          </CartProvider>
        </ShopProductProvider>
      </BrandProvider>
    </CategoryProvider>
  );
};

export default UserContextProvider;
