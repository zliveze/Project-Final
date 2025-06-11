import React, { useState, useRef, memo, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiChevronDown } from 'react-icons/fi';
import CategoryMegaMenu from './CategoryMegaMenu';
import { Category, CategoryItem } from '@/contexts/HeaderContext';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomHeaderProps {
  categories: Category[];
  allCategories: CategoryItem[];
  // featuredBrands: Brand[]; // Removed as it's unused
}

function BottomHeader({ categories, allCategories }: BottomHeaderProps) {
  // const router = useRouter(); // Removed as it's unused
  const [showCategories, setShowCategories] = useState(false);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hàm hiển thị menu
  const showMenu = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }
    setShowCategories(true);
  };

  // Hàm ẩn menu với delay
  const hideMenu = () => {
    const timer = setTimeout(() => {
      setShowCategories(false);
    }, 150); // Delay 150ms để tránh flicker
    setHideTimer(timer);
  };

  // Cleanup timer khi component unmount
  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  return (
    <div className="w-full border-b border-gray-100 bg-white">
      <div className="container mx-auto px-4">
        <div className="hidden lg:flex items-center justify-between h-12">
          {/* Left side menu */}
          <div className="flex items-center space-x-8">
            <div
              ref={menuRef}
              className="relative"
              onMouseEnter={showMenu}
              onMouseLeave={hideMenu}
            >
              <motion.button
                className="flex items-center text-sm font-medium hover:text-pink-600 h-12 px-3 rounded-md hover:bg-gray-50 transition-colors"
                aria-expanded={showCategories}
                aria-haspopup="true"
                whileHover={{ scale: 1.02 }}
              >
                <FiMenu className="w-4 h-4 mr-2" />
                DANH MỤC
                <FiChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
              </motion.button>

              <AnimatePresence>
                {showCategories && (
                  <>
                    {/* Invisible bridge để tránh flicker */}
                    <div
                      className="absolute top-12 left-0 w-[600px] h-2 z-40"
                      onMouseEnter={showMenu}
                      onMouseLeave={hideMenu}
                    />
                    <motion.div
                      className="absolute top-10 left-0 w-[600px] z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={showMenu}
                      onMouseLeave={hideMenu}
                    >
                      <CategoryMegaMenu categories={categories} allCategories={allCategories} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/shop"
              className="h-12 flex items-center text-sm hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors"
              prefetch={true}
            >
              CỬA HÀNG
            </Link>
            <Link href="/thuong-hieu" className="h-12 flex items-center text-sm hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors">
              THƯƠNG HIỆU
            </Link>

            <Link href="/hang-moi-ve" className="h-12 flex items-center text-sm hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors">
              HÀNG MỚI VỀ
            </Link>

            <Link href="/ban-chay" className="h-12 flex items-center text-sm hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors">
              BÁN CHẠY
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <Link href="/tra-cuu-don-hang" className="h-12 flex items-center hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors">
              Tra cứu đơn hàng
            </Link>
            <Link href="/stores" className="h-12 flex items-center hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors">
              Hệ thống cửa hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BottomHeader);
