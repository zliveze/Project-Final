import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { FiMenu } from 'react-icons/fi';
import CategoryMegaMenu from './CategoryMegaMenu';
import { Category, Brand } from '@/contexts/HeaderContext';

interface BottomHeaderProps {
  categories: Category[];
  featuredBrands: Brand[];
}

export default function BottomHeader({ categories, featuredBrands }: BottomHeaderProps) {
  const [showCategories, setShowCategories] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full border-t border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="hidden lg:flex items-center justify-between h-10">
          {/* Left side menu */}
          <div className="flex items-center space-x-8">
            <div 
              ref={menuRef} 
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button 
                className="flex items-center text-sm font-medium hover:text-pink-600 h-10"
                aria-expanded={showCategories}
                aria-haspopup="true"
              >
                <FiMenu className="w-4 h-4 mr-2" />
                DANH MỤC
              </button>
              
              {showCategories && (
                <div className="absolute top-10 left-0 min-w-[800px] z-50">
                  <CategoryMegaMenu categories={categories} />
                </div>
              )}
            </div>
            <Link href="/shop" className="h-10 flex items-center text-sm hover:text-pink-600">
              CỬA HÀNG
            </Link>
            <Link href="/thuong-hieu" className="h-10 flex items-center text-sm hover:text-pink-600">
              THƯƠNG HIỆU
            </Link>
            
            <Link href="/hang-moi-ve" className="h-10 flex items-center text-sm hover:text-pink-600">
              HÀNG MỚI VỀ
            </Link>
            
            <Link href="/ban-chay" className="h-10 flex items-center text-sm hover:text-pink-600">
              BÁN CHẠY
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/tra-cuu-don-hang" className="h-10 flex items-center hover:text-pink-600">
              Tra cứu đơn hàng
            </Link>
            <Link href="/stores" className="h-10 flex items-center hover:text-pink-600">
              Hệ thống cửa hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 