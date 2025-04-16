import React, { memo } from 'react';
import Link from 'next/link';
import { Category } from '@/contexts/HeaderContext';
import { motion } from 'framer-motion';

interface CategoryMegaMenuProps {
  categories: Category[];
}

function CategoryMegaMenu({ categories }: CategoryMegaMenuProps) {
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white shadow-md border border-gray-100 py-5 px-6 rounded-md">
      <motion.div
        className="grid grid-cols-4 gap-x-8 gap-y-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {categories.map((category, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            transition={{ duration: 0.2 }}
            className="group"
          >
            <Link
              href={`/danh-muc/${category.slug}`}
              className="inline-block font-medium text-gray-900 hover:text-pink-600 mb-3 transition-colors group-hover:translate-x-0.5"
            >
              {category.name}
            </Link>

            <ul className="space-y-2.5">
              {category.children?.map((subCategory, subIndex) => (
                <li key={subIndex}>
                  <Link
                    href={`/danh-muc/${subCategory.slug}`}
                    className="inline-block text-sm text-gray-500 hover:text-pink-600 transition-colors hover:translate-x-0.5"
                  >
                    {subCategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-6 bg-gradient-to-r from-pink-50 to-purple-50 text-center p-4 rounded-md border border-pink-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <span className="text-sm font-medium text-pink-700">Ưu đãi đặc biệt</span>
        <p className="text-xs text-gray-600 mt-1">Giảm đến 50% cho sản phẩm mới</p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block mt-2"
        >
          <Link
            href="/khuyen-mai"
            className="text-xs text-pink-600 font-medium hover:underline px-3 py-1 bg-white rounded-full shadow-sm inline-block"
          >
            Xem ngay
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default memo(CategoryMegaMenu);