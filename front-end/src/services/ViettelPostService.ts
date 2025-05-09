import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SHIPPING_API_URL = `${API_URL}/shipping`; // Assuming backend routes are under /shipping

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: SHIPPING_API_URL,
});

// Add request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get adminToken first, then fallback to accessToken
    let token = localStorage.getItem('adminToken');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interfaces matching the backend response structure after mapping
// (Based on back-end/src/orders/shipping.controller.ts)
export interface ProvinceData {
  provinceId: number;
  provinceName: string;
  provinceCode?: string; // Optional, as it might not always be needed/used
}

export interface DistrictData {
  districtId: number;
  districtName: string;
  districtCode?: string; // This is DISTRICT_VALUE from ViettelPost
}

export interface WardData {
  wardId: number;
  wardName: string;
  wardCode: string; // Added wardCode
}

const ViettelPostService = {
  getProvinces: async (): Promise<ProvinceData[]> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: ProvinceData[]; error?: string }>(
        '/provinces'
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch provinces');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast.error('Không thể tải danh sách Tỉnh/Thành phố.');
      return []; // Return empty array on error
    }
  },

  getDistricts: async (provinceId: number): Promise<DistrictData[]> => {
    if (!provinceId) return []; // Don't fetch if no provinceId
    try {
      const response = await axiosInstance.get<{ success: boolean; data: DistrictData[]; error?: string }>(
        `/districts/${provinceId}`
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch districts');
      }
    } catch (error) {
      console.error(`Error fetching districts for province ${provinceId}:`, error);
      toast.error('Không thể tải danh sách Quận/Huyện.');
      return []; // Return empty array on error
    }
  },

  getWards: async (districtId: number): Promise<WardData[]> => {
    if (!districtId) return []; // Don't fetch if no districtId
    try {
      const response = await axiosInstance.get<{ success: boolean; data: WardData[]; error?: string }>(
        `/wards/${districtId}`
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch wards');
      }
    } catch (error) {
      console.error(`Error fetching wards for district ${districtId}:`, error);
      toast.error('Không thể tải danh sách Phường/Xã.');
      return []; // Return empty array on error
    }
  },
};

export default ViettelPostService;
