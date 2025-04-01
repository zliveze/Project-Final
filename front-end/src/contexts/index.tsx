import React from 'react';
import { AuthProvider } from './AuthContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { NotificationProvider } from './NotificationContext';
import { BannerProvider } from './BannerContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <NotificationProvider>
          <BannerProvider>
            {children}
          </BannerProvider>
        </NotificationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export { useAuth } from './AuthContext';
export { useAdminAuth } from './AdminAuthContext';
export { useNotification } from './NotificationContext';
export { useBanner } from './BannerContext'; 