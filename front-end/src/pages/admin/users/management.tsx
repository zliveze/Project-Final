import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminUserProvider } from '@/contexts/AdminUserContext';

export default function UserManagementPage() {
  return (
    <AdminLayout title="Quản lý người dùng">
      <AdminUserProvider>
        <UserManagement />
      </AdminUserProvider>
    </AdminLayout>
  );
} 