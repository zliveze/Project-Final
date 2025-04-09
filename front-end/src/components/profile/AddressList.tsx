import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

// Định nghĩa interface cho địa chỉ - phải giống với interface trong trang profile
export interface Address {
  addressId: string;
  addressLine: string;
  city: string;
  district: string;
  ward: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  state?: string; // Để tương thích với dữ liệu cũ
}

export interface User {
  name: string;
  phone: string;
}

interface Province {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
  province_code: string;
}

interface Ward {
  code: string;
  name: string;
  district_code: string;
}

interface AddressListProps {
  addresses: Address[];
  user?: User;
  onAddAddress?: (address: Omit<Address, 'addressId'>) => void;
  onUpdateAddress?: (address: Address) => void;
  onDeleteAddress?: (addressId: string) => void;
  onSetDefaultAddress?: (addressId: string) => void;
  onCancelAdd?: () => void;
  showAddForm?: boolean;
}

const AddressList = ({
  addresses,
  user,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onCancelAdd,
  showAddForm = false,
}: AddressListProps) => {
  const [isAdding, setIsAdding] = useState(showAddForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Address, 'addressId'>>({
    addressLine: '',
    city: '',
    district: '',
    ward: '',
    country: 'Việt Nam',
    postalCode: '',
    isDefault: false,
  });

  // Dữ liệu địa chỉ Việt Nam
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Cập nhật isAdding khi showAddForm thay đổi
  useEffect(() => {
    setIsAdding(showAddForm);
  }, [showAddForm]);

  // Lấy danh sách tỉnh/thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      try {
        console.log('Fetching provinces...');
        const response = await axios.get('https://provinces.open-api.vn/api/p/');
        console.log('Provinces response:', response.data);
        setProvinces(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', error);
        toast.error('Không thể lấy danh sách tỉnh/thành phố');
        // Sử dụng dữ liệu mẫu nếu API lỗi
        setProvinces([
          { code: '01', name: 'Hà Nội' },
          { code: '79', name: 'TP. Hồ Chí Minh' },
          { code: '48', name: 'Đà Nẵng' },
          { code: '92', name: 'Cần Thơ' },
          { code: '27', name: 'Bắc Ninh' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // Lấy danh sách quận/huyện khi chọn tỉnh/thành phố
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        setLoading(true);
        try {
          console.log('Fetching districts for province:', selectedProvince);
          const response = await axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`);
          console.log('Districts response:', response.data);
          setDistricts(response.data.districts);
          setSelectedDistrict('');
          setSelectedWard('');
          setWards([]);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách quận/huyện:', error);
          toast.error('Không thể lấy danh sách quận/huyện');
          // Sử dụng dữ liệu mẫu nếu API lỗi
          if (selectedProvince === '27') { // Bắc Ninh
            setDistricts([
              { code: '256', name: 'Thành phố Bắc Ninh', province_code: '27' },
              { code: '258', name: 'Huyện Yên Phong', province_code: '27' },
              { code: '259', name: 'Huyện Quế Võ', province_code: '27' },
              { code: '260', name: 'Huyện Tiên Du', province_code: '27' },
              { code: '261', name: 'Thị xã Từ Sơn', province_code: '27' }
            ]);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchDistricts();
    }
  }, [selectedProvince]);

  // Lấy danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        setLoading(true);
        try {
          console.log('Fetching wards for district:', selectedDistrict);
          const response = await axios.get(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
          console.log('Wards response:', response.data);
          setWards(response.data.wards);
          setSelectedWard('');
        } catch (error) {
          console.error('Lỗi khi lấy danh sách phường/xã:', error);
          toast.error('Không thể lấy danh sách phường/xã');
          // Sử dụng dữ liệu mẫu nếu API lỗi
          if (selectedDistrict === '256') { // TP Bắc Ninh
            setWards([
              { code: '9220', name: 'Phường Vũ Ninh', district_code: '256' },
              { code: '9223', name: 'Phường Đáp Cầu', district_code: '256' },
              { code: '9226', name: 'Phường Thị Cầu', district_code: '256' },
              { code: '9229', name: 'Phường Kinh Bắc', district_code: '256' },
              { code: '9232', name: 'Phường Vệ An', district_code: '256' },
              { code: '9235', name: 'Phường Tiền An', district_code: '256' },
              { code: '9238', name: 'Phường Đại Phúc', district_code: '256' },
              { code: '9241', name: 'Phường Ninh Xá', district_code: '256' },
              { code: '9244', name: 'Phường Suối Hoa', district_code: '256' },
              { code: '9247', name: 'Phường Võ Cường', district_code: '256' },
              { code: '9250', name: 'Phường Nam Sơn', district_code: '256' }
            ]);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchWards();
    }
  }, [selectedDistrict]);

  // Cập nhật formData khi chọn địa chỉ
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      const province = provinces.find(p => p.code === selectedProvince);
      const district = districts.find(d => d.code === selectedDistrict);
      const ward = wards.find(w => w.code === selectedWard);

      if (province && district && ward) {
        setFormData(prev => ({
          ...prev,
          city: province.name,
          district: district.name,
          ward: ward.name
        }));
      }
    }
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name === 'province') {
      setSelectedProvince(value);
    } else if (name === 'district') {
      setSelectedDistrict(value);
    } else if (name === 'ward') {
      setSelectedWard(value);
    } else {
      // Sử dụng callback để đảm bảo state được cập nhật đúng
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      
      // Giữ focus cho input sau khi cập nhật state
      if (type !== 'checkbox') {
        // Đảm bảo rằng element vẫn được focus sau khi re-render
        setTimeout(() => {
          const inputElement = document.getElementById(name);
          if (inputElement) {
            const cursorPosition = (e.target as HTMLInputElement).selectionStart;
            inputElement.focus();
            // Khôi phục vị trí con trỏ
            if (cursorPosition !== null) {
              (inputElement as HTMLInputElement).setSelectionRange(cursorPosition, cursorPosition);
            }
          }
        }, 0);
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting address form:', formData);
    
    // Kiểm tra xem đã chọn đủ thông tin địa chỉ chưa
    if (!formData.city || !formData.district || !formData.ward) {
      toast.error('Vui lòng chọn đầy đủ thông tin địa chỉ');
      return;
    }

    // Giả lập thêm địa chỉ
    if (onAddAddress) {
      console.log('Calling onAddAddress with:', formData);
      onAddAddress(formData);
    } else {
      console.error('onAddAddress function is not provided');
    }
    
    toast.success('Thêm địa chỉ thành công!');
    setIsAdding(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId && onUpdateAddress) {
      onUpdateAddress({
        ...formData,
        addressId: editingId,
      } as Address);
    }
    
    toast.success('Cập nhật địa chỉ thành công!');
    setEditingId(null);
    resetForm();
  };

  const startEditing = (address: Address) => {
    setEditingId(address.addressId);
    setFormData({
      addressLine: address.addressLine,
      city: address.city,
      district: address.district || '',
      ward: address.ward || '',
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });

    // Tìm và thiết lập các giá trị cho dropdown
    const province = provinces.find(p => p.name === address.city);
    if (province) {
      setSelectedProvince(province.code);
    }
  };

  const handleCancel = () => {
    if (onCancelAdd && showAddForm) {
      onCancelAdd();
    } else {
      setIsAdding(false);
      setEditingId(null);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      addressLine: '',
      city: '',
      district: '',
      ward: '',
      country: 'Việt Nam',
      postalCode: '',
      isDefault: false,
    });
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedWard('');
  };

  const handleDelete = (addressId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      if (onDeleteAddress) {
        onDeleteAddress(addressId);
      }
      toast.success('Xóa địa chỉ thành công!');
    }
  };

  const handleSetDefault = (addressId: string) => {
    if (onSetDefaultAddress) {
      onSetDefaultAddress(addressId);
    }
    toast.success('Đã đặt làm địa chỉ mặc định!');
  };

  const AddressForm = ({ isEditing = false }: { isEditing?: boolean }) => {
    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted', isEditing ? 'edit mode' : 'add mode');
      if (isEditing) {
        handleEditSubmit(e);
      } else {
        handleAddSubmit(e);
      }
    };
    
    return (
<form onSubmit={handleFormSubmit} className="bg-gray-50 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Tỉnh/Thành phố */}
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              name="province"
              value={selectedProvince}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded appearance-none bg-white"
              disabled={loading}
            >
              <option value="">-- Chọn Tỉnh/Thành phố --</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quận/Huyện */}
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select
              id="district"
              name="district"
              value={selectedDistrict}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded appearance-none bg-white"
              disabled={!selectedProvince || loading}
            >
              <option value="">-- Chọn Quận/Huyện --</option>
              {districts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phường/Xã */}
          <div>
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
              Phường/Xã <span className="text-red-500">*</span>
            </label>
            <select
              id="ward"
              name="ward"
              value={selectedWard}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded appearance-none bg-white"
              disabled={!selectedDistrict || loading}
            >
              <option value="">-- Chọn Phường/Xã --</option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          {/* Địa chỉ cụ thể */}
          <div>
            <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ cụ thể <span className="text-red-500">*</span>
            </label>
            <input
              id="addressLine"
              name="addressLine"
              type="text"
              required
              value={formData.addressLine}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded"
              placeholder="Số nhà, tên đường, tòa nhà, ..."
              autoComplete="off"
            />
          </div>

          {/* Mã bưu điện */}
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              Mã bưu điện
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              value={formData.postalCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Mã bưu điện (nếu có)"
              autoComplete="off"
            />
          </div>

          {/* Đặt làm địa chỉ mặc định */}
          <div className="flex items-center col-span-1 md:col-span-2">
            <input
              id="isDefault"
              name="isDefault"
              type="checkbox"
              checked={formData.isDefault}
              onChange={handleChange}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Đặt làm địa chỉ mặc định
            </label>
          </div>
        </div>

        {/* Hiển thị địa chỉ đầy đủ */}
        {formData.city && formData.district && formData.ward && formData.addressLine && (
          <div className="mb-4 p-3 bg-pink-50 border border-pink-100 rounded">
            <p className="text-sm text-gray-700 font-medium">Địa chỉ đầy đủ:</p>
            <p className="text-sm text-gray-600">
              {formData.addressLine}, {formData.ward}, {formData.district}, {formData.city}, {formData.country}
              {formData.postalCode && ` - ${formData.postalCode}`}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            disabled={loading || !formData.city || !formData.district || !formData.ward || !formData.addressLine}
          >
            {isEditing ? 'Cập nhật' : 'Thêm'}
          </button>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                console.log('Manual add button clicked');
                if (formData.city && formData.district && formData.ward && formData.addressLine) {
                  if (onAddAddress) {
                    console.log('Manually calling onAddAddress with:', formData);
                    onAddAddress(formData);
                  } else {
                    console.error('onAddAddress function is not provided');
                  }
                } else {
                  toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
                }
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              disabled={loading || !formData.city || !formData.district || !formData.ward || !formData.addressLine}
            >
              Thêm (Thử)
            </button>
          )}
        </div>
      </form>
    );
  };

  // Render logic
  if (showAddForm && addresses?.length === 0) {
    return <AddressForm />;
  }

  return (
    <div>
      {!showAddForm && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Địa chỉ của tôi</h2>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center text-pink-600 hover:text-pink-800 border border-pink-600 px-3 py-1 rounded"
            >
              <FaPlus className="mr-1" /> Thêm địa chỉ mới
            </button>
          )}
        </div>
      )}

      {isAdding && <AddressForm />}

      {editingId && <AddressForm isEditing />}

      {addresses && Array.isArray(addresses) && addresses.length === 0 && !isAdding && !editingId ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-gray-200">
          <FaMapMarkerAlt className="mx-auto text-gray-400 text-4xl mb-3" />
          <p>Bạn chưa có địa chỉ nào</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Thêm địa chỉ mới
          </button>
        </div>
      ) : addresses && Array.isArray(addresses) ? (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.addressId}
              className={`p-4 border rounded ${address.isDefault ? 'border-pink-600 bg-pink-50' : 'border-gray-200'}`}
            >
              {editingId === address.addressId ? (
                <AddressForm isEditing />
              ) : (
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="font-medium text-gray-900">{address.isDefault ? 'Địa chỉ mặc định' : 'Địa chỉ'}</h3>
                      {address.isDefault && (
                        <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-600">{user?.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.addressLine}, {address.ward}, {address.district}, {address.city}, {address.country}
                      {address.postalCode && ` - ${address.postalCode}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(address)}
                      className="text-pink-600 hover:text-pink-700 p-1.5 rounded border border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </button>
                    {!address.isDefault && (
                      <>
                        <button
                          onClick={() => handleSetDefault(address.addressId)}
                          className="text-purple-600 hover:text-purple-700 p-1.5 rounded border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          title="Đặt làm mặc định"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => handleDelete(address.addressId)}
                          className="text-red-600 hover:text-red-700 p-1.5 rounded border border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-gray-200">
          <FaMapMarkerAlt className="mx-auto text-gray-400 text-4xl mb-3" />
          <p>Không có địa chỉ nào</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Thêm địa chỉ mới
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressList;
