import React from 'react';
import dynamic from 'next/dynamic';
import ProfileInfo from './ProfileInfo';
import AddressList from './AddressList';
import OrderDetailModal from './OrderDetailModal';
import { TabType, Order, Notification, Review, WishlistItem, Address, User } from '../../types/profile.d';
import LoadingSpinner from '../common/LoadingSpinner'; // Import spinner

// Dynamic imports for tab components
const WishlistItems = dynamic(() => import('./WishlistItems'), {
  loading: () => <LoadingSpinner />,
});
const OrdersTab = dynamic(() => import('./OrdersTab'), {
  loading: () => <LoadingSpinner />,
});
const Notifications = dynamic(() => import('./Notifications'), {
  loading: () => <LoadingSpinner />,
});
const MyReviews = dynamic(() => import('./MyReviews'), {
  loading: () => <LoadingSpinner />,
});

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
  handleMarkAsRead: (notificationId: string) => void;
  handleMarkAllAsRead: () => void;
  handleDeleteNotification: (notificationId: string) => void;
  handleEditReview: (reviewId: string, updatedData: Partial<Review>) => void;
  handleDeleteReview: (reviewId: string) => void;
  // Add address handlers from context
  handleAddAddress: (address: Omit<Address, '_id'>) => Promise<void>;
  handleUpdateAddress: (updatedAddress: Address) => Promise<void>;
  handleDeleteAddress: (_id: string) => Promise<void>;
  handleSetDefaultAddress: (_id: string) => Promise<void>;
  handleBuyAgain: (orderId: string) => Promise<void>; // Added handleBuyAgain
  isLoading?: boolean;
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
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleDeleteNotification,
  handleEditReview,
  handleDeleteReview,
  // Destructure new props
  handleAddAddress,
  handleUpdateAddress,
  handleDeleteAddress,
  handleSetDefaultAddress,
  handleBuyAgain, // Destructure handleBuyAgain
  isLoading = false
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

            {/* Render AddressList directly */}
            <div className="mt-8"> {/* Add margin top similar to AddressManager */}
              <AddressList
                addresses={user.addresses || []} // Ensure addresses is an array
                user={user}
                onAddAddress={handleAddAddress}
                onUpdateAddress={handleUpdateAddress}
                onDeleteAddress={handleDeleteAddress}
                onSetDefaultAddress={handleSetDefaultAddress}
                // No need for onCancelAdd here as AddressList handles its own form visibility
              />
            </div>
          </div>
        );
      case 'wishlist': // Khôi phục tab Wishlist
        return (
          <WishlistItems
            items={wishlistItems}
            onRemoveFromWishlist={handleRemoveFromWishlist}
            onAddToCart={handleAddToCart}
            isLoading={isLoading}
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
            onBuyAgain={handleBuyAgain} // Pass handleBuyAgain to OrdersTab
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
    <div className="flex-grow bg-white shadow rounded p-4 border border-gray-200">
      {renderContent()}

      {/* Modal chi tiết đơn hàng */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onCancelOrder={handleCancelOrder}
          onReturnOrder={handleReturnOrder}
        />
      )}
    </div>
  );
};

export default ProfileContent;
