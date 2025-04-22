import { Injectable, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentMethod, PaymentStatus } from './schemas/order.schema';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema'; // Import Branch schema
import { Product, ProductDocument } from '../products/schemas/product.schema'; // Import Product schema
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
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderTracking.name) private orderTrackingModel: Model<OrderTrackingDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>, // Inject BranchModel
    @InjectModel(Product.name) private productModel: Model<ProductDocument>, // Inject ProductModel
    private readonly viettelPostService: ViettelPostService,
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
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

      // Giảm số lượng sản phẩm trong kho
      await this.decreaseProductInventory(createOrderDto.items);

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
   * Giảm số lượng sản phẩm trong kho
   */
  private async decreaseProductInventory(items: any[]): Promise<void> {
    try {
      this.logger.log('Decreasing product inventory for order items');

      // Lấy thông tin chi nhánh mặc định (có thể lấy từ config hoặc cố định)
      const defaultBranchId = this.configService.get<string>('DEFAULT_BRANCH_ID') || '65a4e4c2a8a4e3c9ab9d1234'; // ID chi nhánh mặc định

      // Xử lý từng sản phẩm trong đơn hàng
      for (const item of items) {
        try {
          const { productId, variantId, quantity } = item;

          // Lấy thông tin sản phẩm
          const product = await this.productsService.findOne(productId);
          if (!product) {
            this.logger.warn(`Product not found: ${productId}`);
            continue;
          }

          if (variantId) {
            // Nếu có variantId, giảm số lượng của biến thể
            try {
              // Kiểm tra variantId có hợp lệ không (phải là chuỗi 24 ký tự hex)
              if (!variantId.match(/^[0-9a-fA-F]{24}$/)) {
                this.logger.warn(`Invalid variantId format: ${variantId}. Skipping inventory update.`);
                continue;
              }

              // Tìm kiếm inventory của biến thể trong chi nhánh
              let currentQuantity = 0;

              // Tìm trong variantInventory của sản phẩm
              if (product['variantInventory']) {
                const variantInventory = product['variantInventory'].find(
                  (inv: any) => inv.branchId.toString() === defaultBranchId && inv.variantId.toString() === variantId
                );

                if (variantInventory) {
                  currentQuantity = variantInventory.quantity || 0;
                  this.logger.log(`Found variant inventory: Product ${productId}, Variant ${variantId}, Current quantity: ${currentQuantity}`);
                }
              }

              // Tính toán số lượng mới
              const newQuantity = Math.max(0, currentQuantity - quantity);

              // Cập nhật số lượng biến thể
              await this.productsService.updateVariantInventory(
                productId,
                defaultBranchId,
                variantId,
                newQuantity
              );

              this.logger.log(`Decreased variant inventory: Product ${productId}, Variant ${variantId}, From ${currentQuantity} to ${newQuantity}`);
            } catch (variantError) {
              this.logger.error(`Error updating variant inventory: ${variantError.message}`, variantError.stack);
            }
          } else {
            // Nếu không có variantId, giảm số lượng của sản phẩm
            try {
              // Tìm kiếm inventory của sản phẩm trong chi nhánh
              let currentQuantity = 0;

              // Tìm trong inventory của sản phẩm
              if (product['inventory']) {
                const productInventory = product['inventory'].find(
                  (inv: any) => inv.branchId.toString() === defaultBranchId
                );

                if (productInventory) {
                  currentQuantity = productInventory.quantity || 0;
                  this.logger.log(`Found product inventory: Product ${productId}, Current quantity: ${currentQuantity}`);
                }
              }

              // Tính toán số lượng mới
              const newQuantity = Math.max(0, currentQuantity - quantity);

              // Cập nhật số lượng sản phẩm
              await this.productsService.updateInventory(
                productId,
                defaultBranchId,
                newQuantity
              );

              this.logger.log(`Decreased product inventory: Product ${productId}, From ${currentQuantity} to ${newQuantity}`);
            } catch (productError) {
              this.logger.error(`Error updating product inventory: ${productError.message}`, productError.stack);
            }
          }
        } catch (itemError) {
          // Ghi log lỗi nhưng không dừng quá trình
          this.logger.error(`Error decreasing inventory for item ${item.productId}: ${itemError.message}`, itemError.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error in decreaseProductInventory: ${error.message}`, error.stack);
      // Không throw lỗi để không ảnh hưởng đến quá trình tạo đơn hàng
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

      // Log thông tin địa chỉ gốc từ order
      this.logger.debug('Original shipping address from order:', {
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        addressLine1: order.shippingAddress.addressLine1,
        provinceCode: order.shippingAddress.provinceCode,
        districtCode: order.shippingAddress.districtCode,
        wardCode: order.shippingAddress.wardCode
      });

      // Kiểm tra xem đơn hàng đã có mã vận đơn chưa
      if (order.trackingCode) {
        throw new BadRequestException(`Order ${order._id} already has tracking code: ${order.trackingCode}`);
      }

      // Kiểm tra số điện thoại người nhận
      if (!order.shippingAddress.phone) {
        this.logger.error('Receiver phone number is missing', { shippingAddress: order.shippingAddress });
        throw new BadRequestException('Receiver phone number is required for shipping');
      }

      // Kiểm tra định dạng số điện thoại
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(order.shippingAddress.phone)) {
        this.logger.error('Invalid receiver phone number format', { phone: order.shippingAddress.phone });
        throw new BadRequestException('Receiver phone number must be 10-11 digits');
      }

      // Chuẩn bị dữ liệu cho Viettel Post
      const viettelPostPayload = await this.prepareViettelPostPayload(order);

      // Kiểm tra payload trước khi gọi API
      this.logger.debug('ViettelPost payload prepared:', {
        payload: viettelPostPayload,
        receiverPhone: viettelPostPayload.RECEIVER_PHONE,
        senderPhone: viettelPostPayload.SENDER_PHONE
      });

      if (!viettelPostPayload || Object.keys(viettelPostPayload).length === 0) {
        this.logger.error('ViettelPost payload is empty');
        throw new BadRequestException('Failed to prepare ViettelPost payload');
      }

      // Gọi API Viettel Post để tạo vận đơn
      const shipmentResult = await this.viettelPostService.createShipmentOrder(viettelPostPayload);
      this.logger.log(`ViettelPost shipment created for order ${order._id}. Result: ${JSON.stringify(shipmentResult)}`);

      // Log chi tiết về kết quả COD
      this.logger.debug('ViettelPost COD result details:', {
        orderPaymentMethod: order.paymentMethod,
        isCOD: order.paymentMethod === PaymentMethod.COD,
        moneyCollection: shipmentResult.MONEY_COLLECTION,
        moneyTotal: shipmentResult.MONEY_TOTAL,
        moneyTotalFee: shipmentResult.MONEY_TOTAL_FEE,
        moneyFee: shipmentResult.MONEY_FEE,
        moneyCollectionFee: shipmentResult.MONEY_COLLECTION_FEE,
        moneyVat: shipmentResult.MONEY_VAT,
        orderNumber: shipmentResult.ORDER_NUMBER,
        fullResponse: shipmentResult
      });

      // Kiểm tra kết quả từ Viettel Post
      if (!shipmentResult || !shipmentResult.ORDER_NUMBER) {
        throw new BadRequestException('Failed to create ViettelPost shipment. Invalid response from ViettelPost API.');
      }

      // Xử lý đặc biệt cho COD
      let updateData: any = {
        trackingCode: shipmentResult.ORDER_NUMBER,
        status: OrderStatus.PROCESSING,
        'metadata.viettelPost': {
          orderNumber: shipmentResult.ORDER_NUMBER,
          createdAt: new Date(),
          details: shipmentResult,
        },
      };

      // Nếu là đơn hàng COD nhưng Viettel Post trả về MONEY_COLLECTION = 0
      if (order.paymentMethod === PaymentMethod.COD && shipmentResult.MONEY_COLLECTION === 0) {
        this.logger.warn(`ViettelPost returned MONEY_COLLECTION=0 for COD order ${order._id}. Trying to fix...`);

        // Cập nhật thông tin COD trong metadata
        updateData['metadata.codInfo'] = {
          isCOD: true,
          moneyCollection: order.finalPrice,
          viettelPostMoneyCollection: 0,
          fixedManually: true,
          fixedAt: new Date()
        };
      }

      // Cập nhật thông tin đơn hàng với mã vận đơn
      const updatedOrder = await this.orderModel.findByIdAndUpdate(
        order._id,
        updateData,
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
  private async prepareViettelPostPayload(order: OrderDocument): Promise<any> { // Make function async
    // Kiểm tra xem đơn hàng có branchId không
    if (!order.branchId) {
      this.logger.error(`Order ${order._id} does not have a branchId assigned.`);
      throw new InternalServerErrorException(`Order ${order._id} is missing branch assignment.`);
    }

    // Lấy thông tin chi tiết về sản phẩm từ database để có thông tin trọng lượng chính xác
    const productIds = order.items.map(item => new Types.ObjectId(item.productId));

    // Truy vấn sản phẩm từ database
    const products = await this.productModel.find({ _id: { $in: productIds } })
      .select('_id name cosmetic_info.volume')
      .lean()
      .exec();

    // Tạo map để dễ dàng truy cập thông tin sản phẩm
    const productMap = new Map<string, any>();
    products.forEach((product: any) => {
      productMap.set(product._id.toString(), product);
    });

    // Log thông tin sản phẩm đã tìm thấy
    this.logger.debug(`Found ${products.length} products for weight calculation:`, {
      productIds: productIds.map(id => id.toString()),
      foundProducts: products.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        volume: p.cosmetic_info?.volume
      }))
    });

    // Lấy thông tin chi nhánh từ branchId
    const branch = await this.branchModel.findById(order.branchId).exec();
    if (!branch) {
      this.logger.error(`Branch with ID ${order.branchId} not found for order ${order._id}.`);
      throw new NotFoundException(`Branch with ID ${order.branchId} not found.`);
    }

    // Kiểm tra xem chi nhánh có đủ thông tin mã địa chỉ ViettelPost không
    if (!branch.wardCode || !branch.districtCode || !branch.provinceCode) {
      this.logger.error(`Branch ${branch.name} (ID: ${branch._id}) is missing ViettelPost address codes.`);
      throw new InternalServerErrorException(`Branch ${branch.name} is missing required ViettelPost address codes.`);
    }

    // Lấy thông tin chi nhánh gửi hàng
    const storeName = branch.name;
    const storeAddress = branch.address;
    const storePhone = branch.contact || this.configService.get<string>('STORE_DEFAULT_PHONE') || '0987654321'; // Use branch contact or a default
    const storeWardCode = branch.wardCode;
    const storeDistrictCode = branch.districtCode;
    const storeProvinceCode = branch.provinceCode;

    // Kiểm tra mã địa chỉ người nhận (giữ nguyên)
    this.logger.debug('Checking receiver address codes:', {
      shippingAddress: order.shippingAddress,
      wardCode: order.shippingAddress.wardCode,
      districtCode: order.shippingAddress.districtCode,
      provinceCode: order.shippingAddress.provinceCode
    });

    if (!order.shippingAddress.wardCode || !order.shippingAddress.districtCode || !order.shippingAddress.provinceCode) {
      this.logger.error('Receiver address codes are missing', {
        wardCode: order.shippingAddress.wardCode,
        districtCode: order.shippingAddress.districtCode,
        provinceCode: order.shippingAddress.provinceCode,
        fullAddress: order.shippingAddress
      });
      throw new Error('Receiver address codes are required for shipping');
    }

    // Tính tổng số lượng và trọng lượng sản phẩm
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Tính trọng lượng dựa trên sản phẩm thực tế
    const totalWeight = order.items.reduce((sum, item) => {
      // Lấy thông tin sản phẩm từ map
      const product = productMap.get(item.productId.toString());

      // Lấy trọng lượng từ cosmetic_info.volume.value nếu có
      let itemWeight = 200; // Giá trị mặc định 200g

      if (product && product.cosmetic_info && product.cosmetic_info.volume) {
        // Nếu có thông tin trọng lượng trong sản phẩm, sử dụng nó
        itemWeight = product.cosmetic_info.volume.value || 200;

        // Log thông tin trọng lượng sản phẩm
        this.logger.debug(`Using product weight for ${product.name}: ${itemWeight}${product.cosmetic_info.volume.unit || 'g'}`);
      } else {
        // Nếu không có thông tin trọng lượng trong sản phẩm, thử lấy từ metadata của item
        const metadataWeight = (item as any).metadata?.weight;
        if (metadataWeight) {
          itemWeight = metadataWeight;
          this.logger.debug(`Using metadata weight for item ${item.name}: ${itemWeight}g`);
        } else {
          this.logger.debug(`Using default weight for item ${item.name}: ${itemWeight}g`);
        }
      }

      return sum + (item.quantity * itemWeight);
    }, 0);

    // Tạo mô tả sản phẩm
    const productDescription = order.items.map(item => `${item.name} x${item.quantity}`).join(', ');

    // Định dạng lại số điện thoại
    let receiverPhone = order.shippingAddress.phone;
    // Loại bỏ các ký tự không phải số
    receiverPhone = receiverPhone ? receiverPhone.replace(/[^0-9]/g, '') : '';
    // Thêm dấu chấm và dấu cách theo định dạng của ViettelPost (ví dụ: 0967.363.789)
    if (receiverPhone.length === 10) {
      receiverPhone = `${receiverPhone.substring(0, 4)}.${receiverPhone.substring(4, 7)}.${receiverPhone.substring(7)}`;
    }

    // Định dạng lại số điện thoại của người gửi
    let senderPhone = storePhone;
    // Loại bỏ các ký tự không phải số
    senderPhone = senderPhone ? senderPhone.replace(/[^0-9]/g, '') : '';
    // Thêm dấu chấm và dấu cách theo định dạng của ViettelPost (ví dụ: 0967.363.789)
    if (senderPhone.length === 10) {
      senderPhone = `${senderPhone.substring(0, 4)}.${senderPhone.substring(4, 7)}.${senderPhone.substring(7)}`;
    }

    // Đảm bảo số điện thoại có ít nhất 10 chữ số
    if (receiverPhone.replace(/[^0-9]/g, '').length < 10) {
      this.logger.error('Receiver phone number is too short after formatting', {
        originalPhone: order.shippingAddress.phone,
        formattedPhone: receiverPhone
      });
      throw new Error('Receiver phone number must have at least 10 digits');
    }

    this.logger.debug('Formatted phone numbers:', {
      originalReceiverPhone: order.shippingAddress.phone,
      formattedReceiverPhone: receiverPhone,
      originalSenderPhone: storePhone,
      formattedSenderPhone: senderPhone
    });

    // Sử dụng các mã địa chỉ mặc định đã được xác nhận hoạt động với ViettelPost
    // Ghi log các mã địa chỉ gốc
    this.logger.debug('Original address codes:', {
      storeWardCode,
      storeDistrictCode,
      storeProvinceCode,
      receiverWardCode: order.shippingAddress.wardCode,
      receiverDistrictCode: order.shippingAddress.districtCode,
      receiverProvinceCode: order.shippingAddress.provinceCode
    });

    // Chuyển đổi mã địa chỉ (đã được chuẩn hóa thành ID dạng số của ViettelPost lưu dưới dạng string) sang kiểu số (number)
    const senderProvince = parseInt(storeProvinceCode, 10);
    const senderDistrict = parseInt(storeDistrictCode, 10);
    const senderWard = parseInt(storeWardCode, 10);
    const receiverProvince = parseInt(order.shippingAddress.provinceCode, 10);
    const receiverDistrict = parseInt(order.shippingAddress.districtCode, 10);
    const receiverWard = parseInt(order.shippingAddress.wardCode, 10);


    // Kiểm tra nếu chuyển đổi thất bại (NaN) - Phòng trường hợp dữ liệu chưa được chuẩn hóa
    if (isNaN(senderWard) || isNaN(senderDistrict) || isNaN(senderProvince) ||
        isNaN(receiverWard) || isNaN(receiverDistrict) || isNaN(receiverProvince)) {
      this.logger.error('Failed to parse standardized address codes to numbers. Data might not be standardized yet.', {
        storeWardCode, storeDistrictCode, storeProvinceCode,
        receiverWardCode: order.shippingAddress.wardCode,
        receiverDistrictCode: order.shippingAddress.districtCode,
        receiverProvinceCode: order.shippingAddress.provinceCode,
        parsed: { senderWard, senderDistrict, senderProvince, receiverWard, receiverDistrict, receiverProvince }
      });
      throw new Error('Invalid address code format. Ensure data is standardized to ViettelPost numeric IDs.');
    }

    // Sử dụng các mã địa chỉ thực tế từ đơn hàng và chi nhánh
    // Nếu các mã địa chỉ không hợp lệ, sử dụng giá trị mặc định
    const finalSenderWard = senderWard || 0; // Sử dụng mã phường/xã thực tế của chi nhánh hoặc giá trị mặc định
    const finalSenderDistrict = senderDistrict || 4; // Sử dụng mã quận/huyện thực tế của chi nhánh hoặc giá trị mặc định
    const finalSenderProvince = senderProvince || 1; // Sử dụng mã tỉnh/thành phố thực tế của chi nhánh hoặc giá trị mặc định

    const finalReceiverWard = receiverWard || 0; // Sử dụng mã phường/xã thực tế của người nhận hoặc giá trị mặc định
    const finalReceiverDistrict = receiverDistrict || 43; // Sử dụng mã quận/huyện thực tế của người nhận hoặc giá trị mặc định
    const finalReceiverProvince = receiverProvince || 2; // Sử dụng mã tỉnh/thành phố thực tế của người nhận hoặc giá trị mặc định

    this.logger.debug('Using hardcoded address codes for ViettelPost compatibility:', {
      originalSenderWard: senderWard,
      originalSenderDistrict: senderDistrict,
      originalSenderProvince: senderProvince,
      originalReceiverWard: receiverWard,
      originalReceiverDistrict: receiverDistrict,
      originalReceiverProvince: receiverProvince,
      finalSenderWard,
      finalSenderDistrict,
      finalSenderProvince,
      finalReceiverWard,
      finalReceiverDistrict,
      finalReceiverProvince
    });

    // Tạo payload cho Viettel Post
    const payload = {
      ORDER_NUMBER: (order._id as Types.ObjectId).toString(),
      // Bỏ qua các trường không cần thiết
      // GROUPADDRESS_ID: 5818802,
      // CUS_ID: 722,
      DELIVERY_DATE: new Date().toISOString().split('T')[0].split('-').reverse().join('/') + ' ' + new Date().toTimeString().split(' ')[0], // Định dạng ngày giờ theo ví dụ của ViettelPost (DD/MM/YYYY HH:MM:SS)
      SENDER_FULLNAME: storeName,
      SENDER_ADDRESS: storeAddress,
      SENDER_PHONE: senderPhone,
      SENDER_EMAIL: 'admin@yumin.vn', // Email mặc định cho người gửi
      SENDER_WARD: finalSenderWard,
      SENDER_DISTRICT: finalSenderDistrict,
      SENDER_PROVINCE: finalSenderProvince,
      RECEIVER_FULLNAME: order.shippingAddress.fullName,
      RECEIVER_ADDRESS: order.shippingAddress.addressLine1,
      RECEIVER_PHONE: receiverPhone,
      RECEIVER_EMAIL: 'customer@yumin.vn', // Email mặc định cho người nhận
      RECEIVER_WARD: finalReceiverWard,
      RECEIVER_DISTRICT: finalReceiverDistrict,
      RECEIVER_PROVINCE: finalReceiverProvince,
      PRODUCT_NAME: productDescription,
      PRODUCT_DESCRIPTION: productDescription,
      PRODUCT_QUANTITY: totalQuantity,
      PRODUCT_PRICE: order.finalPrice,
      PRODUCT_TYPE: 'HH', // Hàng hóa
      MONEY_COLLECTION: order.paymentMethod === PaymentMethod.COD ? order.finalPrice : 0, // Số tiền thu hộ (theo docs)
      // IS_COLLECTION: order.paymentMethod === PaymentMethod.COD ? 1 : 0, // Bỏ trường không có trong docs
      MONEY_TOTALFEE: order.shippingFee || 0, // Sử dụng phí vận chuyển từ đơn hàng
      MONEY_FEECOD: order.paymentMethod === PaymentMethod.COD ? Math.round((order.finalPrice || 0) * 0.01) : 0, // Phí thu hộ (theo docs, có thể cần xác nhận lại công thức tính)
      // MONEY_COLLECTION_FEE: order.paymentMethod === PaymentMethod.COD ? Math.round((order.finalPrice || 0) * 0.01) : 0, // Bỏ trường không có trong docs
      MONEY_FEEVAS: 0,
      MONEY_FEEINSURRANCE: 0, // Sửa tên trường theo docs (INSURANCE -> INSURRANCE có vẻ là lỗi typo trong docs?)
      MONEY_FEE: order.shippingFee || 0, // Sử dụng phí vận chuyển từ đơn hàng
      MONEY_FEEOTHER: 0,
      MONEY_TOTALVAT: Math.round((order.shippingFee || 0) * 0.08), // VAT 8% cho phí vận chuyển
      MONEY_TOTAL: order.finalPrice, // Sử dụng tổng tiền từ đơn hàng
      PRODUCT_WEIGHT: totalWeight || 40000, // Sử dụng trọng lượng thực tế hoặc giá trị mặc định
      PRODUCT_LENGTH: 38,
      PRODUCT_WIDTH: 24,
      PRODUCT_HEIGHT: 25,
      ORDER_PAYMENT: order.paymentMethod === PaymentMethod.COD ? 3 : 1, // Sửa theo docs: 3: Thu tiền hàng (COD), 1: Không thu tiền
      ORDER_SERVICE: order.paymentMethod === PaymentMethod.COD ? 'LCOD' : 'VCN', // LCOD: Dịch vụ chuyển phát tiêu chuẩn có thu hộ, VCN: Chuyển phát tiêu chuẩn
      // ORDER_SERVICE_CODE: order.paymentMethod === PaymentMethod.COD ? 'LCOD' : 'VCN', // Bỏ trường không có trong docs
      // PICK_MONEY: order.paymentMethod === PaymentMethod.COD ? 1 : 0, // Bỏ trường không có trong docs
      // COD_AMOUNT: order.paymentMethod === PaymentMethod.COD ? order.finalPrice : 0, // Bỏ trường không có trong docs
      // COD_FLAG: order.paymentMethod === PaymentMethod.COD ? 1 : 0, // Bỏ trường không có trong docs
      // AUTO_SELECT_COD: order.paymentMethod === PaymentMethod.COD ? 1 : 0, // Bỏ trường không có trong docs
      ORDER_SERVICE_ADD: '',
      ORDER_VOUCHER: '', // Giữ lại trường này theo ví dụ của ViettelPost
      ORDER_NOTE: order.notes || 'cho xem hàng, không cho thử', // Thêm ghi chú mặc định
      MONEY_VOUCHER: order.voucher ? order.voucher.discountAmount : 0, // Giả sử trường này đúng hoặc cần thiết
      LIST_ITEM: order.items.map(item => {
        // Lấy thông tin sản phẩm từ map
        const product = productMap.get(item.productId.toString());

        // Lấy trọng lượng từ cosmetic_info.volume.value nếu có
        let itemWeight = 200; // Giá trị mặc định 200g

        if (product && product.cosmetic_info && product.cosmetic_info.volume) {
          // Nếu có thông tin trọng lượng trong sản phẩm, sử dụng nó
          itemWeight = product.cosmetic_info.volume.value || 200;
        } else {
          // Nếu không có thông tin trọng lượng trong sản phẩm, thử lấy từ metadata của item
          const metadataWeight = (item as any).metadata?.weight;
          if (metadataWeight) {
            itemWeight = metadataWeight;
          }
        }

        return {
          PRODUCT_NAME: item.name,
          PRODUCT_PRICE: item.price,
          PRODUCT_WEIGHT: itemWeight,
          PRODUCT_QUANTITY: item.quantity
        };
      })
    };

    // Thêm thông tin debug về payload
    this.logger.debug('Final ViettelPost payload:', {
      payload,
      types: {
        ORDER_NUMBER: typeof payload.ORDER_NUMBER,
        SENDER_WARD: typeof payload.SENDER_WARD,
        SENDER_DISTRICT: typeof payload.SENDER_DISTRICT,
        SENDER_PROVINCE: typeof payload.SENDER_PROVINCE,
        RECEIVER_WARD: typeof payload.RECEIVER_WARD,
        RECEIVER_DISTRICT: typeof payload.RECEIVER_DISTRICT,
        RECEIVER_PROVINCE: typeof payload.RECEIVER_PROVINCE,
        PRODUCT_WEIGHT: typeof payload.PRODUCT_WEIGHT,
        PRODUCT_PRICE: typeof payload.PRODUCT_PRICE,
        MONEY_COLLECTION: typeof payload.MONEY_COLLECTION
      }
    });

    // Log chi tiết các trường liên quan đến COD theo docs
    this.logger.debug('COD-related fields (based on docs):', {
      paymentMethod: order.paymentMethod,
      ORDER_PAYMENT: payload.ORDER_PAYMENT,
      MONEY_COLLECTION: payload.MONEY_COLLECTION,
      ORDER_SERVICE: payload.ORDER_SERVICE,
      MONEY_FEECOD: payload.MONEY_FEECOD,
      finalPrice: order.finalPrice
    });

    return payload;
  }

}
