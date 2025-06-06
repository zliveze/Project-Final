import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiCalendar, FiClock, FiHome } from 'react-icons/fi';
import { useBranches } from '@/contexts/BranchContext';
import { Branch } from './BranchForm';
import ViettelPostService from '@/services/ViettelPostService';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = false;

// Hàm debug có điều kiện
const debugLog = (message: string, data?: unknown) => {
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

  // Hàm load thông tin tỉnh/thành phố
  const loadProvinceInfo = React.useCallback(async (provinceCode: string) => {
    try {
      const provinces = await ViettelPostService.getProvinces();
      const province = provinces.find(p => p.provinceId === parseInt(provinceCode, 10));
      if (province) {
        setProvinceName(province.provinceName);
        return province;
      }
    } catch (error) {
      debugLog('Lỗi khi lấy thông tin tỉnh/thành phố:', error);
    }
    return null;
  }, []);

  // Hàm load thông tin quận/huyện
  const loadDistrictInfo = React.useCallback(async (provinceId: number, districtCode: string) => {
    try {
      const districts = await ViettelPostService.getDistricts(provinceId);
      const district = districts.find(d => d.districtId === parseInt(districtCode, 10));
      if (district) {
        setDistrictName(district.districtName);
        return district;
      }
    } catch (error) {
      debugLog('Lỗi khi lấy thông tin quận/huyện:', error);
    }
    return null;
  }, []);

  // Hàm load thông tin phường/xã
  const loadWardInfo = React.useCallback(async (districtId: number, wardCode: string) => {
    try {
      const wards = await ViettelPostService.getWards(districtId);
      const ward = wards.find(w => w.wardId === parseInt(wardCode, 10));
      if (ward) {
        setWardName(ward.wardName);
        return ward;
      }
    } catch (error) {
      debugLog('Lỗi khi lấy thông tin phường/xã:', error);
    }
    return null;
  }, []);

  // Hàm load toàn bộ thông tin địa chỉ
  const loadAddressInfo = React.useCallback(async (provinceCode: string, districtCode: string, wardCode: string) => {
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
      debugLog('Lỗi khi lấy thông tin địa chỉ:', error);
    } finally {
      setLoadingAddressInfo(false);
    }
  }, [loadProvinceInfo, loadDistrictInfo, loadWardInfo]);

  const loadBranch = React.useCallback(async () => {
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
        // Error đã được xử lý trong Context
      }
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error ? error.message : String(error)) || 'Lỗi không xác định';
      debugLog(`Lỗi khi tải thông tin chi nhánh: ${errorMessage}`, error);
      setError(`Không thể tải thông tin chi nhánh: ${errorMessage}`);
      // Error đã được xử lý trong Context
    } finally {
      setIsLoading(false);
    }
  }, [branchId, fetchBranch, loadAddressInfo, setError, setIsLoading, setBranch]);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      loadBranch();
    } else {
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [isOpen, branchId, loadBranch]);

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
    } catch {
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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiEye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết chi nhánh
                </h3>
                <p className="text-sm text-gray-500">
                  Xem thông tin chi tiết
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={loadBranch}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : branch ? (
              <div className="space-y-6">
                {/* Tên chi nhánh */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FiHome className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {branch.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {branch.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FiMapPin className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Địa chỉ</h4>
                      <p className="text-gray-700 mb-2">{branch.address}</p>

                      {loadingAddressInfo ? (
                        <div className="text-sm text-gray-500">Đang tải thông tin địa chỉ...</div>
                      ) : (
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><span className="font-medium">Tỉnh/Thành phố:</span> {provinceName || `(Mã: ${branch.provinceCode})`}</div>
                          <div><span className="font-medium">Quận/Huyện:</span> {districtName || `(Mã: ${branch.districtCode})`}</div>
                          <div><span className="font-medium">Phường/Xã:</span> {wardName || `(Mã: ${branch.wardCode})`}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thông tin liên hệ */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FiPhone className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Thông tin liên hệ</h4>
                      <p className="text-gray-700">{branch.contact || "Chưa có thông tin liên hệ"}</p>
                    </div>
                  </div>
                </div>

                {/* Thời gian */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ngày tạo */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FiCalendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Ngày tạo</h4>
                        <p className="text-gray-700 text-sm">{formatDate(branch.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cập nhật lần cuối */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FiClock className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Cập nhật lần cuối</h4>
                        <p className="text-gray-700 text-sm">{formatDate(branch.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không thể tải thông tin chi nhánh
              </div>
            )}

            {/* Footer */}
            {branch && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  onClick={onDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchViewModal;
