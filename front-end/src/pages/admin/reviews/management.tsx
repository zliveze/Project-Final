import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ReviewManagement } from '@/components/admin/ReviewManagement';
import { AdminUserReviewProvider } from '@/contexts/AdminUserReviewContext';
import { AdminUserProvider } from '@/contexts/AdminUserContext';

export default function ReviewManagementPage() {
  return (
    <AdminLayout title="Quản lý đánh giá sản phẩm">
      <AdminUserProvider>
        <AdminUserReviewProvider>
          <ReviewManagement />
        </AdminUserReviewProvider>
      </AdminUserProvider>
    </AdminLayout>
  );
} 