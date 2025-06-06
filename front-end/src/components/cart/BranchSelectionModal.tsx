import React, { useState, useEffect } from 'react';
import { FiMapPin, FiCheck } from 'react-icons/fi';
import { useBranches } from '@/hooks/useBranches';
import Portal from '@/components/common/Portal';

interface BranchInventory {
  branchId: string;
  quantity: number;
  name?: string; // Branch name if available
}

interface BranchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchInventory: BranchInventory[];
  onSelectBranch: (branchId: string) => void;
  initialBranchId?: string; // Add initialBranchId prop
}

const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  onClose,
  branchInventory,
  onSelectBranch,
  initialBranchId
}) => {
  // Use the branches hook to get branch information
  const { getBranchName, preloadBranches } = useBranches();
  // State for selected branch - initialize with initialBranchId if provided
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(initialBranchId || null);

  // Preload branches when modal opens
  useEffect(() => {
    preloadBranches();
  }, [preloadBranches]);

  // Update selectedBranchId when initialBranchId changes
  useEffect(() => {
    if (initialBranchId) {
      setSelectedBranchId(initialBranchId);
    }
  }, [initialBranchId]);

  if (!isOpen) return null;

  // Sort branches by available quantity (highest first)
  const sortedBranches = [...branchInventory]
    .sort((a, b) => b.quantity - a.quantity)
    .filter(branch => branch.quantity > 0);

  // Handle branch selection
  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedBranchId) {
      onSelectBranch(selectedBranchId);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chọn chi nhánh</h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-2">
            Vui lòng chọn chi nhánh để mua sản phẩm này.
          </p>
          <p className="text-xs text-blue-600 mb-4">
            Lưu ý: Số lượng tối đa bạn có thể mua từ mỗi chi nhánh phụ thuộc vào tồn kho của chi nhánh đó.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {sortedBranches.map((branch) => (
              <div
                key={branch.branchId}
                className={`border rounded-md p-3 transition-colors ${selectedBranchId === branch.branchId ? 'border-pink-300 bg-pink-50' : 'border-gray-200 hover:border-pink-300 cursor-pointer'}`}
                onClick={() => handleSelectBranch(branch.branchId)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-pink-500 mr-2">
                      <FiMapPin size={16} />
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {branch.name || getBranchName(branch.branchId)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Số lượng kho: <span className={`font-medium ${branch.quantity < 5 ? 'text-orange-500' : 'text-green-600'}`}>{branch.quantity}</span> sản phẩm
                      </p>
                    </div>
                  </div>
                  {selectedBranchId === branch.branchId && (
                    <span className="text-pink-600">
                      <FiCheck size={18} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sortedBranches.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Không có chi nhánh nào có sản phẩm này trong kho
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedBranchId}
            className={`px-4 py-2 rounded-md transition-colors ${selectedBranchId ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Xác nhận
          </button>
        </div>
        </div>
      </div>
    </Portal>
  );
};

export default BranchSelectionModal;
