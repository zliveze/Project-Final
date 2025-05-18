import React, { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiTrash2, FiAlertCircle, FiEye, FiImage, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminUserReview, Review } from '@/contexts/AdminUserReviewContext';
import Image from 'next/image';

interface UserReviewTabProps {
  userId: string;
}

const UserReviewTab: React.FC<UserReviewTabProps> = ({ userId }) => {
  const { userReviews, loading, fetchUserReviews, approveReview, rejectReview, deleteReview, updatePendingReviewsCount } = useAdminUserReview();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserReviews(userId);
      // Cập nhật số lượng đánh giá đang chờ duyệt
      updatePendingReviewsCount();
    }
  }, [userId, fetchUserReviews, updatePendingReviewsCount]);

  // Lọc đánh giá theo trạng thái và rating
  const filteredReviews = userReviews.filter(review => {
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === null || review.rating === ratingFilter;
    return matchesStatus && matchesRating;
  });

  // Xử lý phê duyệt đánh giá
  const handleApprove = async (reviewId: string) => {
    const success = await approveReview(reviewId);
    if (success) {
      toast.success('Đã phê duyệt đánh giá thành công');
    }
  };

  // Xử lý từ chối đánh giá
  const handleReject = async (reviewId: string) => {
    const success = await rejectReview(reviewId);
    if (success) {
      toast.success('Đã từ chối đánh giá thành công');
    }
  };

  // Xử lý xóa đánh giá
  const handleDelete = async (reviewId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
      const success = await deleteReview(reviewId);
      if (success) {
        toast.success('Đã xóa đánh giá thành công');
      }
    }
  };

  // Xử lý xem chi tiết đánh giá
  const handleViewDetail = (review: Review) => {
    setSelectedReview(review);
  };

  // Xử lý xem hình ảnh
  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // Hiển thị trạng thái đánh giá
  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Đã duyệt</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Từ chối</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Không xác định</span>;
    }
  };

  // Hiển thị rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Hiển thị ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="py-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
            <FiStar className="text-pink-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Đánh giá sản phẩm</h3>
          {filteredReviews.filter(review => review.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800 font-medium">
              {filteredReviews.filter(review => review.status === 'pending').length} chờ duyệt
            </span>
          )}
        </div>
        <a
          href={`/admin/reviews?userId=${userId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-600 hover:text-pink-800 flex items-center"
        >
          <FiExternalLink className="mr-1" size={14} />
          Xem trong trang quản lý
        </a>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
        <div>
          <label className="text-sm text-gray-600 mr-2">Trạng thái:</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mr-2">Đánh giá:</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={ratingFilter === null ? 'all' : ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? null : Number(e.target.value))}
          >
            <option value="all">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FiStar className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-500 mb-1">Người dùng chưa có đánh giá nào</p>
          <p className="text-sm text-gray-400">Các đánh giá sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.reviewId}
              className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${
                review.status === 'pending'
                  ? 'bg-pink-50 border-pink-200'
                  : review.status === 'approved'
                    ? 'bg-green-50 border-green-200'
                    : review.status === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="mr-2">
                    <Image
                      src={review.productImage || '/images/placeholder.png'}
                      alt={review.productName}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{review.productName}</h4>
                    <div className="flex items-center">
                      {renderRating(review.rating)}
                      <span className="ml-2 text-xs text-gray-500">{formatDate(review.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStatus(review.status)}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{review.content}</p>

              {review.images && review.images.length > 0 && (
                <div className="flex space-x-2 mb-2">
                  {review.images.slice(0, 3).map((image, index) => (
                    <div
                      key={index}
                      className="relative w-12 h-12 cursor-pointer"
                      onClick={() => handleViewImage(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Hình ảnh ${index + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ))}
                  {review.images.length > 3 && (
                    <div className="relative w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{review.images.length - 3}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => handleViewDetail(review)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="Xem chi tiết"
                >
                  <FiEye size={16} />
                </button>
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(review.reviewId)}
                      className="p-1 text-green-500 hover:text-green-700"
                      title="Phê duyệt"
                    >
                      <FiCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleReject(review.reviewId)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Từ chối"
                    >
                      <FiX size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(review.reviewId)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Xóa"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xem chi tiết đánh giá */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Chi tiết đánh giá</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start mb-4">
                <div className="mr-3">
                  <Image
                    src={selectedReview.productImage || '/images/placeholder.png'}
                    alt={selectedReview.productName}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">{selectedReview.productName}</h4>
                  <div className="flex items-center mb-1">
                    {renderRating(selectedReview.rating)}
                    <span className="ml-2 text-sm">{selectedReview.rating}/5</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Đánh giá vào: {formatDate(selectedReview.date)}
                    {selectedReview.isEdited && ' (đã chỉnh sửa)'}
                  </p>
                  <div className="mt-1">{renderStatus(selectedReview.status)}</div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-medium text-gray-700 mb-1">Nội dung đánh giá:</h5>
                <p className="text-gray-600 whitespace-pre-line">{selectedReview.content}</p>
              </div>

              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Hình ảnh:</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedReview.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-full h-24 cursor-pointer"
                        onClick={() => handleViewImage(image.url)}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt || `Hình ảnh ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-4">
                {selectedReview.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedReview.reviewId);
                        setSelectedReview(null);
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Phê duyệt
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedReview.reviewId);
                        setSelectedReview(null);
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Từ chối
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedReview.reviewId);
                    setSelectedReview(null);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem hình ảnh */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full"
            >
              <FiX size={20} />
            </button>
            <img
              src={selectedImage}
              alt="Hình ảnh đánh giá"
              className="max-h-[90vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReviewTab;
