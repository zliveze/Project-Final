import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentMethod, PaymentStatus } from './schemas/order.schema';
import {
  CreateOrderDto,
  UpdateOrderDto,
  QueryOrderDto,
  PaginatedOrdersResponseDto,
  CalculateShippingDto,
  ShippingFeeResponseDto
} from './dto';
import { ViettelPostService } from '../shared/services/viettel-post.service';
import { OrderTracking, OrderTrackingDocument } from './schemas/order-tracking.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderTracking.name) private orderTrackingModel: Model<OrderTrackingDocument>,
    private readonly viettelPostService: ViettelPostService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tạo đơn hàng mới
   */
  async create(createOrderDto: CreateOrderDto, userId: string): Promise<OrderDocument> {
    try {
      this.logger.log(`Creating new order for user ${userId}`);

      // Tạo mã đơn hàng duy nhất
      const orderNumber = this.generateOrderNumber();

      // Tạo đơn hàng mới
      const orderData = {
        ...createOrderDto,
        userId,
        orderNumber,
        status: OrderStatus.PENDING,
        paymentStatus:
          createOrderDto.paymentMethod === PaymentMethod.COD
            ? PaymentStatus.PENDING
            : PaymentStatus.PENDING,
      };

      const createdOrder = await this.orderModel.create(orderData);
      this.logger.log(`Order created successfully: ${createdOrder._id}`);

      // Tạo bản ghi theo dõi đơn hàng
      await this.orderTrackingModel.create({
        orderId: createdOrder._id,
        status: OrderStatus.PENDING,
        history: [
          {
            status: OrderStatus.PENDING,
            description: 'Đơn hàng đã được tạo',
            timestamp: new Date(),
          },
        ],
      });

      // Nếu phương thức thanh toán là COD, tạo vận đơn Viettel Post
      if (createOrderDto.paymentMethod === PaymentMethod.COD) {
        this.logger.log(`Payment method is COD for order ${createdOrder._id}. Creating ViettelPost shipment.`);
        try {
          await this.createViettelPostShipment(createdOrder);
        } catch (error) {
          this.logger.error(`Error creating ViettelPost shipment: ${error.message}`, error.stack);
          // Không throw lỗi ở đây, vẫn trả về đơn hàng đã tạo
          // Admin có thể tạo vận đơn sau bằng API riêng
        }
      }

      return createdOrder;
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm tất cả đơn hàng với phân trang và lọc
   */
  async findAll(queryDto: QueryOrderDto): Promise<PaginatedOrdersResponseDto> {
    try {
      const {
        userId,
        orderNumber,
        status,
        paymentMethod,
        paymentStatus,
        trackingCode,
        search,
        fromDate,
        toDate,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryDto;

      // Xây dựng query
      const query: any = {};

      if (userId) {
        query.userId = new Types.ObjectId(userId);
      }

      if (orderNumber) {
        query.orderNumber = orderNumber;
      }

      if (status) {
        query.status = status;
      }

      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }

      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      if (trackingCode) {
        query.trackingCode = trackingCode;
      }

      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
          { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        ];
      }

      if (fromDate) {
        query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
      }

      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        query.createdAt = { ...query.createdAt, $lte: toDateObj };
      }

      // Tính toán skip
      const skip = (page - 1) * limit;

      // Tạo sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Đếm tổng số đơn hàng thỏa mãn điều kiện
      const total = await this.orderModel.countDocuments(query);

      // Lấy danh sách đơn hàng
      const orders = await this.orderModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean();

      // Định dạng kết quả trả về
      const formattedOrders = orders.map(order => ({
        ...order,
        userName: order.userId ? (order.userId as any).name : null,
        userEmail: order.userId ? (order.userId as any).email : null,
        createdAt: (order as any).createdAt || new Date(),
        updatedAt: (order as any).updatedAt || new Date()
      }));

      return {
        data: formattedOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error finding orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm đơn hàng theo ID
   */
  async findOne(id: string): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid order ID: ${id}`);
      }

      const order = await this.orderModel
        .findById(id)
        .populate('userId', 'name email')
        .exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return order;
    } catch (error) {
      this.logger.error(`Error finding order by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm đơn hàng theo mã đơn hàng
   */
  async findByOrderNumber(orderNumber: string): Promise<OrderDocument> {
    try {
      const order = await this.orderModel
        .findOne({ orderNumber })
        .populate('userId', 'name email')
        .exec();

      if (!order) {
        throw new NotFoundException(`Order with number ${orderNumber} not found`);
      }

      return order;
    } catch (error) {
      this.logger.error(`Error finding order by number: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm đơn hàng của một người dùng
   */
  async findUserOrders(userId: string, queryDto: QueryOrderDto): Promise<PaginatedOrdersResponseDto> {
    try {
      return this.findAll({ ...queryDto, userId });
    } catch (error) {
      this.logger.error(`Error finding user orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật đơn hàng
   */
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid order ID: ${id}`);
      }

      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Cập nhật thông tin đơn hàng
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(id, updateOrderDto, { new: true })
        .exec();

      // Nếu có cập nhật trạng thái, cập nhật lịch sử theo dõi
      if (updateOrderDto.status && updateOrderDto.status !== order.status) {
        await this.updateOrderTracking(id, updateOrderDto.status, updateOrderDto.updatedBy);
      }

      if (!updatedOrder) {
        throw new NotFoundException(`Order with ID ${id} not found after update`);
      }

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error updating order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateStatus(id: string, status: OrderStatus, updatedBy?: string): Promise<OrderDocument> {
    try {
      return this.update(id, { status, updatedBy });
    } catch (error) {
      this.logger.error(`Error updating order status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(id: string, reason: string, updatedBy?: string): Promise<OrderDocument> {
    try {
      const order = await this.findOne(id);

      // Kiểm tra xem đơn hàng có thể hủy không
      if (
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.RETURNED
      ) {
        throw new BadRequestException(`Cannot cancel order with status ${order.status}`);
      }

      // Cập nhật trạng thái đơn hàng
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          id,
          {
            status: OrderStatus.CANCELLED,
            'metadata.cancelReason': reason,
            'metadata.cancelledAt': new Date(),
            'metadata.cancelledBy': updatedBy,
          },
          { new: true }
        )
        .exec();

      // Cập nhật lịch sử theo dõi
      await this.updateOrderTracking(
        id,
        OrderStatus.CANCELLED,
        updatedBy,
        `Đơn hàng đã bị hủy. Lý do: ${reason}`
      );

      if (!updatedOrder) {
        throw new NotFoundException(`Order with ID ${id} not found after cancel`);
      }

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Xóa đơn hàng (chỉ dành cho admin và chỉ xóa được đơn hàng đã hủy)
   */
  async remove(id: string): Promise<{ deleted: boolean }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid order ID: ${id}`);
      }

      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Chỉ cho phép xóa đơn hàng đã hủy
      if (order.status !== OrderStatus.CANCELLED) {
        throw new BadRequestException(`Cannot delete order with status ${order.status}. Only cancelled orders can be deleted.`);
      }

      // Xóa đơn hàng
      await this.orderModel.deleteOne({ _id: id }).exec();

      // Xóa thông tin theo dõi đơn hàng
      await this.orderTrackingModel.deleteOne({ orderId: id }).exec();

      return { deleted: true };
    } catch (error) {
      this.logger.error(`Error removing order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin theo dõi đơn hàng
   */
  private async updateOrderTracking(
    orderId: string,
    status: OrderStatus,
    updatedBy?: string,
    description?: string
  ): Promise<void> {
    try {
      const historyItem = {
        status,
        description: description || this.getStatusDescription(status),
        timestamp: new Date(),
        updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
      };

      await this.orderTrackingModel.findOneAndUpdate(
        { orderId },
        {
          status,
          $push: { history: historyItem },
        },
        { new: true, upsert: true }
      ).exec();
    } catch (error) {
      this.logger.error(`Error updating order tracking: ${error.message}`, error.stack);
      // Không throw lỗi ở đây để không ảnh hưởng đến luồng chính
    }
  }

  /**
   * Lấy mô tả cho trạng thái đơn hàng
   */
  private getStatusDescription(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Đơn hàng đã được tạo';
      case OrderStatus.CONFIRMED:
        return 'Đơn hàng đã được xác nhận';
      case OrderStatus.PROCESSING:
        return 'Đơn hàng đang được xử lý';
      case OrderStatus.SHIPPING:
        return 'Đơn hàng đang được vận chuyển';
      case OrderStatus.DELIVERED:
        return 'Đơn hàng đã được giao thành công';
      case OrderStatus.CANCELLED:
        return 'Đơn hàng đã bị hủy';
      case OrderStatus.RETURNED:
        return 'Đơn hàng đã được trả lại';
      default:
        return 'Cập nhật trạng thái đơn hàng';
    }
  }

  /**
   * Tạo mã đơn hàng duy nhất
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `YM${year}${month}${day}${random}`;
  }

  /**
   * Lấy thông tin theo dõi đơn hàng
   */
  async getOrderTracking(orderId: string): Promise<OrderTrackingDocument> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        throw new NotFoundException(`Invalid order ID: ${orderId}`);
      }

      const tracking = await this.orderTrackingModel.findOne({ orderId }).exec();

      if (!tracking) {
        throw new NotFoundException(`Tracking information for order ${orderId} not found`);
      }

      return tracking;
    } catch (error) {
      this.logger.error(`Error getting order tracking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết vận đơn từ Viettel Post
   */
  async getViettelPostTrackingInfo(trackingCode: string): Promise<any> {
    try {
      if (!trackingCode) {
        throw new BadRequestException('Tracking code is required');
      }

      this.logger.log(`Getting tracking information for tracking code: ${trackingCode}`);

      const trackingInfo = await this.viettelPostService.getOrderInfo(trackingCode);

      if (!trackingInfo) {
        throw new NotFoundException(`Tracking information for code ${trackingCode} not found`);
      }

      return trackingInfo;
    } catch (error) {
      this.logger.error(`Error getting ViettelPost tracking info: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tính phí vận chuyển
   */
  async calculateShippingFee(calculateShippingDto: CalculateShippingDto): Promise<ShippingFeeResponseDto> {
    try {
      this.logger.log(`Calculating shipping fee for order value: ${calculateShippingDto.orderValue}`);

      const { shippingAddress, productInfo, orderValue, serviceCode } = calculateShippingDto;

      // Lấy thông tin cửa hàng từ config
      const storeWardCode = this.configService.get<string>('STORE_WARD_CODE') || '00001';
      const storeDistrictCode = this.configService.get<string>('STORE_DISTRICT_CODE') || '001';
      const storeProvinceCode = this.configService.get<string>('STORE_PROVINCE_CODE') || '01';

      // Chuẩn bị payload cho Viettel Post
      const payload = {
        PRODUCT_WEIGHT: productInfo.weight,
        PRODUCT_LENGTH: productInfo.length,
        PRODUCT_WIDTH: productInfo.width,
        PRODUCT_HEIGHT: productInfo.height,
        MONEY_COLLECTION: orderValue,
        ORDER_SERVICE: serviceCode,
        SENDER_WARD: storeWardCode,
        SENDER_DISTRICT: storeDistrictCode,
        SENDER_PROVINCE: storeProvinceCode,
        RECEIVER_WARD: shippingAddress.wardCode,
        RECEIVER_DISTRICT: shippingAddress.districtCode,
        RECEIVER_PROVINCE: shippingAddress.provinceCode,
        PRODUCT_QUANTITY: productInfo.quantity,
      };

      try {
        // Gọi API Viettel Post để tính phí vận chuyển
        const result = await this.viettelPostService.calculateShippingFee(payload);

        if (!result) {
          return {
            success: false,
            fee: 0,
            error: 'Không thể tính phí vận chuyển. Vui lòng thử lại sau.'
          };
        }

        // Xử lý kết quả trả về
        if (Array.isArray(result)) {
          // Nếu kết quả là một mảng các dịch vụ
          const services = result.map(service => ({
            serviceCode: service.MA_DV_CHINH,
            serviceName: service.TEN_DICHVU,
            fee: service.GIA_CUOC,
            estimatedDeliveryTime: service.THOI_GIAN
          }));

          // Tìm dịch vụ được chỉ định hoặc dịch vụ đầu tiên
          const selectedService = serviceCode
            ? services.find(s => s.serviceCode === serviceCode)
            : services[0];

          if (selectedService) {
            return {
              success: true,
              fee: selectedService.fee,
              estimatedDeliveryTime: selectedService.estimatedDeliveryTime,
              availableServices: services
            };
          } else {
            return {
              success: true,
              fee: services[0].fee,
              estimatedDeliveryTime: services[0].estimatedDeliveryTime,
              availableServices: services,
              error: 'Dịch vụ được chỉ định không khả dụng. Đã chọn dịch vụ mặc định.'
            };
          }
        } else if (typeof result === 'object' && result.TOTAL_CUOC) {
          // Nếu kết quả là một đối tượng có phí vận chuyển
          return {
            success: true,
            fee: result.TOTAL_CUOC,
            estimatedDeliveryTime: result.THOI_GIAN || 'Dự kiến 2-3 ngày'
          };
        } else {
          // Trường hợp không xác định
          return {
            success: false,
            fee: 0,
            error: 'Không thể tính phí vận chuyển. Định dạng kết quả không hợp lệ.'
          };
        }
      } catch (error) {
        this.logger.error(`Error calculating shipping fee: ${error.message}`, error.stack);
        return {
          success: false,
          fee: 0,
          error: `Không thể tính phí vận chuyển: ${error.message}`
        };
      }
    } catch (error) {
      this.logger.error(`Error in calculateShippingFee: ${error.message}`, error.stack);
      return {
        success: false,
        fee: 0,
        error: `Lỗi hệ thống: ${error.message}`
      };
    }
  }

  /**
   * Tạo vận đơn Viettel Post cho đơn hàng
   */
  async createViettelPostShipment(order: OrderDocument): Promise<any> {
    try {
      this.logger.log(`Creating ViettelPost shipment for order ${order._id}`);

      // Kiểm tra xem đơn hàng đã có mã vận đơn chưa
      if (order.trackingCode) {
        throw new BadRequestException(`Order ${order._id} already has tracking code: ${order.trackingCode}`);
      }

      // Chuẩn bị dữ liệu cho Viettel Post
      const viettelPostPayload = this.prepareViettelPostPayload(order);

      // Gọi API Viettel Post để tạo vận đơn
      const shipmentResult = await this.viettelPostService.createShipmentOrder(viettelPostPayload);
      this.logger.log(`ViettelPost shipment created for order ${order._id}. Result: ${JSON.stringify(shipmentResult)}`);

      // Kiểm tra kết quả từ Viettel Post
      if (!shipmentResult || !shipmentResult.ORDER_NUMBER) {
        throw new BadRequestException('Failed to create ViettelPost shipment. Invalid response from ViettelPost API.');
      }

      // Cập nhật thông tin đơn hàng với mã vận đơn
      const updatedOrder = await this.orderModel.findByIdAndUpdate(
        order._id,
        {
          trackingCode: shipmentResult.ORDER_NUMBER,
          status: OrderStatus.PROCESSING,
          'metadata.viettelPost': {
            orderNumber: shipmentResult.ORDER_NUMBER,
            createdAt: new Date(),
            details: shipmentResult,
          },
        },
        { new: true }
      ).exec();

      // Cập nhật thông tin theo dõi đơn hàng
      await this.orderTrackingModel.findOneAndUpdate(
        { orderId: order._id },
        {
          status: OrderStatus.PROCESSING,
          trackingCode: shipmentResult.ORDER_NUMBER,
          carrier: {
            name: 'ViettelPost',
            trackingNumber: shipmentResult.ORDER_NUMBER,
            trackingUrl: `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/${shipmentResult.ORDER_NUMBER}`,
          },
          details: shipmentResult,
          $push: {
            history: {
              status: OrderStatus.PROCESSING,
              description: 'Đơn hàng đã được xử lý và tạo vận đơn',
              timestamp: new Date(),
            },
          },
        },
        { new: true, upsert: true }
      ).exec();

      return {
        success: true,
        trackingCode: shipmentResult.ORDER_NUMBER,
        order: updatedOrder,
      };
    } catch (error) {
      this.logger.error(`Error creating ViettelPost shipment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Chuẩn bị dữ liệu cho Viettel Post
   */
  private prepareViettelPostPayload(order: OrderDocument): any {
    // Lấy thông tin cửa hàng từ config
    const storeName = this.configService.get<string>('STORE_NAME') || 'Yumin Beauty';
    const storeAddress = this.configService.get<string>('STORE_ADDRESS') || 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội';
    const storePhone = this.configService.get<string>('STORE_PHONE') || '0987654321';
    const storeWardCode = this.configService.get<string>('STORE_WARD_CODE') || '00001';
    const storeDistrictCode = this.configService.get<string>('STORE_DISTRICT_CODE') || '001';
    const storeProvinceCode = this.configService.get<string>('STORE_PROVINCE_CODE') || '01';

    // Tính tổng số lượng sản phẩm
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Tạo mô tả sản phẩm
    const productDescription = order.items.map(item => `${item.name} x${item.quantity}`).join(', ');

    // Tạo payload cho Viettel Post
    return {
      ORDER_NUMBER: (order._id as Types.ObjectId).toString(),
      SENDER_FULLNAME: storeName,
      SENDER_ADDRESS: storeAddress,
      SENDER_PHONE: storePhone,
      SENDER_WARD: storeWardCode,
      SENDER_DISTRICT: storeDistrictCode,
      SENDER_PROVINCE: storeProvinceCode,
      RECEIVER_FULLNAME: order.shippingAddress.fullName,
      RECEIVER_ADDRESS: order.shippingAddress.addressLine1 + (order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''),
      RECEIVER_PHONE: order.shippingAddress.phone,
      RECEIVER_WARD: order.shippingAddress.wardCode || '',
      RECEIVER_DISTRICT: order.shippingAddress.districtCode || '',
      RECEIVER_PROVINCE: order.shippingAddress.provinceCode || '',
      PRODUCT_NAME: productDescription,
      PRODUCT_DESCRIPTION: productDescription,
      PRODUCT_QUANTITY: totalQuantity,
      PRODUCT_PRICE: order.finalPrice,
      MONEY_COLLECTION: order.paymentMethod === PaymentMethod.COD ? order.finalPrice : 0,
      MONEY_TOTALFEE: 0, // Phí vận chuyển sẽ được Viettel Post tính
      MONEY_FEECOD: 0,
      MONEY_FEEVAS: 0,
      MONEY_FEEINSURRANCE: 0,
      MONEY_FEE: 0,
      MONEY_FEEOTHER: 0,
      MONEY_TOTALVAT: 0,
      MONEY_TOTAL: order.finalPrice,
      PRODUCT_WEIGHT: 500, // Ước tính trọng lượng (gram)
      PRODUCT_LENGTH: 20, // Ước tính kích thước (cm)
      PRODUCT_WIDTH: 15,
      PRODUCT_HEIGHT: 10,
      ORDER_PAYMENT: order.paymentMethod === PaymentMethod.COD ? 1 : 2, // 1: COD, 2: Đã thanh toán
      ORDER_SERVICE: 'LCOD', // Dịch vụ vận chuyển
      ORDER_SERVICE_ADD: '',
      ORDER_NOTE: order.notes || '',
      MONEY_VOUCHER: order.voucher ? order.voucher.discountAmount : 0,
    };
  }

}
