import React, { ReactNode } from 'react';
import { CategoryProvider } from './categories/CategoryContext'; // Assuming path is correct
import { BrandProvider } from './brands/BrandContext'; // Assuming path is correct
import { ShopProductProvider } from './shop/ShopProductContext'; // Assuming path is correct
import { CartProvider } from './cart/CartContext'; // Import CartProvider

interface UserContextProviderProps {
  children: ReactNode;
}

/**
 * Provider tích hợp tất cả các context phía người dùng
 * Sử dụng trong index.tsx để cung cấp context cho các trang người dùng
 */
export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children }) => {
  return (
    <CategoryProvider> {/* Keep existing providers */}
      <BrandProvider>
        <ShopProductProvider>
          <CartProvider> {/* Wrap children with CartProvider */}
            {children}
          </CartProvider>
        </ShopProductProvider>
      </BrandProvider>
    </CategoryProvider>
  );
};

export default UserContextProvider;
