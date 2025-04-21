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
      const initialProvinceId = parseInt(branch.provinceCode, 10);
      const province = provinces.find(p => p.provinceId === initialProvinceId);
      if (province) {
        setSelectedProvinceObj(province);
        // Không cần gọi fetchDistricts ở đây, useEffect tiếp theo sẽ xử lý
      }
    }
  }, [branch, provinces, selectedProvinceObj]); // Phụ thuộc vào branch và provinces

  // Effect để fetch districts KHI provinceId thay đổi (từ RHF) HOẶC state province object được set
  useEffect(() => {
    const provinceIdStr = watchedProvinceCode; // Lấy ID từ RHF
    if (provinceIdStr) {
      const provinceIdNum = parseInt(provinceIdStr, 10);
      if (selectedProvinceObj && selectedProvinceObj.provinceId === provinceIdNum) { // Đảm bảo state object khớp với RHF
        fetchDistricts(provinceIdNum);
      } else if (!selectedProvinceObj) { // Nếu state object chưa được set (ví dụ: load lần đầu)
         const province = provinces.find(p => p.provinceId === provinceIdNum);
         if(province) {
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
  }, [watchedProvinceCode, provinces, selectedProvinceObj, fetchDistricts, setSelectedProvinceObj]); // Thêm selectedProvinceObj

  // Effect để thiết lập state district object ban đầu KHI EDIT và districts đã load
  useEffect(() => {
      if (branch && districts.length > 0 && selectedProvinceObj && selectedProvinceObj.provinceId === parseInt(branch.provinceCode, 10) && !selectedDistrictObj) {
          const initialDistrictId = parseInt(branch.districtCode, 10);
          const district = districts.find(d => d.districtId === initialDistrictId);
          if (district) {
              setSelectedDistrictObj(district);
              // Không cần gọi fetchWards ở đây, useEffect tiếp theo sẽ xử lý
          }
      }
  }, [branch, districts, selectedProvinceObj, selectedDistrictObj]); // Phụ thuộc district list và selected province

  // Effect để fetch wards KHI districtId thay đổi (từ RHF) HOẶC state district object được set
  useEffect(() => {
    const districtIdStr = watchedDistrictCode; // Lấy ID từ RHF
    if (districtIdStr) {
      const districtIdNum = parseInt(districtIdStr, 10);
       if (selectedDistrictObj && selectedDistrictObj.districtId === districtIdNum) { // Đảm bảo state object khớp với RHF
         fetchWards(districtIdNum);
       } else if (!selectedDistrictObj) { // Nếu state object chưa được set
          const district = districts.find(d => d.districtId === districtIdNum);
          if(district) {
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
  }, [watchedDistrictCode, districts, selectedDistrictObj, fetchWards, setSelectedDistrictObj]); // Thêm selectedDistrictObj

  // Effect để thiết lập state ward object ban đầu KHI EDIT và wards đã load
  useEffect(() => {
      if (branch && wards.length > 0 && selectedDistrictObj && selectedDistrictObj.districtId === parseInt(branch.districtCode, 10) && !selectedWardObj) {
          const initialWardId = parseInt(branch.wardCode, 10);
          const ward = wards.find(w => w.wardId === initialWardId);
          if (ward) {
              setSelectedWardObj(ward);
          }
      }
  }, [branch, wards, selectedDistrictObj, selectedWardObj]); // Phụ thuộc ward list và selected district


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
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FiType className="text-pink-600" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên chi nhánh <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Nhập tên đầy đủ của chi nhánh</p>
            </div>
          </div>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Tên chi nhánh là bắt buộc' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: Chi nhánh Hồ Chí Minh"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Địa chỉ - Sử dụng dropdown */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FiMapPin className="text-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ chi nhánh <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập địa chỉ chi tiết.</p>
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
              className={`w-full px-4 py-3 border ${errors.provinceCode ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
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
              className={`w-full px-4 py-3 border ${errors.districtCode ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
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
              className={`w-full px-4 py-3 border ${errors.wardCode ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
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
              className={`w-full px-4 py-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
              placeholder="Ví dụ: 123 Đường ABC, Khu phố XYZ"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
            )}
          </div>
        </div>

        {/* Thông tin liên hệ */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
              <FiPhone className="text-green-600" />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Thông tin liên hệ
              </label>
              <p className="text-xs text-gray-500 mb-2">Nhập số điện thoại và người liên hệ (nếu có)</p>
            </div>
          </div>
          <input
            type="text"
            id="contact"
            {...register('contact')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Ví dụ: 0986644572 Lê Tấn Đạt"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
          disabled={isSubmitting}
        >
          <FiX className="mr-2 -ml-1 h-5 w-5" />
          Hủy
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
          disabled={isSubmitting}
        >
          <FiSave className="mr-2 -ml-1 h-5 w-5" />
          {isSubmitting ? 'Đang lưu...' : 'Lưu chi nhánh'}
        </button>
      </div>
    </form>
  );
};

export default BranchForm;
