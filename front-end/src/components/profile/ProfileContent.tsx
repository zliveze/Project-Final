import React from 'react';
import ProfileInfo from './ProfileInfo';
import WishlistItems from './WishlistItems'; // Khôi phục Wishlist
import OrdersTab from './OrdersTab';
import Notifications from './Notifications';
import MyReviews from './MyReviews';
import AddressManager from './AddressManager';
import OrderDetailModal from './OrderDetailModal';
import { TabType, Order, Notification, Review, WishlistItem, Address, User, OrderStatusType } from './types'; // Khôi phục WishlistItem

interface ProfileContentProps {
  activeTab: TabType;
  user: User;
  orders: Order[];
  wishlistItems: WishlistItem[]; // Khôi phục Wishlist
  notifications: Notification[];
  reviews: Review[];
  selectedOrder: Order | null;
  showOrderModal: boolean;
  setShowOrderModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpdateProfile: (updatedUser: Partial<User>) => void;
  handleRemoveFromWishlist: (productId: string, variantId?: string | null) => void; // Khôi phục Wishlist
  handleAddToCart: (productId: string, variantId?: string | null) => void; // Khôi phục Wishlist
  handleViewOrderDetails: (orderId: string) => void;
  handleDownloadInvoice: (orderId: string) => void;
  handleCancelOrder: (orderId: string) => void;
  handleReturnOrder: (orderId: string) => void;
  handleBuyAgain: (orderId: string) => void;
  handleMarkAsRead: (notificationId: string) => void;
  handleMarkAllAsRead: () => void;
  handleDeleteNotification: (notificationId: string) => void;
  handleEditReview: (reviewId: string, updatedData: Partial<Review>) => void;
  handleDeleteReview: (reviewId: string) => void;
  handleOrderStatusFilterChange: (status: OrderStatusType) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  activeTab,
  user,
  orders,
  wishlistItems, // Khôi phục Wishlist
  notifications,
  reviews,
  selectedOrder,
  showOrderModal,
  setShowOrderModal,
  handleUpdateProfile,
  handleRemoveFromWishlist, // Khôi phục Wishlist
  handleAddToCart, // Khôi phục Wishlist
  handleViewOrderDetails,
  handleDownloadInvoice,
  handleCancelOrder,
  handleReturnOrder,
  handleBuyAgain,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleDeleteNotification,
  handleEditReview,
  handleDeleteReview,
  handleOrderStatusFilterChange
}) => {
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div>
            <ProfileInfo
              user={user}
              onUpdate={handleUpdateProfile}
            />
            
            <AddressManager
              user={user}
              onAddAddress={(address) => user.addresses && user.addresses.length < 10 && handleUpdateProfile({
                addresses: [...user.addresses, { ...address, addressId: `new-${Date.now()}`, isDefault: !user.addresses.length }]
              })}
              onUpdateAddress={(address) => handleUpdateProfile({
                addresses: user.addresses.map(addr => addr.addressId === address.addressId ? address : addr)
              })}
              onDeleteAddress={(addressId) => handleUpdateProfile({
                addresses: user.addresses.filter(addr => addr.addressId !== addressId)
              })}
              onSetDefaultAddress={(addressId) => handleUpdateProfile({
                addresses: user.addresses.map(addr => ({
                  ...addr,
                  isDefault: addr.addressId === addressId
                }))
              })}
            />
          </div>
        );
      case 'wishlist': // Khôi phục tab Wishlist
        return (
          <WishlistItems
            items={wishlistItems}
            onRemoveFromWishlist={handleRemoveFromWishlist}
            onAddToCart={handleAddToCart}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            orders={orders}
            onViewOrderDetails={handleViewOrderDetails}
            onDownloadInvoice={handleDownloadInvoice}
            onCancelOrder={handleCancelOrder}
            onReturnOrder={handleReturnOrder}
            onBuyAgain={handleBuyAgain}
          />
        );
      case 'notifications':
        return (
          <Notifications
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
          />
        );
      case 'reviews':
        return (
          <MyReviews
            reviews={reviews}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            <p>Vui lòng chọn một tab từ menu bên trái</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-grow p-3 bg-white">
      {renderContent()}
      
      {/* Modal chi tiết đơn hàng */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onBuyAgain={handleBuyAgain}
          onDownloadInvoice={handleDownloadInvoice}
          onCancelOrder={handleCancelOrder}
          onReturnOrder={handleReturnOrder}
        />
      )}
    </div>
  );
};

export default ProfileContent;
