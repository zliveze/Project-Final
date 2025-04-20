import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CampaignForm from './CampaignForm';
import { Campaign } from './CampaignForm';

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
      const result = await onSubmit(data);
      console.log('CampaignEditModal: onSubmit result', result);

      // Chỉ hiển thị thông báo và đóng modal nếu cập nhật thành công
      if (result) {
        // Thông báo thành công
        toast.success('Cập nhật chiến dịch thành công!');

        // Đóng modal chỉ khi đã cập nhật thành công
        onClose();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật chiến dịch:', error);
      toast.error('Có lỗi xảy ra khi cập nhật chiến dịch. Vui lòng thử lại sau.');
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
              <FiEdit2 className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chỉnh sửa chiến dịch
            </h2>
          </div>
          <button
            type="button"
            className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
            onClick={(e) => {
              e.preventDefault(); // Ngăn chặn sự kiện mặc định
              e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
              onClose();
            }}
          >
            <span className="sr-only">Đóng</span>
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div
          className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]"
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
  );
};

export default CampaignEditModal;