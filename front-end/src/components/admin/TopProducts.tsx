import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProduct } from '@/contexts/ProductContext';

export default function TopProducts() {
  const { products, loading, fetchProducts } = useProduct();
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (!hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      // Gọi API để lấy sản phẩm bán chạy
      fetchProducts(1, 5, '', '', '', '', undefined, undefined, '', '', '', true);
    }
  }, [hasAttemptedFetch, fetchProducts]);

  useEffect(() => {
    // Cập nhật danh sách sản phẩm bán chạy khi có dữ liệu thực từ API
    if (products && products.length > 0) {
      const formattedProducts = products.slice(0, 5).map(product => ({
        id: product._id || product.id,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0].url : 'https://via.placeholder.com/50',
        price: product.price.toLocaleString('vi-VN') + 'đ',
        sold: Math.floor(Math.random() * 100) + 50 // Tạm thời random vì chưa có field sold trong API
      }));
      setTopProducts(formattedProducts);
    }
  }, [products]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Sản phẩm bán chạy</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {loading ? (
          // Hiển thị skeleton loading
          Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="px-6 py-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-gray-200"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </li>
          ))
        ) : topProducts.length > 0 ? (
          topProducts.map((product) => (
          <li key={product.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={50}
                  height={50}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-pink-600"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-gray-500 truncate">
                  Giá: {product.price}
                </p>
              </div>
              <div className="inline-flex items-center text-sm font-semibold text-pink-600">
                Đã bán: {product.sold}
              </div>
            </div>
          </li>
        ))
        ) : (
          <li className="px-6 py-8 text-center text-gray-500">
            Chưa có sản phẩm bán chạy
          </li>
        )}
      </ul>
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Link href="/admin/products" className="text-sm font-medium text-pink-600 hover:text-pink-500">
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}