import React from 'react';

interface BranchInventory {
  branchId: string;
  quantity: number;
  name?: string; // Branch name if available
}

interface BranchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchInventory: BranchInventory[];
  currentQuantity: number;
  maxQuantity: number;
  onSelectBranch: (branchId: string) => void;
}

const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  onClose,
  branchInventory,
  currentQuantity,
  maxQuantity,
  onSelectBranch
}) => {
  if (!isOpen) return null;

  // Sort branches by available quantity (highest first)
  const sortedBranches = [...branchInventory]
    .sort((a, b) => b.quantity - a.quantity)
    .filter(branch => branch.quantity > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chọn chi nhánh</h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Bạn đang muốn tăng số lượng lên <span className="font-medium">{currentQuantity + 1}</span> sản phẩm.
            Vui lòng chọn chi nhánh để tiếp tục.
          </p>
          <p className="text-xs text-blue-600 mb-4">
            Lưu ý: Số lượng tối đa bạn có thể mua từ mỗi chi nhánh phụ thuộc vào tồn kho của chi nhánh đó.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {sortedBranches.map((branch) => (
              <div
                key={branch.branchId}
                className={`border rounded-md p-3 transition-colors ${branch.quantity > currentQuantity ? 'border-gray-200 hover:border-pink-300 cursor-pointer' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                onClick={() => branch.quantity > currentQuantity ? onSelectBranch(branch.branchId) : null}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {branch.name || `Chi nhánh ${branch.branchId.substring(0, 6)}...`}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Còn lại: <span className={`font-medium ${branch.quantity > currentQuantity ? 'text-green-600' : 'text-orange-500'}`}>{branch.quantity}</span> sản phẩm
                    </p>
                    {branch.quantity <= currentQuantity && (
                      <p className="text-xs text-red-500 mt-1">
                        Không đủ số lượng để tăng thêm
                      </p>
                    )}
                  </div>
                  <button
                    className={`px-3 py-1 rounded-full text-sm font-medium ${branch.quantity > currentQuantity ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-gray-100 text-gray-400'}`}
                    disabled={branch.quantity <= currentQuantity}
                  >
                    {branch.quantity > currentQuantity ? 'Chọn' : 'Không đủ'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sortedBranches.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Không có chi nhánh nào có đủ số lượng sản phẩm
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchSelectionModal;
