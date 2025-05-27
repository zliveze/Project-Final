import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, TrendingUp, Calendar, Package, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

// Interface cho Top Product
interface TopProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  currentPrice: number;
  status: string;
  imageUrl: string;
  brandId?: string;
  brandName?: string;
  categoryIds: Array<{
    id: string;
    name: string;
  }>;
  flags: any;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  soldCount: number;
  totalQuantity30Days?: number; // Chỉ có cho 30 ngày
  totalOrders30Days?: number; // Chỉ có cho 30 ngày
}

// Interface cho API Response
interface TopProductsResponse {
  products: TopProduct[];
  period: 'all-time' | '30-days';
  total: number;
  generatedAt: string;
}

export default function TopProducts() {
  const [activeTab, setActiveTab] = useState<'all-time' | '30-days'>('all-time');
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API configuration
  const getApiConfig = useCallback(() => {
    const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    return {
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  }, []);

  // Fetch top products from API
  const fetchTopProducts = useCallback(async (period: 'all-time' | '30-days') => {
    setLoading(true);
    setError(null);

    try {
      const { baseURL, headers } = getApiConfig();
      const response = await fetch(`${baseURL}/admin/products/top-products?period=${period}&limit=5`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TopProductsResponse = await response.json();
      setTopProducts(data.products || []);

      console.log(`Fetched ${data.products?.length || 0} top products for period: ${period}`);
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      setError(error.message || 'Không thể tải dữ liệu sản phẩm bán chạy');
      toast.error('Không thể tải dữ liệu sản phẩm bán chạy');

      // Fallback to empty array
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  }, [getApiConfig]);

  // Effect to fetch data when tab changes
  useEffect(() => {
    fetchTopProducts(activeTab);
  }, [activeTab, fetchTopProducts]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Get product image URL
  const getProductImageUrl = (product: TopProduct) => {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return '/images/placeholder-product.jpg';
  };

  // Get primary category name
  const getPrimaryCategoryName = (product: TopProduct) => {
    if (product.categoryIds && product.categoryIds.length > 0) {
      return product.categoryIds[0].name;
    }
    return 'Chưa phân loại';
  };

  // Calculate revenue for display
  const calculateRevenue = (product: TopProduct) => {
    const quantity = activeTab === '30-days' ? (product.totalQuantity30Days || 0) : product.soldCount;
    return quantity * product.currentPrice;
  };

  // Get quantity for display
  const getDisplayQuantity = (product: TopProduct) => {
    return activeTab === '30-days' ? (product.totalQuantity30Days || 0) : product.soldCount;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Sản phẩm bán chạy</h3>
          <TrendingUp className="h-5 w-5 text-pink-500" />
        </div>

        {/* Tabs for switching between periods */}
        <div className="mt-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all-time')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'all-time'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Toàn thời gian
            </button>
            <button
              onClick={() => setActiveTab('30-days')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === '30-days'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-3 w-3 mr-1" />
              30 ngày qua
            </button>
          </div>
        </div>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <button
              onClick={() => fetchTopProducts(activeTab)}
              className="px-4 py-2 text-sm text-pink-600 border border-pink-200 rounded-md hover:bg-pink-50 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <Package className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">
              {activeTab === '30-days'
                ? 'Không có sản phẩm nào được bán trong 30 ngày qua'
                : 'Không có dữ liệu sản phẩm bán chạy'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {topProducts.map((product, index) => (
              <div
                key={product._id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all duration-200"
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-pink-100 text-pink-800'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-product.jpg';
                      }}
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{product.brandName || 'Chưa có thương hiệu'}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {getPrimaryCategoryName(product)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600 ml-1">
                        {product.reviews?.averageRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    {activeTab === '30-days' && product.totalOrders30Days && (
                      <span className="text-xs text-blue-600 font-medium">
                        {product.totalOrders30Days} đơn hàng
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatNumber(getDisplayQuantity(product))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeTab === '30-days' ? 'bán (30 ngày)' : 'đã bán'}
                  </div>
                  <div className="text-xs text-pink-600 font-medium mt-1">
                    {formatCurrency(calculateRevenue(product))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/admin/products"
            className="block w-full text-center py-2 text-sm text-pink-600 border border-pink-200 rounded-md hover:bg-pink-50 transition-colors"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}