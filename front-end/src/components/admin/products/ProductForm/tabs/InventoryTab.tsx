import React, { useState, useEffect } from 'react';
import { FiTrash2, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiLayers } from 'react-icons/fi';
import { ProductFormData, BranchItem, ProductVariant, VariantCombination } from '../types';

// Thêm style cho animation
const notificationAnimation = `
@keyframes slideInTop {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutTop {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

.animate-slideInTop {
  animation: slideInTop 0.3s ease-out forwards;
}

.animate-slideOutTop {
  animation: slideOutTop 0.3s ease-in forwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.animate-slideInRight {
  animation: slideInRight 0.3s ease-out forwards;
}

.animate-slideOutRight {
  animation: slideOutRight 0.3s ease-in forwards;
}
`;

// Mở rộng kiểu dữ liệu cho inventory item
interface InventoryItemExtended {
  branchId: string;
  branchName: string;
  quantity: number;
  lowStockThreshold?: number;
  isNew?: boolean; // Thêm trường để đánh dấu chi nhánh mới thêm vào
}

interface InventoryTabProps {
  formData: ProductFormData;
  isViewMode?: boolean;
  showBranchModal: boolean;
  availableBranches: BranchItem[];
  handleInventoryChange: (index: number, field: string, value: any) => void;
  handleRemoveInventory: (index: number) => void;
  handleAddBranch: (branchId: string, branchName: string) => void;
  handleShowBranchModal: (branches: BranchItem[]) => void;
  handleCloseBranchModal: () => void;
  getTotalInventory: () => number;
  getInStockBranchesCount: () => number;
  getLowStockBranchesCount: () => number;
  hasVariants: () => boolean; // Thêm hàm kiểm tra có biến thể hay không
  branches: BranchItem[]; // Danh sách chi nhánh từ dữ liệu store
  // Variant inventory props
  selectedBranchForVariants?: string | null;
  branchVariants?: Array<ProductVariant & {quantity: number, name?: string}>;
  handleSelectBranchForVariants?: (branchId: string) => void;
  handleClearBranchSelection?: () => void;
  handleVariantInventoryChange?: (variantId: string, quantity: number) => void;
  // Combination inventory props
  selectedVariantForCombinations?: string | null;
  variantCombinations?: Array<{
    combinationId: string;
    attributes: Record<string, string>;
    quantity: number;
  }>;
  handleSelectVariantForCombinations?: (variantId: string) => void;
  handleClearVariantSelection?: () => void;
  handleCombinationInventoryChange?: (combinationId: string, quantity: number) => void;
}

/**
 * Component tab quản lý tồn kho sản phẩm
 */
