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
  // Xử lý menu hành động cho từng sản phẩm
  const [openActionMenu, setOpenActionMenu] = React.useState<string | null>(null);
  const [processingAction, setProcessingAction] = React.useState<{ id: string, action: string } | null>(null);

  // Đóng tất cả menu khi click bên ngoài
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionMenu(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleActionMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenActionMenu(openActionMenu === id ? null : id);
  };

  const closeActionMenus = () => {
    setOpenActionMenu(null);
  };

  const handleAction = async (action: 'view' | 'edit' | 'delete' | 'duplicate', id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeActionMenus();

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
    <div className="bg-white shadow-md rounded-lg overflow-hidden" onClick={closeActionMenus}>
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
                Sản phẩm
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thương hiệu
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn kho
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhãn
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
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
                          {product.price}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProductStatusBadge status={product.status as 'active' | 'out_of_stock' | 'discontinued'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {product.flags?.isBestSeller && (
                          <ProductFlagBadge type="bestSeller" />
                        )}
                        {product.flags?.isNew && (
                          <ProductFlagBadge type="new" />
                        )}
                        {product.flags?.isOnSale && (
                          <ProductFlagBadge type="sale" />
                        )}
                        {product.flags?.hasGifts && (
                          <ProductFlagBadge type="gift" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handleAction('view', product.id, e)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Xem chi tiết"
                          disabled={!!processingAction}
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleAction('edit', product.id, e)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Chỉnh sửa"
                          disabled={!!processingAction}
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => toggleActionMenu(product.id, e)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Thêm hành động"
                            disabled={!!processingAction}
                          >
                            <FiMoreVertical className="h-5 w-5" />
                          </button>

                          {openActionMenu === product.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                              <div className="py-1">
                                <button
                                  onClick={(e) => handleAction('duplicate', product.id, e)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  disabled={processingAction?.id === product.id && processingAction?.action === 'duplicate'}
                                >
                                  <span className="flex items-center">
                                    <FiCopy className="mr-2 text-gray-500" />
                                    {processingAction?.id === product.id && processingAction?.action === 'duplicate'
                                      ? 'Đang nhân bản...'
                                      : 'Nhân bản sản phẩm'
                                    }
                                  </span>
                                </button>
                                <a
                                  href={`/product/${product.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <span className="flex items-center">
                                    <FiExternalLink className="mr-2 text-gray-500" />
                                    Xem trang sản phẩm
                                  </span>
                                </a>
                                <button
                                  onClick={(e) => handleAction('delete', product.id, e)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                                  disabled={processingAction?.id === product.id && processingAction?.action === 'delete'}
                                >
                                  <span className="flex items-center">
                                    <FiTrash2 className="mr-2 text-red-500" />
                                    {processingAction?.id === product.id && processingAction?.action === 'delete'
                                      ? 'Đang xóa...'
                                      : 'Xóa sản phẩm'
                                    }
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Chi tiết tồn kho theo chi nhánh - Temporarily commented out due to missing 'inventory' property */}
                  {/* {expandedProduct === product.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-3">
                        <div className="py-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Tồn kho theo chi nhánh:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {product.inventory.map((inv: any) => ( // Added ': any' temporarily if uncommented
                              <div key={inv.branchId} className="p-2 border border-gray-200 rounded-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{inv.branchName}</span>
                                  <span className={`text-sm ${inv.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {inv.quantity} sản phẩm
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )} */}
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
