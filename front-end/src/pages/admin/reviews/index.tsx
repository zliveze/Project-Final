import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ReviewManagement } from '@/components/admin/ReviewManagement';

// AdminUserProvider và AdminUserReviewProvider đã được cung cấp bởi AdminWrapper trong _app.tsx
export default function ReviewsPage() {
  return (
    <AdminLayout title="Quản lý đánh giá sản phẩm">
      <ReviewManagement />
    </AdminLayout>
  );
}
