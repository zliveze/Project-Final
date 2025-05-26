import React, { useState, useEffect } from 'react';
import { FiX, FiEdit } from 'react-icons/fi';
import BranchForm, { Branch } from './BranchForm';
import { useBranches } from '@/contexts/BranchContext';
import ViettelPostService from '@/services/ViettelPostService';

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

  const loadAddressInfo = async (provinceCode: string, districtCode: string, wardCode: string) => {
    setLoadingAddressInfo(true);
    try {
      if (!provinceCode || !districtCode || !wardCode) {
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
      setError('ID chi nhánh không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchBranch(branchId);

      if (result) {
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

        setBranch(branchData);

        if (result.provinceCode && result.districtCode && result.wardCode) {
          loadAddressInfo(result.provinceCode, result.districtCode, result.wardCode);
        }
      } else {
        setError('Không thể tải thông tin chi nhánh. Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Lỗi không xác định';
      setError(`Không thể tải thông tin chi nhánh: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Branch>) => {
    if (!branchId) return;

    try {
      setIsSubmitting(true);

      const preparedData = {
        ...data,
        provinceCode: data.provinceCode ? data.provinceCode.toString() : '',
        districtCode: data.districtCode ? data.districtCode.toString() : '',
        wardCode: data.wardCode ? data.wardCode.toString() : ''
      };

      const result = await updateBranch(branchId, preparedData);

      if (result) {
        onClose();
      } else {
        throw new Error('Không nhận được phản hồi từ server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Lỗi không xác định';
      console.error(`Lỗi khi cập nhật chi nhánh: ${errorMessage}`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !modalVisible) return null;

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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
            isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-4 sm:scale-95'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiEdit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chỉnh sửa chi nhánh
                </h3>
                <p className="text-sm text-gray-500">
                  Cập nhật thông tin chi nhánh
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

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={loadBranch}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : branch ? (
              <>
                {loadingAddressInfo ? (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Đang tải thông tin địa chỉ...</p>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Thông tin địa chỉ hiện tại:</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Tỉnh/Thành phố:</span> {provinceName || `(Mã: ${branch.provinceCode})`}</div>
                      <div><span className="font-medium">Quận/Huyện:</span> {districtName || `(Mã: ${branch.districtCode})`}</div>
                      <div><span className="font-medium">Phường/Xã:</span> {wardName || `(Mã: ${branch.wardCode})`}</div>
                    </div>
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
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">Không thể tải thông tin chi nhánh</div>
                <button
                  onClick={loadBranch}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchEditModal;
