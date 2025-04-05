import React from 'react';
import Link from 'next/link';
import { FiFolder, FiHash, FiTag } from 'react-icons/fi';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductCategoriesProps {
  categories: Category[];
  tags: string[];
}

const ProductCategories: React.FC<ProductCategoriesProps> = ({ categories, tags }) => {
  if (!categories?.length && !tags?.length) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <FiFolder className="mr-2 text-[#d53f8c]" />
        Phân loại sản phẩm
      </h3>

      <div className="space-y-4">
        {/* Danh mục sản phẩm */}
        {categories?.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FiTag className="mr-1 text-[#d53f8c]" />
              <span>Danh mục</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link 
                  key={category._id} 
                  href={`/category/${category.slug}`}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:border-[#d53f8c] text-gray-700 hover:text-[#d53f8c] rounded-lg text-sm transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags sản phẩm */}
        {tags?.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FiHash className="mr-1 text-[#d53f8c]" />
              <span>Tags</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Link 
                  key={index} 
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-white border border-gray-200 hover:border-[#d53f8c] text-gray-600 hover:text-[#d53f8c] rounded-full text-xs transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {categories?.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <FiTag className="mr-1 text-gray-400" />
          <span>Xem thêm sản phẩm tương tự trong cùng danh mục</span>
        </div>
      )}
    </div>
  );
};

export default ProductCategories; 