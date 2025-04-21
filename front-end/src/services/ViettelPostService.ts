import axios from 'axios';

// Import axios để gọi API
// import { useAuth } from '@/contexts/AuthContext'; // Tạm thời không sử dụng

// Định nghĩa kiểu dữ liệu
export interface ViettelProvince {
  PROVINCE_ID: string;
  PROVINCE_CODE: string;
  PROVINCE_NAME: string;
}

export interface ViettelDistrict {
  DISTRICT_ID: string;
  DISTRICT_CODE: string;
  DISTRICT_NAME: string;
  PROVINCE_ID: string;
}

export interface ViettelWard {
  WARDS_ID: string;
  WARDS_CODE: string;
  WARDS_NAME: string;
  DISTRICT_ID: string;
}

// Chuyển đổi kiểu dữ liệu từ Viettel Post sang định dạng tương thích với ứng dụng
export interface Province {
  code: string;
  name: string;
  viettelCode?: string; // Thêm mã Viettel Post
}

export interface District {
  code: string;
  name: string;
  province_code: string;
  viettelCode?: string; // Thêm mã Viettel Post
}

export interface Ward {
  code: string;
  name: string;
  district_code: string;
  viettelCode?: string; // Thêm mã Viettel Post
}

// Base URL cho API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PATH = `${API_URL}/api`;

// Dữ liệu mẫu cho tỉnh/thành phố
const sampleProvinces: Province[] = [
  { code: '01', name: 'Hà Nội', viettelCode: '01' },
  { code: '79', name: 'Hồ Chí Minh', viettelCode: '79' },
  { code: '31', name: 'Hải Phòng', viettelCode: '31' },
  { code: '48', name: 'Đà Nẵng', viettelCode: '48' },
  { code: '92', name: 'Cần Thơ', viettelCode: '92' },
  { code: '77', name: 'Bà Rịa - Vũng Tàu', viettelCode: '77' },
  { code: '95', name: 'Bạc Liêu', viettelCode: '95' },
  { code: '24', name: 'Bắc Giang', viettelCode: '24' },
  { code: '06', name: 'Bắc Kạn', viettelCode: '06' },
  { code: '27', name: 'Bắc Ninh', viettelCode: '27' },
];

// Dữ liệu mẫu cho quận/huyện của Hà Nội
const sampleDistrictsHanoi: District[] = [
  { code: '001', name: 'Ba Đình', province_code: '01', viettelCode: '001' },
  { code: '002', name: 'Hoàn Kiếm', province_code: '01', viettelCode: '002' },
  { code: '003', name: 'Tây Hồ', province_code: '01', viettelCode: '003' },
  { code: '004', name: 'Long Biên', province_code: '01', viettelCode: '004' },
  { code: '005', name: 'Cầu Giấy', province_code: '01', viettelCode: '005' },
  { code: '006', name: 'Đống Đa', province_code: '01', viettelCode: '006' },
  { code: '007', name: 'Hai Bà Trưng', province_code: '01', viettelCode: '007' },
  { code: '008', name: 'Hoàng Mai', province_code: '01', viettelCode: '008' },
  { code: '009', name: 'Thanh Xuân', province_code: '01', viettelCode: '009' },
];

// Dữ liệu mẫu cho phường/xã của quận Hai Bà Trưng
const sampleWardsHaiBaTrung: Ward[] = [
  { code: '00001', name: 'Nguyễn Du', district_code: '007', viettelCode: '00001' },
  { code: '00002', name: 'Bách Khoa', district_code: '007', viettelCode: '00002' },
  { code: '00003', name: 'Bạch Mai', district_code: '007', viettelCode: '00003' },
  { code: '00004', name: 'Bùi Thị Xuân', district_code: '007', viettelCode: '00004' },
  { code: '00005', name: 'Cầu Dền', district_code: '007', viettelCode: '00005' },
  { code: '00006', name: 'Đồng Nhân', district_code: '007', viettelCode: '00006' },
  { code: '00007', name: 'Đồng Tâm', district_code: '007', viettelCode: '00007' },
  { code: '00008', name: 'Lê Đại Hành', district_code: '007', viettelCode: '00008' },
  { code: '00009', name: 'Minh Khai', district_code: '007', viettelCode: '00009' },
  { code: '00010', name: 'Ngô Thì Nhậm', district_code: '007', viettelCode: '00010' },
  { code: '00011', name: 'Nguyễn Du', district_code: '007', viettelCode: '00011' },
  { code: '00012', name: 'Phạm Đình Hổ', district_code: '007', viettelCode: '00012' },
  { code: '00013', name: 'Phố Huế', district_code: '007', viettelCode: '00013' },
  { code: '00014', name: 'Quỳnh Lôi', district_code: '007', viettelCode: '00014' },
  { code: '00015', name: 'Quỳnh Mai', district_code: '007', viettelCode: '00015' },
];

