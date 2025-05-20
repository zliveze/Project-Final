import React, { useState, useEffect } from 'react';
import { X, FileEdit } from 'lucide-react';
import toast from 'react-hot-toast';
import CampaignForm from './CampaignForm';
import { Campaign } from '@/contexts/CampaignContext';

interface CampaignEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Campaign>) => void;
  campaignData: Partial<Campaign>;
}

const CampaignEditModal: React.FC<CampaignEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  campaignData
}) => {
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
  const handleSubmit = async (data: Partial<Campaign>) => {
    try {
      setIsSubmitting(true);
      console.log('CampaignEditModal: handleSubmit called with data', data);

      // Gọi hàm submit từ parent component
      await onSubmit(data);
      
      // Thông báo thành công
      toast.success('Cập nhật chiến dịch thành công!');

      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Lỗi khi cập nhật chiến dịch:', error);
      toast.error('Có lỗi xảy ra khi cập nhật chiến dịch. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full ${isOpen ? 'sm:scale-100' : 'sm:scale-95'}`}>
          {/* Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <FileEdit className="h-5 w-5 mr-2.5 text-pink-600" />
              Chỉnh sửa chiến dịch
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Ngăn chặn sự kiện mặc định
                e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
                onClose();
              }}
              className="text-slate-400 hover:text-pink-600 focus:outline-none transition-colors duration-200 p-1.5 rounded-md hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div 
            className="bg-white px-6 pt-6 pb-8 sm:p-8 max-h-[calc(100vh-160px)] overflow-y-auto"
            onClick={(e) => {
              // Ngăn chặn sự kiện lan truyền đến form cha
              e.stopPropagation();
            }}
          >
            <CampaignForm
              initialData={campaignData}
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

export default CampaignEditModal;