import React from 'react';
import Image from 'next/image';
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiCopy,
  FiExternalLink
} from 'react-icons/fi';
import ProductStatusBadge from './ProductStatusBadge';
import ProductFlagBadge from './ProductFlagBadge';
import { AdminProduct } from '@/hooks/useProductAdmin';
import { useApiStats } from '@/hooks/useApiStats';
import { useProduct } from '@/contexts/ProductContext';

interface ProductTableProps {
  products: AdminProduct[];
  selectedProducts: string[];
  expandedProduct: string | null;
  isLoading: boolean;
  isAllSelected: boolean;
  // Các handler
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onDuplicate?: (id: string) => Promise<boolean>;
  toggleProductSelection: (id: string) => void;
  toggleSelectAll: () => void;
  toggleProductDetails: (id: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProducts,
  expandedProduct,
  isLoading,
  isAllSelected,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  toggleProductSelection,
  toggleSelectAll,
  toggleProductDetails
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
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="pl-4 py-3 text-left">
                <div className="flex items-center">
                  <input
                    id="select-all"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={combinedLoading || products.length === 0}
                  />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SẢN PHẨM
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DANH MỤC
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                THƯƠNG HIỆU
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GIÁ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TỒN KHO
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TRẠNG THÁI
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NHÃN
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-8 bg-gray-200 rounded w-24 ml-auto animate-pulse"></div>
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              // Không có kết quả
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
                  <p className="text-gray-400 mt-1">Vui lòng thử lại với từ khóa khác hoặc bỏ các bộ lọc</p>
                </td>
              </tr>
            ) : (
              // Danh sách sản phẩm
              products.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-pink-50' : ''}`}>
                    <td className="pl-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          id={`select-product-${product.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          disabled={processingAction?.id === product.id}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden border border-gray-200">
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
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {product.currentPrice !== product.originalPrice ? (
                        <div className="flex flex-col">
                          <span className="text-pink-600 font-medium">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.currentPrice)}
                          </span>
                          <span className="text-gray-400 text-xs line-through">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                          </span>
                        </div>
                      ) : (
                        <span>
                          {product.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.price)) : '0đ'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' :
                          product.status === 'out_of_stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status === 'active' ? 'Đang bán' :
                           product.status === 'out_of_stock' ? 'Hết hàng' :
                           product.status === 'discontinued' ? 'Ngừng kinh doanh' : 'Chưa xác định'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex">
                        {product.flags?.isNew && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-1">
                            Mới
                          </span>
                        )}
                        {product.flags?.isOnSale && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800 mr-1">
                            Giảm giá
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={(e) => handleAction('view', product.id, e)}
                          className="p-1.5 text-gray-600 hover:text-gray-900"
                          title="Xem chi tiết"
                          disabled={!!processingAction}
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleAction('edit', product.id, e)}
                          className="p-1.5 text-blue-600 hover:text-blue-800"
                          title="Chỉnh sửa"
                          disabled={!!processingAction}
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleAction('duplicate', product.id, e)}
                          className="p-1.5 text-green-600 hover:text-green-800"
                          title="Nhân bản sản phẩm"
                          disabled={!!processingAction}
                        >
                          <FiCopy className="h-5 w-5" />
                        </button>
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-600 hover:text-gray-900"
                          title="Xem trang sản phẩm"
                        >
                          <FiExternalLink className="h-5 w-5" />
                        </a>
                        <button
                          onClick={(e) => handleAction('delete', product.id, e)}
                          className="p-1.5 text-red-600 hover:text-red-800"
                          title="Xóa sản phẩm"
                          disabled={!!processingAction}
                        >
                          <FiTrash2 className="h-5 w-5" />
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
