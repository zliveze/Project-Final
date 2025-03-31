import React, { useState } from 'react';
import { FiMapPin, FiUser, FiPhone, FiMail, FiHome, FiSave } from 'react-icons/fi';

interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  notes?: string;
}

interface ShippingFormProps {
  initialValues?: ShippingInfo;
  onSubmit: (values: ShippingInfo) => void;
  showSubmitButton?: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ initialValues, onSubmit, showSubmitButton = true }) => {
  const [formValues, setFormValues] = useState<ShippingInfo>(
    initialValues || {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      notes: '',
    }
  );

  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Xóa lỗi khi người dùng nhập lại
    if (errors[name as keyof ShippingInfo]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};
    let isValid = true;

    // Kiểm tra họ tên
    if (!formValues.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
      isValid = false;
    }

    // Kiểm tra số điện thoại
    if (!formValues.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(formValues.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
      isValid = false;
    }

    // Kiểm tra email
    if (formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      newErrors.email = 'Email không hợp lệ';
      isValid = false;
    }

    // Kiểm tra địa chỉ
    if (!formValues.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
      isValid = false;
    }

    // Kiểm tra tỉnh/thành phố
    if (!formValues.city) {
      newErrors.city = 'Vui lòng chọn tỉnh/thành phố';
      isValid = false;
    }

    // Kiểm tra quận/huyện
    if (!formValues.district) {
      newErrors.district = 'Vui lòng chọn quận/huyện';
      isValid = false;
    }

    // Kiểm tra phường/xã
    if (!formValues.ward) {
      newErrors.ward = 'Vui lòng chọn phường/xã';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  // Danh sách tỉnh/thành phố mẫu
  const cities = [
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'hochiminh', label: 'TP. Hồ Chí Minh' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'haiphong', label: 'Hải Phòng' },
    { value: 'cantho', label: 'Cần Thơ' },
  ];

  // Danh sách quận/huyện mẫu (thực tế sẽ phụ thuộc vào tỉnh/thành phố đã chọn)
  const districts = [
    { value: 'quan1', label: 'Quận 1' },
    { value: 'quan2', label: 'Quận 2' },
    { value: 'quan3', label: 'Quận 3' },
    { value: 'quan4', label: 'Quận 4' },
    { value: 'quan5', label: 'Quận 5' },
  ];

  // Danh sách phường/xã mẫu (thực tế sẽ phụ thuộc vào quận/huyện đã chọn)
  const wards = [
    { value: 'phuong1', label: 'Phường 1' },
    { value: 'phuong2', label: 'Phường 2' },
    { value: 'phuong3', label: 'Phường 3' },
    { value: 'phuong4', label: 'Phường 4' },
    { value: 'phuong5', label: 'Phường 5' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>
      
      {/* Họ tên */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Họ tên <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiUser className="text-gray-400" />
          </div>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formValues.fullName}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-2 border ${
              errors.fullName ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]`}
            placeholder="Nhập họ tên"
          />
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
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formValues.phone}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-2 border ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]`}
            placeholder="Nhập số điện thoại"
          />
        </div>
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>
      
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formValues.email}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-2 border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]`}
            placeholder="Nhập email"
          />
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
          <input
            type="text"
            id="address"
            name="address"
            value={formValues.address}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-2 border ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]`}
            placeholder="Nhập địa chỉ"
          />
        </div>
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>
      
      {/* Tỉnh/Thành phố, Quận/Huyện, Phường/Xã */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tỉnh/Thành phố */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMapPin className="text-gray-400" />
            </div>
            <select
              id="city"
              name="city"
              value={formValues.city}
              onChange={handleChange}
              className={`pl-10 w-full px-4 py-2 border ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white`}
            >
              <option value="">Chọn tỉnh/thành phố</option>
              {cities.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
        </div>
        
        {/* Quận/Huyện */}
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
            Quận/Huyện <span className="text-red-500">*</span>
          </label>
          <select
            id="district"
            name="district"
            value={formValues.district}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.district ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white`}
            disabled={!formValues.city}
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.value} value={district.value}>
                {district.label}
              </option>
            ))}
          </select>
          {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
        </div>
        
        {/* Phường/Xã */}
        <div>
          <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
            Phường/Xã <span className="text-red-500">*</span>
          </label>
          <select
            id="ward"
            name="ward"
            value={formValues.ward}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.ward ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white`}
            disabled={!formValues.district}
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.value} value={ward.value}>
                {ward.label}
              </option>
            ))}
          </select>
          {errors.ward && <p className="mt-1 text-sm text-red-600">{errors.ward}</p>}
        </div>
      </div>
      
      {/* Ghi chú */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formValues.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51]"
          placeholder="Nhập ghi chú (nếu có)"
        />
      </div>
      
      {/* Nút lưu thông tin */}
      {showSubmitButton && (
        <div className="mt-8">
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            <FiSave className="mr-2" />
            Lưu thông tin giao hàng
          </button>
        </div>
      )}
    </form>
  );
};

export default ShippingForm; 