import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FiSave, FiX, FiMapPin, FiPhone, FiType } from 'react-icons/fi';
import { useBranches } from '@/contexts/BranchContext';
import toast from 'react-hot-toast';
import ViettelPostService, { ProvinceData, DistrictData, WardData } from '@/services/ViettelPostService'; // Import service và types

// Cập nhật kiểu dữ liệu cho form
export type BranchFormData = {
  id?: string;
  name: string;
  provinceCode: string; // Mã tỉnh/TP
  districtCode: string; // Mã quận/huyện
  wardCode: string;     // Mã phường/xã
  address: string;      // Địa chỉ chi tiết (số nhà, đường)
  contact?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Đảm bảo Branch cũng có các trường địa chỉ
export type Branch = BranchFormData;

interface BranchFormProps {
  branch?: BranchFormData; // Sử dụng kiểu mới
  onSubmit: (data: Partial<BranchFormData>) => void; // Sử dụng kiểu mới, xóa dòng trùng lặp
  onCancel: () => void; // Xóa dòng trùng lặp
  isSubmitting: boolean;
}

const BranchForm: React.FC<BranchFormProps> = ({
  branch,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  // State cho dropdown địa chỉ
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  // State để lưu các đối tượng địa chỉ đã chọn
  const [selectedProvinceObj, setSelectedProvinceObj] = useState<ProvinceData | null>(null);
  const [selectedDistrictObj, setSelectedDistrictObj] = useState<DistrictData | null>(null);
  const [selectedWardObj, setSelectedWardObj] = useState<WardData | null>(null);


  // Khởi tạo form với react-hook-form
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<BranchFormData>({
    defaultValues: {
      name: branch?.name || '',
      provinceCode: branch?.provinceCode || '',
      districtCode: branch?.districtCode || '',
      wardCode: branch?.wardCode || '',
      address: branch?.address || '', // Địa chỉ chi tiết
      contact: branch?.contact || '',
    }
  });

  // Watch giá trị province và district để load dữ liệu phụ thuộc
  const watchedProvinceCode = watch('provinceCode');
  const watchedDistrictCode = watch('districtCode');

  // --- Fetch Data ---
  const fetchProvinces = useCallback(async () => {
    setLoadingProvinces(true);
    try {
      const data = await ViettelPostService.getProvinces();
      setProvinces(data);
    } catch (error) {
      toast.error('Lỗi tải danh sách tỉnh/thành phố.');
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

 // fetchDistricts chỉ fetch dữ liệu dựa trên provinceId
 const fetchDistricts = useCallback(async (provinceId: number) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    // Reset RHF values và state objects liên quan
    setValue('districtCode', '', { shouldDirty: true });
    setValue('wardCode', '', { shouldDirty: true });
    setSelectedDistrictObj(null);
    setSelectedWardObj(null);

    try {
      const data = await ViettelPostService.getDistricts(provinceId);
      setDistricts(data);
    } catch (error) {
      toast.error('Lỗi tải danh sách quận/huyện.');
      // Đảm bảo clear state khi lỗi
      setDistricts([]);
      setWards([]);
      setSelectedDistrictObj(null);
      setSelectedWardObj(null);
    } finally {
      setLoadingDistricts(false);
    }
  }, [setValue, setSelectedDistrictObj, setSelectedWardObj]); // Thêm setters

  // fetchWards chỉ fetch dữ liệu dựa trên districtId
  const fetchWards = useCallback(async (districtId: number) => {
    setLoadingWards(true);
    setWards([]);
    // Reset RHF value và state object liên quan
    setValue('wardCode', '', { shouldDirty: true });
    setSelectedWardObj(null);

    try {
      const data = await ViettelPostService.getWards(districtId);
      setWards(data);
    } catch (error) {
      toast.error('Lỗi tải danh sách phường/xã.');
      // Đảm bảo clear state khi lỗi
      setWards([]);
      setSelectedWardObj(null);
    } finally {
      setLoadingWards(false);
    }
  }, [setValue, setSelectedWardObj]); // Thêm setter

  // --- Effects ---
  // Load provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  // Effect để reset form và state khi branch thay đổi (thêm mới hoặc bắt đầu sửa)
  useEffect(() => {
    if (branch) {
      reset(branch); // Set giá trị RHF ban đầu
      // Reset state object trước khi thiết lập lại (nếu cần)
      setSelectedProvinceObj(null);
      setSelectedDistrictObj(null);
      setSelectedWardObj(null);
    } else {
      reset({ name: '', provinceCode: '', districtCode: '', wardCode: '', address: '', contact: '' });
      setSelectedProvinceObj(null);
      setSelectedDistrictObj(null);
      setSelectedWardObj(null);
    }
  }, [branch, reset]);

  // Effect để thiết lập state object ban đầu KHI EDIT và provinces đã load
  useEffect(() => {
    if (branch && provinces.length > 0 && !selectedProvinceObj) { // Chỉ chạy khi cần set state ban đầu
      console.log("Đang tìm tỉnh/thành phố cho provinceCode:", branch.provinceCode);
      const initialProvinceId = parseInt(branch.provinceCode, 10);
      const province = provinces.find(p => p.provinceId === initialProvinceId);

      if (province) {
        console.log("Đã tìm thấy tỉnh/thành phố:", province.provinceName);
        setSelectedProvinceObj(province);
        fetchDistricts(initialProvinceId);
      } else {
        console.error("Không tìm thấy tỉnh/thành phố với mã:", initialProvinceId);
        // In ra tất cả các tỉnh để debug
        console.log("Danh sách tỉnh/thành phố:", provinces.map(p => ({ id: p.provinceId, name: p.provinceName })));
      }
    }
  }, [branch, provinces, selectedProvinceObj, fetchDistricts]); // Phụ thuộc vào branch và provinces

  // Effect để fetch districts KHI provinceId thay đổi (từ RHF) HOẶC state province object được set
  useEffect(() => {
    const provinceIdStr = watchedProvinceCode; // Lấy ID từ RHF
    if (provinceIdStr) {
      const provinceIdNum = parseInt(provinceIdStr, 10);
      console.log("provinceId thay đổi:", provinceIdNum);

      if (!selectedProvinceObj || selectedProvinceObj.provinceId !== provinceIdNum) {
        // Nếu state object chưa được set hoặc không khớp với giá trị hiện tại
        const province = provinces.find(p => p.provinceId === provinceIdNum);
        if (province) {
          console.log("Cập nhật selectedProvinceObj:", province.provinceName);
          setSelectedProvinceObj(province); // Set state object
          fetchDistricts(province.provinceId); // Fetch districts
        }
      }
    } else {
      // Clear khi không có provinceId
      setDistricts([]);
      setWards([]);
      setSelectedProvinceObj(null);
      setSelectedDistrictObj(null);
      setSelectedWardObj(null);
    }
  }, [watchedProvinceCode, provinces, selectedProvinceObj, fetchDistricts]);

  // Effect để thiết lập state district object ban đầu KHI EDIT và districts đã load
  useEffect(() => {
    if (branch && districts.length > 0 && selectedProvinceObj && !selectedDistrictObj) {
      console.log("Đang tìm quận/huyện cho districtCode:", branch.districtCode);
      const initialDistrictId = parseInt(branch.districtCode, 10);
      const district = districts.find(d => d.districtId === initialDistrictId);

      if (district) {
        console.log("Đã tìm thấy quận/huyện:", district.districtName);
        setSelectedDistrictObj(district);
        fetchWards(initialDistrictId);
      } else {
        console.error("Không tìm thấy quận/huyện với mã:", initialDistrictId);
        // In ra tất cả các quận/huyện để debug
        console.log("Danh sách quận/huyện:", districts.map(d => ({ id: d.districtId, name: d.districtName })));
      }
    }
  }, [branch, districts, selectedProvinceObj, selectedDistrictObj, fetchWards]);

  // Effect để fetch wards KHI districtId thay đổi (từ RHF) HOẶC state district object được set
  useEffect(() => {
    const districtIdStr = watchedDistrictCode; // Lấy ID từ RHF
    if (districtIdStr) {
      const districtIdNum = parseInt(districtIdStr, 10);
      console.log("districtId thay đổi:", districtIdNum);

      if (!selectedDistrictObj || selectedDistrictObj.districtId !== districtIdNum) {
        // Nếu state object chưa được set hoặc không khớp với giá trị hiện tại
        const district = districts.find(d => d.districtId === districtIdNum);
        if (district) {
          console.log("Cập nhật selectedDistrictObj:", district.districtName);
          setSelectedDistrictObj(district); // Set state object
          fetchWards(district.districtId); // Fetch wards
        }
      }
    } else {
      // Clear khi không có districtId
      setWards([]);
      setSelectedDistrictObj(null);
      setSelectedWardObj(null);
    }
  }, [watchedDistrictCode, districts, selectedDistrictObj, fetchWards]);

  // Effect để thiết lập state ward object ban đầu KHI EDIT và wards đã load
  useEffect(() => {
    if (branch && wards.length > 0 && selectedDistrictObj && !selectedWardObj) {
      console.log("Đang tìm phường/xã cho wardCode:", branch.wardCode);
      const initialWardId = parseInt(branch.wardCode, 10);
      const ward = wards.find(w => w.wardId === initialWardId);

      if (ward) {
        console.log("Đã tìm thấy phường/xã:", ward.wardName);
        setSelectedWardObj(ward);
      } else {
        console.error("Không tìm thấy phường/xã với mã:", initialWardId);
        // In ra tất cả các phường/xã để debug
        console.log("Danh sách phường/xã:", wards.map(w => ({ id: w.wardId, name: w.wardName })));
      }
    }
  }, [branch, wards, selectedDistrictObj, selectedWardObj]);


  // Xử lý submit form
  const onFormSubmit = (data: BranchFormData) => {
    // Sử dụng trực tiếp các state object đã lưu khi chọn dropdown
    const province = selectedProvinceObj;
    const district = selectedDistrictObj;
    const ward = selectedWardObj;

    const provinceName = province?.provinceName;
    const districtName = district?.districtName;
    const wardName = ward?.wardName;

    // Kiểm tra xem các đối tượng đã được chọn chưa
    if (!province || !district || !ward) {
      toast.error('Thông tin địa chỉ không hợp lệ. Vui lòng chọn đầy đủ Tỉnh/Huyện/Xã.');
      console.error('Missing selected address objects:', {
        province: province ? 'Selected' : 'Missing',
        district: district ? 'Selected' : 'Missing',
        ward: ward ? 'Selected' : 'Missing',
        provinceCode: data.provinceCode,
        districtCode: data.districtCode,
        wardCode: data.wardCode
      });
      return;
    }

    // Log chi tiết dữ liệu để debug
    console.log("Submitting branch data:", {
      ...data,
      provinceName,
      districtName,
      wardName,
      provinceDetails: province,
      districtDetails: district,
      wardDetails: ward
    });

    // Dữ liệu `data` từ react-hook-form đã chứa đúng ID dạng số (lưu dưới dạng string)
    // trong các trường provinceCode, districtCode, wardCode
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Tên chi nhánh */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <FiType className="w-5 h-5 text-gray-600" />
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                Tên chi nhánh <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600">Nhập tên đầy đủ của chi nhánh</p>
            </div>
          </div>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Tên chi nhánh là bắt buộc' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: Chi nhánh Hồ Chí Minh"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Địa chỉ - Sử dụng dropdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-3 mb-3">
            <FiMapPin className="w-5 h-5 text-gray-600" />
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Địa chỉ chi nhánh <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600">Chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập địa chỉ chi tiết.</p>
            </div>
          </div>

          {/* Tỉnh/Thành phố */}
          <div>
            <label htmlFor="provinceCode" className="block text-xs font-medium text-gray-600 mb-1">
              Tỉnh/Thành phố
            </label>
            <select
              id="provinceCode"
              {...register('provinceCode', { required: 'Vui lòng chọn Tỉnh/Thành phố' })}
              className={`w-full px-3 py-2 border ${errors.provinceCode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
              disabled={loadingProvinces}
              onChange={(e) => {
                // Lấy provinceId từ value
                const provinceIdStr = e.target.value;
                const provinceIdNum = parseInt(provinceIdStr, 10);

                // Tìm province dựa trên provinceId
                const province = provinces.find(p => p.provinceId === provinceIdNum);

                // Lưu provinceId thay vì provinceCode
                if (province) {
                  setValue('provinceCode', provinceIdStr);
                  console.log(`Sử dụng provinceId: ${provinceIdStr}`);
                } else {
                  // Fallback nếu không có province
                  setValue('provinceCode', '');
                }
                setValue('districtCode', ''); // Reset district RHF
                setValue('wardCode', ''); // Reset ward RHF
                setDistricts([]); // Reset state districts
                setWards([]); // Reset state wards
                setSelectedDistrictObj(null); // Reset selected district object
                setSelectedWardObj(null);   // Reset selected ward object

                if (provinceIdStr) {
                  const provinceIdNum = parseInt(provinceIdStr, 10);
                  // Tìm province dựa trên provinceId
                  const province = provinces.find(p => p.provinceId === provinceIdNum);
                  setSelectedProvinceObj(province || null); // Lưu đối tượng province vào state
                  if (province) {
                    console.log(`Selected province: ${province.provinceName} (ID: ${province.provinceId})`);
                    // Fetch districts bằng provinceId dạng số
                    fetchDistricts(province.provinceId);
                  } else {
                     setSelectedProvinceObj(null); // Clear nếu không tìm thấy
                  }
                } else {
                   setSelectedProvinceObj(null); // Clear nếu bỏ chọn
                }
              }}
            >
              <option value="">{loadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh/Thành phố --'}</option>
              {provinces.map((province) => (
                // Sử dụng provinceId làm value
                <option key={province.provinceId} value={province.provinceId}>
                  {province.provinceName}
                </option>
              ))}
            </select>
            {errors.provinceCode && (
              <p className="mt-1 text-xs text-red-600">{errors.provinceCode.message}</p>
            )}
          </div>

          {/* Quận/Huyện */}
          <div>
            <label htmlFor="districtCode" className="block text-xs font-medium text-gray-600 mb-1">
              Quận/Huyện
            </label>
            <select
              id="districtCode"
              {...register('districtCode', { required: 'Vui lòng chọn Quận/Huyện' })}
              className={`w-full px-3 py-2 border ${errors.districtCode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
              disabled={!watchedProvinceCode || loadingDistricts || districts.length === 0}
              onChange={(e) => {
                // Lấy districtId từ value
                const districtIdStr = e.target.value;
                // Lưu districtId (dưới dạng string) vào trường districtCode của RHF
                setValue('districtCode', districtIdStr);
                setValue('wardCode', ''); // Reset ward RHF
                setWards([]); // Reset state wards
                setSelectedWardObj(null); // Reset selected ward object

                if (districtIdStr) {
                  const districtIdNum = parseInt(districtIdStr, 10);
                  // Tìm district dựa trên districtId
                  const district = districts.find(d => d.districtId === districtIdNum);
                  setSelectedDistrictObj(district || null); // Lưu đối tượng district vào state
                  if (district) {
                    console.log(`Selected district: ${district.districtName} (ID: ${district.districtId})`);
                    // Fetch wards bằng districtId dạng số
                    fetchWards(district.districtId);
                  } else {
                     setSelectedDistrictObj(null); // Clear nếu không tìm thấy
                  }
                } else {
                   setSelectedDistrictObj(null); // Clear nếu bỏ chọn
                }
              }}
            >
              <option value="">{loadingDistricts ? 'Đang tải...' : '-- Chọn Quận/Huyện --'}</option>
              {districts.map((district) => (
                // Sử dụng districtId làm value
                <option key={district.districtId} value={district.districtId}>
                  {district.districtName}
                </option>
              ))}
            </select>
            {errors.districtCode && (
              <p className="mt-1 text-xs text-red-600">{errors.districtCode.message}</p>
            )}
          </div>

          {/* Phường/Xã */}
          <div>
            <label htmlFor="wardCode" className="block text-xs font-medium text-gray-600 mb-1">
              Phường/Xã
            </label>
            <select
              id="wardCode"
              {...register('wardCode', { required: 'Vui lòng chọn Phường/Xã' })}
              className={`w-full px-3 py-2 border ${errors.wardCode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
              disabled={!watchedDistrictCode || loadingWards || wards.length === 0}
              onChange={(e) => {
                // Lấy wardId từ value
                const wardIdStr = e.target.value;
                // Lưu wardId (dưới dạng string) vào trường wardCode của RHF
                setValue('wardCode', wardIdStr);

                if (wardIdStr) {
                  const wardIdNum = parseInt(wardIdStr, 10);
                  // Tìm ward dựa trên wardId
                  const ward = wards.find(w => w.wardId === wardIdNum);
                  setSelectedWardObj(ward || null); // Lưu đối tượng ward vào state
                  if (ward) {
                    console.log(`Selected ward: ${ward.wardName} (ID: ${ward.wardId})`);
                  } else {
                     setSelectedWardObj(null); // Clear nếu không tìm thấy
                  }
                } else {
                   setSelectedWardObj(null); // Clear nếu bỏ chọn
                }
              }}
            >
              <option value="">{loadingWards ? 'Đang tải...' : '-- Chọn Phường/Xã --'}</option>
              {wards.map((ward) => (
                // Sử dụng wardId làm value
                <option key={ward.wardId} value={ward.wardId}>
                  {ward.wardName}
                </option>
              ))}
            </select>
            {errors.wardCode && (
              <p className="mt-1 text-xs text-red-600">{errors.wardCode.message}</p>
            )}
          </div>

          {/* Địa chỉ chi tiết */}
          <div>
            <label htmlFor="addressDetail" className="block text-xs font-medium text-gray-600 mb-1">
              Địa chỉ chi tiết (Số nhà, tên đường)
            </label>
            <input
              type="text"
              id="addressDetail"
              {...register('address', { required: 'Vui lòng nhập địa chỉ chi tiết' })} // Đăng ký với tên 'address'
              className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
              placeholder="Ví dụ: 123 Đường ABC, Khu phố XYZ"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
            )}
          </div>
        </div>

        {/* Thông tin liên hệ */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <FiPhone className="w-5 h-5 text-gray-600" />
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-900">
                Thông tin liên hệ
              </label>
              <p className="text-xs text-gray-600">Nhập số điện thoại và người liên hệ (nếu có)</p>
            </div>
          </div>
          <input
            type="text"
            id="contact"
            {...register('contact')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: 0986644572 Lê Tấn Đạt"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center space-x-2"
          disabled={isSubmitting}
        >
          <FiX className="w-4 h-4" />
          <span>Hủy</span>
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          disabled={isSubmitting}
        >
          <FiSave className="w-4 h-4" />
          <span>{isSubmitting ? 'Đang lưu...' : 'Lưu chi nhánh'}</span>
        </button>
      </div>
    </form>
  );
};

export default BranchForm;
