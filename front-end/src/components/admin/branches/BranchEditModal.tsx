import React, { useState, useEffect } from 'react';
import { FiX, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';
import BranchForm, { Branch } from './BranchForm';
import { useBranches } from '@/contexts/BranchContext';

interface BranchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

const BranchEditModal: React.FC<BranchEditModalProps> = ({
  isOpen,
  onClose,
  branchId
}) => {
  const { fetchBranch, updateBranch } = useBranches();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      loadBranch();
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen, branchId]);

  const loadBranch = async () => {
    if (!branchId) return;
    
    try {
      setIsLoading(true);
      const result = await fetchBranch(branchId);
      if (result) {
        // Chuyển đổi từ API response sang kiểu dữ liệu form
        setBranch({
          id: result.id,
          name: result.name,
          address: result.address,
          contact: result.contact,
          // isActive: true, // Removed status field
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin chi nhánh:', error);
      toast.error('Không thể tải thông tin chi nhánh');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi submit form
  const handleSubmit = async (data: Partial<Branch>) => {
    if (!branchId) return;
    
    try {
      setIsSubmitting(true);
      
      // Gọi API cập nhật chi nhánh
      const success = await updateBranch(branchId, data);
      
      if (success) {
        // Thông báo thành công
        toast.success('Cập nhật chi nhánh thành công!');
        
        // Đóng modal
        onClose();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật chi nhánh:', error);
      toast.error('Có lỗi xảy ra khi cập nhật chi nhánh. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${ // Re-added rounded-lg
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors" // Re-added rounded-md
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3"> {/* Re-added rounded-full */}
              <FiEdit className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chỉnh sửa chi nhánh
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div> {/* Re-added rounded-full */}
              </div>
            ) : branch ? (
              <BranchForm 
                branch={branch}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không thể tải thông tin chi nhánh
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchEditModal;
