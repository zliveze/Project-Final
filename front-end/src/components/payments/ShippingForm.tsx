import React, { useState, useEffect } from 'react';
import { FiMapPin, FiUser, FiPhone, FiMail, FiHome, FiSave, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';
// Import service and data types
import ViettelPostService, { ProvinceData, DistrictData, WardData } from '@/services/ViettelPostService';


// Use interfaces from ViettelPostService
interface Province extends ProvinceData {}
interface District extends DistrictData {}
interface Ward extends WardData {}

// Update ShippingInfo to store IDs and potentially names separately
export interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string; // Specific address line (street, number)
  notes?: string;

  // Store IDs selected from dropdowns
  provinceId?: number | string; // Use string initially from select value, convert later
  districtId?: number | string;
  wardId?: number | string;

  // Store names corresponding to selected IDs (for display or submission)
  provinceName?: string;
  districtName?: string;
  wardName?: string;

  // Keep original city/district/ward if needed for compatibility, but mark optional
  city?: string; // Might be redundant with provinceName
  district?: string; // Might be redundant with districtName
  ward?: string; // Might be redundant with wardName

  // Thêm các mã địa chỉ ViettelPost
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
}

interface ShippingFormProps {
  initialValues?: ShippingInfo;
  onSubmit: (values: ShippingInfo) => void;
  showSubmitButton?: boolean;
  disableEditing?: boolean; // Thêm prop để kiểm soát khả năng chỉnh sửa từ bên ngoài
}

