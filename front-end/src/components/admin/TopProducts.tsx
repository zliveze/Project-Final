import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Dữ liệu mẫu cho sản phẩm bán chạy
const sampleProducts = [
  {
    id: 'PRD-001',
    name: 'Kem dưỡng ẩm Yumin',
    image: 'https://via.placeholder.com/50',
    price: '350,000đ',
    sold: 120
  },
  {
    id: 'PRD-002',
    name: 'Sữa rửa mặt Yumin',
    image: 'https://via.placeholder.com/50',
    price: '250,000đ',
    sold: 98
  },
  {
    id: 'PRD-003',
    name: 'Serum Vitamin C Yumin',
    image: 'https://via.placeholder.com/50',
    price: '450,000đ',
    sold: 85
  },
  {
    id: 'PRD-004',
    name: 'Mặt nạ dưỡng ẩm Yumin',
    image: 'https://via.placeholder.com/50',
    price: '50,000đ',
    sold: 75
  },
  {
    id: 'PRD-005',
    name: 'Kem chống nắng Yumin SPF50',
    image: 'https://via.placeholder.com/50',
    price: '320,000đ',
    sold: 68
  }
];

export default function TopProducts() {
  const [products] = useState(sampleProducts);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Sản phẩm bán chạy</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {products.map((product) => (
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
        ))}
      </ul>
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Link href="/admin/products" className="text-sm font-medium text-pink-600 hover:text-pink-500">
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
} 