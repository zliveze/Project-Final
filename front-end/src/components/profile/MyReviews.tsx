import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaStarHalfAlt, FaRegStar, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Review } from './types';

interface MyReviewsProps {
  reviews: Review[];
  onEditReview?: (reviewId: string, updatedData: Partial<Review>) => void;
  onDeleteReview?: (reviewId: string) => void;
}

const MyReviews = ({ reviews, onEditReview, onDeleteReview }: MyReviewsProps) => {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Review>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }

    return stars;
  };

  const handleEditClick = (review: Review) => {
    setEditingReviewId(review._id);
    setEditFormData({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    });
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
    setEditFormData({});
  };

  const handleEditSubmit = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (onEditReview && editFormData) {
      onEditReview(reviewId, editFormData);
      toast.success('Cập nhật đánh giá thành công!');
      setEditingReviewId(null);
    }
  };

  const handleDeleteClick = (reviewId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      if (onDeleteReview) {
        onDeleteReview(reviewId);
        toast.success('Xóa đánh giá thành công!');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (newRating: number) => {
    setEditFormData((prev) => ({
      ...prev,
      rating: newRating,
    }));
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Đánh giá của tôi</h2>
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <FaStar className="text-pink-400 text-4xl" />
          </div>
          <p className="text-gray-500 mb-4">Bạn chưa có đánh giá nào</p>
          <Link href="/shop">
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity shadow-sm">
              Mua sắm ngay
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Đánh giá của tôi</h2>
      
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {editingReviewId === review._id ? (
              // Form chỉnh sửa đánh giá
              <form onSubmit={(e) => handleEditSubmit(e, review._id)} className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden mr-3">
                    <Image
                      src={review.productImage}
                      alt={review.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <Link href={`/shop/product/${review.productId}`} className="text-pink-600 hover:text-pink-800">
                      {review.productName}
                    </Link>
                    <p className="text-sm text-gray-500">Đánh giá ngày: {formatDate(review.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá sao</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`rating-${star}`}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="text-2xl focus:outline-none"
                      >
                        {star <= (editFormData.rating || 0) ? (
                          <FaStar className="text-yellow-400" />
                        ) : (
                          <FaRegStar className="text-yellow-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={editFormData.title || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={editFormData.comment || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            ) : (
              // Hiển thị đánh giá
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden mr-3">
                      <Image
                        src={review.productImage}
                        alt={review.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link href={`/shop/product/${review.productId}`} className="text-pink-600 hover:text-pink-800 font-medium">
                        {review.productName}
                      </Link>
                      <div className="flex items-center mt-1">
                        <div className="flex mr-2">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500">({review.rating.toFixed(1)})</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Đánh giá ngày: {formatDate(review.createdAt)}
                        {review.updatedAt && review.updatedAt !== review.createdAt && 
                          ` (Cập nhật: ${formatDate(review.updatedAt)})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(review)}
                      className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(review._id)}
                      className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                      title="Xóa"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h3 className="font-medium text-gray-900">{review.title}</h3>
                  <p className="text-gray-700 mt-1">{review.comment}</p>
                </div>
                
                {review.images && review.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</p>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {review.images.map((image, index) => (
                        <div key={index} className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                          <Image
                            src={image}
                            alt={`Ảnh ${index + 1}`}
                            fill
                            className="object-cover cursor-pointer hover:opacity-80"
                            onClick={() => window.open(image, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {review.isVerifiedPurchase && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      Đã mua hàng xác thực
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReviews;
