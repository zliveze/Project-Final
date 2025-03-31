import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ProfileProvider, useProfile } from '../../contexts/ProfileContext';
import DefaultLayout from '../../layout/DefaultLayout';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSidebar from '../../components/profile/ProfileSidebar';
import ProfileContent from '../../components/profile/ProfileContent';

// Component con lấy dữ liệu từ Context
const ProfileMain: React.FC = () => {
  const router = useRouter();
  const {
    user,
    activeTab,
    orders,
    wishlistItems,
    notifications,
    reviews,
    selectedOrder,
    showOrderModal,
    setShowOrderModal,
    handleUpdateProfile,
    handleRemoveFromWishlist,
    handleAddToCart,
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
    handleOrderStatusFilterChange,
    handleTabChange,
    handleLogout
  } = useProfile();

  // Đếm số thông báo chưa đọc
  const unreadNotificationCount = notifications.filter(notif => !notif.isRead).length;

  // Xử lý nút back
  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileHeader 
          title="Trang cá nhân" 
          onBack={handleBack}
          onLogout={handleLogout}
        />
        
        <div className="flex flex-col md:flex-row gap-6">
          <ProfileSidebar
            user={user}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            notificationCount={unreadNotificationCount}
          />
          
          <ProfileContent
            activeTab={activeTab}
            user={user}
            orders={orders}
            wishlistItems={wishlistItems}
            notifications={notifications}
            reviews={reviews}
            selectedOrder={selectedOrder}
            showOrderModal={showOrderModal}
            setShowOrderModal={setShowOrderModal}
            handleUpdateProfile={handleUpdateProfile}
            handleRemoveFromWishlist={handleRemoveFromWishlist}
            handleAddToCart={handleAddToCart}
            handleViewOrderDetails={handleViewOrderDetails}
            handleDownloadInvoice={handleDownloadInvoice}
            handleCancelOrder={handleCancelOrder}
            handleReturnOrder={handleReturnOrder}
            handleBuyAgain={handleBuyAgain}
            handleMarkAsRead={handleMarkAsRead}
            handleMarkAllAsRead={handleMarkAllAsRead}
            handleDeleteNotification={handleDeleteNotification}
            handleEditReview={handleEditReview}
            handleDeleteReview={handleDeleteReview}
            handleOrderStatusFilterChange={handleOrderStatusFilterChange}
          />
        </div>
      </div>
    </div>
  );
};

// Component gốc bọc Provider context
const ProfilePage: NextPage = () => {
  return (
    <ProfileProvider>
      <DefaultLayout>
        <Head>
          <title>Trang cá nhân | YUMIN</title>
          <meta name="description" content="Quản lý thông tin cá nhân, địa chỉ và đơn hàng" />
        </Head>
        
        <ProfileMain />
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </DefaultLayout>
    </ProfileProvider>
  );
};

export default ProfilePage; 