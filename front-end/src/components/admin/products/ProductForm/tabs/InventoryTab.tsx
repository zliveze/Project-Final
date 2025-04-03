import React, { useState } from 'react';
import { FiTrash2, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ProductFormData, BranchItem } from '../types';

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
  branches: BranchItem[]; // Danh sách chi nhánh từ dữ liệu store
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
  branches
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

  return (
    <div className="space-y-6">
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
              {formData.inventory.map((item, index) => (
                <tr key={item.branchId}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {item.branchName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {!isViewMode ? (
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => handleInventoryChange(index, 'quantity', e.target.value)}
                        min="0"
                        className="w-20 border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                      />
                    ) : (
                      item.quantity
                    )}
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
                    ) : item.quantity <= item.lowStockThreshold ? (
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

      {/* Modal thêm chi nhánh */}
      {showBranchModal && !isViewMode && (
        <div className="fixed inset-0 z-10" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-center min-h-screen px-4 text-center" style={{ overflow: 'hidden' }}>
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{ maxHeight: '80vh', overflow: 'hidden' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Thêm chi nhánh
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Chọn chi nhánh để thêm vào danh sách tồn kho:
                      </p>
                      
                      {availableBranches.length > 0 ? (
                        <>
                          <div className="branch-list-container">
                            <ul className="divide-y divide-gray-200">
                              {getCurrentPageBranches().map((branch) => (
                                <li key={branch.id} className="py-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddBranch(branch.id, branch.name)}
                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                                  >
                                    {branch.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Điều khiển phân trang */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 border-t pt-2">
                              <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`inline-flex items-center px-2 py-1 text-sm rounded ${
                                  currentPage === 1 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <FiChevronLeft className="mr-1" />
                                Trước
                              </button>
                              
                              <span className="text-sm text-gray-600">
                                Trang {currentPage}/{totalPages}
                              </span>
                              
                              <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={`inline-flex items-center px-2 py-1 text-sm rounded ${
                                  currentPage === totalPages 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                Tiếp
                                <FiChevronRight className="ml-1" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="py-4 text-center text-gray-500">
                          Tất cả chi nhánh đã được thêm vào danh sách
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCloseBranchModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTab; 