import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AdminLayout from '@/components/admin/layouts/AdminLayout';
import UserReviewHistory from '@/components/admin/users/UserReviewHistory';
import Pagination from '@/components/admin/common/Pagination';
import { FiUsers, FiMessageSquare, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { GetServerSideProps } from 'next';
import { withAdminAuth } from '@/utils/withAdminAuth';

interface UserReview {
  reviewId: string;
  productId: string;
  variantId: string;
  productName: string;
  productImage: string;
  rating: number;
  content: string;
  images: { url: string; alt: string }[];
  likes: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  verified: boolean;
}

interface UserReviewsProps {
  userId: string;
  userName?: string;
}

const UserReviewsPage: React.FC<UserReviewsProps> = ({ userId, userName }) => {
  const router = useRouter();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [user, setUser] = useState<any>(null);

  // Lấy thông tin người dùng
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`/api/admin/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Không thể tải thông tin người dùng');
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // Lấy danh sách đánh giá
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Gọi API để lấy đánh giá của người dùng với phân trang
        const response = await axios.get(`/api/admin/reviews/user/${userId}`, {
          params: {
            page: currentPage,
            limit: itemsPerPage
          }
        });
        
        const data = response.data;
        
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
        setError(null);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Không thể tải đánh giá của người dùng');
        toast.error('Không thể tải đánh giá của người dùng');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReviews();
    }
  }, [userId, currentPage, itemsPerPage]);

  // Xử lý khi xem chi tiết đánh giá
  const handleViewReview = (reviewId: string) => {
    // Có thể mở modal hoặc chuyển hướng đến trang chi tiết đánh giá
    toast.loading('Đang tải chi tiết đánh giá...', { id: 'loading-review' });
    
    // Giả lập xử lý
    setTimeout(() => {
      toast.dismiss('loading-review');
      toast.success('Đã tải thông tin đánh giá');
      // Chức năng xem chi tiết có thể được thêm sau
      console.log('View review', reviewId);
    }, 500);
  };

  // Xử lý khi xem sản phẩm
  const handleViewProduct = (productId: string) => {
    toast.loading('Đang tải thông tin sản phẩm...', { id: 'loading-product' });
    
    // Giả lập xử lý
    setTimeout(() => {
      toast.dismiss('loading-product');
      toast.success('Đã tải thông tin sản phẩm');
      // Chuyển hướng đến trang sản phẩm
      router.push(`/admin/products/${productId}`);
    }, 500);
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:px-6 bg-white shadow-sm rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FiMessageSquare className="mr-2 text-pink-500" />
              Đánh giá của người dùng
            </h1>
            <p className="mt-1 text-gray-500 text-sm">
              {user ? (
                <>
                  Người dùng: <span className="font-medium text-gray-800">{user.name}</span> ({user.email})
                </>
              ) : (
                <>Đang tải thông tin người dùng...</>
              )}
            </p>
          </div>
          
          <button
            className="mt-3 sm:mt-0 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => router.push('/admin/users')}
          >
            <FiArrowLeft className="mr-2 -ml-0.5 h-4 w-4" />
            Quay lại danh sách
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiLoader className="h-8 w-8 text-pink-500 animate-spin mb-4" />
            <p className="text-gray-500">Đang tải đánh giá...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            <p>{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-gray-50 text-gray-500 p-12 text-center rounded-md">
            <FiMessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">Không có đánh giá nào</p>
            <p className="mt-1">Người dùng này chưa viết đánh giá nào.</p>
          </div>
        ) : (
          <>
            <UserReviewHistory 
              reviews={reviews}
              onViewReview={handleViewReview}
              onViewProduct={handleViewProduct}
              userId={userId}
            />
            
            <div className="mt-6">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                showItemsInfo={true}
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = withAdminAuth(async (context) => {
  const { id } = context.params || {};
  
  return {
    props: {
      userId: id as string,
    },
  };
});

export default UserReviewsPage;