import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Address, User } from './types/index';
import ViettelPostService from '@/services/ViettelPostService';

// --- Interfaces & Types ---
interface Province { code: string; name: string; viettelCode?: string; }
interface District { code: string; name: string; province_code: string; viettelCode?: string; }
interface Ward { code: string; name: string; district_code: string; viettelCode?: string; }
// Type for selected location object
type SelectedLocation = { code: string; name: string } | null;
// Local form data state type (lives inside AddressForm)
type LocalFormData = {
  addressLine: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};
interface AddressListProps {
  addresses: Address[];
  user?: User;
  onAddAddress?: (address: Omit<Address, '_id'>) => Promise<void>;
  onUpdateAddress?: (address: Address) => Promise<void>;
  onDeleteAddress?: (_id: string) => Promise<void>;
  onSetDefaultAddress?: (_id: string) => Promise<void>;
  onCancelAdd?: () => void; // Kept for potential future use if needed externally
  showAddForm?: boolean; // Kept for potential future use if needed externally
}
// Props for the separated AddressForm component
interface AddressFormProps {
  initialData: LocalFormData;
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  selectedProvince: SelectedLocation; // Pass selected object
  selectedDistrict: SelectedLocation; // Pass selected object
  selectedWard: SelectedLocation;     // Pass selected object
  loadingProvinces: boolean;
  loadingDistricts: boolean;
  loadingWards: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent, localData: LocalFormData) => Promise<void>;
  onCancel: () => void;
  // Pass specific handlers for each dropdown and local inputs
  onProvinceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDistrictChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onWardChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onLocalInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Re-add missing prop definition
  getSelectedLocationNames: () => { provinceName: string; districtName: string; wardName: string; };
}

// --- API Base URL ---
// Thay đổi từ provinces.open-api.vn sang API Viettel Post
// const PROVINCES_API_BASE_URL = 'https://provinces.open-api.vn/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ================== AddressForm Component (Manages its own text inputs) ==================
const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  provinces,
  districts,
  wards,
  selectedProvince,
  selectedDistrict,
  selectedWard,
  loadingProvinces,
  loadingDistricts,
  loadingWards,
  isSubmitting,
  isEditing,
  onSubmit,
  onCancel,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onLocalInputChange, // Handler for local text/checkbox inputs
}) => {
  // Local state for text inputs and checkbox, initialized by prop
  const [localFormData, setLocalFormData] = useState<LocalFormData>(initialData);

  // Update local state if initialData changes (e.g., when editing starts)
  useEffect(() => {
    setLocalFormData(initialData);
  }, [initialData]);

  const isLoading = loadingProvinces || loadingDistricts || loadingWards || isSubmitting;

  // Handle form submission by calling the passed onSubmit prop
  const handleFormSubmit = (e: React.FormEvent) => {
    onSubmit(e, localFormData); // Pass local data up
  };

  // Use the passed onLocalInputChange for text/checkbox changes
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLocalInputChange(e); // Call the handler passed from AddressList
  };


  return (
    <form onSubmit={handleFormSubmit} className="bg-gray-50 p-4 mb-4 border border-gray-200 rounded">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         {/* Province */}
         <div>
           <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
           <select id="province" name="province" value={selectedProvince?.code || ''} onChange={onProvinceChange} required disabled={loadingProvinces || isSubmitting}
             className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white disabled:bg-gray-100">
             <option value="">-- Chọn Tỉnh/Thành phố --</option>
             {provinces.map((p) => (<option key={p.code} value={p.code}>{p.name}</option>))}
           </select>
         </div>
         {/* District */}
         <div>
           <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện <span className="text-red-500">*</span></label>
           <select id="district" name="district" value={selectedDistrict?.code || ''} onChange={onDistrictChange} required disabled={!selectedProvince || loadingDistricts || isSubmitting}
             className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white disabled:bg-gray-100">
             <option value="">-- Chọn Quận/Huyện --</option>
             {districts.map((d) => (<option key={d.code} value={d.code}>{d.name}</option>))}
           </select>
         </div>
         {/* Ward */}
         <div>
           <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã <span className="text-red-500">*</span></label>
           <select id="ward" name="ward" value={selectedWard?.code || ''} onChange={onWardChange} required disabled={!selectedDistrict || loadingWards || isSubmitting}
             className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white disabled:bg-gray-100">
             <option value="">-- Chọn Phường/Xã --</option>
             {wards.map((w) => (<option key={w.code} value={w.code}>{w.name}</option>))}
           </select>
         </div>
         {/* Address Line */}
         <div>
           <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
           <input id="addressLine" name="addressLine" type="text" value={localFormData.addressLine} onChange={onLocalInputChange} required disabled={isSubmitting}
             className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100" placeholder="Số nhà, tên đường, tòa nhà, ..." />
         </div>
         {/* Postal Code */}
         <div>
           <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Mã bưu điện</label>
           <input id="postalCode" name="postalCode" type="text" value={localFormData.postalCode} onChange={onLocalInputChange} disabled={isSubmitting}
             className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100" placeholder="Mã bưu điện (nếu có)" />
         </div>
         {/* Is Default */}
         <div className="flex items-center col-span-1 md:col-span-2">
           <input id="isDefault" name="isDefault" type="checkbox" checked={!!localFormData.isDefault} onChange={handleLocalChange} disabled={isSubmitting} // Use !! boolean cast and internal handler again
             className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded disabled:bg-gray-100" />
           <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
         </div>
      </div>
      {/* Preview */}
      {selectedProvince?.name && selectedDistrict?.name && selectedWard?.name && localFormData.addressLine && (
        <div className="mb-4 p-3 bg-pink-50 border border-pink-100 rounded">
          <p className="text-sm text-gray-700 font-medium">Xem trước địa chỉ:</p>
          <p className="text-sm text-gray-600">
            {`${localFormData.addressLine.trim()}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}, ${localFormData.country}`}
            {localFormData.postalCode && ` - ${localFormData.postalCode.trim()}`}
          </p>
        </div>
      )}
      {/* Buttons */}
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50">
          Hủy
        </button>
        <button type="submit" disabled={isLoading || !selectedProvince || !selectedDistrict || !selectedWard || !localFormData.addressLine.trim()}
          className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm')}
        </button>
      </div>
    </form>
  );
};


