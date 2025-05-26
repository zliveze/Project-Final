import React, { useState, useEffect } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import BranchForm, { Branch } from './BranchForm';
import { useBranches } from '@/contexts/BranchContext';

interface BranchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BranchAddModal: React.FC<BranchAddModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createBranch } = useBranches();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen]);

  // Xử lý khi submit form
  const handleSubmit = async (data: Partial<Branch>) => {
    try {
      setIsSubmitting(true);
      // Gọi API tạo chi nhánh - toast đã được xử lý trong Context
      const success = await createBranch(data);

      if (success) {
        // Đóng modal - không cần toast vì đã có trong Context
        onClose();
      }
    } catch (error) {
      // Error đã được xử lý trong Context, không cần toast thêm
      console.error('Lỗi khi thêm chi nhánh:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${ // Re-added rounded-lg
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <FiPlus className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm chi nhánh mới
                </h3>
                <p className="text-sm text-gray-500">
                  Tạo chi nhánh mới cho hệ thống
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

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <BranchForm
              onSubmit={handleSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchAddModal;
