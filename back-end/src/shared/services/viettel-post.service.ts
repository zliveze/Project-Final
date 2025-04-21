import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViettelPostToken, ViettelPostTokenDocument } from '../schemas/viettel-post-token.schema';

export interface ViettelPostLoginResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    token: string;
    partner: {
      phone: string;
      name: string;
      address: string;
      groupaddressId: number;
    };
  };
}

export interface ViettelPostOrderResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    ORDER_NUMBER: string;
    MONEY_TOTAL: number;
    MONEY_TOTAL_FEE: number;
    MONEY_FEE: number;
    MONEY_COLLECTION_FEE: number;
    MONEY_COLLECTION: number;
    MONEY_VAT: number;
    MONEY_TOTAL_VAT: number;
    KPI_HT: string;
  };
}

export interface ViettelPostTrackingResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    ORDER_NUMBER: string;
    ORDER_REFERENCE: string;
    ORDER_STATUS: string;
    ORDER_STATUS_NAME: string;
    RECEIVER_PROVINCE: string;
    RECEIVER_DISTRICT: string;
    RECEIVER_WARD: string;
    PRODUCT_WEIGHT: number;
    ORDER_SERVICE: string;
    ORDER_SERVICE_NAME: string;
    ORDER_NOTE: string;
    MONEY_COLLECTION: number;
    MONEY_TOTAL_FEE: number;
    MONEY_TOTAL: number;
    EXPECTED_DELIVERY: string;
    ORDER_PAYMENT_METHOD: number;
    INVENTORY_STATUS_NAME: string;
    listOrderLogs: Array<{
      action_time: string;
      status: string;
      status_name: string;
      location: string;
      reason: string;
    }>;
  };
}