// ================== AddressList Component ==================
const AddressList = ({
  addresses = [],
  user,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onCancelAdd,
  showAddForm = false,
}: AddressListProps) => {
  // --- State ---
  const [isAdding, setIsAdding] = useState(showAddForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  // State for the data passed to AddressForm when editing/adding
  const [formData, setFormData] = useState<LocalFormData>({
    addressLine: '', country: 'Việt Nam', postalCode: '', isDefault: false,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  // Store selected location objects
  const [selectedProvince, setSelectedProvince] = useState<SelectedLocation>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedLocation>(null);
  const [selectedWard, setSelectedWard] = useState<SelectedLocation>(null);
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingWards, setLoadingWards] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Effects ---
  useEffect(() => {
    setIsAdding(showAddForm);
    if (showAddForm) {
      setEditingId(null);
      resetFormAndSelections(); // Reset form and dropdowns when forced to add
    }
  }, [showAddForm]);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
        const data = await ViettelPostService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Lỗi tỉnh/thành phố:', error);
        toast.error('Lỗi tải Tỉnh/Thành phố.');
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]); setSelectedDistrict(null); setWards([]); setSelectedWard(null); return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistricts([]); setWards([]); setSelectedDistrict(null); setSelectedWard(null);
      try {
        // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
        const data = await ViettelPostService.getDistricts(selectedProvince.code);
        setDistricts(data);
      } catch (error) {
        console.error('Lỗi quận/huyện:', error);
        toast.error('Lỗi tải Quận/Huyện.');
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]); setSelectedWard(null); return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      setWards([]); setSelectedWard(null);
      try {
        // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
        const data = await ViettelPostService.getWards(selectedDistrict.code);
        setWards(data);
      } catch (error) {
        console.error('Lỗi phường/xã:', error);
        toast.error('Lỗi tải Phường/Xã.');
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // --- Event Handlers ---

  // Handle changes for local text/checkbox inputs (managed within AddressForm, but handler passed down)
  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      // Update the formData state in AddressList as well, so AddressForm receives updated initialData if needed
      setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
      }));
  };

  // Find and set selected province object
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value; // code is always a string from select value
    // Ensure comparison is string vs string
    const province = provinces.find(p => String(p.code) === code) || null;
    setSelectedProvince(province);
    setSelectedDistrict(null); // Reset district
    setSelectedWard(null);   // Reset ward
  };

  // Find and set selected district object
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value; // code is always a string
    // Ensure comparison is string vs string
    const district = districts.find(d => String(d.code) === code) || null;
    setSelectedDistrict(district);
    setSelectedWard(null); // Reset ward
  };

  // Find and set selected ward object
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value; // code is always a string
    // Ensure comparison is string vs string
    const ward = wards.find(w => String(w.code) === code) || null;
    setSelectedWard(ward);
  };

  // Helper to get names (now simpler)
  const getSelectedLocationNames = useCallback(() => {
    return {
      provinceName: selectedProvince?.name || '',
      districtName: selectedDistrict?.name || '',
      wardName: selectedWard?.name || '',
    };
  }, [selectedProvince, selectedDistrict, selectedWard]);

  // Reset form data and selections
  const resetFormAndSelections = () => {
    setFormData({ addressLine: '', country: 'Việt Nam', postalCode: '', isDefault: false }); // Reset form data state
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
  };

  const handleCancel = () => {
    if (editingId) setEditingId(null);
    else if (isAdding) {
      setIsAdding(false);
      if (onCancelAdd) onCancelAdd();
    }
    resetFormAndSelections();
  };

  // handleSubmit receives localData from AddressForm
  const handleSubmit = async (e: React.FormEvent, localData: LocalFormData) => {
    e.preventDefault();
    setIsSubmitting(true);

    const provinceName = selectedProvince?.name;
    const districtName = selectedDistrict?.name;
    const wardName = selectedWard?.name;

    console.log('handleSubmit validation check:', { selectedProvince, provinceName, selectedDistrict, districtName, selectedWard, wardName, addressLine: localData.addressLine });

    // --- Full Validation ---
    if (!selectedProvince || !provinceName) { toast.error('Vui lòng chọn Tỉnh/Thành phố.'); setIsSubmitting(false); return; }
    if (!selectedDistrict || !districtName) { toast.error('Vui lòng chọn Quận/Huyện.'); setIsSubmitting(false); return; }
    if (!selectedWard || !wardName) { toast.error('Vui lòng chọn Phường/Xã.'); setIsSubmitting(false); return; }
    if (!localData.addressLine.trim()) { toast.error('Vui lòng nhập địa chỉ cụ thể.'); setIsSubmitting(false); return; }
    // --- End Validation ---

    console.log("Validation Passed!");

    const addressPayload = {
      addressLine: `${localData.addressLine.trim()}, ${wardName}, ${districtName}`,
      city: provinceName,
      state: districtName,
      country: localData.country,
      postalCode: localData.postalCode.trim() || undefined,
      isDefault: localData.isDefault,
    };

    try {
      if (editingId) {
        if (!onUpdateAddress) throw new Error("Update handler not configured.");
        console.log("Submitting update:", { _id: editingId, ...addressPayload });
        await onUpdateAddress({ _id: editingId, ...addressPayload });
        setEditingId(null);
      } else {
        if (!onAddAddress) throw new Error("Add handler not configured.");
        console.log("Submitting add:", addressPayload);
        await onAddAddress(addressPayload);
        setIsAdding(false);
      }
      resetFormAndSelections();
    } catch (error) {
      console.error(`Error ${editingId ? 'updating' : 'adding'} address:`, error);
      let errorMessage = `Lỗi khi ${editingId ? 'cập nhật' : 'thêm'} địa chỉ.`;
      if (axios.isAxiosError(error) && error.response?.data?.message) {
          errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
          errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // startEditing sets initialFormData and selects dropdowns
  const startEditing = useCallback(async (address: Address) => {
     setEditingId(address._id);
     setIsAdding(false);
     const addressParts = address.addressLine.split(',').map(p => p.trim());
     const specificAddressLine = addressParts[0] || '';
     const wardNameFromLine = addressParts.length > 1 ? addressParts[1] : null;

     // Set the initial data for the form state in AddressList
     setFormData({
       addressLine: specificAddressLine, country: address.country,
       postalCode: address.postalCode || '', isDefault: !!address.isDefault,
     });

     // Pre-select dropdowns
     const province = provinces.find(p => p.name === address.city);
     setSelectedProvince(province || null);

     if (province) {
       setLoadingDistricts(true);
       try {
         // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
         const fetchedDistricts = await ViettelPostService.getDistricts(province.code);
         setDistricts(fetchedDistricts);
         const district = fetchedDistricts.find(d => d.name === address.state);
         setSelectedDistrict(district || null);

         if (district) {
           setLoadingWards(true);
           try {
             // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
             const fetchedWards = await ViettelPostService.getWards(district.code);
             setWards(fetchedWards);
             const ward = wardNameFromLine ? fetchedWards.find(w => w.name === wardNameFromLine) : null;
             setSelectedWard(ward || null);
           } catch (wardError) {
             console.error("Error fetching wards during edit:", wardError);
             toast.error("Lỗi tải Phường/Xã.");
             setWards([]);
             setSelectedWard(null);
           } finally {
             setLoadingWards(false);
           }
         } else {
           setWards([]);
           setSelectedWard(null);
         }
       } catch (distError) {
         console.error("Error fetching districts during edit:", distError);
         toast.error("Lỗi tải Quận/Huyện.");
         setDistricts([]);
         setWards([]);
         setSelectedDistrict(null);
         setSelectedWard(null);
       } finally {
         setLoadingDistricts(false);
       }
     } else {
       setDistricts([]);
       setWards([]);
       setSelectedDistrict(null);
       setSelectedWard(null);
     }
  }, [provinces]);

  const handleDelete = async (_id: string) => {
      if (!onDeleteAddress) { toast.error("Delete handler not configured."); return; }
      if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
          setIsSubmitting(true);
          try { await onDeleteAddress(_id); toast.success("Xóa địa chỉ thành công!"); }
          catch (error) { console.error('Error deleting address:', error); toast.error(error instanceof Error ? error.message : 'Failed to delete address.'); }
          finally { setIsSubmitting(false); }
      }
  };
  const handleSetDefault = async (_id: string) => {
      if (!onSetDefaultAddress) { toast.error("Set default handler not configured."); return; }
      setIsSubmitting(true);
      try { await onSetDefaultAddress(_id); toast.success("Đặt làm địa chỉ mặc định thành công!"); }
      catch (error) { console.error('Error setting default address:', error); toast.error(error instanceof Error ? error.message : 'Failed to set default address.'); }
      finally { setIsSubmitting(false); }
  };

  // --- Render Logic ---
  const shouldShowForm = isAdding || !!editingId;

  return (
    <div>
      {!showAddForm && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Địa chỉ của tôi</h2>
          {!shouldShowForm && (
            <button onClick={() => { setIsAdding(true); setEditingId(null); resetFormAndSelections(); }}
              className="flex items-center text-pink-600 hover:text-pink-800 border border-pink-600 px-3 py-1 rounded">
              <FaPlus className="mr-1" /> Thêm địa chỉ mới
            </button>
          )}
        </div>
      )}

      {/* Render AddressForm conditionally */}
      {shouldShowForm && (
        <AddressForm
          initialData={formData} // Pass current formData state
          provinces={provinces} districts={districts} wards={wards}
          selectedProvince={selectedProvince} selectedDistrict={selectedDistrict} selectedWard={selectedWard}
          loadingProvinces={loadingProvinces} loadingDistricts={loadingDistricts} loadingWards={loadingWards}
          isSubmitting={isSubmitting} isEditing={!!editingId}
          onSubmit={handleSubmit} onCancel={handleCancel}
          onProvinceChange={handleProvinceChange}
          onDistrictChange={handleDistrictChange}
          onWardChange={handleWardChange}
          onLocalInputChange={handleLocalInputChange} // Pass the handler to update AddressList's formData
          getSelectedLocationNames={getSelectedLocationNames}
        />
      )}

      {/* Address List or Empty State */}
      {addresses.length === 0 && !shouldShowForm ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-gray-200">
          <FaMapMarkerAlt className="mx-auto text-gray-400 text-4xl mb-3" />
          <p>Bạn chưa có địa chỉ nào.</p>
          {!showAddForm && (
             <button onClick={() => { setIsAdding(true); setEditingId(null); resetFormAndSelections(); }}
               className="mt-4 px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
               Thêm địa chỉ mới
             </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {addresses.map((address) => (
            editingId !== address._id && (
              <div key={address._id} className={`p-4 border rounded ${address.isDefault ? 'border-pink-600 bg-pink-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-grow mr-4">
                     <div className="flex items-center mb-1">
                       <h3 className="font-semibold text-gray-800">{user?.name || 'Người nhận'}</h3>
                       {address.isDefault && (<span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full">Mặc định</span>)}
                     </div>
                     <p className="text-sm text-gray-600">{user?.phone || 'Chưa có SĐT'}</p>
                     <p className="text-sm text-gray-600 mt-1">
                       {address.addressLine}
                       {address.state && `, ${address.state}`}
                       {address.city && `, ${address.city}`}
                       {`, ${address.country}`}
                       {address.postalCode && ` - ${address.postalCode}`}
                     </p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end sm:items-center flex-shrink-0">
                    <button onClick={() => startEditing(address)} disabled={isSubmitting} className="text-blue-600 hover:text-blue-700 p-1 text-xs sm:text-sm disabled:opacity-50" title="Chỉnh sửa"> <FaEdit /> <span className="hidden sm:inline">Sửa</span> </button>
                    {!address.isDefault && (<>
                      <button onClick={() => handleSetDefault(address._id)} disabled={isSubmitting} className="text-green-600 hover:text-green-700 p-1 text-xs sm:text-sm disabled:opacity-50" title="Đặt làm mặc định"> <FaCheck /> <span className="hidden sm:inline">Mặc định</span> </button>
                      <button onClick={() => handleDelete(address._id)} disabled={isSubmitting} className="text-red-600 hover:text-red-700 p-1 text-xs sm:text-sm disabled:opacity-50" title="Xóa"> <FaTrash /> <span className="hidden sm:inline">Xóa</span> </button>
                    </>)}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressList;
