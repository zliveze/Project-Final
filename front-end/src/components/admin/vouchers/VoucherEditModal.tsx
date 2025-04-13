import React, { useState, useEffect } from 'react';
import { Voucher } from '@/contexts/VoucherContext';
import { FiX, FiEdit } from 'react-icons/fi';
import VoucherForm from './VoucherForm'; // Import the shared form component

interface VoucherEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, voucherData: Partial<Voucher>) => void; // Keep original signature
  isSubmitting: boolean;
  voucher: Voucher | null; // The voucher data to edit
}

const VoucherEditModal: React.FC<VoucherEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  voucher
}) => {

  const [modalVisible, setModalVisible] = useState(false);

  // Reset form state or perform actions when modal opens/closes if needed
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      // Khi modal mở, ngăn scroll của body
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
      // Khi modal đóng, cho phép scroll lại
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle the submission from the VoucherForm
  const handleFormSubmit = (formData: Partial<Voucher>) => {
    if (voucher?._id) {
      onSubmit(voucher._id, formData); // Call the original onSubmit with the ID
    } else {
      console.error("Voucher ID is missing, cannot submit edit.");
      // Optionally show an error toast to the user
    }
  };

  if ((!isOpen && !modalVisible) || !voucher) return null; // Don't render if not open or no voucher data

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl ${
            isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          }`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                <FiEdit className="text-pink-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Chỉnh sửa voucher: <span className="font-semibold">{voucher.code}</span>
              </h2>
            </div>
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Body - scrollable */}
          <div className="max-h-[calc(85vh-8rem)] overflow-y-auto p-6">
            <VoucherForm
              initialData={voucher} // Pass the voucher data to prefill the form
              onSubmit={handleFormSubmit} // Use the wrapper function
              onCancel={onClose}
              isSubmitting={isSubmitting}
              isEditMode={true} // This is the Edit modal
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherEditModal;
