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
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
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
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
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

          <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiEdit className="text-pink-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Chỉnh sửa voucher: <span className="font-semibold">{voucher.code}</span>
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
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
