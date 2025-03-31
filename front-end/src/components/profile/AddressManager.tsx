import React, { useState } from 'react';
import { User, Address } from './types';
import AddressList from './AddressList';

interface AddressManagerProps {
  user: User;
  onAddAddress: (address: Omit<Address, 'addressId'>) => void;
  onUpdateAddress: (address: Address) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefaultAddress: (addressId: string) => void;
}

const AddressManager: React.FC<AddressManagerProps> = ({
  user,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Địa chỉ giao hàng</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-pink-100 text-pink-700 rounded-md hover:bg-pink-200 transition-colors"
        >
          Thêm địa chỉ mới
        </button>
      </div>
      
      <AddressList
        addresses={user.addresses}
        user={{ name: user.name, phone: user.phone }}
        showAddForm={showAddForm}
        onCancelAdd={() => setShowAddForm(false)}
        onAddAddress={onAddAddress}
        onUpdateAddress={onUpdateAddress}
        onDeleteAddress={onDeleteAddress}
        onSetDefaultAddress={onSetDefaultAddress}
      />
    </div>
  );
};

export default AddressManager; 