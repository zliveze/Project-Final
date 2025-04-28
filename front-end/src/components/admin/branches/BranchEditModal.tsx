import React, { useState, useEffect } from 'react';
import { FiX, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';
import BranchForm, { Branch } from './BranchForm';
import { useBranches } from '@/contexts/BranchContext';
import ViettelPostService from '@/services/ViettelPostService';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = true;

// Hàm debug có điều kiện
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[BranchEditModal] ${message}`, data || '');
  }
};

interface BranchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

const BranchEditModal: React.FC<BranchEditModalProps> = ({
  isOpen,
  onClose,
  branchId
}) => {
  const { fetchBranch, updateBranch } = useBranches();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State cho thông tin địa chỉ
  const [provinceName, setProvinceName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [wardName, setWardName] = useState<string>('');
  const [loadingAddressInfo, setLoadingAddressInfo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      loadBranch();
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen, branchId]);

  // Hàm load thông tin tỉnh/thành phố
  const loadProvinceInfo = async (provinceCode: string) => {
    try {
      const provinces = await ViettelPostService.getProvinces();
      const province = provinces.find(p => p.provinceId === parseInt(provinceCode, 10));
      if (province) {
        setProvinceName(province.provinceName);
        debugLog(`Đã tìm thấy tỉnh/thành phố: ${province.provinceName} (ID: ${province.provinceId})`);
        return province;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tỉnh/thành phố:', error);
    }
    return null;
  };

  // Hàm load thông tin quận/huyện
  const loadDistrictInfo = async (provinceId: number, districtCode: string) => {
    try {
      const districts = await ViettelPostService.getDistricts(provinceId);
      const district = districts.find(d => d.districtId === parseInt(districtCode, 10));
      if (district) {
        setDistrictName(district.districtName);
        debugLog(`Đã tìm thấy quận/huyện: ${district.districtName} (ID: ${district.districtId})`);
        return district;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin quận/huyện:', error);
    }
    return null;
  };

  // Hàm load thông tin phường/xã
  const loadWardInfo = async (districtId: number, wardCode: string) => {
    try {
      const wards = await ViettelPostService.getWards(districtId);
      const ward = wards.find(w => w.wardId === parseInt(wardCode, 10));
      if (ward) {
        setWardName(ward.wardName);
        debugLog(`Đã tìm thấy phường/xã: ${ward.wardName} (ID: ${ward.wardId})`);
        return ward;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin phường/xã:', error);
    }
    return null;
  };

  // Hàm load toàn bộ thông tin địa chỉ
  const loadAddressInfo = async (provinceCode: string, districtCode: string, wardCode: string) => {
    setLoadingAddressInfo(true);
    try {
      // Đảm bảo các mã là số
      if (!provinceCode || !districtCode || !wardCode) {
        debugLog('Thiếu mã địa chỉ:', { provinceCode, districtCode, wardCode });
        return;
      }

      const province = await loadProvinceInfo(provinceCode);
      if (province) {
        const district = await loadDistrictInfo(province.provinceId, districtCode);
        if (district) {
          await loadWardInfo(district.districtId, wardCode);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin địa chỉ:', error);
    } finally {
      setLoadingAddressInfo(false);
    }
  };

  const loadBranch = async () => {
    if (!branchId) {
      debugLog('Không thể tải chi nhánh: branchId không hợp lệ');
      setError('ID chi nhánh không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Đang tải thông tin chi nhánh với ID: ${branchId}`);
      
      const result = await fetchBranch(branchId);
      
      debugLog('Kết quả trả về từ fetchBranch:', result);
      
      if (result) {
        // Chuyển đổi từ API response sang kiểu dữ liệu form
        // Đảm bảo lưu đầy đủ thông tin địa chỉ (provinceCode, districtCode, wardCode)
        const branchData: Branch = {
          id: result.id,
          name: result.name || '',
          address: result.address || '',
          contact: result.contact || '',
          provinceCode: result.provinceCode || '',
          districtCode: result.districtCode || '',
          wardCode: result.wardCode || '',
          createdAt: result.createdAt || '',
          updatedAt: result.updatedAt || ''
        };
        
        // Ghi log tất cả dữ liệu để debug
        debugLog('Thông tin chi nhánh từ API:', result);
        debugLog('provinceCode:', result.provinceCode);
        debugLog('districtCode:', result.districtCode);
        debugLog('wardCode:', result.wardCode);
        
        setBranch(branchData);
        debugLog('Đã cập nhật state branch với dữ liệu:', branchData);
        
        // Load thông tin địa chỉ từ mã
        if (result.provinceCode && result.districtCode && result.wardCode) {
          loadAddressInfo(result.provinceCode, result.districtCode, result.wardCode);
        }
      } else {
        debugLog('fetchBranch trả về null hoặc undefined');
        setError('Không thể tải thông tin chi nhánh. Vui lòng thử lại sau.');
        toast.error('Không thể tải thông tin chi nhánh');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Lỗi không xác định';
      debugLog(`Lỗi khi tải thông tin chi nhánh: ${errorMessage}`, error);
      setError(`Không thể tải thông tin chi nhánh: ${errorMessage}`);
      toast.error('Không thể tải thông tin chi nhánh');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi submit form
  const handleSubmit = async (data: Partial<Branch>) => {
    if (!branchId) return;

    try {
      setIsSubmitting(true);
      debugLog('Đang cập nhật chi nhánh với dữ liệu:', data);

      // Đảm bảo các mã code là số
      const preparedData = {
        ...data,
        provinceCode: data.provinceCode ? data.provinceCode.toString() : '',
        districtCode: data.districtCode ? data.districtCode.toString() : '',
        wardCode: data.wardCode ? data.wardCode.toString() : ''
      };

      // Gọi API cập nhật chi nhánh
      const result = await updateBranch(branchId, preparedData);

      if (result) {
        // Thông báo thành công
        debugLog('Cập nhật chi nhánh thành công:', result);
        toast.success('Cập nhật chi nhánh thành công!');

        // Đóng modal
        onClose();
      } else {
        throw new Error('Không nhận được phản hồi từ server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Lỗi không xác định';
      debugLog(`Lỗi khi cập nhật chi nhánh: ${errorMessage}`, error);
      toast.error(`Có lỗi xảy ra khi cập nhật chi nhánh: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 flex items-center">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 backdrop-blur-sm">
              <FiEdit className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Chỉnh sửa chi nhánh
            </h2>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                {error}
                <div className="mt-4">
                  <button
                    onClick={loadBranch}
                    className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : branch ? (
              <>
                {loadingAddressInfo ? (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <p className="text-sm">Đang tải thông tin địa chỉ...</p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <p className="text-sm font-medium">Thông tin địa chỉ hiện tại:</p>
                    <ul className="text-xs mt-1">
                      <li><span className="font-medium">Tỉnh/Thành phố:</span> {provinceName || `(Mã: ${branch.provinceCode})`}</li>
                      <li><span className="font-medium">Quận/Huyện:</span> {districtName || `(Mã: ${branch.districtCode})`}</li>
                      <li><span className="font-medium">Phường/Xã:</span> {wardName || `(Mã: ${branch.wardCode})`}</li>
                    </ul>
                  </div>
                )}
                <BranchForm
                  branch={branch}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  isSubmitting={isSubmitting}
                />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không thể tải thông tin chi nhánh
                <div className="mt-4">
                  <button
                    onClick={loadBranch}
                    className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchEditModal;
