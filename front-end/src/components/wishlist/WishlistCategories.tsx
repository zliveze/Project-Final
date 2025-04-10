import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

interface WishlistCategoriesProps {
  categories: Category[];
}

const WishlistCategories: React.FC<WishlistCategoriesProps> = ({ categories }) => {
  // Đảm bảo chỉ hiển thị tối đa 4 danh mục theo bố cục 2x2
  const displayCategories = categories.slice(0, 4);
  
  return (
    <div className="mt-8 mb-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Danh mục phổ biến</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayCategories.map((category) => (
          <Link 
            key={category.id} 
            href={`/shop?category=${category.slug}`}
            replace={true}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60 transition-all duration-300"></div>
                
                {/* Tên danh mục trên ảnh */}
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-200">{category.productCount} sản phẩm</span>
                    <div className="bg-pink-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                      <FiArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {categories.length > 4 && (
        <div className="mt-4 text-center">
          <Link 
            href="/shop" 
            className="inline-flex items-center text-sm text-pink-600 hover:text-pink-700"
          >
            Xem tất cả danh mục
            <FiArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default WishlistCategories; 