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
 * 
 * Lưu ý: HeaderProvider phải được đặt sau CartProvider và WishlistProvider
 * vì HeaderContext cần sử dụng useCart() và useWishlist()
 */
export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children, withShopProduct = false }) => {
  return (
    <CategoryProvider>
      <BrandProvider>
        <CartProvider>
          <WishlistProvider>
            <HeaderProvider>
              <UserOrderProvider>
                <UserPaymentProvider>
                  <OrderProvider>
                    <UserReviewProvider>
                      {children}
                    </UserReviewProvider>
                  </OrderProvider>
                </UserPaymentProvider>
              </UserOrderProvider>
            </HeaderProvider>
          </WishlistProvider>
        </CartProvider>
      </BrandProvider>
    </CategoryProvider>
  );
};

export default UserContextProvider;
