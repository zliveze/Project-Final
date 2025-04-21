import React, { useState, useEffect } from 'react';
import { FiMapPin, FiUser, FiPhone, FiMail, FiHome, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ViettelPostService from '@/services/ViettelPostService';

// API URL cho dữ liệu provinces, districts, wards
// Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn

// Types cho province, district, ward
interface Province { code: string; name: string; viettelCode?: string; }
interface District { code: string; name: string; province_code: string; viettelCode?: string; }
interface Ward { code: string; name: string; district_code: string; viettelCode?: string; }

interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  notes?: string;
  // Thêm mã Viettel Post
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
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

  // State cho province, district, ward
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

  // Lấy danh sách quận/huyện khi chọn tỉnh/thành phố
  useEffect(() => {
    if (!formValues.city) {
      setDistricts([]);
      setWards([]);
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistricts([]);
      setWards([]);

      try {
        // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
        const data = await ViettelPostService.getDistricts(formValues.city);
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
  }, [formValues.city]);

  // Lấy danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (!formValues.district) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setLoadingWards(true);
      setWards([]);

      try {
        // Sử dụng ViettelPostService thay vì gọi trực tiếp API provinces.open-api.vn
        const data = await ViettelPostService.getWards(formValues.district);
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
  }, [formValues.district]);

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
      // Tạo dữ liệu gửi đi với tên tỉnh/quận/phường thay vì mã code
      const province = provinces.find(p => p.code === formValues.city);
      const district = districts.find(d => d.code === formValues.district);
      const ward = wards.find(w => w.code === formValues.ward);

      const provinceName = province?.name || '';
      const districtName = district?.name || '';
      const wardName = ward?.name || '';

      // Lưu mã Viettel Post cho địa chỉ
      const provinceCode = province?.viettelCode || '';
      const districtCode = district?.viettelCode || '';
      const wardCode = ward?.viettelCode || '';

      const submittedData = {
        ...formValues,
        city: provinceName,
        district: districtName,
        ward: wardName,
        // Thêm mã Viettel Post cho địa chỉ
        provinceCode: provinceCode,
        districtCode: districtCode,
        wardCode: wardCode
      };

      onSubmit(submittedData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialValues?.fullName && <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>}

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
            } rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500`}
            placeholder="Nhập số điện thoại (ví dụ: 0987654321)"
          />
        </div>
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        {!errors.phone && <p className="mt-1 text-xs text-gray-500">Số điện thoại sẽ được dùng để liên hệ khi giao hàng</p>}
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
              disabled={loadingProvinces}
              className={`pl-10 w-full px-4 py-2 border ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white ${
                loadingProvinces ? 'cursor-wait opacity-70' : ''
              }`}
            >
              <option value="">Chọn tỉnh/thành phố</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
              </div>
            )}
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
            disabled={!formValues.city || loadingDistricts}
            className={`w-full px-4 py-2 border ${
              errors.district ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white ${
              !formValues.city || loadingDistricts ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
          {loadingDistricts && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          )}
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
            disabled={!formValues.district || loadingWards}
            className={`w-full px-4 py-2 border ${
              errors.ward ? 'border-red-300' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-1 focus:ring-[#306E51] focus:border-[#306E51] bg-white ${
              !formValues.district || loadingWards ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
          {loadingWards && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          )}
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

      {/* Hiển thị xem trước địa chỉ */}
      {formValues.city && formValues.district && formValues.ward && formValues.address && (
        <div className="p-3 bg-pink-50 border border-pink-100 rounded-md">
          <p className="text-sm text-gray-700 font-medium">Xem trước địa chỉ:</p>
          <p className="text-sm text-gray-600">
            {`${formValues.address}, ${wards.find(w => w.code === formValues.ward)?.name || ''}, ${districts.find(d => d.code === formValues.district)?.name || ''}, ${provinces.find(p => p.code === formValues.city)?.name || ''}, Việt Nam`}
          </p>
        </div>
      )}

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