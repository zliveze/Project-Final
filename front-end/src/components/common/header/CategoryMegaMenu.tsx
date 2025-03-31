import React from 'react';
import Link from 'next/link';
import { Category } from '@/contexts/HeaderContext';

interface CategoryMegaMenuProps {
  categories: Category[];
}

export default function CategoryMegaMenu({ categories }: CategoryMegaMenuProps) {
  return (
    <div className="bg-white shadow-md border border-gray-200 py-4 px-6 rounded-b-md">
      <div className="grid grid-cols-4 gap-x-8 gap-y-6">
        {categories.map((category, index) => (
          <div key={index}>
            <Link 
              href={`/danh-muc/${category.slug}`}
              className="block font-medium text-gray-900 hover:text-pink-600 mb-3"
            >
              {category.name}
            </Link>
            
            <ul className="space-y-2">
              {category.children?.map((subCategory, subIndex) => (
                <li key={subIndex}>
                  <Link 
                    href={`/danh-muc/${subCategory.slug}`}
                    className="block text-sm text-gray-600 hover:text-pink-600"
                  >
                    {subCategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mt-6 bg-pink-50 text-center p-3 rounded-md">
        <span className="text-sm font-medium text-pink-700">Ưu đãi đặc biệt</span>
        <p className="text-xs text-gray-600 mt-1">Giảm đến 50% cho sản phẩm mới</p>
        <Link href="/khuyen-mai" className="inline-block mt-2 text-xs text-pink-600 font-medium hover:underline">
          Xem ngay
        </Link>
      </div>
    </div>
  );
} 