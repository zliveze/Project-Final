import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FiMessageSquare, FiEye, FiStar, FiThumbsUp, FiFilter, FiCalendar, FiSearch, FiGrid, FiList, FiCheck, FiClock, FiXCircle, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface ReviewImage {
  url: string;
  alt: string;
}

interface ReviewItem {
  reviewId: string;
  productId: string;
  variantId: string;
  productName: string;
  productImage: string;
  rating: number;
  content: string;
  images: ReviewImage[];
  likes: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  verified: boolean;
}

interface UserReviewHistoryProps {
  reviews: ReviewItem[];
  onViewReview: (reviewId: string) => void;
  onViewProduct: (productId: string) => void;
  // userId: string; // Commented out as it's unused
}

const UserReviewHistory: React.FC<UserReviewHistoryProps> = ({
  reviews,
  onViewReview,
  onViewProduct,
  // userId // Commented out as it's unused
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentReviewImages, setCurrentReviewImages] = useState<ReviewImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4 mr-1" />;
      case 'approved':
        return <FiCheck className="w-4 h-4 mr-1" />;
      case 'rejected':
        return <FiXCircle className="w-4 h-4 mr-1" />;
      default:
        return <FiMessageSquare className="w-4 h-4 mr-1" />;
    }
  };

  // Hiển thị số sao dưới dạng icon
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push(<FiStar key={i} className="text-yellow-400 fill-current w-4 h-4" />);
      } else {
        stars.push(<FiStar key={i} className="text-gray-300 w-4 h-4" />);
      }
    }
    return <div className="flex">{stars}</div>;
  };

  // Lọc đánh giá theo trạng thái và số sao
  const filteredReviews = reviews.filter(review => {
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    const matchesSearch = 
      searchTerm === '' || 
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      review.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesRating && matchesSearch;
  });

  // Sắp xếp đánh giá theo ngày
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleDateSort = () => {
    setDateSort(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleViewReview = (reviewId: string) => {
    setSelectedReview(reviewId);
    setIsLoading(true);
    toast.loading('Đang tải thông tin đánh giá...');
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.dismiss();
      toast.success('Đã tải thông tin đánh giá');
      onViewReview(reviewId);
    }, 800);
  };

  const handleViewProduct = (productId: string) => {
    setIsLoading(true);
    toast.loading('Đang tải thông tin sản phẩm...');
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.dismiss();
      toast.success('Đã tải thông tin sản phẩm');
      onViewProduct(productId);
    }, 800);
  };

  const openImageModal = (review: ReviewItem, initialIndex: number = 0) => {
    setCurrentReviewImages(review.images);
    setSelectedImageIndex(initialIndex);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = useCallback(() => {
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % currentReviewImages.length);
  }, [currentReviewImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? currentReviewImages.length - 1 : prevIndex - 1
    );
  }, [currentReviewImages.length]);

  // Xử lý phím bấm cho modal hình ảnh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentReviewImages.length, nextImage, prevImage]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0 flex items-center">
          <FiMessageSquare className="mr-2 text-pink-500" />
          Lịch sử đánh giá
          <span className="ml-2 bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {reviews.length}
          </span>
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Chế độ xem danh sách"
          >
            <FiList className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Chế độ xem lưới"
          >
            <FiGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col space-y-3">
          {/* Thanh tìm kiếm */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition duration-150 ease-in-out"
              placeholder="Tìm kiếm đánh giá..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Bộ lọc */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition duration-150 ease-in-out appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiStar className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition duration-150 ease-in-out appearance-none"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="all">Tất cả đánh giá</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={toggleDateSort}
              className="inline-flex items-center w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-150 ease-in-out"
            >
              <FiCalendar className="mr-2 h-5 w-5 text-gray-400" />
              {dateSort === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
            </button>
          </div>
        </div>
      </div>
      
      {sortedReviews.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <p className="mt-2 text-lg font-medium">Không có đánh giá nào</p>
          <p className="mt-1">Người dùng này chưa viết đánh giá nào.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedReviews.map((review) => (
            <div 
              key={review.reviewId} 
              className={`bg-white rounded-lg border hover:shadow-lg transition-all duration-200 overflow-hidden ${
                selectedReview === review.reviewId ? 'ring-2 ring-pink-500' : ''
              }`}
            >
              <div className="relative h-48 bg-gray-200">
                <Image 
                  src={review.productImage} 
                  alt={review.productName} 
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full" // className might not be directly applicable in the same way, but next/image handles optimization
                />
                <div className="absolute top-2 right-2">
                  <span className={`flex items-center text-xs px-2 py-1 rounded-full border ${getStatusColor(review.status)}`}>
                    {getStatusIcon(review.status)}
                    {getStatusText(review.status)}
                  </span>
                </div>
                {review.verified && (
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200">
                      Đã mua
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1 truncate">{review.productName}</h3>
                
                <div className="flex items-center mb-2">
                  {renderStars(review.rating)}
                  <span className="ml-1 text-xs text-gray-500">{review.date}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {review.content}
                </p>
                
                {review.images.length > 0 && (
                  <div className="flex -mx-1 mb-3 overflow-hidden">
                    {review.images.slice(0, 3).map((image, index) => (
                      <div 
                        key={index} 
                        className="px-1 w-1/3 cursor-pointer transform hover:scale-105 transition-transform duration-200"
                        onClick={() => openImageModal(review, index)}
                      >
                        <div className="h-16 rounded overflow-hidden relative">
                          <Image 
                            src={image.url} 
                            alt={image.alt} 
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                      </div>
                    ))}
                    {review.images.length > 3 && (
                      <div 
                        className="px-1 w-1/3 cursor-pointer"
                        onClick={() => openImageModal(review, 3)}
                      >
                        <div className="h-16 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-500">+{review.images.length - 3}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiThumbsUp className="mr-1 h-4 w-4" />
                    <span>{review.likes}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewProduct(review.productId)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-blue-50"
                      title="Xem sản phẩm"
                      disabled={isLoading}
                    >
                      <FiExternalLink className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleViewReview(review.reviewId)}
                      className="text-pink-600 hover:text-pink-900 transition-colors p-1 rounded-full hover:bg-pink-50"
                      title="Xem chi tiết đánh giá"
                      disabled={isLoading}
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {sortedReviews.map((review) => (
            <div 
              key={review.reviewId} 
              className={`p-6 hover:bg-gray-50 transition-all duration-150 ${
                selectedReview === review.reviewId ? 'bg-pink-50' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden relative">
                    <Image 
                      className="transition-transform duration-200 hover:scale-110" 
                      src={review.productImage} 
                      alt={review.productName} 
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2 hover:text-pink-600 cursor-pointer" onClick={() => handleViewProduct(review.productId)}>
                        {review.productName}
                      </div>
                      {review.verified && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Đã mua
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-1 text-sm text-gray-500">{review.date}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {review.content.length > 150 
                        ? `${review.content.substring(0, 150)}...` 
                        : review.content}
                    </div>
                    
                    {/* Hiển thị ảnh đánh giá nếu có */}
                    {review.images.length > 0 && (
                      <div className="mt-3 flex space-x-2 overflow-x-auto">
                        {review.images.slice(0, 4).map((image, index) => (
                          <div 
                            key={index} 
                            className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
                            onClick={() => openImageModal(review, index)}
                          >
                            <Image className="h-full w-full object-cover" src={image.url} alt={image.alt} layout="fill" objectFit="cover" />
                          </div>
                        ))}
                        {review.images.length > 4 && (
                          <div 
                            className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center cursor-pointer"
                            onClick={() => openImageModal(review, 4)}
                          >
                            <span className="text-sm font-medium text-gray-500">+{review.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center">
                      <div className="flex items-center text-sm text-gray-500 mr-4">
                        <FiThumbsUp className="mr-1 h-4 w-4" />
                        <span>{review.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex flex-col items-end">
                  <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(review.status)}`}>
                    {getStatusIcon(review.status)}
                    {getStatusText(review.status)}
                  </span>
                  
                  <div className="mt-2 flex space-x-2">
                    <button 
                      onClick={() => handleViewProduct(review.productId)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-blue-50"
                      title="Xem sản phẩm"
                      disabled={isLoading}
                    >
                      <FiExternalLink className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleViewReview(review.reviewId)}
                      className="text-pink-600 hover:text-pink-900 transition-colors p-1 rounded-full hover:bg-pink-50"
                      title="Xem chi tiết đánh giá"
                      disabled={isLoading}
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal xem ảnh */}
      {isModalOpen && currentReviewImages.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center transition-opacity duration-300 ease-in-out">
          <div className="relative max-w-3xl w-full mx-auto p-4">
            <button 
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <FiXCircle className="w-8 h-8" />
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden shadow-xl">
              <div className="relative bg-gray-900 h-96"> {/* Added h-96 for the parent to constrain Image with layout fill */}
                <Image 
                  src={currentReviewImages[selectedImageIndex].url} 
                  alt={currentReviewImages[selectedImageIndex].alt} 
                  layout="fill"
                  objectFit="contain"
                  className="mx-auto" // className might not be directly applicable in the same way
                />
                
                {currentReviewImages.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {currentReviewImages.length > 1 && (
                <div className="p-2 bg-gray-100">
                  <div className="flex justify-center space-x-2 overflow-x-auto">
                    {currentReviewImages.map((image, index) => (
                      <div 
                        key={index} 
                        className={`h-16 w-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer ${
                          selectedImageIndex === index ? 'ring-2 ring-pink-500' : ''
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <Image className="h-full w-full object-cover" src={image.url} alt={image.alt} layout="fill" objectFit="cover"/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReviewHistory;
