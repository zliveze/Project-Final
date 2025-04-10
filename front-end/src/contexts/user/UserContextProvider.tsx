import React, { ReactNode } from 'react';
import { CategoryProvider } from './categories/CategoryContext';
import { BrandProvider } from './brands/BrandContext';
import { ShopProductProvider } from './shop/ShopProductContext';

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
          {children}
        </ShopProductProvider>
      </BrandProvider>
    </CategoryProvider>
  );
};

export default UserContextProvider; 