const ShippingForm: React.FC<ShippingFormProps> = ({ 
  initialValues, 
  onSubmit, 
  showSubmitButton = true,
  disableEditing = false
}) => {
  const [formValues, setFormValues] = useState<ShippingInfo>(
    initialValues || {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      city: '', // Keep for now if needed
      district: '', // Keep for now if needed
      ward: '', // Keep for now if needed
      notes: '',
      provinceId: '', // Initialize ID fields
      districtId: '',
      wardId: '',
    }
  );

  // State để kiểm soát việc chỉnh sửa form
  const [isEditing, setIsEditing] = useState<boolean>(true);  // Luôn bật chế độ chỉnh sửa mặc định
  
  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});

  // Use updated interfaces for state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingWards, setLoadingWards] = useState<boolean>(false);

  // Lấy danh sách tỉnh/thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await ViettelPostService.getProvinces();
        setProvinces(data);
      } catch (error) {
        // Error handled in service, but log here too if needed
        console.error('Lỗi tỉnh/thành phố:', error);
        // toast.error('Lỗi tải Tỉnh/Thành phố.'); // Toast is in service
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Lấy danh sách quận/huyện khi provinceId thay đổi
  useEffect(() => {
    const currentProvinceId = formValues.provinceId ? Number(formValues.provinceId) : null;
    if (!currentProvinceId) {
      setDistricts([]);
      setWards([]);
      setFormValues(prev => ({ ...prev, districtId: '', wardId: '', districtName: '', wardName: '' }));
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistricts([]);
      setWards([]);
      setFormValues(prev => ({ ...prev, districtId: '', wardId: '', districtName: '', wardName: '' }));
      try {
        const data = await ViettelPostService.getDistricts(currentProvinceId);
        setDistricts(data);
      } catch (error) {
        // Error handled in service
        // toast.error('Lỗi tải Quận/Huyện.'); // Toast is in service
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [formValues.provinceId]);

  // Lấy danh sách phường/xã khi districtId thay đổi
  useEffect(() => {
    const currentDistrictId = formValues.districtId ? Number(formValues.districtId) : null;
    if (!currentDistrictId) {
      setWards([]);
      setFormValues(prev => ({ ...prev, wardId: '', wardName: '' }));
      return;
    }

    const fetchWards = async () => {
      setLoadingWards(true);
      setWards([]);
      setFormValues(prev => ({ ...prev, wardId: '', wardName: '' }));
      try {
        const data = await ViettelPostService.getWards(currentDistrictId);
        setWards(data);
      } catch (error) {
        // Error handled in service
        // toast.error('Lỗi tải Phường/Xã.'); // Toast is in service
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [formValues.districtId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Update names when IDs change
    if (name === 'provinceId') {
      const selected = provinces.find(p => p.provinceId === Number(value));
      setFormValues((prev) => ({ ...prev, provinceName: selected?.provinceName || '' }));
    } else if (name === 'districtId') {
      const selected = districts.find(d => d.districtId === Number(value));
      setFormValues((prev) => ({ ...prev, districtName: selected?.districtName || '' }));
    } else if (name === 'wardId') {
      const selected = wards.find(w => w.wardId === Number(value));
      setFormValues((prev) => ({ ...prev, wardName: selected?.wardName || '' }));
    }

    // Clear errors on change
    if (errors[name as keyof ShippingInfo]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};
    let isValid = true;

    if (!formValues.fullName.trim()) { newErrors.fullName = 'Vui lòng nhập họ tên'; isValid = false; }
    if (!formValues.phone.trim()) { newErrors.phone = 'Vui lòng nhập số điện thoại'; isValid = false; }
    else if (!/^[0-9]{10}$/.test(formValues.phone.trim())) { newErrors.phone = 'Số điện thoại không hợp lệ'; isValid = false; }
    if (formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) { newErrors.email = 'Email không hợp lệ'; isValid = false; }
    if (!formValues.address.trim()) { newErrors.address = 'Vui lòng nhập địa chỉ'; isValid = false; }
    if (!formValues.provinceId) { newErrors.provinceId = 'Vui lòng chọn tỉnh/thành phố'; isValid = false; }
    if (!formValues.districtId) { newErrors.districtId = 'Vui lòng chọn quận/huyện'; isValid = false; }
    if (!formValues.wardId) { newErrors.wardId = 'Vui lòng chọn phường/xã'; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  // Hàm để bắt đầu chỉnh sửa
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Hàm để hủy chỉnh sửa và quay lại giá trị ban đầu
  const handleCancel = () => {
    if (initialValues) {
      setFormValues(initialValues);
      setErrors({});
    }
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Tìm các đối tượng địa chỉ đã chọn
      const selectedProvince = provinces.find(p => p.provinceId === Number(formValues.provinceId));
      const selectedDistrict = districts.find(d => d.districtId === Number(formValues.districtId));
      const selectedWard = wards.find(w => w.wardId === Number(formValues.wardId));

      const submittedData: ShippingInfo = {
        ...formValues,
        provinceId: formValues.provinceId ? Number(formValues.provinceId) : undefined,
        districtId: formValues.districtId ? Number(formValues.districtId) : undefined,
        wardId: formValues.wardId ? Number(formValues.wardId) : undefined,
        provinceName: formValues.provinceName || selectedProvince?.provinceName || '',
        districtName: formValues.districtName || selectedDistrict?.districtName || '',
        wardName: formValues.wardName || selectedWard?.wardName || '',
        // Gửi đi mã địa chỉ theo đúng định dạng cho ViettelPost
        // Đối với tỉnh/thành phố, cần chuyển đổi sang định dạng mã số (PROVINCE_ID)
        provinceCode: selectedProvince?.provinceId === 2 || selectedProvince?.provinceCode === 'HCM' ? '2' :
                     selectedProvince?.provinceId === 1 || selectedProvince?.provinceCode === 'HNI' ? '1' :
                     formValues.provinceId ? formValues.provinceId.toString() : '1', // Mặc định là Hà Nội
        // Đối với quận/huyện, sử dụng DISTRICT_ID
        districtCode: selectedDistrict?.districtId === 43 ? '43' : // Quận 1, HCM
                     selectedDistrict?.districtId === 4 ? '4' : // Quận Hoàng Mai, HN
                     formValues.districtId ? formValues.districtId.toString() : '4', // Mặc định là Quận Hoàng Mai
        // Đối với phường/xã, sử dụng WARDS_ID
        wardCode: selectedWard?.wardId ? selectedWard.wardId.toString() : '0', // Mặc định là 0
        // Cập nhật các trường city, district, ward cho tương thích (dùng tên đã lấy)
        city: formValues.provinceName || selectedProvince?.provinceName || '',
        district: formValues.districtName || selectedDistrict?.districtName || '',
        ward: formValues.wardName || selectedWard?.wardName || '',
      };

      console.log('Submitting shipping info with ViettelPost codes:', {
        provinceCode: submittedData.provinceCode,
        districtCode: submittedData.districtCode,
        wardCode: submittedData.wardCode
      });

      onSubmit(submittedData);
      
      // Nếu đang ở chế độ chỉnh sửa, tắt chế độ chỉnh sửa sau khi lưu
      if (initialValues) {
        setIsEditing(false);
        toast.success('Đã cập nhật thông tin địa chỉ thành công');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        {!initialValues?.fullName && <h2 className="text-lg font-semibold text-gray-800">Thông tin giao hàng</h2>}
        {initialValues && (
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex-grow">Thông tin giao hàng</h2>
          </div>
        )}
      </div>

      {/* Họ tên */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Họ tên <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiUser className="text-gray-400" />
          </div>
          <input type="text" id="fullName" name="fullName" value={formValues.fullName} onChange={handleChange}
            disabled={!isEditing}
            className={`pl-10 w-full px-4 py-2 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="Nhập họ tên" />
        </div>
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
      </div>

      {/* Số điện thoại */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiPhone className="text-gray-400" />
          </div>
          <input type="tel" id="phone" name="phone" value={formValues.phone} onChange={handleChange}
            disabled={!isEditing}
            className={`pl-10 w-full px-4 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="Nhập số điện thoại (ví dụ: 0987654321)" />
        </div>
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        {!errors.phone && <p className="mt-1 text-xs text-gray-500">Số điện thoại sẽ được dùng để liên hệ khi giao hàng</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="text-gray-400" />
          </div>
          <input type="email" id="email" name="email" value={formValues.email} onChange={handleChange}
            disabled={!isEditing}
            className={`pl-10 w-full px-4 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="Nhập email" />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Địa chỉ */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiHome className="text-gray-400" />
          </div>
          <input type="text" id="address" name="address" value={formValues.address} onChange={handleChange}
            disabled={!isEditing}
            className={`pl-10 w-full px-4 py-2 border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] ${!isEditing ? 'bg-gray-100' : ''}`}
            placeholder="Nhập địa chỉ" />
        </div>
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>

      {/* Tỉnh/Thành phố, Quận/Huyện, Phường/Xã */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tỉnh/Thành phố */}
        <div>
          <label htmlFor="provinceId" className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMapPin className="text-gray-400" />
            </div>
            <select id="provinceId" name="provinceId" value={formValues.provinceId} onChange={handleChange} 
              disabled={!isEditing || loadingProvinces}
              className={`pl-10 w-full px-4 py-2 border ${errors.provinceId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white ${loadingProvinces ? 'cursor-wait opacity-70' : ''} ${!isEditing ? 'bg-gray-100' : ''}`}>
              <option value="">Chọn tỉnh/thành phố</option>
              {provinces.map((province) => (
                <option key={province.provinceId} value={province.provinceId}>
                  {province.provinceName}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {errors.provinceId && <p className="mt-1 text-sm text-red-600">{errors.provinceId}</p>}
        </div>

        {/* Quận/Huyện */}
        <div>
          <label htmlFor="districtId" className="block text-sm font-medium text-gray-700 mb-1">
            Quận/Huyện <span className="text-red-500">*</span>
          </label>
          <select id="districtId" name="districtId" value={formValues.districtId} onChange={handleChange} 
            disabled={!isEditing || !formValues.provinceId || loadingDistricts}
            className={`w-full px-4 py-2 border ${errors.districtId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white ${!formValues.provinceId || loadingDistricts ? 'cursor-not-allowed opacity-70' : ''} ${!isEditing ? 'bg-gray-100' : ''}`}>
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.districtId} value={district.districtId}>
                {district.districtName}
              </option>
            ))}
          </select>
          {loadingDistricts && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {errors.districtId && <p className="mt-1 text-sm text-red-600">{errors.districtId}</p>}
        </div>

        {/* Phường/Xã */}
        <div>
          <label htmlFor="wardId" className="block text-sm font-medium text-gray-700 mb-1">
            Phường/Xã <span className="text-red-500">*</span>
          </label>
          <select id="wardId" name="wardId" value={formValues.wardId} onChange={handleChange} 
            disabled={!isEditing || !formValues.districtId || loadingWards}
            className={`w-full px-4 py-2 border ${errors.wardId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white ${!formValues.districtId || loadingWards ? 'cursor-not-allowed opacity-70' : ''} ${!isEditing ? 'bg-gray-100' : ''}`}>
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.wardId} value={ward.wardId}>
                {ward.wardName}
              </option>
            ))}
          </select>
          {loadingWards && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {errors.wardId && <p className="mt-1 text-sm text-red-600">{errors.wardId}</p>}
        </div>
      </div>

      {/* Ghi chú */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
        <textarea id="notes" name="notes" value={formValues.notes} onChange={handleChange} rows={3}
          disabled={!isEditing}
          className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] ${!isEditing ? 'bg-gray-100' : ''}`}
          placeholder="Nhập ghi chú (nếu có)" />
      </div>

      {/* Hiển thị xem trước địa chỉ */}
      {formValues.provinceName && formValues.districtName && formValues.wardName && formValues.address && (
        <div className="p-3 bg-pink-50 border border-pink-100 rounded-md">
          <p className="text-sm text-gray-700 font-medium">Xem trước địa chỉ:</p>
          <p className="text-sm text-gray-600">
            {`${formValues.address}, ${formValues.wardName}, ${formValues.districtName}, ${formValues.provinceName}, Việt Nam`}
          </p>
        </div>
      )}

      {/* Nút lưu thông tin và hủy */}
      {showSubmitButton && isEditing && (
        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <button type="submit"
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity flex items-center justify-center">
            <FiSave className="mr-2" />
            {initialValues ? 'Cập nhật địa chỉ' : 'Lưu thông tin giao hàng'}
          </button>
          
          {initialValues && (
            <button 
              type="button" 
              onClick={handleCancel}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              Hủy thay đổi
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default ShippingForm;
