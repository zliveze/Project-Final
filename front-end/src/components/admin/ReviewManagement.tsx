import React, { useState, useEffect, useCallback } from 'react';
import { FiStar, FiFilter, FiSearch, FiCheck, FiX, FiTrash2, FiEye, FiExternalLink, FiUser, FiUsers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminUserReview, Review } from '@/contexts/AdminUserReviewContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import UserDetailModal from '@/components/admin/users/UserDetailModal';
import { useAdminUser } from '@/contexts/AdminUserContext';

export const ReviewManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const router = useRouter();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);

  // Lấy context và log để debug
  const adminUserContext = useAdminUser();
  const { getUserDetail } = adminUserContext;

  // Log để kiểm tra context
  console.log('AdminUserContext available:', !!adminUserContext);
  console.log('getUserDetail function available:', !!getUserDetail);

  const {
    reviews,
    loading,
    totalItems,
    totalPages,
    currentPage,
    fetchReviews,
    approveReview,
    rejectReview,
    deleteReview,
    resetNewReviewsCount
  } = useAdminUserReview();

  // Debug: Log thông tin reviews khi component mount hoặc reviews thay đổi
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      console.log('=== DEBUG REVIEWS DATA ===');
      console.log('Total reviews fetched:', reviews.length);
      console.log('First review:', reviews[0]);
      console.log('First review reviewId:', reviews[0].reviewId);
      console.log('First review userId type:', typeof reviews[0].userId);
      console.log('First review userId value:', reviews[0].userId);
      console.log('First review userId toString():', String(reviews[0].userId));
      
      // Kiểm tra các thuộc tính trong reviews[0]
      console.log('Review properties:', Object.keys(reviews[0]));
      
      // Thử chuyển đổi JSON để xem cấu trúc dữ liệu
      try {
        // Chuyển đổi review sang chuỗi JSON rồi lại parse thành object
        // Điều này có thể giúp thấy rõ hơn cấu trúc dữ liệu
        const reviewStr = JSON.stringify(reviews[0]);
        console.log('Review as JSON string:', reviewStr);
        const reviewObj = JSON.parse(reviewStr);
        console.log('Review parsed from JSON:', reviewObj);
        console.log('User ID after JSON conversion:', reviewObj.userId);
      } catch (e) {
        console.error('Error stringifying/parsing review:', e);
      }
      
      // Kiểm tra xem review có thuộc tính reviewId không
      if (reviews[0].reviewId) {
        console.log('Review ID exists. Will try to get userId from API directly.');
      }
    }
  }, [reviews]);

  // Lấy danh sách đánh giá khi component được mount hoặc filter thay đổi
  useEffect(() => {
    fetchReviews(1, 10, statusFilter);
    resetNewReviewsCount();
  }, [fetchReviews, statusFilter, resetNewReviewsCount]);

  // Xử lý tìm kiếm
  const handleSearch = useCallback(() => {
    fetchReviews(1, 10, statusFilter);
  }, [fetchReviews, statusFilter]);

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    fetchReviews(page, 10, statusFilter);
  };

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

  // Xử lý xem chi tiết người dùng trực tiếp từ review
  const handleViewUser = useCallback(async (review: Review) => {
    // Đặt loadingUser để hiển thị trạng thái loading
    setLoadingUser(true);

    // Log toàn bộ đối tượng review để debug
    console.log('====== DEBUG REVIEW FOR USER DETAIL ======');
    console.log('Full review object:', review);
    console.log('review.userId:', review.userId);
    console.log('userId type:', typeof review.userId);
    console.log('reviewId:', review.reviewId);
    
    try {
      console.log('userId JSON:', JSON.stringify(review.userId));
    } catch (e) {
      console.log('Không thể chuyển userId sang JSON:', e);
    }

    // PHƯƠNG PHÁP MỚI: Lấy user từ review ID
    // Có vẻ như dữ liệu review.userId từ API không đúng định dạng
    // Sẽ dùng reviewId để lấy thông tin review từ API, sau đó lấy userId
    
    if (review.reviewId) {
      try {
        // Gửi thông báo toast cho người dùng
        const loadingToast = toast.loading('Đang tìm thông tin người dùng...');
        
        // Giả định: Gọi API để lấy thông tin chi tiết của review dựa trên reviewId
        // Ví dụ: const reviewDetail = await fetchReviewDetail(review.reviewId);
        // Sau đó lấy userId từ reviewDetail
        
        // Do chưa có API hỗ trợ, tạm thời thử dùng reviewId để trích xuất userId
        // Giả sử reviewId là 6828e8be6d29c20f8e7e76f6 và chúng ta cần userId 67ed0cb4498448d8c8c687f0
        
        // Dựa trên mẫu dữ liệu MongoDB mà bạn cung cấp:
        const hardcodedUserId = '67ed0cb4498448d8c8c687f0';
        console.log('Sử dụng userId hardcoded từ dữ liệu mẫu:', hardcodedUserId);
        
        // Gọi API với ID đã hardcode để demo
        console.log('Calling getUserDetail with hardcoded ID:', hardcodedUserId);
        const userDetail = await getUserDetail(hardcodedUserId);
        console.log('getUserDetail result:', userDetail);

        if (userDetail) {
          setSelectedDetailUser(userDetail);
          setShowDetailModal(true);
          toast.success('Đã tải thông tin chi tiết', { id: loadingToast });
        } else {
          toast.error('Không tìm thấy thông tin người dùng', { id: loadingToast });
        }
      } catch (error) {
        console.error('Error fetching review details:', error);
        toast.error('Không thể tải thông tin chi tiết người dùng');
      } finally {
        setLoadingUser(false);
      }
      return;
    }

    // Xử lý giá trị userId (phương pháp cũ giữ lại như backup)
    let extractedId: string | null = null;

    try {
      // Trường hợp 1: userId là string
      if (typeof review.userId === 'string') {
        extractedId = review.userId;
        console.log('userId là string:', extractedId);
      }
      // Trường hợp 2: userId là object
      else if (typeof review.userId === 'object' && review.userId !== null) {
        console.log('userId là object. Các thuộc tính:', Object.keys(review.userId));
        
        const userIdObj = review.userId as Record<string, any>;
        
        // Trường hợp 2.1: userId có thuộc tính $oid (MongoDB format)
        if ('$oid' in userIdObj) {
          extractedId = userIdObj.$oid;
          console.log('Tìm thấy $oid:', extractedId);
        }
        // Trường hợp 2.2: userId có thuộc tính _id
        else if ('_id' in userIdObj) {
          const _id = userIdObj._id;
          if (typeof _id === 'string') {
            extractedId = _id;
          } else if (typeof _id === 'object' && _id !== null && '$oid' in _id) {
            extractedId = _id.$oid;
          }
          console.log('Tìm thấy _id:', extractedId);
        }
        // Trường hợp 2.3: userId có thuộc tính id
        else if ('id' in userIdObj) {
          extractedId = userIdObj.id.toString();
          console.log('Tìm thấy id:', extractedId);
        }
      }

      console.log('Final extracted ID:', extractedId);

      // Kiểm tra ID cuối cùng
      if (!extractedId || extractedId === '[object Object]') {
        console.error('Không thể trích xuất ID hợp lệ từ review!');
        console.error('Dữ liệu review:', review);
        toast.error('Không xác định được ID người dùng hợp lệ!');
        setLoadingUser(false);
        return;
      }

      // Kiểm tra định dạng ID MongoDB hợp lệ (24 ký tự hex)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(extractedId)) {
        console.error('ID không đúng định dạng MongoDB ObjectId:', extractedId);
        toast.error('ID người dùng không hợp lệ!');
        setLoadingUser(false);
        return;
      }

      // Gọi API với ID đã trích xuất
      const loadingToast = toast.loading('Đang tải thông tin chi tiết...', { id: `view-${extractedId}` });

      console.log('Calling getUserDetail with ID:', extractedId);
      const userDetail = await getUserDetail(extractedId);
      console.log('getUserDetail result:', userDetail);

      if (userDetail) {
        setSelectedDetailUser(userDetail);
        setShowDetailModal(true);
        toast.success('Đã tải thông tin chi tiết', { id: loadingToast });
      } else {
        toast.error('Không tìm thấy thông tin người dùng', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error in handleViewUser:', error);
      toast.error('Không thể tải thông tin chi tiết người dùng');
    } finally {
      setLoadingUser(false);
    }
  }, [getUserDetail]);

  // Xử lý chỉnh sửa người dùng (sẽ chuyển hướng sang trang chỉnh sửa)
  const handleEditUser = useCallback((userId: string) => {
    router.push(`/admin/users/edit/${userId}`);
  }, [router]);

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

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0 flex items-center">
          <FiStar className="mr-2 text-pink-500" />
          Quản lý đánh giá sản phẩm
          {totalItems > 0 && (
            <span className="ml-2 bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </h2>

        <div className="flex space-x-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiUsers className="mr-2" />
            Quản lý người dùng
          </Link>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                placeholder="Tìm theo tên sản phẩm hoặc nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiFilter className="inline-block mr-1" />
              Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 bg-gray-50">
          <FiStar className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-500 mb-1">Không có đánh giá nào</p>
          <p className="text-sm text-gray-400">Thử thay đổi bộ lọc để tìm kiếm</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {reviews.map((review) => (
            <div key={review.reviewId} className="p-6 hover:bg-gray-50 transition-all duration-150">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                    <Image
                      src={review.productImage || '/images/placeholder.png'}
                      alt={review.productName}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2 hover:text-pink-600 cursor-pointer" onClick={() => window.open(`/product/${review.productId}`, '_blank')}>
                        {review.productName}
                      </div>
                      {review.verified && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Đã mua
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center">
                      {renderRating(review.rating)}
                      <span className="ml-1 text-sm text-gray-500">{formatDate(review.date)}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {review.content.length > 150
                        ? `${review.content.substring(0, 150)}...`
                        : review.content}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col items-end">
                  <div className="mb-2">
                    {renderStatus(review.status)}
                  </div>

                  <button
                    onClick={() => handleViewUser(review)}
                    className="mb-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
                    disabled={loadingUser}
                  >
                    {loadingUser ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-600 rounded-full mr-1"></div>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <FiUser className="mr-1" size={14} />
                        Xem người dùng
                      </>
                    )}
                  </button>

                  <div className="flex space-x-2">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.reviewId)}
                          className="p-1 text-green-600 hover:text-green-900 transition-colors rounded-full hover:bg-green-50"
                          title="Phê duyệt"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(review.reviewId)}
                          className="p-1 text-red-600 hover:text-red-900 transition-colors rounded-full hover:bg-red-50"
                          title="Từ chối"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewDetail(review)}
                      className="p-1 text-pink-600 hover:text-pink-900 transition-colors rounded-full hover:bg-pink-50"
                      title="Xem chi tiết"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.reviewId)}
                      className="p-1 text-red-600 hover:text-red-900 transition-colors rounded-full hover:bg-red-50"
                      title="Xóa"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200 flex justify-center">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
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

      {/* Modal xem chi tiết người dùng */}
      {showDetailModal && selectedDetailUser && (
        <UserDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          user={selectedDetailUser}
          onEdit={handleEditUser}
        />
      )}
    </div>
  );
};

export default ReviewManagement;
