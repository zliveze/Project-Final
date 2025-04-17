import React from 'react';
import Image from 'next/image';
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiCopy,
  FiExternalLink,
  FiInfo
} from 'react-icons/fi';
import ProductStatusBadge from './ProductStatusBadge';
import ProductFlagBadge from './ProductFlagBadge';
import { AdminProduct } from '@/hooks/useProductAdmin';
import { useApiStats } from '@/hooks/useApiStats';
import { useProduct } from '@/contexts/ProductContext';

interface ProductTableProps {
  products: AdminProduct[];
  selectedProducts: string[];
  expandedProduct?: string | null;
  isLoading: boolean;
  isAllSelected: boolean;
  // Các handler
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onDuplicate?: (id: string) => Promise<boolean>;
  toggleProductSelection: (id: string) => void;
  toggleSelectAll: () => void;
  toggleProductDetails?: (id: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProducts,
  isLoading,
  isAllSelected,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  toggleProductSelection,
  toggleSelectAll
}) => {
  // Access the API stats for loading state
  const { loading: statsLoading } = useApiStats();
  // Access the ProductContext for additional functionality if needed
  const { loading: contextLoading } = useProduct();
  // Xử lý trạng thái khi đang thực hiện hành động
  const [processingAction, setProcessingAction] = React.useState<{ id: string, action: string } | null>(null);

  const handleAction = async (action: 'view' | 'edit' | 'delete' | 'duplicate', id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Đánh dấu đang xử lý hành động
    setProcessingAction({ id, action });

    try {
      switch (action) {
        case 'view':
          onView(id);
          break;
        case 'edit':
          onEdit(id);
          break;
        case 'delete':
          await onDelete(id);
          break;
        case 'duplicate':
          if (onDuplicate) await onDuplicate(id);
          break;
      }
    } catch (error) {
      console.error(`Lỗi khi thực hiện hành động ${action} cho sản phẩm ${id}:`, error);
    } finally {
      setProcessingAction(null);
    }
  };

  // Kết hợp trạng thái loading từ props và context
  const combinedLoading = isLoading || contextLoading || statsLoading;

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="pl-4 py-3.5 text-left">
                <div className="flex items-center">
                  <input
                    id="select-all"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={combinedLoading || products.length === 0}
                  />
                </div>
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thương hiệu
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn kho
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhãn
              </th>
              <th scope="col" className="px-6 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {combinedLoading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="pl-4 py-4 whitespace-nowrap">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              // Không có kết quả
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FiInfo className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-lg font-medium">Không tìm thấy sản phẩm nào</p>
                    <p className="text-gray-400 mt-1">Vui lòng thử lại với từ khóa khác hoặc bỏ các bộ lọc</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Danh sách sản phẩm
              products.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className={`hover:bg-gray-50 transition-colors duration-150 ${selectedProducts.includes(product.id) ? 'bg-pink-50' : ''}`}>
                    <td className="pl-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          id={`select-product-${product.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 focus:ring-offset-0 border-gray-300 rounded transition-all duration-200"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          disabled={processingAction?.id === product.id}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <span className="text-xs">No img</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{product.brand}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-pink-600 font-medium">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.currentPrice)}
                        </span>
                        {product.currentPrice !== product.originalPrice && (
                          <span className="text-gray-400 text-xs line-through mt-0.5">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-700">{product.stock || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProductStatusBadge status={product.status as 'active' | 'out_of_stock' | 'discontinued'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {product.flags?.isBestSeller && <ProductFlagBadge type="bestSeller" small />}
                        {product.flags?.isNew && <ProductFlagBadge type="new" small />}
                        {product.flags?.isOnSale && <ProductFlagBadge type="sale" small />}
                        {product.flags?.hasGifts && <ProductFlagBadge type="gift" small />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={(e) => handleAction('view', product.id, e)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                          title="Xem chi tiết"
                          disabled={!!processingAction}
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleAction('edit', product.id, e)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-200"
                          title="Chỉnh sửa"
                          disabled={!!processingAction}
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleAction('duplicate', product.id, e)}
                          className="p-1.5 text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-full transition-colors duration-200"
                          title="Nhân bản sản phẩm"
                          disabled={!!processingAction}
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                          title="Xem trang sản phẩm"
                        >
                          <FiExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={(e) => handleAction('delete', product.id, e)}
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition-colors duration-200"
                          title="Xóa sản phẩm"
                          disabled={!!processingAction}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
