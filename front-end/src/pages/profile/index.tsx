import React, { useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { ProfileProvider, useProfile } from '../../contexts/user/ProfileContext';
import DefaultLayout from '../../layout/DefaultLayout';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSidebar from '../../components/profile/ProfileSidebar';
import ProfileContent from '../../components/profile/ProfileContent';

// Component con lấy dữ liệu từ Context
const ProfileMain: React.FC = () => {
  const router = useRouter();
  // const { isAuthenticated, isLoading: authLoading } = useAuth(); // Gỡ bỏ - ProfileContext đã xử lý
  const {
    user,
    activeTab,
    orders,
    wishlistItems, // Khôi phục wishlist
    notifications,
    reviews,
    selectedOrder,
    showOrderModal,
    setShowOrderModal,
    handleUpdateProfile,
    handleRemoveFromWishlist, // Khôi phục wishlist
    handleAddToCart, // Khôi phục wishlist (nếu liên quan)
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
    handleLogout,
  } = useProfile();

  // useEffect(() => { // Gỡ bỏ - ProfileContext đã xử lý
  //   // Chỉ kiểm tra khi auth context đã load xong và user chưa đăng nhập
  //   if (!authLoading && !isAuthenticated) {
  //     router.push('/auth/login'); // Chuyển hướng đến /auth/login
  //   }
  // }, [isAuthenticated, authLoading, router]);

  // Đếm số thông báo chưa đọc - Thêm kiểm tra null/undefined
  const unreadNotificationCount = Array.isArray(notifications)
    ? notifications.filter(notif => !notif.isRead).length 
    : 0;

  // Xử lý nút back
  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="container mx-auto px-4">
        <ProfileHeader 
          title="Trang cá nhân" 
          onBack={handleBack}
          onLogout={handleLogout}
        />
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <ProfileSidebar
              user={user}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              notificationCount={unreadNotificationCount}
            />
          </div>
          
          <div className="w-full md:w-3/4">
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
