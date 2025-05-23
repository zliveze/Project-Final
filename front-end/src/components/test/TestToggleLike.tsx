'use client';

import React, { useState } from 'react';
import { useUserReview } from '../../contexts/user/UserReviewContext';
import { toast } from 'react-hot-toast';

const TestToggleLike: React.FC = () => {
  const [reviewId, setReviewId] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toggleLikeReview } = useUserReview();

  const handleTest = async () => {
    if (!reviewId.trim()) {
      toast.error('Vui lòng nhập Review ID');
      return;
    }

    setLoading(true);
    try {
      const success = await toggleLikeReview(reviewId, isLiked);
      if (success) {
        setIsLiked(!isLiked);
        toast.success('Test toggle like thành công!');
      } else {
        toast.error('Test toggle like thất bại!');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Có lỗi xảy ra trong test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h3 className="text-lg font-bold mb-4">Test Toggle Like Review</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Review ID:
        </label>
        <input
          type="text"
          value={reviewId}
          onChange={(e) => setReviewId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Nhập Review ID để test"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isLiked}
            onChange={(e) => setIsLiked(e.target.checked)}
            className="mr-2"
          />
          Trạng thái hiện tại: {isLiked ? 'Đã thích' : 'Chưa thích'}
        </label>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-pink-500 hover:bg-pink-600'
        }`}
      >
        {loading ? 'Đang test...' : 'Test Toggle Like'}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Hướng dẫn:</strong></p>
        <ol className="list-decimal list-inside mt-2">
          <li>Nhập một Review ID hợp lệ (24 ký tự hex)</li>
          <li>Chọn trạng thái hiện tại</li>
          <li>Nhấn "Test Toggle Like" để kiểm tra</li>
          <li>Kiểm tra console và network tab để xem logs</li>
        </ol>
      </div>
    </div>
  );
};

export default TestToggleLike; 