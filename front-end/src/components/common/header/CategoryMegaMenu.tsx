import React, { memo, useState } from 'react';
import Link from 'next/link';
import { Category, CategoryItem } from '@/contexts/HeaderContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiGrid, FiHome } from 'react-icons/fi';

interface CategoryMegaMenuProps {
  categories: Category[];
  allCategories?: CategoryItem[]; // Thêm prop cho tất cả categories
}

function CategoryMegaMenu({ categories, allCategories = [] }: CategoryMegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<CategoryItem[]>([]); // Đường dẫn navigation
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [showAllSubcategories, setShowAllSubcategories] = useState<{[key: string]: boolean}>({});



  // Giới hạn hiển thị categories
  const CATEGORIES_DISPLAY_LIMIT = 8;

  // Helper functions
  const getChildCategories = (parentId: string): CategoryItem[] => {
    return allCategories.filter(cat => cat.parentId === parentId);
  };

  const navigateToCategory = (category: CategoryItem) => {
    const newPath = [...navigationPath, category];
    setNavigationPath(newPath);
  };

  const navigateBack = (index: number) => {
    const newPath = navigationPath.slice(0, index + 1);
    setNavigationPath(newPath);
  };

  const resetNavigation = () => {
    setNavigationPath([]);
  };

  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const subMenuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.1 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.1 }
    }
  };

  // Lọc chỉ lấy categories cấp 1 (root categories)
  const rootCategories = categories.filter(cat => cat.level === 1);

  // Hiển thị categories với giới hạn
  const displayedCategories = showAllCategories
    ? rootCategories
    : rootCategories.slice(0, CATEGORIES_DISPLAY_LIMIT);

  const hasMoreCategories = rootCategories.length > CATEGORIES_DISPLAY_LIMIT;

  return (
    <motion.div
      className="bg-white shadow-lg border border-gray-100 rounded-md overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex max-h-96">
        {/* Left sidebar - Main categories */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-0 flex items-center uppercase tracking-wide">
              <FiGrid className="w-3 h-3 mr-1.5" />
              Danh mục
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 category-scroll">
            <motion.ul className="space-y-0.5" variants={containerVariants}>
              {displayedCategories.map((category) => (
                <motion.li
                  key={category._id}
                  variants={itemVariants}
                  onMouseEnter={() => {
                    setHoveredCategory(category._id);
                    resetNavigation(); // Reset navigation khi hover vào category mới
                  }}
                  className="relative"
                >
                  <Link
                    href={`/shop?categoryId=${category._id}`}
                    className={`flex items-center justify-between py-2 px-3 rounded text-sm transition-all duration-200 group ${
                      hoveredCategory === category._id
                        ? 'bg-pink-50 text-pink-600 border-l-2 border-pink-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        {category.childrenCount && category.childrenCount > 0 && (
                          <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                            {category.childrenCount}
                          </span>
                        )}
                        {allCategories.some(cat => cat.parentId === category._id) && (
                          <FiChevronRight
                            className={`w-3 h-3 transition-transform duration-200 ${
                              hoveredCategory === category._id ? 'transform rotate-90' : ''
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.li>
              ))}

              {/* Nút hiển thị thêm/ít hơn */}
              {hasMoreCategories && (
                <motion.li variants={itemVariants}>
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="w-full py-2 px-3 text-sm text-pink-600 hover:bg-pink-50 rounded transition-colors text-left font-medium"
                  >
                    {showAllCategories
                      ? `Ẩn bớt (${rootCategories.length - CATEGORIES_DISPLAY_LIMIT} danh mục)`
                      : `Xem thêm ${rootCategories.length - CATEGORIES_DISPLAY_LIMIT} danh mục khác`
                    }
                  </button>
                </motion.li>
              )}
            </motion.ul>
          </div>
        </div>

        {/* Right content - Subcategories */}
        <div className="flex-1 min-w-0 relative">
          <AnimatePresence mode="wait">
            {hoveredCategory && (
              <motion.div
                key={`${hoveredCategory}-${navigationPath.length}`}
                variants={subMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex flex-col"
                onMouseLeave={resetNavigation}
              >
                {(() => {
                  // Xác định category hiện tại dựa trên navigation path
                  const currentParentId = navigationPath.length > 0
                    ? navigationPath[navigationPath.length - 1]._id
                    : hoveredCategory;

                  const currentCategory = navigationPath.length > 0
                    ? navigationPath[navigationPath.length - 1]
                    : rootCategories.find(cat => cat._id === hoveredCategory);

                  const childCategories = getChildCategories(currentParentId);



                  if (!currentCategory) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <FiGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Không tìm thấy danh mục</p>
                        </div>
                      </div>
                    );
                  }

                  const SUBCATEGORIES_LIMIT = 12;
                  const isShowingAllSubs = showAllSubcategories[currentCategory._id] || false;
                  const displayedSubcategories = isShowingAllSubs
                    ? childCategories
                    : childCategories.slice(0, SUBCATEGORIES_LIMIT);
                  const hasMoreSubcategories = childCategories.length > SUBCATEGORIES_LIMIT;

                  const toggleSubcategories = () => {
                    setShowAllSubcategories(prev => ({
                      ...prev,
                      [currentCategory._id]: !prev[currentCategory._id]
                    }));
                  };

                  return (
                    <>
                      {/* Header với breadcrumb navigation */}
                      <div className="p-4 border-b border-gray-200 bg-white">
                        {/* Breadcrumb navigation */}
                        {navigationPath.length > 0 && (
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <button
                              onClick={resetNavigation}
                              className="hover:text-pink-600 transition-colors"
                            >
                              <FiHome className="w-3 h-3" />
                            </button>
                            {navigationPath.map((pathCategory, index) => (
                              <React.Fragment key={pathCategory._id}>
                                <FiChevronRight className="w-3 h-3 mx-1" />
                                <button
                                  onClick={() => navigateBack(index)}
                                  className="hover:text-pink-600 transition-colors truncate max-w-20"
                                  title={pathCategory.name}
                                >
                                  {pathCategory.name}
                                </button>
                              </React.Fragment>
                            ))}
                          </div>
                        )}

                        <h4 className="text-sm font-semibold text-gray-900 flex items-center justify-between">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                            {currentCategory.name}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {childCategories.length} danh mục
                          </span>
                        </h4>
                      </div>

                      {/* Content có thể cuộn */}
                      <div className="flex-1 overflow-y-auto p-4 category-scroll">
                        {childCategories.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-gray-500">
                            <div className="text-center">
                              <FiGrid className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Chưa có danh mục con</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            {displayedSubcategories.map((subCategory) => {
                              const hasChildren = getChildCategories(subCategory._id).length > 0;

                              return (
                                <motion.div
                                  key={subCategory._id}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <div className="flex items-center">
                                    <Link
                                      href={`/shop?categoryId=${subCategory._id}`}
                                      className="flex-1 flex items-center justify-between py-2 px-3 rounded text-sm text-gray-700 hover:bg-gray-50 hover:text-pink-600 transition-colors"
                                    >
                                      <span>{subCategory.name}</span>
                                      {subCategory.childrenCount && subCategory.childrenCount > 0 && (
                                        <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                                          {subCategory.childrenCount}
                                        </span>
                                      )}
                                    </Link>
                                    {hasChildren && (
                                      <button
                                        onClick={() => navigateToCategory(subCategory)}
                                        className="ml-1 p-1 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors"
                                        title={`Xem danh mục con của ${subCategory.name}`}
                                      >
                                        <FiChevronRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}

                            {/* Nút xem thêm cho subcategories */}
                            {hasMoreSubcategories && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className="col-span-2 mt-2"
                              >
                                <button
                                  onClick={toggleSubcategories}
                                  className="w-full py-2 px-3 text-sm text-pink-600 hover:bg-pink-50 rounded transition-colors text-center font-medium border border-pink-200"
                                >
                                  {isShowingAllSubs
                                    ? `Ẩn bớt`
                                    : `Xem thêm ${childCategories.length - SUBCATEGORIES_LIMIT} danh mục`
                                  }
                                </button>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Default content when no category is hovered */}
          {!hoveredCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center text-gray-400">
                <FiGrid className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Di chuột qua danh mục để xem chi tiết</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(CategoryMegaMenu);
