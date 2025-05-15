import React, { ReactNode } from 'react';
import { CategoryProvider } from './categories/CategoryContext';
import { BrandProvider } from './brands/BrandContext';
import { CartProvider } from './cart/CartContext';
import { WishlistProvider } from './wishlist/WishlistContext';
import { UserOrderProvider } from './UserOrderContext';
import { UserPaymentProvider } from './UserPaymentContext';
import { OrderProvider } from './OrderContext';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { UserReviewProvider } from '@/contexts/user/UserReviewContext';

interface UserContextProviderProps {
  children: ReactNode;
  withShopProduct?: boolean;
}

/**
 * Provider tích hợp tất cả các context phía người dùng
 * Sử dụng trong index.tsx để cung cấp context cho các trang người dùng
 */
export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children, withShopProduct = false }) => {
  return (
    <CategoryProvider>
      <BrandProvider>
        <CartProvider>
          <WishlistProvider>
            <UserOrderProvider>
              <UserPaymentProvider>
                <OrderProvider>
                  <UserReviewProvider>
                    <HeaderProvider>
                      {children}
                    </HeaderProvider>
                  </UserReviewProvider>
                </OrderProvider>
              </UserPaymentProvider>
            </UserOrderProvider>
          </WishlistProvider>
        </CartProvider>
      </BrandProvider>
    </CategoryProvider>
  );
};

export default UserContextProvider;
