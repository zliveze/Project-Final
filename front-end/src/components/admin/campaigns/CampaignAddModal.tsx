import React, { useState, useEffect } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CampaignForm from './CampaignForm';
import { Campaign } from './CampaignForm';

interface CampaignAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Campaign>) => void;
}

const CampaignAddModal: React.FC<CampaignAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit
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
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gọi hàm submit từ parent component
      onSubmit(data);
      
      // Thông báo thành công
      toast.success('Thêm chiến dịch mới thành công!');
      
      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Lỗi khi thêm chiến dịch:', error);
      toast.error('Có lỗi xảy ra khi thêm chiến dịch. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
      <div className={`relative bg-white rounded-lg shadow-xl w-[90vw] max-w-5xl mx-auto z-50 ${
        isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
      } transition-all duration-300`}>
        
        <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiPlus className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Thêm chiến dịch mới
            </h2>
          </div>
          <button
            type="button"
            className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
            onClick={onClose}
          >
            <span className="sr-only">Đóng</span>
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
          <CampaignForm 
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CampaignAddModal; 