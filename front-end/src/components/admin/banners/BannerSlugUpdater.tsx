import React, { useState, useEffect } from 'react';
import { useBanner } from '@/contexts/BannerContext';
import { toast } from 'react-hot-toast';
import { FiRefreshCw, FiCheck, FiAlertCircle } from 'react-icons/fi';

/**
 * Component để cập nhật đường dẫn href của tất cả banner từ /shop?campaign= thành /shop?campaignId=
 */
const BannerSlugUpdater: React.FC = () => {
  const { banners, fetchBanners, updateBanner } = useBanner();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalToUpdate, setTotalToUpdate] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tìm các banner cần cập nhật
  useEffect(() => {
    const bannersToUpdate = banners.filter(banner => 
      banner.campaignId && 
      banner.href && 
      banner.href.includes(`/shop?campaign=${banner.campaignId}`)
    );
    setTotalToUpdate(bannersToUpdate.length);
  }, [banners]);

  // Hàm cập nhật tất cả banner
  const updateAllBanners = async () => {
    setIsUpdating(true);
    setUpdatedCount(0);
    setIsComplete(false);
    setError(null);

    try {
      // Lọc các banner cần cập nhật
      const bannersToUpdate = banners.filter(banner => 
        banner.campaignId && 
        banner.href && 
        banner.href.includes(`/shop?campaign=${banner.campaignId}`)
      );

      setTotalToUpdate(bannersToUpdate.length);

      if (bannersToUpdate.length === 0) {
        toast.success('Không có banner nào cần cập nhật!');
        setIsComplete(true);
        setIsUpdating(false);
        return;
      }

      // Cập nhật từng banner
      for (const banner of bannersToUpdate) {
        if (!banner._id || !banner.campaignId) continue;

        const oldHref = banner.href;
        const newHref = `/shop?campaignId=${banner.campaignId}`;

        // Chỉ cập nhật nếu href thực sự khác
        if (oldHref !== newHref) {
          await updateBanner(banner._id, {
            ...banner,
            href: newHref
          });
          setUpdatedCount(prev => prev + 1);
        }
      }

      // Tải lại danh sách banner sau khi cập nhật
      await fetchBanners();
      
      toast.success(`Đã cập nhật ${updatedCount} banner thành công!`);
      setIsComplete(true);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật banner:', error);
      setError(error.message || 'Đã xảy ra lỗi khi cập nhật banner');
      toast.error('Đã xảy ra lỗi khi cập nhật banner');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Cập nhật đường dẫn banner</h3>
          <p className="text-sm text-gray-500 mt-1">
            Cập nhật đường dẫn từ <code>/shop?campaign=</code> thành <code>/shop?campaignId=</code>
          </p>
          {totalToUpdate > 0 && !isComplete && (
            <p className="text-sm text-yellow-600 mt-1">
              <FiAlertCircle className="inline-block mr-1" />
              Có {totalToUpdate} banner cần cập nhật
            </p>
          )}
          {isComplete && (
            <p className="text-sm text-green-600 mt-1">
              <FiCheck className="inline-block mr-1" />
              Đã cập nhật {updatedCount} banner thành công
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-1">
              <FiAlertCircle className="inline-block mr-1" />
              {error}
            </p>
          )}
        </div>
        <button
          onClick={updateAllBanners}
          disabled={isUpdating || totalToUpdate === 0}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isUpdating || totalToUpdate === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'
          }`}
        >
          {isUpdating ? (
            <>
              <FiRefreshCw className="animate-spin mr-2 -ml-1 h-5 w-5" />
              Đang cập nhật...
            </>
          ) : (
            <>
              <FiRefreshCw className="mr-2 -ml-1 h-5 w-5" />
              Cập nhật tất cả
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BannerSlugUpdater;
