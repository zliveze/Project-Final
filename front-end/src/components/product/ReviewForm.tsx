import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiX, FiAlertCircle, FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { useUserReview } from '@/contexts/user/UserReviewContext';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
  productId: string;
  reviewId?: string | null;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  reviewId,
  onCancel,
  onSubmitSuccess,
}) => {
  const { createReview, updateReview, loading } = useUserReview();
  const { isAuthenticated } = useAuth();

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Tải dữ liệu đánh giá hiện có nếu đang ở chế độ chỉnh sửa
  useEffect(() => {
    const loadExistingReview = async () => {
      if (reviewId) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/reviews/${reviewId}`);
          if (response.ok) {
            const reviewData = await response.json();
            setRating(reviewData.rating || 5);
            setContent(reviewData.content || '');
            setReviewStatus(reviewData.status || 'pending');

            // Lưu trữ hình ảnh hiện có
            if (reviewData.images && reviewData.images.length > 0) {
              setExistingImages(reviewData.images);

              // Tạo URL preview cho hình ảnh hiện có
              const imageUrls = reviewData.images.map((img: any) => img.url);
              setImagePreviewUrls(imageUrls);
            }

            setIsEditMode(true);
          }
        } catch (error) {
          console.error('Lỗi khi tải đánh giá hiện có:', error);
          setError('Không thể tải đánh giá hiện có. Vui lòng thử lại sau.');
        }
      }
    };

    loadExistingReview();
  }, [reviewId]);

  // Lắng nghe sự kiện cập nhật trạng thái đánh giá từ WebSocket
  useEffect(() => {
    // Tạo hàm xử lý sự kiện client-review-status-changed
    const handleReviewStatusChange = (data: any) => {
      console.log('ReviewForm: Received client-review-status-changed event:', data);
      if (data && data.reviewId === reviewId) {
        setReviewStatus(data.status);

        // Hiển thị thông báo
        if (data.status === 'approved') {
          toast.success('Đánh giá của bạn đã được phê duyệt!', {
            position: "bottom-right",
            autoClose: 5000,
          });
        } else if (data.status === 'rejected') {
          toast.error('Đánh giá của bạn đã bị từ chối.', {
            position: "bottom-right",
            autoClose: 5000,
          });
        }
      }
    };

    // Đăng ký lắng nghe sự kiện từ socket
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    socket.on('client-review-status-changed', handleReviewStatusChange);

    // Cleanup function
    return () => {
      socket.off('client-review-status-changed', handleReviewStatusChange);
      socket.disconnect();
    };
  }, [reviewId]);

  // Xử lý khi chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);

    // Giới hạn số lượng ảnh tối đa là 5
    if (images.length + filesArray.length > 5) {
      toast.error('Bạn chỉ có thể tải lên tối đa 5 ảnh', {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB mỗi ảnh)
    const validFiles = filesArray.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== filesArray.length) {
      toast.error('Một số ảnh vượt quá kích thước tối đa 5MB', {
        position: "bottom-right",
        autoClose: 3000,
      });
    }

    // Tạo URL preview cho ảnh
    const newImagePreviewUrls = validFiles.map(file => URL.createObjectURL(file));

    setImages([...images, ...validFiles]);
    setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviewUrls]);
  };

  // Xử lý khi xóa ảnh
  const handleRemoveImage = (index: number) => {
    // Kiểm tra xem đây có phải là ảnh mới tải lên hay ảnh hiện có
    if (isEditMode && index < existingImages.length) {
      // Xóa ảnh hiện có
      const newExistingImages = [...existingImages];
      const newImagePreviewUrls = [...imagePreviewUrls];

      newExistingImages.splice(index, 1);
      newImagePreviewUrls.splice(index, 1);

      setExistingImages(newExistingImages);
      setImagePreviewUrls(newImagePreviewUrls);
    } else {
      // Xóa ảnh mới tải lên
      const adjustedIndex = isEditMode ? index - existingImages.length : index;

      if (adjustedIndex < 0 || adjustedIndex >= images.length) return;

      const newImages = [...images];
      const newImagePreviewUrls = [...imagePreviewUrls];

      // Giải phóng URL object để tránh rò rỉ bộ nhớ
      if (!isEditMode || index >= existingImages.length) {
        URL.revokeObjectURL(newImagePreviewUrls[index]);
      }

      if (isEditMode) {
        newImages.splice(adjustedIndex, 1);
        newImagePreviewUrls.splice(index, 1);
      } else {
        newImages.splice(adjustedIndex, 1);
        newImagePreviewUrls.splice(index, 1);
      }

      setImages(newImages);
      setImagePreviewUrls(newImagePreviewUrls);
    }
  };

  // Xử lý khi gửi đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);

    if (content.trim().length < 10) {
      setError('Nội dung đánh giá phải có ít nhất 10 ký tự');
      return;
    }

    // Kiểm tra đăng nhập trước khi thực hiện
    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để gửi đánh giá');
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu đánh giá
      const formData = new FormData();

      if (!isEditMode) {
        // Tạo đánh giá mới
        formData.append('productId', productId);
      }

      formData.append('rating', rating.toString());
      formData.append('content', content);

      // Thêm thông tin về hình ảnh hiện có (nếu đang chỉnh sửa)
      if (isEditMode && existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      // Thêm các ảnh mới vào formData nếu có
      if (images.length > 0) {
        // Thêm các file hình ảnh vào formData
        images.forEach((image) => {
          formData.append('reviewImages', image);
        });
      }

      // Log formData để debug
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      let success = false;

      if (isEditMode && reviewId) {
        // Cập nhật đánh giá hiện có
        success = await updateReview(reviewId, formData, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        // Tạo đánh giá mới
        success = await createReview(formData, (progress) => {
          setUploadProgress(progress);
        });
      }

      if (success) {
        // Giải phóng tất cả URL objects cho ảnh mới tải lên
        if (!isEditMode) {
          imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        } else {
          // Chỉ giải phóng URL của ảnh mới tải lên, không phải ảnh hiện có
          imagePreviewUrls.slice(existingImages.length).forEach(url => URL.revokeObjectURL(url));
        }

        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        {isEditMode ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá của bạn'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Hiển thị trạng thái đánh giá */}
      {reviewStatus && (
        <div className={`mb-4 p-3 rounded-md flex items-start ${
          reviewStatus === 'approved'
            ? 'bg-green-50 text-green-700'
            : reviewStatus === 'rejected'
              ? 'bg-red-50 text-red-700'
              : 'bg-yellow-50 text-yellow-700'
        }`}>
          {reviewStatus === 'approved' && <FiCheckCircle className="mt-0.5 mr-2 flex-shrink-0" />}
          {reviewStatus === 'rejected' && <FiXCircle className="mt-0.5 mr-2 flex-shrink-0" />}
          {reviewStatus === 'pending' && <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />}
          <p>
            {reviewStatus === 'approved' && 'Đánh giá của bạn đã được phê duyệt.'}
            {reviewStatus === 'rejected' && 'Đánh giá của bạn đã bị từ chối. Bạn có thể chỉnh sửa và gửi lại.'}
            {reviewStatus === 'pending' && 'Đánh giá của bạn đang chờ phê duyệt.'}
          </p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Đánh giá sao */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá của bạn
          </label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating === 1 && 'Rất không hài lòng'}
              {rating === 2 && 'Không hài lòng'}
              {rating === 3 && 'Bình thường'}
              {rating === 4 && 'Hài lòng'}
              {rating === 5 && 'Rất hài lòng'}
            </span>
          </div>
        </div>

        {/* Nội dung đánh giá */}
        <div className="mb-6">
          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung đánh giá
          </label>
          <textarea
            id="review-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#306E51] focus:border-[#306E51]"
            required
          />
          <p className={`mt-1 text-xs ${content.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
            Tối thiểu 10 ký tự. Hiện tại: {content.length} ký tự
          </p>
        </div>

        {/* Tải lên ảnh */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thêm hình ảnh (tùy chọn)
          </label>

          <div className="flex flex-wrap gap-3">
            {/* Hiển thị ảnh đã chọn */}
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative h-24 w-24 border rounded-md overflow-hidden">
                <Image
                  src={url}
                  alt={`Ảnh đánh giá ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}

            {/* Nút tải lên ảnh */}
            {images.length < 5 && (
              <label className="h-24 w-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <FiUpload className="text-gray-400 mb-1" size={20} />
                <span className="text-xs text-gray-500">Tải ảnh lên</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  name="reviewImages"
                />
              </label>
            )}
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Tối đa 5 ảnh, mỗi ảnh không quá 5MB
          </p>
        </div>

        {/* Hiển thị tiến trình upload */}
        {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <div className="flex items-center">
              <FiLoader className="animate-spin mr-2 text-pink-500" />
              <span className="text-sm text-gray-600">Đang tải lên ảnh: {uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div
                className="bg-pink-500 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Nút gửi và hủy */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#d53f8c] text-white rounded-md hover:bg-[#b83280] disabled:bg-gray-400"
            disabled={isSubmitting || loading || content.trim().length < 10}
          >
            {isSubmitting || loading ? 'Đang gửi...' : isEditMode ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;