const InventoryTab: React.FC<InventoryTabProps> = ({
  formData,
  isViewMode = false,
  showBranchModal,
  availableBranches,
  handleInventoryChange,
  handleRemoveInventory,
  handleAddBranch,
  handleShowBranchModal,
  handleCloseBranchModal,
  getTotalInventory,
  getInStockBranchesCount,
  getLowStockBranchesCount,
  hasVariants,
  branches,
  // Variant inventory props
  selectedBranchForVariants,
  branchVariants = [],
  handleSelectBranchForVariants,
  handleClearBranchSelection,
  handleVariantInventoryChange,
  // Combination inventory props
  selectedVariantForCombinations,
  variantCombinations = [],
  handleSelectVariantForCombinations,
  handleClearVariantSelection,
  handleCombinationInventoryChange
}) => {
  // State cho phân trang chi nhánh
  const [currentPage, setCurrentPage] = useState(1);
  const branchesPerPage = 5;

  // Tính toán tổng số trang
  const totalPages = Math.ceil(availableBranches.length / branchesPerPage);

  // Lấy chi nhánh cho trang hiện tại
  const getCurrentPageBranches = () => {
    const startIndex = (currentPage - 1) * branchesPerPage;
    const endIndex = startIndex + branchesPerPage;
    return availableBranches.slice(startIndex, endIndex);
  };

  // Xử lý chuyển trang
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // State để theo dõi chi nhánh đang được chọn
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  // State để theo dõi chi nhánh mới được thêm vào
  const [newlyAddedBranch, setNewlyAddedBranch] = useState<string | null>(null);

  // Thêm state cho thông báo
  const [notification, setNotification] = useState<{show: boolean, message: string, branchName: string, isLeaving: boolean}>({
    show: false,
    message: '',
    branchName: '',
    isLeaving: false
  });

  // Sửa kiểu ref cho các hàng trong bảng
  const tableRowsRef = React.useRef<{[key: string]: HTMLTableRowElement | null}>({});

  // Hàm callback để lưu ref
  const setRowRef = (element: HTMLTableRowElement | null, id: string) => {
    if (element) {
      tableRowsRef.current[id] = element;
    }
  };

  // Effect để cuộn đến chi nhánh mới khi được thêm vào
  useEffect(() => {
    if (newlyAddedBranch && tableRowsRef.current[newlyAddedBranch]) {
      // Cuộn đến chi nhánh mới thêm vào
      setTimeout(() => {
        tableRowsRef.current[newlyAddedBranch]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [newlyAddedBranch, formData.inventory]);

  // Cập nhật hàm xử lý khi chọn chi nhánh
  const handleSelectBranch = (branchId: string, branchName: string) => {
    setSelectedBranch(branchId);

    // Thêm chi nhánh và ghi nhớ chi nhánh mới thêm
    setTimeout(() => {
      handleAddBranch(branchId, branchName);
      setSelectedBranch(null);
      setNewlyAddedBranch(branchId);

      // Hiển thị thông báo
      setNotification({
        show: true,
        message: 'Đã thêm chi nhánh thành công',
        branchName: branchName,
        isLeaving: false
      });

      // Tự động ẩn thông báo
      setTimeout(() => {
        // Bắt đầu animation ẩn
        setNotification(prev => ({...prev, isLeaving: true}));

        // Ẩn thông báo hoàn toàn sau khi animation kết thúc
        setTimeout(() => {
          setNotification({
            show: false,
            message: '',
            branchName: '',
            isLeaving: false
          });
        }, 300); // Thời gian của animation
      }, 3000);

      // Tăng thời gian hiệu ứng từ 3000ms lên 5000ms (5 giây)
      setTimeout(() => {
        setNewlyAddedBranch(null);
      }, 5000);
    }, 800);
  };

  // Sử dụng useEffect để theo dõi khi có thay đổi trong danh sách inventory
  useEffect(() => {
    // Nếu có chi nhánh mới được thêm vào, kiểm tra xem nó có thực sự tồn tại trong inventory không
    if (newlyAddedBranch && formData.inventory) {
      const exists = formData.inventory.some(item => item.branchId === newlyAddedBranch);
      if (!exists) {
        setNewlyAddedBranch(null); // Nếu không tồn tại, xóa trạng thái hiệu ứng
      }
    }
  }, [formData.inventory, newlyAddedBranch]);

  // Chuyển đổi kiểu dữ liệu để TypeScript hiểu đúng
  const getInventoryWithNames = (): InventoryItemExtended[] => {
    if (!formData.inventory || !Array.isArray(formData.inventory)) {
      return [];
    }

    return formData.inventory.map(item => {
      // Kiểm tra xem đây có phải là chi nhánh mới được thêm vào hay không
      const isNew = item.branchId === newlyAddedBranch;

      // Tìm tên chi nhánh từ danh sách chi nhánh nếu không có trong item
      let branchName = item.branchName;
      if (!branchName) {
        // Tìm trong danh sách chi nhánh
        const branch = branches.find(b => b.id === item.branchId);
        branchName = branch ? branch.name : 'Chi nhánh không xác định';
      }

      return {
        branchId: item.branchId,
        branchName: branchName,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold || 5,
        isNew
      };
    });
  };

  // Thêm hàm đóng thông báo thủ công
  const handleCloseNotification = () => {
    // Bắt đầu animation ẩn
    setNotification(prev => ({...prev, isLeaving: true}));

    // Ẩn thông báo hoàn toàn sau khi animation kết thúc
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        branchName: '',
        isLeaving: false
      });
    }, 300); // Thời gian của animation
  };

  return (
    <div className="space-y-6">
      {/* Thêm style cho animation */}
      <style>{notificationAnimation}</style>

      {/* Thông báo thành công */}
      {notification.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-50 border-l-4 border-green-500 border-t border-r border-b text-green-700 px-4 py-3 rounded-md shadow-2xl flex items-center justify-between max-w-md animate-pulse ${notification.isLeaving ? 'animate-slideOutTop' : 'animate-slideInTop'}`}>
          <div className="flex items-center mr-4">
            <FiCheck className="text-green-500 mr-2 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-green-800">{notification.message}</p>
              <p className="text-sm font-medium text-green-700">{notification.branchName}</p>
            </div>
          </div>
          <button
            type="button"
            className="text-green-500 hover:text-green-700 transition-colors"
            onClick={handleCloseNotification}
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Quản lý tồn kho</h3>
        {!isViewMode && (
          <button
            type="button"
            onClick={() => handleShowBranchModal(branches)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiPlus className="mr-1" /> Thêm chi nhánh
          </button>
        )}
      </div>

      {/* Tổng quan tồn kho */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tổng tồn kho</h4>
          <p className="text-2xl font-bold text-gray-900">{getTotalInventory().toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng số sản phẩm trong kho</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Chi nhánh còn hàng</h4>
          <p className="text-2xl font-bold text-green-600">{getInStockBranchesCount()}</p>
          <p className="text-xs text-gray-500 mt-1">Số chi nhánh có tồn kho &gt; 0</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Chi nhánh sắp hết hàng</h4>
          <p className="text-2xl font-bold text-yellow-600">{getLowStockBranchesCount()}</p>
          <p className="text-xs text-gray-500 mt-1">Số chi nhánh có tồn kho thấp hơn ngưỡng</p>
        </div>
      </div>

      {/* Panel quản lý tồn kho biến thể */}
      {selectedBranchForVariants && formData.variants && formData.variants.length > 0 && (
        <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-blue-800">
              Quản lý tồn kho biến thể cho chi nhánh: {getInventoryWithNames().find(item => item.branchId === selectedBranchForVariants)?.branchName}
            </h4>
            <button
              type="button"
              onClick={handleClearBranchSelection}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              <FiX className="inline mr-1" /> Đóng
            </button>
          </div>

          {branchVariants.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg bg-white">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Biến thể
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Thông tin
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Số lượng
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tổ hợp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {branchVariants.map((variant) => (
                    <tr key={variant.variantId || ''}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {variant.name || `Biến thể ${variant.options?.color || ''}`}
                      </td>
                      <td className="py-4 px-3 text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          {variant.options?.color && (
                            <span className="text-xs">Màu: <span className="font-medium">{variant.options.color}</span></span>
                          )}
                          {variant.options?.shades && variant.options.shades.length > 0 && (
                            <span className="text-xs">Tông màu: <span className="font-medium">{variant.options.shades.join(', ')}</span></span>
                          )}
                          {variant.options?.sizes && variant.options.sizes.length > 0 && (
                            <span className="text-xs">Kích thước: <span className="font-medium">{variant.options.sizes.join(', ')}</span></span>
                          )}
                          <span className="text-xs">Giá: <span className="font-medium">{(variant.price || 0).toLocaleString()} đ</span></span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => handleVariantInventoryChange?.(variant.variantId || '', parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-20 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {variant.combinations && variant.combinations.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleSelectVariantForCombinations?.(variant.variantId || '')}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <FiLayers className="mr-1" /> Quản lý tổ hợp ({variant.combinations.length})
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Không có tổ hợp</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md bg-white">
              Không có biến thể nào cho sản phẩm này
            </div>
          )}
        </div>
      )}

      {/* Panel quản lý tồn kho tổ hợp biến thể */}
      {selectedBranchForVariants && selectedVariantForCombinations && variantCombinations.length > 0 && (
        <div className="mt-4 bg-pink-50 p-4 rounded-lg border border-pink-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-pink-800">
              Quản lý tồn kho tổ hợp cho biến thể: {branchVariants.find(v => v.variantId === selectedVariantForCombinations)?.name || 'Biến thể'}
            </h4>
            <button
              type="button"
              onClick={handleClearVariantSelection}
              className="text-pink-600 hover:text-pink-800 text-sm"
            >
              <FiX className="inline mr-1" /> Đóng
            </button>
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg bg-white">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Thuộc tính
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Số lượng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {variantCombinations.map((combo) => (
                  <tr key={combo.combinationId}>
                    <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(combo.attributes).map(([key, value]) => (
                          <span key={key} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {key === 'shade' ? 'Tông màu' : key === 'size' ? 'Kích thước' : key}: {value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <input
                        type="number"
                        value={combo.quantity}
                        onChange={(e) => handleCombinationInventoryChange?.(combo.combinationId, parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-20 border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Danh sách tồn kho theo chi nhánh */}
      {formData.inventory && formData.inventory.length > 0 ? (
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Chi nhánh
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Tồn kho
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Ngưỡng cảnh báo hết hàng
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Trạng thái
                </th>
                {!isViewMode && (
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {getInventoryWithNames().map((item, index) => (
                <tr
                  key={item.branchId}
                  ref={(el) => setRowRef(el, item.branchId)}
                  className={item.isNew ? "bg-pink-100 transition-all duration-1000 animate-pulse" : ""}
                >
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <div className="flex items-center">
                      <span className={item.isNew ? "font-medium text-pink-600" : ""}>{item.branchName}</span>
                      {item.isNew && (
                        <span className="flex items-center ml-2 text-pink-600">
                          <span className="flex items-center bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                            Mới thêm <FiCheck size={14} className="ml-1" />
                          </span>
                        </span>
                      )}
                      {selectedBranchForVariants === item.branchId && (
                        <span className="flex items-center ml-2">
                          <span className="flex items-center bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                            Đang chọn
                          </span>
                        </span>
                      )}
                      {!isViewMode && hasVariants() && (
                        <button
                          type="button"
                          onClick={() => handleSelectBranchForVariants?.(item.branchId)}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Quản lý tồn kho biến thể
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      {!isViewMode && !hasVariants() ? (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleInventoryChange(index, 'quantity', e.target.value)}
                          min="0"
                          className="w-20 border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                        />
                      ) : (
                        <span className="font-medium">{item.quantity}</span>
                      )}
                      {hasVariants() && (
                        <span className="ml-2 text-xs text-gray-400 italic">
                          (Tính từ tổng biến thể)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {!isViewMode ? (
                      <input
                        type="number"
                        value={item.lowStockThreshold}
                        onChange={(e) => handleInventoryChange(index, 'lowStockThreshold', e.target.value)}
                        min="0"
                        className="w-20 border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                      />
                    ) : (
                      item.lowStockThreshold
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {item.quantity === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Hết hàng
                      </span>
                    ) : item.quantity <= (item.lowStockThreshold || 5) ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Sắp hết
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Còn hàng
                      </span>
                    )}
                  </td>
                  {!isViewMode && (
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        type="button"
                        onClick={() => handleRemoveInventory(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
          Chưa có thông tin tồn kho nào được thêm
        </div>
      )}

      {/* Modal thêm chi nhánh kiểu popup đơn giản */}
      {showBranchModal && !isViewMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          {/* Backdrop mờ */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleCloseBranchModal} />

          {/* Modal content */}
          <div
            className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-0 z-[1001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Thêm chi nhánh</h3>
              <button
                onClick={handleCloseBranchModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">Chọn chi nhánh để thêm vào danh sách tồn kho:</p>

              {availableBranches.length > 0 ? (
                <>
                  <ul className="mb-4 max-h-[300px] overflow-y-auto">
                    {getCurrentPageBranches().map((branch) => {
                      // Kiểm tra xem chi nhánh này đã được thêm vào inventory chưa
                      const isAlreadyAdded = formData.inventory?.some(item => item.branchId === branch.id);

                      return (
                        <li key={branch.id} className="py-2 border-b border-gray-100 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => !isAlreadyAdded && handleSelectBranch(branch.id, branch.name)}
                            disabled={isAlreadyAdded}
                            className={`w-full text-left py-2 px-3 rounded-md flex items-center justify-between transition-colors duration-200 ${
                              isAlreadyAdded
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : selectedBranch === branch.id
                                  ? 'bg-pink-50 text-pink-600 ring-2 ring-pink-300'
                                  : 'hover:bg-gray-50 hover:text-pink-600'
                            }`}
                          >
                            <span>{branch.name}</span>
                            {selectedBranch === branch.id ? (
                              <span className="flex items-center text-pink-600 animate-pulse">
                                <FiCheck className="ml-2" />
                              </span>
                            ) : isAlreadyAdded ? (
                              <span className="flex items-center text-green-600">
                                <span className="text-xs text-green-600 px-2 py-0.5 rounded-full border border-green-200 bg-green-50">Đã thêm</span>
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Bộ điều hướng phân trang */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`flex items-center text-sm font-medium ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-pink-600 hover:text-pink-700'
                        }`}
                      >
                        <FiChevronLeft className="mr-1" /> Trước
                      </button>

                      <span className="text-sm text-gray-600">
                        Trang {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`flex items-center text-sm font-medium ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-pink-600 hover:text-pink-700'
                        }`}
                      >
                        Tiếp <FiChevronRight className="ml-1" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
                  Tất cả chi nhánh đã được thêm vào danh sách
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-md">
              <button
                type="button"
                onClick={handleCloseBranchModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;