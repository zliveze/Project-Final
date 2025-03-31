import React, { useState, useEffect } from 'react';
import { FiMapPin, FiEdit2, FiTrash2, FiPlusCircle, FiCheck, FiX, FiAlertTriangle, FiMap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Address {
  addressId: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

interface UserAddressTableProps {
  addresses: Address[];
  onEdit: (addressId: string) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  onAdd: () => void;
  userId: string;
}

const UserAddressTable: React.FC<UserAddressTableProps> = ({
  addresses,
  onEdit,
  onDelete,
  onSetDefault,
  onAdd,
  userId
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

  // Khi hiển thị modal xác nhận
  useEffect(() => {
    if (showDeleteModal) {
      setModalVisible(true);
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [showDeleteModal]);

  const handleDeleteClick = (addressId: string) => {
    const address = addresses.find(a => a.addressId === addressId);
    setSelectedAddressId(addressId);
    setSelectedAddress(address || null);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedAddressId) {
      // Hiển thị loading toast
      const loadingToast = toast.loading('Đang xóa địa chỉ...');
      
      // Mô phỏng API call
      setTimeout(() => {
        onDelete(selectedAddressId);
        toast.dismiss(loadingToast);
        toast.success('Xóa địa chỉ thành công!');
        setShowDeleteModal(false);
        setSelectedAddressId(null);
        setSelectedAddress(null);
      }, 600);
    }
  };

  const handleSetDefault = (addressId: string) => {
    // Hiển thị loading toast
    const loadingToast = toast.loading('Đang cập nhật địa chỉ mặc định...');
    
    // Mô phỏng API call
    setTimeout(() => {
      onSetDefault(addressId);
      toast.dismiss(loadingToast);
      toast.success('Đã đặt địa chỉ mặc định thành công!');
    }, 600);
  };

  // Lọc địa chỉ theo từ khóa tìm kiếm
  const filteredAddresses = addresses.filter(address => {
    const searchString = 
      `${address.addressLine} ${address.city} ${address.state} ${address.country} ${address.postalCode}`.toLowerCase();
    return searchTerm === '' || searchString.includes(searchTerm.toLowerCase());
  });

  // Hiển thị địa chỉ dưới dạng card
  const renderAddressCards = () => {
    if (filteredAddresses.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-lg font-medium">Không tìm thấy địa chỉ</p>
          <p className="mt-1">{searchTerm ? 'Không có kết quả phù hợp với tìm kiếm của bạn.' : 'Người dùng này chưa có địa chỉ nào được thêm vào.'}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAddresses.map((address) => (
          <div 
            key={address.addressId} 
            className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
              address.isDefault ? 'border-pink-300 bg-pink-50/50' : 'border-gray-200 hover:border-pink-200'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <div className={`p-2 rounded-full mt-0.5 ${address.isDefault ? 'bg-pink-100' : 'bg-gray-100'}`}>
                    <FiMapPin className={`h-4 w-4 ${address.isDefault ? 'text-pink-500' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{address.addressLine}</div>
                    <div className="text-sm text-gray-600">
                      {address.city}, {address.state}
                    </div>
                    <div className="text-sm text-gray-600">
                      {address.country}, {address.postalCode}
                    </div>
                    {address.isDefault && (
                      <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiCheck className="mr-1 h-3 w-3" /> Mặc định
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <button 
                    onClick={() => onEdit(address.addressId)}
                    className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  {!address.isDefault && (
                    <>
                      <button 
                        onClick={() => handleSetDefault(address.addressId)}
                        className="p-1.5 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                        title="Đặt làm mặc định"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(address.addressId)}
                        className="p-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {address.isDefault && (
              <div className="px-3 py-1.5 bg-pink-100 text-pink-800 text-xs font-medium text-center">
                Địa chỉ mặc định
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Hiển thị địa chỉ dưới dạng bảng
  const renderAddressTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Địa chỉ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thành phố
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tỉnh/Bang
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Quốc gia
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Mã bưu điện
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAddresses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-lg font-medium">Không tìm thấy địa chỉ</p>
                  <p className="mt-1">{searchTerm ? 'Không có kết quả phù hợp với tìm kiếm của bạn.' : 'Người dùng này chưa có địa chỉ nào được thêm vào.'}</p>
                </td>
              </tr>
            ) : (
              filteredAddresses.map((address) => (
                <tr key={address.addressId} className={address.isDefault ? 'bg-pink-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm text-gray-900 max-w-xs">{address.addressLine}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {address.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {address.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {address.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {address.postalCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {address.isDefault ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <FiCheck className="mr-1" /> Mặc định
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleSetDefault(address.addressId)}
                        className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        <FiCheck className="mr-1" /> Đặt mặc định
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => onEdit(address.addressId)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(address.addressId)}
                        className={`text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors ${address.isDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Xóa"
                        disabled={address.isDefault}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
              <FiMap className="text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Danh sách địa chỉ</h2>
              <p className="text-sm text-gray-500">Quản lý địa chỉ của người dùng</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors flex items-center"
            >
              {viewMode === 'table' ? (
                <>
                  <FiMapPin className="mr-1.5" />
                  Xem dạng thẻ
                </>
              ) : (
                <>
                  <FiMap className="mr-1.5" />
                  Xem dạng bảng
                </>
              )}
            </button>
            <button 
              onClick={onAdd}
              className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors flex items-center"
            >
              <FiPlusCircle className="mr-1.5" />
              Thêm địa chỉ
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm địa chỉ..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-hidden">
          {addresses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-lg font-medium">Không có địa chỉ nào</p>
              <p className="mt-1">Người dùng này chưa có địa chỉ nào được thêm vào.</p>
              <button 
                onClick={onAdd}
                className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 inline-flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
              >
                <FiPlusCircle />
                <span>Thêm địa chỉ mới</span>
              </button>
            </div>
          ) : (
            viewMode === 'card' ? renderAddressCards() : renderAddressTable()
          )}
        </div>
      </div>
      
      {/* Modal xác nhận xóa */}
      {(showDeleteModal || modalVisible) && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${showDeleteModal ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
              showDeleteModal ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
            }`}>
              <div className="bg-red-50 px-4 py-3 sm:px-6 border-b border-red-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <FiTrash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-red-800">
                    Xác nhận xóa địa chỉ
                  </h3>
                </div>
              </div>

              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-4">
                        Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                      </p>
                      
                      {selectedAddress && (
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
                          <p className="text-sm font-medium text-gray-700">Thông tin địa chỉ:</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedAddress.addressLine}</p>
                          <p className="text-sm text-gray-600">{selectedAddress.city}, {selectedAddress.state}</p>
                          <p className="text-sm text-gray-600">{selectedAddress.country}, {selectedAddress.postalCode}</p>
                        </div>
                      )}
                      
                      <div className="p-3 rounded-md text-sm bg-yellow-50 text-yellow-700 border border-yellow-100">
                        <div className="flex">
                          <FiAlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>
                            Xóa địa chỉ sẽ xóa vĩnh viễn khỏi hệ thống và có thể ảnh hưởng đến đơn hàng liên quan.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  <FiTrash2 className="mr-1.5" /> Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-300 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <FiX className="mr-1.5" /> Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAddressTable; 