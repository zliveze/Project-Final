import React, { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle, FiX, FiTrash, FiPackage } from 'react-icons/fi';
import { useBranches } from '@/contexts/BranchContext';

interface BranchDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  branchId: string;
  branchName: string;
}

const BranchDeleteConfirmModal: React.FC<BranchDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  branchId,
  branchName
}) => {
  const { getProductsCount, forceDeleteBranch } = useBranches();
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  const checkProductsCount = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    try {
      const result = await getProductsCount(branchId);
      if (result) {
        setProductsCount(result.productsCount);
      }
    } catch {
      // Error đã được xử lý trong Context
      setProductsCount(0);
    } finally {
      setLoading(false);
    }
  }, [branchId, getProductsCount]);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      checkProductsCount();
    } else {
      setTimeout(() => {
        setModalVisible(false);
        setProductsCount(null);
      }, 300);
    }
  }, [isOpen, branchId, checkProductsCount]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleForceDelete = async () => {
    if (!branchId) return;

    try {
      setIsForceDeleting(true);
      const result = await forceDeleteBranch(branchId);
      if (result && result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Lỗi khi force delete chi nhánh:", error);
    } finally {
      setIsForceDeleting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    } transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"
            onClick={onClose}
          />
        </div>

        {/* Trick to center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full ${
          isOpen ? 'sm:scale-100' : 'sm:scale-95'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận xóa chi nhánh
              </h3>
              <p className="text-sm text-gray-500">
                {branchName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Đang kiểm tra sản phẩm...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Products count info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FiPackage className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Sản phẩm liên quan
                    </p>
                    <p className="text-sm text-gray-600">
                      {productsCount !== null ? (
                        productsCount > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {productsCount} sản phẩm đang tham chiếu đến chi nhánh này
                          </span>
                        ) : (
                          <span className="text-green-600">
                            Không có sản phẩm nào tham chiếu đến chi nhánh này
                          </span>
                        )
                      ) : (
                        'Không thể kiểm tra'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning message */}
              <div className="space-y-2">
                <p className="text-gray-700">
                  {productsCount !== null && productsCount > 0 ? (
                    <>
                      <strong className="text-orange-600">Cảnh báo:</strong> Chi nhánh này đang được tham chiếu bởi <strong>{productsCount} sản phẩm</strong>.
                    </>
                  ) : (
                    'Bạn có chắc chắn muốn xóa chi nhánh này?'
                  )}
                </p>

                {productsCount !== null && productsCount > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800 text-sm font-medium mb-2">
                        ⚠️ Chi nhánh này đang được sử dụng:
                      </p>
                      <ul className="text-sm text-orange-700 space-y-1 ml-4">
                        <li>• Có {productsCount} sản phẩm đang tham chiếu đến chi nhánh này</li>
                        <li>• Xóa thông thường sẽ không thành công</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm font-medium mb-2">
                        🔥 Xóa cưỡng bức sẽ:
                      </p>
                      <ul className="text-sm text-red-700 space-y-1 ml-4">
                        <li>• Xóa tất cả dữ liệu tồn kho của chi nhánh này</li>
                        <li>• Cập nhật lại trạng thái sản phẩm dựa trên tồn kho còn lại</li>
                        <li>• Dọn dẹp dữ liệu rác nếu có</li>
                        <li>• <strong>Hành động này không thể hoàn tác!</strong></li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm font-medium">
                    ⚠️ Hành động này không thể hoàn tác!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {productsCount !== null && productsCount > 0 ? 'Đóng' : 'Hủy'}
          </button>

          {/* Nút xóa thông thường - chỉ hiển thị khi không có sản phẩm */}
          {productsCount !== null && productsCount === 0 && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <FiTrash className="w-4 h-4" />
              <span>Xóa chi nhánh</span>
            </button>
          )}

          {/* Nút xóa cưỡng bức - chỉ hiển thị khi có sản phẩm */}
          {productsCount !== null && productsCount > 0 && (
            <button
              onClick={handleForceDelete}
              disabled={loading || isForceDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-700 border border-transparent rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <FiAlertTriangle className="w-4 h-4" />
              <span>
                {isForceDeleting ? 'Đang xóa...' : `Xóa cưỡng bức và cập nhật ${productsCount} sản phẩm`}
              </span>
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDeleteConfirmModal;
