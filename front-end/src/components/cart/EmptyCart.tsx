import React from 'react';
import Link from 'next/link';
import { FiShoppingBag } from 'react-icons/fi';

const EmptyCart: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center mb-6">
        <FiShoppingBag className="w-16 h-16 text-pink-500 opacity-50" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Giỏ hàng của bạn đang trống</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi và tìm thấy những gì phù hợp với bạn.
      </p>

      <Link href="/shop">
        <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition-opacity font-medium">
          Tiếp tục mua sắm
        </button>
      </Link>
    </div>
  );
};

export default EmptyCart;
