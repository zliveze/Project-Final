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
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class OrdersService {
  public readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderTracking.name) private orderTrackingModel: Model<OrderTrackingDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>, // Inject BranchModel
    @InjectModel(Product.name) private productModel: Model<ProductDocument>, // Inject ProductModel
    private readonly viettelPostService: ViettelPostService,
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    private readonly vouchersService: VouchersService,
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

      // Kiểm tra dịch vụ vận chuyển đã chọn
      if (!createOrderDto.shippingServiceCode) {
        this.logger.debug('No shipping service code provided, will use default service');
      }

      const createdOrder = await this.orderModel.create(orderData);
      this.logger.debug(`Order created successfully: ${createdOrder._id}`);

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
      await this.decreaseProductInventory(createOrderDto.items, createOrderDto.branchId);

      // Đánh dấu voucher đã được sử dụng nếu có
      if (createOrderDto.voucher && createOrderDto.voucher.voucherId && createOrderDto.voucher.code) {
        try {
          this.logger.debug(`Marking voucher ${createOrderDto.voucher.code} as used by user ${userId}`);
          this.logger.debug(`Voucher details: ${JSON.stringify(createOrderDto.voucher)}`);

          // Kiểm tra voucherId có đúng định dạng MongoDB ObjectId không
          if (!Types.ObjectId.isValid(createOrderDto.voucher.voucherId)) {
            this.logger.error(`Invalid voucher ID format: ${createOrderDto.voucher.voucherId}`);
          } else {
            // Kiểm tra voucher có tồn tại không trước khi đánh dấu đã sử dụng
            const voucher = await this.vouchersService.findOne(createOrderDto.voucher.voucherId).catch(error => {
              this.logger.error(`Error finding voucher: ${error.message}`);
              return null;
            });

            if (voucher) {
              await this.vouchersService.markVoucherAsUsed(createOrderDto.voucher.voucherId, userId);
              this.logger.debug(`Successfully marked voucher ${createOrderDto.voucher.code} as used by user ${userId}`);
            } else {
              this.logger.error(`Voucher with ID ${createOrderDto.voucher.voucherId} not found`);
            }
          }
        } catch (error) {
          this.logger.error(`Error marking voucher as used: ${error.message}`, error.stack);
          // Không throw lỗi ở đây, vẫn tiếp tục xử lý đơn hàng
        }
      } else {
        if (createOrderDto.voucher) {
          this.logger.debug(`Voucher information incomplete: ${JSON.stringify(createOrderDto.voucher)}`);

          // Nếu có mã voucher nhưng không có voucherId, thử tìm voucher theo mã
          if (createOrderDto.voucher.code && !createOrderDto.voucher.voucherId) {
            try {
              const voucher = await this.vouchersService.findByCode(createOrderDto.voucher.code);
              if (voucher) {
                this.logger.debug(`Found voucher by code: ${voucher._id}`);
                await this.vouchersService.markVoucherAsUsed(voucher._id.toString(), userId);
                this.logger.debug(`Successfully marked voucher ${createOrderDto.voucher.code} as used by user ${userId}`);
              }
            } catch (error) {
              this.logger.error(`Error finding voucher by code: ${error.message}`, error.stack);
            }
          }
        } else {
          this.logger.debug(`No voucher in the order for user ${userId}`);
        }
      }

      // Nếu phương thức thanh toán là COD, tạo vận đơn Viettel Post
      if (createOrderDto.paymentMethod === PaymentMethod.COD) {
        this.logger.debug(`Payment method is COD for order ${createdOrder._id}. Creating ViettelPost shipment.`);
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
   * Cập nhật trạng thái thanh toán của đơn hàng
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid order ID: ${id}`);
      }

      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Cập nhật trạng thái thanh toán
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          id,
          {
            paymentStatus,
            'metadata.paymentUpdatedAt': new Date(),
          },
          { new: true }
        )
        .exec();

      this.logger.log(`Updated payment status for order ${id} to ${paymentStatus}`);

      // Nếu thanh toán thành công và đơn hàng đang ở trạng thái chờ xử lý, cập nhật trạng thái đơn hàng
      if (paymentStatus === PaymentStatus.PAID && order.status === OrderStatus.PENDING) {
        await this.updateStatus(id, OrderStatus.CONFIRMED);
      }

      return updatedOrder as OrderDocument;
    } catch (error) {
      this.logger.error(`Error updating payment status: ${error.message}`, error.stack);
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

      this.logger.debug(`Getting tracking information for tracking code: ${trackingCode}`);

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
  private async decreaseProductInventory(items: any[], orderBranchId?: string): Promise<void> {
    try {
      this.logger.debug('Decreasing product inventory for order items');

      // Lấy thông tin chi nhánh mặc định (chỉ sử dụng khi không có selectedBranchId trong options)
      const defaultBranchId = this.configService.get<string>('DEFAULT_BRANCH_ID') || '65a4e4c2a8a4e3c9ab9d1234'; // ID chi nhánh mặc định

      // Xử lý từng sản phẩm trong đơn hàng
      for (const item of items) {
        try {
          const { productId, variantId, quantity, options } = item;

          // Lấy thông tin chi nhánh từ options hoặc sử dụng chi nhánh mặc định
          // Kiểm tra cấu trúc dữ liệu của options
          this.logger.debug(`Options data: ${JSON.stringify(options)}`);

          // Tìm kiếm selectedBranchId trong các vị trí khác nhau
          let branchId = orderBranchId || defaultBranchId;

          if (options?.selectedOptions?.selectedBranchId) {
            branchId = options.selectedOptions.selectedBranchId;
            this.logger.debug(`Found branchId in options.selectedOptions.selectedBranchId: ${branchId}`);
          } else if (options?.selectedBranchId) {
            branchId = options.selectedBranchId;
            this.logger.debug(`Found branchId in options.selectedBranchId: ${branchId}`);
          } else if (typeof options === 'object' && options !== null) {
            // Kiểm tra xem options có chứa selectedBranchId không
            const keys = Object.keys(options);
            for (const key of keys) {
              if (key === 'selectedBranchId') {
                branchId = options[key];
                this.logger.debug(`Found branchId directly in options.${key}: ${branchId}`);
                break;
              } else if (typeof options[key] === 'object' && options[key] !== null) {
                // Kiểm tra các object con
                const subKeys = Object.keys(options[key]);
                for (const subKey of subKeys) {
                  if (subKey === 'selectedBranchId') {
                    branchId = options[key][subKey];
                    this.logger.debug(`Found branchId in options.${key}.${subKey}: ${branchId}`);
                    break;
                  }
                }
              }
            }
          }
          this.logger.debug(`Using branch ID: ${branchId} for product ${productId}`);

          // Kiểm tra xem có combinationId trong options không
          // Tìm kiếm combinationId trong các vị trí khác nhau
          let combinationId = options?.combinationId;

          // Nếu không tìm thấy trực tiếp, tìm trong selectedOptions
          if (!combinationId && options?.selectedOptions?.combinationId) {
            combinationId = options.selectedOptions.combinationId;
            this.logger.debug(`Found combinationId in options.selectedOptions: ${combinationId}`);
          }

          // Nếu vẫn không tìm thấy, tìm kiếm trong các trường con của options
          if (!combinationId && typeof options === 'object' && options !== null) {
            // Kiểm tra xem options có chứa combinationId không
            const keys = Object.keys(options);
            for (const key of keys) {
              if (key === 'combinationId') {
                combinationId = options[key];
                this.logger.debug(`Found combinationId directly in options.${key}: ${combinationId}`);
                break;
              } else if (typeof options[key] === 'object' && options[key] !== null) {
                // Kiểm tra các object con
                const subKeys = Object.keys(options[key]);
                for (const subKey of subKeys) {
                  if (subKey === 'combinationId') {
                    combinationId = options[key][subKey];
                    this.logger.debug(`Found combinationId in options.${key}.${subKey}: ${combinationId}`);
                    break;
                  }
                }
              }
            }
          }

          // Lấy thông tin sản phẩm
          const product = await this.productsService.findOne(productId);
          if (!product) {
            this.logger.warn(`Product not found: ${productId}`);
            continue;
          }

          if (variantId) {
            // Nếu có variantId, kiểm tra xem có combinationId không
            try {
              // Xử lý variantId có định dạng new-timestamp
              // Không cần xử lý đặc biệt nữa vì đã được xử lý trong phần variantInventory bình thường

              if (combinationId) {
                // Trường hợp 2: Sản phẩm có biến thể và tổ hợp biến thể
                this.logger.debug(`Updating combination inventory for product ${productId}, variant ${variantId}, combination ${combinationId}`);

                // Tìm kiếm sản phẩm trực tiếp từ database
                const productData = await this.productModel.findById(productId);
                if (!productData) {
                  this.logger.warn(`Product not found in database: ${productId}`);
            continue;
          }

                // Log thông tin để debug
                this.logger.debug(`Looking for combination inventory with branchId=${branchId}, variantId=${variantId}, combinationId=${combinationId}`);

                // Kiểm tra xem combinationInventory có tồn tại không
                if (!productData.combinationInventory || productData.combinationInventory.length === 0) {
                  this.logger.warn(`Product ${productId} has no combinationInventory`);
                continue;
              }

                // Log danh sách các combinationInventory để debug
                this.logger.debug(`Available combinationInventory items: ${JSON.stringify(productData.combinationInventory.map(inv => ({
                  branchId: inv.branchId,
                  variantId: inv.variantId,
                  combinationId: inv.combinationId
                })))}`);

                // Tìm kiếm inventory của tổ hợp trong chi nhánh
                const combinationInventoryItem = productData.combinationInventory.find(
                  inv => inv.branchId?.toString() === branchId &&
                    inv.variantId?.toString() === variantId &&
                    inv.combinationId?.toString() === combinationId
                );

                if (!combinationInventoryItem) {
                  this.logger.warn(`Combination inventory for branch ${branchId}, variant ${variantId}, and combination ${combinationId} not found in product ${productId}`);
                  continue;
                }

                // Lấy số lượng hiện tại
                const currentQuantity = combinationInventoryItem.quantity || 0;
                this.logger.debug(`Found combination inventory: ${currentQuantity} units`);

                // Tính toán số lượng mới
              const newQuantity = Math.max(0, currentQuantity - quantity);
                this.logger.debug(`New combination quantity: ${newQuantity} units`);

                // Cập nhật trực tiếp vào database sử dụng MongoDB native
                const updateResult = await this.productModel.collection.updateOne(
                  {
                    _id: new Types.ObjectId(productId.toString()),
                    'combinationInventory': {
                      $elemMatch: {
                        'combinationId': combinationId,
                        'variantId': variantId,
                        'branchId': branchId
                      }
                    }
                  },
                  {
                    $set: { 'combinationInventory.$.quantity': newQuantity }
                  }
                );

                this.logger.debug(`MongoDB update result: ${JSON.stringify(updateResult)}`);

                // Kiểm tra kết quả cập nhật
                if (updateResult.modifiedCount === 0) {
                  this.logger.warn(`Failed to update combination inventory for product ${productId}, variant ${variantId}, combination ${combinationId}. No documents modified.`);
                }

                this.logger.debug(`Updated combination inventory directly in database: ${newQuantity} units`);

                // Lấy sản phẩm sau khi cập nhật
                const updatedProduct = await this.productModel.findById(productId);
                if (updatedProduct) {
                  // Tính tổng số lượng của tất cả các tổ hợp trong biến thể
                  const totalCombinationQuantity = updatedProduct.combinationInventory
                    .filter(inv => inv.branchId.toString() === branchId && inv.variantId.toString() === variantId)
                    .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

                  // Cập nhật tổng số lượng của biến thể sử dụng MongoDB native
                  const updateVariantResult = await this.productModel.collection.updateOne(
                    {
                      _id: new Types.ObjectId(productId.toString()),
                      'variantInventory': {
                        $elemMatch: {
                          'variantId': variantId,
                          'branchId': branchId
                        }
                      }
                    },
                    {
                      $set: { 'variantInventory.$.quantity': totalCombinationQuantity }
                    }
                  );

                  this.logger.debug(`MongoDB variant update result: ${JSON.stringify(updateVariantResult)}`);

                  // Kiểm tra kết quả cập nhật
                  if (updateVariantResult.modifiedCount === 0) {
                    this.logger.warn(`Failed to update variant inventory for product ${productId}, variant ${variantId}. No documents modified.`);
                  }

                  this.logger.debug(`Updated variant inventory directly in database: ${totalCombinationQuantity} units`);

                  // Lấy sản phẩm sau khi cập nhật
                  const updatedProductAfterVariant = await this.productModel.findById(productId);
                  if (updatedProductAfterVariant) {
                    // Tính tổng số lượng của tất cả các biến thể trong chi nhánh
                    const totalVariantQuantity = updatedProductAfterVariant.variantInventory
                      .filter(inv => inv.branchId.toString() === branchId)
                      .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

                    // Cập nhật tổng số lượng của chi nhánh sử dụng MongoDB native
                    const updateInventoryResult = await this.productModel.collection.updateOne(
                      {
                        _id: new Types.ObjectId(productId.toString()),
                        'inventory': {
                          $elemMatch: {
                            'branchId': branchId
                          }
                        }
                      },
                      {
                        $set: { 'inventory.$.quantity': totalVariantQuantity }
                      }
                    );

                    this.logger.debug(`MongoDB inventory update result: ${JSON.stringify(updateInventoryResult)}`);

                    // Kiểm tra kết quả cập nhật
                    if (updateInventoryResult.modifiedCount === 0) {
                      this.logger.warn(`Failed to update total branch inventory for product ${productId}. No documents modified.`);
                    }

                    this.logger.debug(`Updated total branch inventory directly in database: ${totalVariantQuantity} units`);
                  }
                }

                this.logger.debug(`Successfully updated combination inventory for product ${productId}, variant ${variantId}, combination ${combinationId}`);
              } else {
                // Trường hợp 1: Sản phẩm có biến thể nhưng không có tổ hợp biến thể
                this.logger.debug(`Updating variant inventory for product ${productId}, variant ${variantId}`);

                // Tìm kiếm sản phẩm trực tiếp từ database
                const productData = await this.productModel.findById(productId);
                if (!productData) {
                  this.logger.warn(`Product not found in database: ${productId}`);
                  continue;
                }

                // Log thông tin để debug
                this.logger.debug(`Looking for variant inventory with branchId=${branchId}, variantId=${variantId}`);

                // Kiểm tra xem variantInventory có tồn tại không
                if (!productData.variantInventory || productData.variantInventory.length === 0) {
                  this.logger.warn(`Product ${productId} has no variantInventory`);
                  continue;
                }

                // Log danh sách các variantInventory để debug
                this.logger.debug(`Available variantInventory items: ${JSON.stringify(productData.variantInventory.map(inv => ({
                  branchId: inv.branchId,
                  variantId: inv.variantId
                })))}`);

                // Tìm kiếm inventory của biến thể trong chi nhánh
                const variantInventoryItem = productData.variantInventory.find(
                  inv => inv.branchId?.toString() === branchId && inv.variantId?.toString() === variantId
                );

                if (!variantInventoryItem) {
                  this.logger.warn(`Variant inventory for branch ${branchId} and variant ${variantId} not found in product ${productId}`);
                  continue;
                }

                // Lấy số lượng hiện tại
                const currentQuantity = variantInventoryItem.quantity || 0;
                this.logger.debug(`Found variant inventory: ${currentQuantity} units`);

                // Tính toán số lượng mới
              const newQuantity = Math.max(0, currentQuantity - quantity);
                this.logger.debug(`New variant quantity: ${newQuantity} units`);

                // Cập nhật trực tiếp vào database sử dụng MongoDB native
                const updateResult = await this.productModel.collection.updateOne(
                  {
                    _id: new Types.ObjectId(productId.toString()),
                    'variantInventory': {
                      $elemMatch: {
                        'variantId': variantId,
                        'branchId': branchId
                      }
                    }
                  },
                  {
                    $set: { 'variantInventory.$.quantity': newQuantity }
                  }
                );

                this.logger.debug(`MongoDB update result: ${JSON.stringify(updateResult)}`);

                // Kiểm tra kết quả cập nhật
                if (updateResult.modifiedCount === 0) {
                  this.logger.warn(`Failed to update variant inventory for product ${productId}, variant ${variantId}. No documents modified.`);
                }

                this.logger.debug(`Updated variant inventory directly in database: ${newQuantity} units`);

                // Lấy sản phẩm sau khi cập nhật
                const updatedProduct = await this.productModel.findById(productId);
                if (updatedProduct) {
                  // Tính tổng số lượng của tất cả các biến thể trong chi nhánh
                  const totalVariantQuantity = updatedProduct.variantInventory
                    .filter(inv => inv.branchId.toString() === branchId)
                    .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

                  // Cập nhật tổng số lượng của chi nhánh sử dụng MongoDB native
                  const updateInventoryResult = await this.productModel.collection.updateOne(
                    {
                      _id: new Types.ObjectId(productId.toString()),
                      'inventory': {
                        $elemMatch: {
                          'branchId': branchId
                        }
                      }
                    },
                    {
                      $set: { 'inventory.$.quantity': totalVariantQuantity }
                    }
                  );

                  this.logger.debug(`MongoDB inventory update result: ${JSON.stringify(updateInventoryResult)}`);

                  // Kiểm tra kết quả cập nhật
                  if (updateInventoryResult.modifiedCount === 0) {
                    this.logger.warn(`Failed to update total branch inventory for product ${productId}. No documents modified.`);
                  }

                  this.logger.debug(`Updated total branch inventory directly in database: ${totalVariantQuantity} units`);
                }

                this.logger.debug(`Successfully updated variant inventory for product ${productId}, variant ${variantId}`);
              }
            } catch (variantError) {
              this.logger.error(`Error updating variant/combination inventory: ${variantError.message}`, variantError.stack);
            }
          } else {
            // Trường hợp 3: Sản phẩm không có biến thể
            try {
              this.logger.debug(`Updating product inventory for product ${productId}`);

              // Tìm kiếm sản phẩm trực tiếp từ database
              const productData = await this.productModel.findById(productId);
              if (!productData) {
                this.logger.warn(`Product not found in database: ${productId}`);
                continue;
              }

              // Kiểm tra xem sản phẩm có variantInventory không mặc dù không có biến thể
              // Đây là trường hợp đặc biệt khi sản phẩm không có biến thể nhưng có dữ liệu trong variantInventory
              if (productData.variantInventory && productData.variantInventory.length > 0) {
                this.logger.debug(`Product ${productId} has no variants but has variantInventory. Checking for branch ${branchId}`);

                // Tìm kiếm tất cả các mục trong variantInventory thuộc chi nhánh này
                const branchVariantInventories = productData.variantInventory.filter(
                  inv => inv.branchId?.toString() === branchId
                );

                if (branchVariantInventories.length > 0) {
                  this.logger.debug(`Found ${branchVariantInventories.length} variantInventory items for branch ${branchId}`);

                  // Chỉ cập nhật mục đầu tiên để tránh cập nhật nhiều lần
                  const variantInv = branchVariantInventories[0];
                  const variantId = variantInv.variantId?.toString();
                  if (variantId) {
                    // Lấy số lượng hiện tại
                    const currentQuantity = variantInv.quantity || 0;
                    this.logger.debug(`Found variant inventory for variantId ${variantId}: ${currentQuantity} units`);

                    // Tính toán số lượng mới
                    const newQuantity = Math.max(0, currentQuantity - quantity);
                    this.logger.debug(`New variant quantity for variantId ${variantId}: ${newQuantity} units`);

                    // Cập nhật trực tiếp vào database sử dụng MongoDB native
                    const updateResult = await this.productModel.collection.updateOne(
                      {
                        _id: new Types.ObjectId(productId.toString()),
                        'variantInventory': {
                          $elemMatch: {
                            'variantId': variantId,
                            'branchId': branchId
                          }
                        }
                      },
                      {
                        $set: { 'variantInventory.$.quantity': newQuantity }
                      }
                    );

                    this.logger.debug(`MongoDB update result: ${JSON.stringify(updateResult)}`);

                    // Kiểm tra kết quả cập nhật
                    if (updateResult.modifiedCount === 0) {
                      this.logger.warn(`Failed to update variant inventory for product ${productId}, variant ${variantId}. No documents modified.`);
                    }

                    this.logger.debug(`Updated variant inventory directly in database for variantId ${variantId}: ${newQuantity} units`);

                    // Cập nhật inventory của chi nhánh
                    // Tính tổng số lượng của tất cả các variantInventory trong chi nhánh sau khi cập nhật
                    const updatedProduct = await this.productModel.findById(productId);
                    if (updatedProduct) {
                      const totalVariantQuantity = updatedProduct.variantInventory
                        .filter(inv => inv.branchId?.toString() === branchId)
                        .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

                      // Cập nhật trực tiếp vào database sử dụng MongoDB native
                      const updateInventoryResult = await this.productModel.collection.updateOne(
                        {
                          _id: new Types.ObjectId(productId.toString()),
                          'inventory': {
                            $elemMatch: {
                              'branchId': branchId
                            }
                          }
                        },
                        {
                          $set: { 'inventory.$.quantity': totalVariantQuantity }
                        }
                      );

                      this.logger.debug(`MongoDB inventory update result: ${JSON.stringify(updateInventoryResult)}`);

                      // Kiểm tra kết quả cập nhật
                      if (updateInventoryResult.modifiedCount === 0) {
                        this.logger.warn(`Failed to update total branch inventory for product ${productId}. No documents modified.`);
                      }

                      this.logger.debug(`Updated total branch inventory directly in database: ${totalVariantQuantity} units`);
                    }

                    this.logger.debug(`Successfully updated product inventory for product ${productId} with variantInventory`);
                    return;
                  }
                }
              }

              // Xử lý bình thường nếu không có variantInventory hoặc không tìm thấy mục phù hợp
              // Log thông tin để debug
              this.logger.debug(`Looking for inventory with branchId=${branchId}`);

              // Kiểm tra xem inventory có tồn tại không
              if (!productData.inventory || productData.inventory.length === 0) {
                this.logger.warn(`Product ${productId} has no inventory`);
                continue;
              }

              // Log danh sách các inventory để debug
              this.logger.debug(`Available inventory items: ${JSON.stringify(productData.inventory.map(inv => ({
                branchId: inv.branchId,
                quantity: inv.quantity
              })))}`);

              // Tìm kiếm inventory của sản phẩm trong chi nhánh
              const inventoryItem = productData.inventory.find(
                inv => inv.branchId?.toString() === branchId
              );

              if (!inventoryItem) {
                this.logger.warn(`Inventory for branch ${branchId} not found in product ${productId}`);
                continue;
              }

              // Lấy số lượng hiện tại
              const currentQuantity = inventoryItem.quantity || 0;
              this.logger.debug(`Found product inventory: ${currentQuantity} units`);

              // Tính toán số lượng mới
              const newQuantity = Math.max(0, currentQuantity - quantity);
              this.logger.debug(`New product quantity: ${newQuantity} units`);

              // Cập nhật trực tiếp vào database sử dụng MongoDB native
              const updateResult = await this.productModel.collection.updateOne(
                {
                  _id: new Types.ObjectId(productId.toString()),
                  'inventory': {
                    $elemMatch: {
                      'branchId': branchId
                    }
                  }
                },
                {
                  $set: { 'inventory.$.quantity': newQuantity }
                }
              );

              this.logger.debug(`MongoDB update result: ${JSON.stringify(updateResult)}`);

              // Kiểm tra kết quả cập nhật
              if (updateResult.modifiedCount === 0) {
                this.logger.warn(`Failed to update inventory for product ${productId}. No documents modified.`);
              }

              this.logger.debug(`Successfully updated product inventory directly in database for product ${productId}`);
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
   * Tính phí vận chuyển (sử dụng API getPrice)
   */
  async calculateShippingFee(calculateShippingDto: any): Promise<ShippingFeeResponseDto> {
    try {
      this.logger.debug(`Calculating shipping fee for order value: ${calculateShippingDto.MONEY_COLLECTION || calculateShippingDto.PRODUCT_PRICE || 0}`);

      // Sử dụng trực tiếp payload từ frontend
      const payload = calculateShippingDto;

      // Đảm bảo các trường bắt buộc
      if (!payload.PRODUCT_TYPE) payload.PRODUCT_TYPE = 'HH';
      if (!payload.NATIONAL_TYPE) payload.NATIONAL_TYPE = 1;
      if (!payload.ORDER_SERVICE) payload.ORDER_SERVICE = 'VCN';

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

        // Xử lý kết quả trả về từ API getPrice
        if (typeof result === 'object' && result.MONEY_TOTAL) {
          return {
            success: true,
            fee: result.MONEY_TOTAL,
            estimatedDeliveryTime: result.KPI_HT ? `Dự kiến ${result.KPI_HT} giờ` : 'Dự kiến 2-3 ngày'
          };
        } else if (Array.isArray(result)) {
          // Nếu kết quả là một mảng các dịch vụ
          const services = result.map(service => ({
            serviceCode: service.MA_DV_CHINH,
            serviceName: service.TEN_DICHVU,
            fee: service.GIA_CUOC,
            estimatedDeliveryTime: service.THOI_GIAN
          }));

          // Tìm dịch vụ được chỉ định hoặc dịch vụ đầu tiên
          const selectedService = calculateShippingDto.ORDER_SERVICE
            ? services.find(s => s.serviceCode === calculateShippingDto.ORDER_SERVICE)
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
   * Tính phí vận chuyển cho tất cả dịch vụ (sử dụng API getPriceAll)
   */
  async calculateShippingFeeAll(calculateShippingDto: any): Promise<ShippingFeeResponseDto> {
    try {
      this.logger.debug(`Calculating shipping fee for all services, order value: ${calculateShippingDto.MONEY_COLLECTION || calculateShippingDto.PRODUCT_PRICE || 0}`);

      // Sử dụng trực tiếp payload từ frontend
      const payload = calculateShippingDto;

      try {
        // Gọi API Viettel Post để tính phí vận chuyển cho tất cả dịch vụ
        const result = await this.viettelPostService.calculateShippingFeeAll(payload);

        if (!result || !Array.isArray(result) || result.length === 0) {
          return {
            success: false,
            fee: 0,
            error: 'Không thể tính phí vận chuyển. Vui lòng thử lại sau.'
          };
        }

        // Xử lý kết quả trả về từ API getPriceAll
        // Kết quả là một mảng các dịch vụ
        const services = result.map(service => ({
          serviceCode: service.MA_DV_CHINH,
          serviceName: service.TEN_DICHVU,
          fee: service.GIA_CUOC,
          estimatedDeliveryTime: service.THOI_GIAN
        }));

        // Tìm dịch vụ được chỉ định hoặc dịch vụ LCOD hoặc dịch vụ đầu tiên
        const selectedService = calculateShippingDto.ORDER_SERVICE
          ? services.find(s => s.serviceCode === calculateShippingDto.ORDER_SERVICE)
          : services.find(s => s.serviceCode === 'LCOD') || services[0];

        if (selectedService) {
          // Chọn dịch vụ vận chuyển
          this.logger.debug(`Selected shipping service: ${selectedService.serviceCode} - ${selectedService.serviceName} - ${selectedService.fee}đ`);
          return {
            success: true,
            fee: selectedService.fee,
            estimatedDeliveryTime: selectedService.estimatedDeliveryTime,
            selectedServiceCode: selectedService.serviceCode,
            availableServices: services
          };
        } else {
          // Nếu không tìm thấy dịch vụ được chỉ định, uu tiên chọn LCOD hoặc dịch vụ đầu tiên
          const defaultService = services.find(s => s.serviceCode === 'LCOD') || services[0];
          this.logger.debug(`Default shipping service: ${defaultService.serviceCode} - ${defaultService.serviceName} - ${defaultService.fee}đ`);

          return {
            success: true,
            fee: defaultService.fee,
            estimatedDeliveryTime: defaultService.estimatedDeliveryTime,
            selectedServiceCode: defaultService.serviceCode,
            availableServices: services,
            error: 'Dịch vụ được chỉ định không khả dụng. Đã chọn dịch vụ mặc định.'
          };
        }
      } catch (error) {
        this.logger.error(`Error calculating shipping fee with getPriceAll: ${error.message}`, error.stack);
        return {
          success: false,
          fee: 0,
          error: `Không thể tính phí vận chuyển: ${error.message}`
        };
      }
    } catch (error) {
      this.logger.error(`Error in calculateShippingFeeAll: ${error.message}`, error.stack);
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
      this.logger.debug(`Creating ViettelPost shipment for order ${order._id}`);



      // Kiểm tra xem đơn hàng đã có mã vận đơn chưa
      if (order.trackingCode) {
        throw new BadRequestException(`Order ${order._id} already has tracking code: ${order.trackingCode}`);
      }

      // Kiểm tra số điện thoại người nhận
      if (!order.shippingAddress.phone) {
        this.logger.error('Receiver phone number is missing');
        throw new BadRequestException('Receiver phone number is required for shipping');
      }

      // Kiểm tra định dạng số điện thoại
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(order.shippingAddress.phone)) {
        this.logger.error(`Invalid receiver phone number format: ${order.shippingAddress.phone}`);
        throw new BadRequestException('Receiver phone number must be 10-11 digits');
      }

      // Chuẩn bị dữ liệu cho Viettel Post
      const viettelPostPayload = await this.prepareViettelPostPayload(order);



      if (!viettelPostPayload || Object.keys(viettelPostPayload).length === 0) {
        this.logger.error('ViettelPost payload is empty');
        throw new BadRequestException('Failed to prepare ViettelPost payload');
      }

      // Gọi API Viettel Post để tạo vận đơn
      const shipmentResult = await this.viettelPostService.createShipmentOrder(viettelPostPayload);
      this.logger.log(`ViettelPost shipment created for order ${order._id}`);



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
      this.logger.error('Order is missing branch assignment.');
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



    // Lấy thông tin chi nhánh từ branchId
    const branch = await this.branchModel.findById(order.branchId).exec();
    if (!branch) {
      this.logger.error(`Branch not found for order ${order._id}.`);
      throw new NotFoundException(`Branch with ID ${order.branchId} not found.`);
    }

    // Kiểm tra xem chi nhánh có đủ thông tin mã địa chỉ ViettelPost không
    if (!branch.wardCode || !branch.districtCode || !branch.provinceCode) {
      this.logger.error(`Branch ${branch.name} is missing ViettelPost address codes.`);
      throw new InternalServerErrorException(`Branch ${branch.name} is missing required ViettelPost address codes.`);
    }

    // Lấy thông tin chi nhánh gửi hàng
    const storeName = branch.name;
    const storeAddress = branch.address;
    const storePhone = branch.contact || this.configService.get<string>('STORE_DEFAULT_PHONE') || '0987654321'; // Use branch contact or a default
    const storeWardCode = branch.wardCode;
    const storeDistrictCode = branch.districtCode;
    const storeProvinceCode = branch.provinceCode;

    // Kiểm tra mã địa chỉ người nhận

    if (!order.shippingAddress.wardCode || !order.shippingAddress.districtCode || !order.shippingAddress.provinceCode) {
      this.logger.error('Receiver address codes are missing');
      throw new Error('Receiver address codes are required for shipping');
    }

    // Tính tổng số lượng và trọng lượng sản phẩm
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Tính trọng lượng dựa trên sản phẩm thực tế
    const totalWeight = order.items.reduce((sum, item) => {
      // Lấy thông tin sản phẩm từ map
      const product = productMap.get(item.productId.toString());

      // Lấy trọng lượng từ cosmetic_info.volume.value nếu có
      let itemWeight = 0; // Khởi tạo trọng lượng là 0

      if (product && product.cosmetic_info && product.cosmetic_info.volume) {
        // Nếu có thông tin trọng lượng trong sản phẩm, sử dụng nó
        itemWeight = product.cosmetic_info.volume.value || 0;


      } else {
        // Nếu không có thông tin trọng lượng trong sản phẩm, thử lấy từ metadata của item
        const metadataWeight = (item as any).metadata?.weight;
        if (metadataWeight) {
          itemWeight = metadataWeight;

        } else {

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
      this.logger.error(`Receiver phone number is too short after formatting: ${order.shippingAddress.phone}`);
      throw new Error('Receiver phone number must have at least 10 digits');
    }



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
      this.logger.error('Failed to parse standardized address codes to numbers. Data might not be standardized yet.');
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
      RECEIVER_EMAIL: order.shippingAddress.email || 'customer@yumin.vn', // Sử dụng email của người dùng hoặc mặc định
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
      PRODUCT_WEIGHT: totalWeight, // Sử dụng trọng lượng thực tế từ sản phẩm
      PRODUCT_LENGTH: 38,
      PRODUCT_WIDTH: 24,
      PRODUCT_HEIGHT: 25,
      ORDER_PAYMENT: order.paymentMethod === PaymentMethod.COD ? 3 : 1, // Sửa theo docs: 3: Thu tiền hàng (COD), 1: Không thu tiền
      // Sử dụng mã dịch vụ vận chuyển đã chọn hoặc mặc định theo phương thức thanh toán
      ORDER_SERVICE: (order as any).shippingServiceCode || (order.paymentMethod === PaymentMethod.COD ? 'LCOD' : 'VCN'),
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
        let itemWeight = 0; // Khởi tạo trọng lượng là 0

        if (product && product.cosmetic_info && product.cosmetic_info.volume) {
          // Nếu có thông tin trọng lượng trong sản phẩm, sử dụng nó
          itemWeight = product.cosmetic_info.volume.value || 0;

        } else {
          // Nếu không có thông tin trọng lượng trong sản phẩm, thử lấy từ metadata của item
          const metadataWeight = (item as any).metadata?.weight;
          if (metadataWeight) {
            itemWeight = metadataWeight;

          } else {

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



    return payload;
  }

}
