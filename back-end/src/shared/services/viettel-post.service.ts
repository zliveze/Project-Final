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
        this.logger.debug('Loaded existing ViettelPost token from database');
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

      this.logger.debug(`Logging in to ViettelPost with username: ${this.username}`);

      const response = await firstValueFrom(
        this.httpService.post<ViettelPostLoginResponse>(url, payload),
      );



      if (response.data && response.data.status === 200 && response.data.data?.token) {
        // Lưu token vào database
        await this.saveToken(response.data.data.token);
        this.logger.debug('Successfully logged in to ViettelPost and saved token');
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

      this.logger.debug(`Sending request to create ViettelPost shipment`);

      const response = await firstValueFrom(
        this.httpService.post<ViettelPostOrderResponse>(url, payload, { headers: this.getHeaders() }),
      );

      this.logger.debug(`ViettelPost response status: ${response.status}`);

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
        this.logger.debug('Token expired, trying to login again...');
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

      this.logger.debug(`Getting order info for order number: ${orderNumber}`);

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
        this.logger.debug('Token expired, trying to login again...');
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

      this.logger.debug(`Cancelling order: ${orderNumber}`);

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
        this.logger.debug('Token expired, trying to login again...');
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
      this.logger.debug('Fetching provinces from ViettelPost');

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
        this.logger.debug('Token expired, trying to login again...');
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
        this.logger.debug('Token expired, trying to login again...');
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
        this.logger.debug('Token expired, trying to login again...');
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
   * Tính phí vận chuyển (API getPrice)
   */
  async calculateShippingFee(payload: any): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/order/getPrice`;

      this.logger.debug(`Calculating shipping fee using getPrice API`);

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
        this.logger.debug('Token expired, trying to login again...');
        await this.login();
        return this.calculateShippingFee(payload); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Tính phí vận chuyển cho tất cả dịch vụ (API getPriceAll)
   */
  async calculateShippingFeeAll(payload: any): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/order/getPriceAll`;

      this.logger.debug(`Calculating shipping fee using getPriceAll API`);

      // Chuẩn hóa payload
      const normalizedPayload = {
        SENDER_PROVINCE: payload.SENDER_PROVINCE,
        SENDER_DISTRICT: payload.SENDER_DISTRICT,
        RECEIVER_PROVINCE: payload.RECEIVER_PROVINCE,
        RECEIVER_DISTRICT: payload.RECEIVER_DISTRICT,
        PRODUCT_TYPE: payload.PRODUCT_TYPE || 'HH',
        PRODUCT_WEIGHT: payload.PRODUCT_WEIGHT || 500,
        PRODUCT_PRICE: payload.PRODUCT_PRICE || 10000,
        MONEY_COLLECTION: payload.MONEY_COLLECTION || payload.PRODUCT_PRICE || 10000,
        TYPE: payload.TYPE || 1
      };

      const response = await firstValueFrom(
        this.httpService.post(url, normalizedPayload, { headers: this.getHeaders() }),
      );

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        this.logger.error(`ViettelPost API error: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: Invalid response format`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error calculating shipping fee with getPriceAll: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.debug('Token expired, trying to login again...');
        await this.login();
        return this.calculateShippingFeeAll(payload); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Tạo yêu cầu chuyển hoàn đơn hàng
   */
  async createReturnRequest(orderNumber: string, options: { SERVICE_CODE: string, SERVICE_NAME: string, REASON: string }): Promise<any> {
    try {
      // Đảm bảo có token
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/order/UpdateOrder`;

      // Chuẩn hóa payload cho yêu cầu chuyển hoàn
      const payload = {
        TYPE: 2, // Mã duyệt chuyển hoàn theo tài liệu API
        ORDER_NUMBER: orderNumber,
        NOTE: options.REASON || 'Yêu cầu trả hàng từ khách hàng'
      };

      this.logger.debug(`Creating return request for order: ${orderNumber} with service: ${options.SERVICE_CODE}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );

      if (response.data && response.data.status === 200) {
        this.logger.debug(`Return request created successfully for order: ${orderNumber}`);
        return response.data.data;
      } else {
        this.logger.error(`ViettelPost API error when creating return request: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error creating return request: ${axiosError.message}`, axiosError.stack);

      // Nếu lỗi là do token hết hạn, thử đăng nhập lại và gọi lại API
      if (axiosError.response?.status === 401) {
        this.logger.debug('Token expired, trying to login again...');
        await this.login();
        return this.createReturnRequest(orderNumber, options); // Gọi lại API sau khi đăng nhập
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng trên Viettel Post
   * https://partner.viettelpost.vn/v2/order/UpdateOrder
   */
  async updateOrderStatus(payload: {
    TYPE: number;
    ORDER_NUMBER: string;
    NOTE?: string;
    DATE?: string;
  }): Promise<any> {
    try {
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/order/UpdateOrder`;
      this.logger.debug(`[VTP_SERVICE_UPDATE_STATUS] Updating ViettelPost order status for: ${payload.ORDER_NUMBER}. URL: ${url}`);
      this.logger.debug(`[VTP_SERVICE_UPDATE_STATUS] Update payload: ${JSON.stringify(payload)}`);
      let response;
      try {
        response = await firstValueFrom(
          this.httpService.post(url, payload, { headers: this.getHeaders() }),
        );
        this.logger.debug(`[VTP_SERVICE_UPDATE_STATUS] Raw response from ViettelPost: Status ${response.status}, Data: ${JSON.stringify(response.data)}`);
      } catch (requestError) {
        const axiosRequestError = requestError as AxiosError;
        this.logger.error(`[VTP_SERVICE_UPDATE_STATUS] HTTP request to ViettelPost failed for order ${payload.ORDER_NUMBER}: ${axiosRequestError.message}`, axiosRequestError.stack);
        if (axiosRequestError.response) {
          this.logger.error(`[VTP_SERVICE_UPDATE_STATUS] ViettelPost error response: Status ${axiosRequestError.response.status}, Data: ${JSON.stringify(axiosRequestError.response.data)}`);
        }
        throw axiosRequestError; // Ném lại lỗi để được xử lý ở tầng cao hơn nếu cần
      }


      if (response.data && response.data.status === 200 && response.data.error === false) {
        this.logger.log(`[VTP_SERVICE_UPDATE_STATUS] Successfully updated ViettelPost order status for ${payload.ORDER_NUMBER}. Response data: ${JSON.stringify(response.data)}`);
        // Trả về toàn bộ response.data để OrdersService có thể kiểm tra chi tiết
        return response.data;
      } else {
        this.logger.error(`[VTP_SERVICE_UPDATE_STATUS] ViettelPost API returned a non-successful status or error for order ${payload.ORDER_NUMBER}: ${JSON.stringify(response.data)}`);
        // Ném lỗi với thông tin từ ViettelPost để OrdersService có thể bắt và xử lý
        throw new Error(`ViettelPost API Error for order ${payload.ORDER_NUMBER}: ${response.data?.message || 'Unknown error from ViettelPost'}. Full response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      // Đây là catch block cho các lỗi không phải là lỗi HTTP request (ví dụ: token hết hạn, lỗi logic trước khi gọi API)
      // hoặc lỗi đã được ném lại từ catch block của HTTP request
      const axiosError = error as AxiosError; // Có thể không phải lúc nào cũng là AxiosError ở đây
      this.logger.error(`[VTP_SERVICE_UPDATE_STATUS] Error in updateOrderStatus for ${payload.ORDER_NUMBER}: ${error.message}`, error.stack);

      if (axiosError.response?.status === 401) {
        this.logger.debug('Token expired, trying to login again...');
        await this.login();
        return this.updateOrderStatus(payload); // Retry after login
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Đăng ký để Viettel Post gửi lại toàn bộ hành trình của vận đơn qua webhook
   * https://partner.viettelpost.vn/v2/order/registerOrderHook?oid=ORDER_NUMBER&mes=MESSAGE
   */
  async registerOrderHook(orderNumber: string, message?: string): Promise<any> {
    try {
      if (!this.token) {
        await this.initializeToken();
      }

      const url = `${this.apiUrl}/order/registerOrderHook`;
      const params: any = { oid: orderNumber };
      if (message) {
        params.mes = message;
      }

      this.logger.debug(`Registering order hook for ViettelPost order: ${orderNumber}, message: ${message || 'N/A'}`);

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders(), params }),
      );

      // API này thường trả về thông báo thành công hoặc lỗi, không có dữ liệu cụ thể của đơn hàng
      // mà sẽ kích hoạt webhook gửi lại hành trình.
      if (response.data && response.data.status === 200) {
        this.logger.log(`Successfully registered order hook for ${orderNumber}. ViettelPost will resend webhook. Response: ${JSON.stringify(response.data)}`);
        return response.data; // Trả về toàn bộ response từ ViettelPost
      } else {
        this.logger.error(`ViettelPost API error when registering order hook: ${JSON.stringify(response.data)}`);
        throw new Error(`ViettelPost API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error registering ViettelPost order hook: ${axiosError.message}`, axiosError.stack);

      if (axiosError.response?.status === 401) {
        this.logger.debug('Token expired, trying to login again...');
        await this.login();
        return this.registerOrderHook(orderNumber, message); // Retry after login
      }

      if (axiosError.response) {
        this.logger.error(`ViettelPost error response: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`ViettelPost API Request Failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw error;
    }
  }
}
