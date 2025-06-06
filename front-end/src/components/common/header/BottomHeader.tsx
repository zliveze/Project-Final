import React, { useState, useRef, memo } from 'react';
import Link from 'next/link';
import { FiMenu, FiChevronDown } from 'react-icons/fi';
import CategoryMegaMenu from './CategoryMegaMenu';
import { Category } from '@/contexts/HeaderContext';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomHeaderProps {
  categories: Category[];
  // featuredBrands: Brand[]; // Removed as it's unused
}

function BottomHeader({ categories }: BottomHeaderProps) {
  // const router = useRouter(); // Removed as it's unused
  const [showCategories, setShowCategories] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full border-b border-gray-100 bg-white">
      <div className="container mx-auto px-4">
        <div className="hidden lg:flex items-center justify-between h-12">
          {/* Left side menu */}
          <div className="flex items-center space-x-8">
            <div
              ref={menuRef}
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
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
                  <motion.div
                    className="absolute top-12 left-0 min-w-[800px] z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CategoryMegaMenu categories={categories} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/shop"
              className="h-12 flex items-center text-sm hover:text-pink-600 px-3 rounded-md hover:bg-gray-50 transition-colors"
              prefetch={true}
              onClick={() => { // Removed 'e' as it's unused
                // Hiển thị trạng thái loading ngay lập tức
                document.body.classList.add('page-loading');
              }}
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
