import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiMail, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBranches } from '@/contexts/BranchContext';
import { Branch } from './BranchForm';
import toast from 'react-hot-toast';

interface BranchViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  onEdit: () => void;
  onDelete: () => void;
}

const BranchViewModal: React.FC<BranchViewModalProps> = ({
  isOpen,
  onClose,
  branchId,
  onEdit,
  onDelete
}) => {
  const { fetchBranch } = useBranches();
  const [branch, setBranch] = useState<Branch | null>(null);
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
          isActive: true, // Giả định nếu API không có trường này
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

  if (!isOpen && !modalVisible) return null;

  // Format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Không xác định';
    return format(new Date(date), 'dd MMMM yyyy', { locale: vi });
  };

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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiEye className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết chi nhánh
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
              </div>
            ) : branch ? (
              <div className="space-y-6">
                {/* Thông tin chi tiết */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        {branch.name}
                      </h3>
                    </div>
                    
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                        </span>
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        <FiMapPin className="mr-2 text-gray-400" /> Địa chỉ
                      </p>
                      <p className="mt-1 text-gray-900">{branch.address}</p>
                    </div>
                    
                    {branch.contact && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-500 flex items-center">
                          <FiPhone className="mr-2 text-gray-400" /> Thông tin liên hệ
                        </p>
                        <p className="mt-1 text-gray-900">{branch.contact}</p>
                      </div>
                    )}
                    
                    {branch.createdAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                        <p className="mt-1 text-gray-900">{formatDate(branch.createdAt)}</p>
                      </div>
                    )}
                    
                    {branch.updatedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                        <p className="mt-1 text-gray-900">{formatDate(branch.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 space-x-3">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <FiEdit2 className="mr-2 -ml-1 h-5 w-5" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <FiTrash2 className="mr-2 -ml-1 h-5 w-5" />
                    Xóa
                  </button>
                </div>
              </div>
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

export default BranchViewModal; 