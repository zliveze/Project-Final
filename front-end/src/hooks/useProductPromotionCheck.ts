import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { toast } from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho kết quả kiểm tra
export interface ProductPromotionCheck {
  productId: string;
  variantId?: string;
  inEvent: boolean;
  eventId?: string;
  eventName?: string;
  inCampaign: boolean;
  campaignId?: string;
  campaignName?: string;
}

// Hook để kiểm tra sản phẩm trong Event và Campaign
export const useProductPromotionCheck = () => {
  const { accessToken } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductPromotionCheck[]>([]);

  // Hàm kiểm tra sản phẩm
  const checkProducts = useCallback(async (productIds: string[]): Promise<ProductPromotionCheck[]> => {
    if (!accessToken) {
      toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/check-promotions`,
        { productIds },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      // Kiểm tra cấu trúc dữ liệu phản hồi
      const data = response.data;
      
      // Đảm bảo kết quả là mảng
      const results = Array.isArray(data) ? data : [];
      
      setResults(results);
      return results;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể kiểm tra sản phẩm';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Hàm lọc sản phẩm không thuộc về Campaign
  const filterProductsNotInCampaign = useCallback(async (productIds: string[]): Promise<string[]> => {
    const results = await checkProducts(productIds);
    return results
      .filter(result => !result.inCampaign)
      .map(result => result.productId);
  }, [checkProducts]);

  // Hàm lọc sản phẩm không thuộc về Event
  const filterProductsNotInEvent = useCallback(async (productIds: string[]): Promise<string[]> => {
    const results = await checkProducts(productIds);
    return results
      .filter(result => !result.inEvent)
      .map(result => result.productId);
  }, [checkProducts]);

  // Hàm kiểm tra xem sản phẩm đã có trong Event hoặc Campaign chưa
  const isProductInPromotions = useCallback(async (productId: string): Promise<{inEvent: boolean, inCampaign: boolean}> => {
    const results = await checkProducts([productId]);
    if (results.length === 0) {
      return { inEvent: false, inCampaign: false };
    }
    return {
      inEvent: results[0].inEvent,
      inCampaign: results[0].inCampaign
    };
  }, [checkProducts]);

  return {
    loading,
    error,
    results,
    checkProducts,
    filterProductsNotInCampaign,
    filterProductsNotInEvent,
    isProductInPromotions
  };
};

export default useProductPromotionCheck;
