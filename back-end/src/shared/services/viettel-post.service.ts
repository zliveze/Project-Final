import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

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
  ) {
    const apiUrl = this.configService.get<string>('VIETTEL_POST_URL');
    const username = this.configService.get<string>('VIETTEL_POST_USERNAME');
    const password = this.configService.get<string>('VIETTEL_POST_PASSWORD');
    const token = this.configService.get<string>('VIETTEL_POST_TOKEN');

    if (apiUrl) this.apiUrl = apiUrl;
    if (username) this.username = username;
    if (password) this.password = password;
    if (token) this.token = token;

    if (!this.apiUrl) {
      this.logger.error('ViettelPost API URL is missing in config!');
    }

    if (!this.token && (!this.username || !this.password)) {
      this.logger.error('ViettelPost credentials are missing in config!');
    }
  }

  private getHeaders() {
    if (!this.token) {
      throw new UnauthorizedException('ViettelPost token is not available. Please login first.');
    }

    return {
      'Content-Type': 'application/json',
      'Token': this.token,
    };
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

      const response = await firstValueFrom(
        this.httpService.post<ViettelPostLoginResponse>(url, payload),
      );

      if (response.data && response.data.status === 200 && response.data.data?.token) {
        this.token = response.data.data.token;
        this.logger.log('Successfully logged in to ViettelPost');
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

      this.logger.log(`Sending request to create ViettelPost shipment`);
      this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

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
        await this.login();
      }

      const url = `${this.apiUrl}/categories/listProvinceById`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders() }),
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error getting provinces: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.log('Token expired, trying to login again...');
        await this.login();
        return this.getProvinces(); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
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
        await this.login();
      }

      const url = `${this.apiUrl}/categories/listDistrict?provinceId=${provinceId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders() }),
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
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
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
        await this.login();
      }

      const url = `${this.apiUrl}/categories/listWards?districtId=${districtId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders() }),
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
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
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
        await this.login();
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
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }
}
