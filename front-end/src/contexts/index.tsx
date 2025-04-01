import React from 'react';
import { AuthProvider } from './AuthContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { NotificationProvider } from './NotificationContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export { useAuth } from './AuthContext';
export { useAdminAuth } from './AdminAuthContext';
export { useNotification } from './NotificationContext'; 