@Injectable()
export class ViettelPostService {
  private readonly logger = new Logger(ViettelPostService.name);
  private readonly apiUrl: string = '';
  private readonly username: string = '';
  private readonly password: string = '';
  private token: string = '';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(ViettelPostToken.name)
    private viettelPostTokenModel: Model<ViettelPostTokenDocument>,
  ) {
    const apiUrl = this.configService.get<string>('VIETTEL_POST_URL');
    const username = this.configService.get<string>('VIETTEL_POST_USERNAME');
    const password = this.configService.get<string>('VIETTEL_POST_PASSWORD');

    if (apiUrl) this.apiUrl = apiUrl;
    if (username) this.username = username;
    if (password) this.password = password;

    if (!this.apiUrl) {
      this.logger.error('ViettelPost API URL is missing in config!');
    }

    if (!this.username || !this.password) {
      this.logger.error('ViettelPost credentials are missing in config!');
    }

    // Khởi tạo token khi service start
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      // Tìm token active trong database
      const tokenDoc = await this.viettelPostTokenModel.findOne({
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (tokenDoc) {
        this.token = tokenDoc.token;
        this.logger.log('Loaded existing ViettelPost token from database');
      } else {
        // Nếu không có token hoặc token hết hạn, login để lấy token mới
        await this.login();
      }
    } catch (error) {
      this.logger.error('Error initializing ViettelPost token:', error);
    }
  }

  private async saveToken(token: string, expiresIn: number = 24 * 60 * 60 * 1000) { // Default 24h
    try {
      // Vô hiệu hóa token cũ
      await this.viettelPostTokenModel.updateMany(
        { isActive: true },
        { isActive: false }
      );

      // Lưu token mới
      const expiresAt = new Date(Date.now() + expiresIn);
      await this.viettelPostTokenModel.create({
        token,
        expiresAt,
        isActive: true
      });

      this.token = token;
    } catch (error) {
      this.logger.error('Error saving ViettelPost token:', error);
      throw error;
    }
  }

  private getHeaders() {
    if (!this.token) {
      this.logger.error('ViettelPost token is not available');
      throw new UnauthorizedException('ViettelPost token is not available. Please login first.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Token': this.token,
    };

    this.logger.debug('ViettelPost API headers:', {
      headers,
      tokenLength: this.token ? this.token.length : 0,
      tokenFirstChars: this.token ? this.token.substring(0, 10) + '...' : 'null'
    });

    return headers;
  }

  /**
   * Đăng nhập vào Viettel Post để lấy token
   */
  async login(): Promise<string> {
    try {
      if (!this.username || !this.password) {
        throw new Error('ViettelPost username or password is missing in config!');
      }

      const url = `${this.apiUrl}/user/Login`;
      const payload = {
        USERNAME: this.username,
        PASSWORD: this.password,
      };

      this.logger.log(`Logging in to ViettelPost with username: ${this.username}`);
      this.logger.debug('ViettelPost login payload:', {
        url,
        username: this.username,
        passwordLength: this.password ? this.password.length : 0
      });

      const response = await firstValueFrom(
        this.httpService.post<ViettelPostLoginResponse>(url, payload),
      );

      this.logger.debug('ViettelPost login response:', {
        status: response.status,
        statusText: response.statusText,
        dataStatus: response.data?.status,
        message: response.data?.message,
        hasToken: response.data?.data?.token ? 'Yes' : 'No',
        tokenLength: response.data?.data?.token ? response.data.data.token.length : 0
      });

      if (response.data && response.data.status === 200 && response.data.data?.token) {
        // Lưu token vào database
        await this.saveToken(response.data.data.token);
        this.logger.log('Successfully logged in to ViettelPost and saved token');
        return this.token;
      } else {
        this.logger.error(`ViettelPost login failed: ${response.data?.message || 'Unknown error'}`);
        throw new Error(`ViettelPost login failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error logging in to ViettelPost: ${axiosError.message}`, axiosError.stack);
      if (axiosError.response) {
        this.logger.error(`ViettelPost login error: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Tạo vận đơn mới
   */
  async createShipmentOrder(payload: any): Promise<any> {
    const url = `${this.apiUrl}/order/createOrder`;
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.login();
      }

      // Kiểm tra và xử lý số điện thoại
      if (payload.RECEIVER_PHONE) {
        // Loại bỏ các ký tự không phải số
        payload.RECEIVER_PHONE = payload.RECEIVER_PHONE.replace(/[^0-9]/g, '');
        // Đảm bảo số điện thoại bắt đầu bằng 84
        if (payload.RECEIVER_PHONE.startsWith('0')) {
          payload.RECEIVER_PHONE = `84${payload.RECEIVER_PHONE.substring(1)}`;
        } else if (!payload.RECEIVER_PHONE.startsWith('84')) {
          payload.RECEIVER_PHONE = `84${payload.RECEIVER_PHONE}`;
        }
      }

      if (payload.SENDER_PHONE) {
        // Loại bỏ các ký tự không phải số
        payload.SENDER_PHONE = payload.SENDER_PHONE.replace(/[^0-9]/g, '');
        // Đảm bảo số điện thoại bắt đầu bằng 84
        if (payload.SENDER_PHONE.startsWith('0')) {
          payload.SENDER_PHONE = `84${payload.SENDER_PHONE.substring(1)}`;
        } else if (!payload.SENDER_PHONE.startsWith('84')) {
          payload.SENDER_PHONE = `84${payload.SENDER_PHONE}`;
        }
      }

      this.logger.log(`Sending request to create ViettelPost shipment`);
      this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await firstValueFrom(
        this.httpService.post<ViettelPostOrderResponse>(url, payload, { headers: this.getHeaders() }),
      );

      this.logger.log(`ViettelPost response status: ${response.status}`);
      this.logger.debug(`ViettelPost response data: ${JSON.stringify(response.data)}`);

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error calling ViettelPost API: ${axiosError.message}`, axiosError.stack);

      // Hiển thị thông tin chi tiết về lỗi
      this.logger.debug('ViettelPost API error details:', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
          data: axiosError.config?.data
        },
        responseData: axiosError.response?.data
      });

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401 ||
          (axiosError.response?.data &&
           typeof axiosError.response.data === 'object' &&
           'message' in axiosError.response.data &&
           typeof (axiosError.response.data as any).message === 'string' &&
           (axiosError.response.data as any).message.includes('token'))) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.createShipmentOrder(payload); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin vận đơn
   */
  async getOrderInfo(orderNumber: string): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.login();
      }

      const url = `${this.apiUrl}/order/GetOrderDetailByOrderNumber`;
      const payload = { ORDER_NUMBER: orderNumber };

      this.logger.log(`Getting order info for order number: ${orderNumber}`);

      const response = await firstValueFrom(
        this.httpService.post<ViettelPostTrackingResponse>(url, payload, { headers: this.getHeaders() }),
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error getting order info: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.getOrderInfo(orderNumber); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Hủy vận đơn
   */
  async cancelOrder(orderNumber: string, reason: string): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.login();
      }

      const url = `${this.apiUrl}/order/UpdateOrder`;
      const payload = {
        TYPE: 4, // Mã hủy đơn hàng
        ORDER_NUMBER: orderNumber,
        NOTE: reason || 'Cancelled by system',
      };

      this.logger.log(`Cancelling order: ${orderNumber}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error cancelling order: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.cancelOrder(orderNumber, reason); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách tỉnh/thành phố
   */
  async getProvinces(): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/categories/listProvinceById`;
      this.logger.log('Fetching provinces from ViettelPost');

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getHeaders(),
          params: { provinceId: -1 } // -1 để lấy tất cả
        })
      );

      if (response.data && response.data.status === 200) {
        return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error fetching provinces: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.getProvinces(); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách quận/huyện theo tỉnh/thành phố
   */
  async getDistricts(provinceId: number): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/categories/listDistrict`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getHeaders(),
          params: { provinceId: provinceId || -1 }
        })
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error getting districts: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.getDistricts(provinceId); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách phường/xã theo quận/huyện
   */
  async getWards(districtId: number): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/categories/listWards`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getHeaders(),
          params: { districtId: districtId || -1 }
        })
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error getting wards: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.getWards(districtId); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Tính phí vận chuyển
   */
  async calculateShippingFee(payload: any): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/order/getPrice`;

      this.logger.log(`Calculating shipping fee`);
      this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error calculating shipping fee: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.calculateShippingFee(payload); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }
}