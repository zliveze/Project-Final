import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiCalendar, FiClock, FiInfo, FiHome } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBranches } from '@/contexts/BranchContext';
import { Branch } from './BranchForm';
import toast from 'react-hot-toast';
import ViettelPostService from '@/services/ViettelPostService';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = true;

// Hàm debug có điều kiện
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[BranchViewModal] ${message}`, data || '');
  }
};

interface BranchViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  onEdit: () => void;
  onDelete: () => void;
}

const BranchViewModal: React.FC<BranchViewModalProps> = ({
  isOpen,
  onClose,
  branchId,
  onEdit,
  onDelete
}) => {
  const { fetchBranch } = useBranches();
  const [branch, setBranch] = useState<Branch | null>(null);
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
        console.warn('Thiếu mã địa chỉ:', { provinceCode, districtCode, wardCode });
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
        setBranch(result);
        debugLog('Đã cập nhật state branch với dữ liệu:', result);

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

  if (!isOpen && !modalVisible) return null;

  // Format date hợp lý
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-700/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 p-2 transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 border-b flex items-center">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 backdrop-blur-sm">
              <FiEye className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Chi tiết chi nhánh
            </h2>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
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
              <div className="space-y-6">
                {/* Tên chi nhánh */}
                <div className="bg-pink-50 rounded-xl p-5 border border-pink-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-pink-600">
                    ID: {branch.id}
                  </p>
                </div>

                {/* Địa chỉ - Hiển thị tên địa điểm thay vì mã */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <FiMapPin className="text-blue-600" />
                    </div>
                    <div className="w-full">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Địa chỉ</h4>
                      <p className="text-gray-800 text-base mb-3">{branch.address}</p>

                      {loadingAddressInfo ? (
                        <div className="mt-2 text-sm text-gray-500">Đang tải thông tin địa chỉ...</div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <h5 className="text-xs font-medium text-gray-500 mb-1">Thông tin địa chỉ chi tiết:</h5>
                          <div className="grid grid-cols-1 gap-1 mt-1">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-24">Tỉnh/Thành phố:</span>
                              <span className="text-xs text-gray-700">{provinceName || `(Mã: ${branch.provinceCode})`}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-24">Quận/Huyện:</span>
                              <span className="text-xs text-gray-700">{districtName || `(Mã: ${branch.districtCode})`}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-24">Phường/Xã:</span>
                              <span className="text-xs text-gray-700">{wardName || `(Mã: ${branch.wardCode})`}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thông tin liên hệ */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <FiPhone className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Thông tin liên hệ</h4>
                      <p className="text-gray-800 text-base">{branch.contact || "Chưa có thông tin liên hệ"}</p>
                    </div>
                  </div>
                </div>

                {/* Thời gian */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Ngày tạo */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <FiCalendar className="text-indigo-600 h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Ngày tạo</h4>
                        <p className="text-gray-800 text-sm">{formatDate(branch.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cập nhật lần cuối */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <FiClock className="text-amber-600 h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Cập nhật lần cuối</h4>
                        <p className="text-gray-800 text-sm">{formatDate(branch.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 space-x-3">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
                  >
                    <FiEdit2 className="mr-2 -ml-1 h-5 w-5" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
                  >
                    <FiTrash2 className="mr-2 -ml-1 h-5 w-5" />
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không thể tải thông tin chi nhánh
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchViewModal;