// Service cho Viettel Post
const ViettelPostService = {
  // Lấy danh sách tỉnh/thành phố
  async getProvinces(): Promise<Province[]> {
    try {
      // Sử dụng dữ liệu mẫu thay vì gọi API
      console.log('Sử dụng dữ liệu mẫu cho tỉnh/thành phố');
      return sampleProvinces;

      /* Gọi API thật - tạm thời comment lại vì API yêu cầu xác thực
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_PATH}/viettel-post/provinces`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Chuyển đổi dữ liệu từ Viettel Post sang định dạng tương thích
        return response.data.map((province: ViettelProvince) => ({
          code: province.PROVINCE_ID, // Sử dụng ID làm code
          name: province.PROVINCE_NAME,
          viettelCode: province.PROVINCE_CODE // Lưu mã Viettel Post
        }));
      } catch (apiError) {
        console.error('Lỗi khi gọi API Viettel Post:', apiError);
        // Nếu API gọi lỗi, trả về dữ liệu mẫu
        return sampleProvinces;
      }
      */
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', error);
      throw error;
    }
  },

  // Lấy danh sách quận/huyện theo tỉnh/thành phố
  async getDistricts(provinceId: string): Promise<District[]> {
    try {
      // Sử dụng dữ liệu mẫu thay vì gọi API
      console.log('Sử dụng dữ liệu mẫu cho quận/huyện, provinceId:', provinceId);
      // Nếu là Hà Nội, trả về dữ liệu mẫu
      if (provinceId === '01') {
        return sampleDistrictsHanoi;
      }
      // Nếu không phải Hà Nội, trả về mảng rỗng
      return [];

      /* Gọi API thật - tạm thời comment lại vì API yêu cầu xác thực
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_PATH}/viettel-post/districts/${provinceId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Chuyển đổi dữ liệu từ Viettel Post sang định dạng tương thích
        return response.data.map((district: ViettelDistrict) => ({
          code: district.DISTRICT_ID, // Sử dụng ID làm code
          name: district.DISTRICT_NAME,
          province_code: district.PROVINCE_ID,
          viettelCode: district.DISTRICT_CODE // Lưu mã Viettel Post
        }));
      } catch (apiError) {
        console.error('Lỗi khi gọi API Viettel Post:', apiError);
        // Nếu là Hà Nội, trả về dữ liệu mẫu
        if (provinceId === '01') {
          return sampleDistrictsHanoi;
        }
        // Nếu không phải Hà Nội, trả về mảng rỗng
        return [];
      }
      */
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quận/huyện:', error);
      throw error;
    }
  },

  // Lấy danh sách phường/xã theo quận/huyện
  async getWards(districtId: string): Promise<Ward[]> {
    try {
      // Sử dụng dữ liệu mẫu thay vì gọi API
      console.log('Sử dụng dữ liệu mẫu cho phường/xã, districtId:', districtId);
      // Nếu là quận Hai Bà Trưng, trả về dữ liệu mẫu
      if (districtId === '007') {
        return sampleWardsHaiBaTrung;
      }
      // Nếu không phải quận Hai Bà Trưng, trả về mảng rỗng
      return [];

      /* Gọi API thật - tạm thời comment lại vì API yêu cầu xác thực
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_PATH}/viettel-post/wards/${districtId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Chuyển đổi dữ liệu từ Viettel Post sang định dạng tương thích
        return response.data.map((ward: ViettelWard) => ({
          code: ward.WARDS_ID, // Sử dụng ID làm code
          name: ward.WARDS_NAME,
          district_code: ward.DISTRICT_ID,
          viettelCode: ward.WARDS_CODE // Lưu mã Viettel Post
        }));
      } catch (apiError) {
        console.error('Lỗi khi gọi API Viettel Post:', apiError);
        // Nếu là quận Hai Bà Trưng, trả về dữ liệu mẫu
        if (districtId === '007') {
          return sampleWardsHaiBaTrung;
        }
        // Nếu không phải quận Hai Bà Trưng, trả về mảng rỗng
        return [];
      }
      */
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phường/xã:', error);
      throw error;
    }
  },

  // Tính phí vận chuyển
  async calculateShippingFee(data: any): Promise<any> {
    try {
      // Sử dụng dữ liệu mẫu thay vì gọi API
      console.log('Sử dụng dữ liệu mẫu cho phí vận chuyển');
      // Trả về phí vận chuyển mặc định
      return {
        total: 30000,
        currency: 'VND',
        details: {
          baseFee: 25000,
          additionalFee: 5000,
          discount: 0
        }
      };

      /* Gọi API thật - tạm thời comment lại vì API yêu cầu xác thực
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_PATH}/viettel-post/shipping-fee`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: data
        });

        return response.data;
      } catch (apiError) {
        console.error('Lỗi khi gọi API Viettel Post:', apiError);
        // Trả về phí vận chuyển mặc định
        return {
          total: 30000,
          currency: 'VND',
          details: {
            baseFee: 25000,
            additionalFee: 5000,
            discount: 0
          }
        };
      }
      */
    } catch (error) {
      console.error('Lỗi khi tính phí vận chuyển:', error);
      throw error;
    }
  }
};

export default ViettelPostService;
