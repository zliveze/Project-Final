import { Injectable, Logger, HttpException, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateMomoPaymentDto } from './dto/create-momo-payment.dto';
import { MomoIpnDto } from './dto/momo-ipn.dto';
import { MomoPaymentResponseDto } from './dto/momo-payment-response.dto';
import { Payment, PaymentStatus } from '../schemas/payment.schema';
import { PaymentDocument } from '../schemas/payment.schema';
import { OrdersService } from '../../orders/orders.service';
import { OrderStatus, OrderDocument, Order } from '../../orders/schemas/order.schema';
import { PendingOrder, PendingOrderDocument } from './schemas/pending-order.schema';
import { CartsService } from '../../carts/carts.service';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';
import { PaymentMethod } from '../../orders/schemas/order.schema';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly apiEndpoint: string;
  private readonly ipnUrl: string;
  private readonly redirectUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly ordersService: OrdersService,
    private readonly cartsService: CartsService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PendingOrder.name) private pendingOrderModel: Model<PendingOrderDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {
    this.partnerCode = this.configService.get('MOMO_PARTNER_CODE') || '';
    this.accessKey = this.configService.get('MOMO_ACCESS_KEY') || '';
    this.secretKey = this.configService.get('MOMO_SECRET_KEY') || '';
    this.apiEndpoint = this.configService.get('MOMO_API_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api');

    const baseUrl = this.configService.get('APP_URL', 'https://backendyumin.vercel.app');
    this.ipnUrl = this.configService.get('MOMO_IPN_URL', `${baseUrl}/api/payments/momo/ipn`);
    this.redirectUrl = this.configService.get('MOMO_REDIRECT_URL', `${baseUrl}/payments/success`);

    this.logger.log('MoMo payment service initialized');
  }

  async createPayment(createMomoPaymentDto: CreateMomoPaymentDto): Promise<MomoPaymentResponseDto> {
    try {
      const { orderId, amount, returnUrl, orderInfo: originalOrderInfo, orderData } = createMomoPaymentDto;

      // Tạo requestId và orderId cho MoMo
      const requestId = `${this.partnerCode}_${new Date().getTime()}`;
      const momoOrderId = requestId;

      // Kiểm tra xem có phải đơn hàng tạm thời không (bắt đầu bằng YM)
      const isTemporaryOrder = orderId && orderId.startsWith('YM');

      // Tạo mã đơn hàng tạm thời nếu là đơn hàng mới
      let orderNumber = '';
      if (!orderId || orderId === 'new' || isTemporaryOrder) {
        // Nếu là đơn hàng mới, tạo mã đơn hàng tạm thời
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        orderNumber = `YM${year}${month}${day}${random}`;
        this.logger.debug(`Generated temporary order number: ${orderNumber}`);
      } else if (isTemporaryOrder) {
        // Nếu đã có mã đơn hàng tạm thời, sử dụng nó
        orderNumber = orderId;
      } else {
        // Nếu là đơn hàng đã tồn tại, lấy mã đơn hàng từ database
        try {
          const order = await this.orderModel.findById(orderId).lean().exec();
          if (order) {
            orderNumber = order.orderNumber;
            this.logger.debug(`Found order number from database: ${orderNumber}`);
          }
        } catch (error) {
          this.logger.error(`Error finding order number: ${error.message}`, error.stack);
        }
      }

      // Tạo orderInfo bao gồm mã đơn hàng
      const orderInfo = orderNumber
        ? `Thanh toán đơn hàng Yumin #${orderNumber}`
        : (originalOrderInfo || 'Thanh toán đơn hàng Yumin');

      this.logger.debug(`Using orderInfo: ${orderInfo}`);

      // Tạo extraData để lưu thông tin đơn hàng
      const extraData = Buffer.from(JSON.stringify({
        orderId,
        orderNumber,
        isNewOrder: !orderId || orderId === 'new' || isTemporaryOrder
      })).toString('base64');

      // Loại yêu cầu thanh toán
      const requestType = 'captureWallet';

      // Tạo chữ ký theo tài liệu MoMo
      // HMAC_SHA256(accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType,secretKey)
      const rawSignature = [
        `accessKey=${this.accessKey}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `ipnUrl=${this.ipnUrl}`,
        `orderId=${momoOrderId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${this.partnerCode}`,
        `redirectUrl=${returnUrl}`,
        `requestId=${requestId}`,
        `requestType=${requestType}`
      ].join('&');

      this.logger.debug(`Creating payment signature with raw string: ${rawSignature}`);

      const signature = crypto.createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      this.logger.debug(`Generated payment signature: ${signature}`);

      // Tạo payload gửi đến MoMo
      const payload = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        amount: amount,
        orderId: momoOrderId,
        orderInfo: orderInfo,
        redirectUrl: returnUrl,
        ipnUrl: this.ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'vi'
      };

      this.logger.debug(`Creating MoMo payment with amount ${amount}`);
      this.logger.debug(`MoMo request payload: ${JSON.stringify(payload)}`);
      this.logger.debug(`MoMo API endpoint: ${this.apiEndpoint}/create`);

      // Gọi API MoMo
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiEndpoint}/create`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      // Kiểm tra kết quả từ MoMo
      if (response.status !== 200 || response.data.resultCode !== 0) {
        this.logger.error(`MoMo API error: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          response.data.message || 'Lỗi tạo thanh toán MoMo',
          response.status
        );
      }

      // Lưu thông tin đơn hàng tạm thời nếu là đơn hàng mới
      if (orderData && (!orderId || orderId === 'new' || isTemporaryOrder)) {
        await this.pendingOrderModel.create({
          userId: orderData.userId,
          orderData: orderData,
          requestId: requestId,
          momoOrderId: momoOrderId,
        });
        this.logger.log(`Created pending order for requestId ${requestId}`);
      }

      // Lưu thông tin thanh toán
      const paymentData: any = {
        userId: orderData?.userId || '000000000000000000000000',
        amount: amount,
        method: 'momo',
        status: PaymentStatus.PENDING,
        requestId: requestId,
        momoOrderId: momoOrderId,
        paymentDetails: {
          orderInfo: orderInfo,
          extraData: extraData,
          payUrl: response.data.payUrl
        },
      };

      // Thêm orderId nếu không phải đơn hàng mới
      if (orderId !== 'new') {
        paymentData.orderId = orderId;
      }

      await this.paymentModel.create(paymentData);
      this.logger.log(`MoMo payment created with requestId ${requestId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Error creating MoMo payment: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi xử lý thanh toán MoMo');
    }
  }

  async handleIpnCallback(ipnData: MomoIpnDto): Promise<{ message: string }> {
    // ADDED: Log ngay khi hàm được gọi
    this.logger.log(`===== MOMO IPN CALLBACK RECEIVED =====`);
    this.logger.debug(`Raw IPN Data: ${JSON.stringify(ipnData)}`);

    try {
      // ADDED: Log trước khi xác thực signature
      this.logger.debug('Verifying MoMo signature...');
      // Xác thực chữ ký từ MoMo
      const isValidSignature = this.verifySignature(ipnData);
      if (!isValidSignature) {
        this.logger.error('!!! Invalid MoMo signature !!!');
        throw new BadRequestException('Chữ ký MoMo không hợp lệ');
      }
      this.logger.debug('MoMo signature verified successfully.');

      // Xử lý khi thanh toán thất bại
      this.logger.debug(`Processing IPN with resultCode: ${ipnData.resultCode}`);
      if (ipnData.resultCode !== 0) {
        this.logger.warn(`MoMo payment failed with resultCode: ${ipnData.resultCode}, message: ${ipnData.message}`);
        await this.updatePaymentStatus(ipnData, PaymentStatus.FAILED);
        return { message: 'Ghi nhận thanh toán thất bại' };
      }

      // Cập nhật trạng thái thanh toán thành công
      this.logger.debug('Updating payment status to PAID...');
      await this.updatePaymentStatus(ipnData, PaymentStatus.PAID);
      this.logger.debug('Payment status updated.');

      // Lấy thông tin thanh toán
      this.logger.debug(`Finding payment record for requestId: ${ipnData.requestId}`);
      const payment = await this.paymentModel.findOne({ requestId: ipnData.requestId });
      if (!payment) {
        this.logger.error(`Payment not found for requestId: ${ipnData.requestId}`);
        return { message: 'Không tìm thấy thông tin thanh toán' };
      }

      interface ExtraData {
        orderId: string;
        orderNumber: string;
        isNewOrder: boolean;
      }

      interface ParsedData {
        orderId?: string;
        orderNumber?: string;
        isNewOrder?: boolean;
      }

      // Giải mã extraData để lấy thông tin đơn hàng
      this.logger.debug('Parsing extraData...');
      let extraDataObj: ExtraData = { orderId: '', orderNumber: '', isNewOrder: false };
      try {
        if (ipnData.extraData) {
          const decodedExtraData = Buffer.from(ipnData.extraData, 'base64').toString();
          this.logger.debug(`Decoded extraData: ${decodedExtraData}`);
          const parsedData = JSON.parse(decodedExtraData) as ParsedData;
          if (parsedData && typeof parsedData === 'object') {
            extraDataObj = {
              orderId: String(parsedData.orderId || ''),
              orderNumber: String(parsedData.orderNumber || ''),
              isNewOrder: Boolean(parsedData.isNewOrder)
            };
            this.logger.debug(`Parsed extraData: ${JSON.stringify(extraDataObj)}`);
          } else {
             this.logger.warn('Parsed extraData is not a valid object.');
          }
        } else {
           this.logger.warn('IPN data does not contain extraData.');
        }
      } catch (error) {
        this.logger.error(`!!! Error parsing extraData: ${error.message} !!!`);
        // Không throw lỗi ở đây, có thể thử xử lý tiếp nếu có orderId trong payment record
      }

      // Xử lý đơn hàng dựa trên extraData (hoặc payment record)
      this.logger.debug('Processing order based on extraData...');
      if (extraDataObj.isNewOrder) {
        // Tạo đơn hàng mới từ dữ liệu tạm thời
        this.logger.debug(`Handling as NEW order. Finding pending order for requestId: ${ipnData.requestId}`);
        const pendingOrder = await this.pendingOrderModel.findOne({ requestId: ipnData.requestId });
        if (!pendingOrder) {
          this.logger.error(`!!! Pending order not found for requestId: ${ipnData.requestId} !!!`);
          // Cân nhắc: Có nên thử tìm orderId từ payment record không?
          return { message: 'Không tìm thấy thông tin đơn hàng tạm thời' };
        }
        this.logger.debug(`Found pending order for user: ${pendingOrder.userId}`);

        // Chuẩn bị dữ liệu đơn hàng với trạng thái đã thanh toán
        this.logger.debug('Preparing order data from pending order...');
        const orderData = pendingOrder.orderData as any;

        // Sử dụng orderNumber từ extraData nếu có
        const customOrderNumber = extraDataObj.orderNumber || undefined;
        if (customOrderNumber) {
          this.logger.debug(`Using custom order number from extraData: ${customOrderNumber}`);
        }

        const orderDataWithPayment: CreateOrderDto = {
          items: orderData.items.map((item: any) => ({
            productId: item.productId.toString(),
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            price: item.price,
            ...(item.variantId && { variantId: item.variantId.toString() }),
            ...(item.options && { options: item.options })
          })),
          shippingAddress: {
            fullName: orderData.shippingAddress.fullName,
            phone: orderData.shippingAddress.phone,
            addressLine1: orderData.shippingAddress.addressLine1,
            ward: orderData.shippingAddress.ward,
            district: orderData.shippingAddress.district,
            province: orderData.shippingAddress.province,
            ...(orderData.shippingAddress.email && { email: orderData.shippingAddress.email }),
            ...(orderData.shippingAddress.addressLine2 && { addressLine2: orderData.shippingAddress.addressLine2 }),
            ...(orderData.shippingAddress.wardCode && { wardCode: orderData.shippingAddress.wardCode }),
            ...(orderData.shippingAddress.districtCode && { districtCode: orderData.shippingAddress.districtCode }),
            ...(orderData.shippingAddress.provinceCode && { provinceCode: orderData.shippingAddress.provinceCode }),
            ...(orderData.shippingAddress.postalCode && { postalCode: orderData.shippingAddress.postalCode }),
            ...(orderData.shippingAddress.country && { country: orderData.shippingAddress.country })
          },
          subtotal: orderData.subtotal,
          totalPrice: orderData.totalPrice,
          finalPrice: orderData.finalPrice,
          paymentMethod: PaymentMethod.MOMO,
          ...(orderData.tax && { tax: orderData.tax }),
          ...(orderData.shippingFee && { shippingFee: orderData.shippingFee }),
          ...(orderData.voucher && { voucher: orderData.voucher }),
          ...(orderData.branchId && { branchId: orderData.branchId.toString() }),
          ...(orderData.notes && { notes: orderData.notes }),
          ...(orderData.metadata && { metadata: orderData.metadata }),
          ...(orderData.shippingServiceCode && { shippingServiceCode: orderData.shippingServiceCode }),
          ...(customOrderNumber && { orderNumber: customOrderNumber })
        };

        // Tạo đơn hàng mới với dữ liệu từ pendingOrder
        this.logger.debug('Calling ordersService.create...');
        const newOrder = await this.ordersService.create(orderDataWithPayment, pendingOrder.userId);
        this.logger.log(`Successfully created new order: ${newOrder._id}`);

        // Cập nhật orderId trong payment
        this.logger.debug(`Updating payment record with new orderId: ${newOrder._id}`);
        payment.orderId = newOrder._id as Types.ObjectId;
        await payment.save();

        // Tạo vận đơn Viettel Post
        this.logger.debug(`Creating ViettelPost shipment for new order: ${newOrder._id}`);
        try {
          await this.ordersService.createViettelPostShipment(newOrder);
          this.logger.log(`Successfully created ViettelPost shipment for order: ${newOrder._id}`);
        } catch (shipmentError) {
           this.logger.error(`!!! Error creating ViettelPost shipment for new order ${newOrder._id}: ${shipmentError.message} !!!`, shipmentError.stack);
           // Không throw lỗi, tiếp tục xử lý
        }


        // Xóa giỏ hàng
        if (pendingOrder.userId) {
          this.logger.debug(`Clearing cart for user: ${pendingOrder.userId}`);
          try {
            await this.cartsService.clearCart(pendingOrder.userId);
            this.logger.log(`Successfully cleared cart for user: ${pendingOrder.userId}`);
          } catch (cartError) {
             this.logger.error(`!!! Error clearing cart for user ${pendingOrder.userId}: ${cartError.message} !!!`, cartError.stack);
             // Không throw lỗi, tiếp tục xử lý
          }
        } else {
           this.logger.warn('No userId found in pending order, cannot clear cart.');
        }

        // Xóa đơn hàng tạm thời
        this.logger.debug(`Deleting pending order: ${pendingOrder._id}`);
        await this.pendingOrderModel.findByIdAndDelete(pendingOrder._id);
        this.logger.log(`Deleted pending order: ${pendingOrder._id}`);

      } else if (extraDataObj.orderId && Types.ObjectId.isValid(extraDataObj.orderId)) {
         this.logger.debug(`Handling as EXISTING order. OrderId: ${extraDataObj.orderId}`);
        try {
          const orderId = extraDataObj.orderId;
          // Kiểm tra đơn hàng tồn tại trước khi cập nhật
          this.logger.debug(`Checking if order exists: ${orderId}`);
          const existingOrder = await this.orderModel.findById(orderId).lean().exec(); // Sử dụng lean() để không load toàn bộ document

          if (!existingOrder) {
             this.logger.error(`!!! Order with ID ${orderId} not found !!!`);
            throw new NotFoundException(`Order with ID ${orderId} not found`);
          }
           this.logger.debug(`Order ${orderId} found. Current status: ${existingOrder.status}`);

          // Cập nhật đơn hàng hiện có (chỉ cập nhật nếu chưa được xác nhận)
          if (existingOrder.status === OrderStatus.PENDING) {
             this.logger.debug(`Updating order status to CONFIRMED for order: ${orderId}`);
            await this.ordersService.updateStatus(
              orderId,
              OrderStatus.CONFIRMED // Hoặc PROCESSING tùy theo logic mong muốn
            );
             this.logger.log(`Successfully updated status for order: ${orderId}`);

            // Lưu ý: Số lượng sản phẩm trong kho đã được giảm khi tạo đơn hàng
            // Không cần giảm lại số lượng sản phẩm trong kho ở đây
            this.logger.debug(`Inventory for order ${orderId} was already decreased when the order was created.`);
          } else {
             this.logger.warn(`Order ${orderId} status is already ${existingOrder.status}. Skipping status update.`);
          }

          // Tạo vận đơn Viettel Post (chỉ tạo nếu chưa có tracking code)
          if (!existingOrder.trackingCode) {
             this.logger.debug(`Creating ViettelPost shipment for existing order: ${orderId}`);
            // Lấy lại document đầy đủ để tạo shipment
            const orderDoc = await this.orderModel.findById(orderId).exec();
            if (orderDoc) {
              try {
                await this.ordersService.createViettelPostShipment(orderDoc);
                 this.logger.log(`Successfully created ViettelPost shipment for order: ${orderId}`);
              } catch (shipmentError) {
                 this.logger.error(`!!! Error creating ViettelPost shipment for existing order ${orderId}: ${shipmentError.message} !!!`, shipmentError.stack);
                 // Không throw lỗi, tiếp tục xử lý
              }
            } else {
               this.logger.error(`!!! Could not retrieve full order document for shipment creation: ${orderId} !!!`);
            }
          } else {
             this.logger.warn(`Order ${orderId} already has tracking code ${existingOrder.trackingCode}. Skipping shipment creation.`);
          }

          // Xóa giỏ hàng của người dùng (giống như COD)
          if (existingOrder.userId) {
            this.logger.debug(`Clearing cart for user: ${existingOrder.userId}`);
            try {
              await this.cartsService.clearCart(existingOrder.userId.toString());
              this.logger.log(`Successfully cleared cart for user: ${existingOrder.userId}`);
            } catch (cartError) {
              this.logger.error(`!!! Error clearing cart for user ${existingOrder.userId}: ${cartError.message} !!!`, cartError.stack);
              // Không throw lỗi, tiếp tục xử lý
            }
          } else {
            this.logger.warn('No userId found in existing order, cannot clear cart.');
          }

        } catch (error) {
          this.logger.error(`!!! Error processing existing order ${extraDataObj.orderId}: ${error.message} !!!`, error.stack);
          // Không throw lỗi ra ngoài IPN handler, ghi nhận lỗi và trả về thành công cho Momo
        }
      } else {
         this.logger.error(`!!! Invalid or missing orderId in extraData and no pending order found. Cannot process order. RequestId: ${ipnData.requestId} !!!`);
         // Có thể cần thêm logic để xử lý trường hợp này, ví dụ: tìm payment record và thử lấy orderId từ đó
      }

       this.logger.log(`===== MOMO IPN CALLBACK PROCESSING COMPLETE for RequestId: ${ipnData.requestId} =====`);
      return { message: 'Xử lý thanh toán thành công' };
    } catch (error) {
      this.logger.error(`!!! FATAL ERROR handling MoMo IPN for RequestId ${ipnData.requestId}: ${error.message} !!!`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi xử lý callback từ MoMo');
    }
  }

  private async updatePaymentStatus(ipnData: MomoIpnDto, status: string): Promise<void> {
    try {
      const payment = await this.paymentModel.findOne({ requestId: ipnData.requestId });
      if (!payment) {
        this.logger.error(`Payment not found for requestId: ${ipnData.requestId}`);
        return;
      }

      payment.status = status;
      if (ipnData.transId) {
        payment.transactionId = ipnData.transId.toString();
      }
      payment.paymentDetails = {
        ...payment.paymentDetails,
        momoTransId: ipnData.transId,
        payType: ipnData.payType,
        responseTime: new Date(),
        resultCode: ipnData.resultCode,
        message: ipnData.message,
      };

      await payment.save();
      this.logger.log(`Payment status updated to ${status} for requestId: ${ipnData.requestId}`);
    } catch (error) {
      this.logger.error(`Error updating payment status: ${error.message}`, error.stack);
      throw error;
    }
  }

  private verifySignature(ipnData: MomoIpnDto): boolean {
    try {
      // Thêm log để debug
      this.logger.debug(`Verifying signature with data: ${JSON.stringify(ipnData)}`);

      // Phương pháp chính: Tạo chuỗi raw signature theo tài liệu MoMo chính thức
      // Theo tài liệu MoMo, chuỗi raw signature cho IPN callback cần được tạo theo định dạng:
      // accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&payType=$payType&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
      const rawSignature = [
        `accessKey=${this.accessKey}`,
        `amount=${ipnData.amount}`,
        `extraData=${ipnData.extraData || ''}`,
        `message=${ipnData.message}`,
        `orderId=${ipnData.orderId}`,
        `orderInfo=${ipnData.orderInfo}`,
        `orderType=${ipnData.orderType}`,
        `partnerCode=${ipnData.partnerCode}`,
        `payType=${ipnData.payType || ''}`,
        `requestId=${ipnData.requestId}`,
        `resultCode=${ipnData.resultCode}`,
        `transId=${ipnData.transId || 0}`
      ].join('&');

      // Log chuỗi raw signature để debug
      this.logger.debug(`Raw signature string: ${rawSignature}`);

      // Tạo chữ ký từ chuỗi raw signature
      const signature = crypto.createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      // Log chữ ký tạo ra và chữ ký từ MoMo để so sánh
      this.logger.debug(`Generated signature: ${signature}`);
      this.logger.debug(`MoMo signature: ${ipnData.signature}`);

      // So sánh chữ ký tạo ra với chữ ký từ MoMo
      const isValid = signature === ipnData.signature;

      this.logger.debug(`Signature validation result: ${isValid}`);

      // Nếu chữ ký không khớp, thử một phương pháp khác
      if (!isValid) {
        this.logger.debug('Signature validation failed with primary method, trying alternative method...');

        // Phương pháp thay thế: Tạo chuỗi raw signature với tất cả các trường từ ipnData
        const ipnDataWithoutSignature: Record<string, any> = {};
        Object.keys(ipnData).forEach(key => {
          if (key !== 'signature') {
            ipnDataWithoutSignature[key] = ipnData[key];
          }
        });

        // Thêm accessKey vào dữ liệu
        ipnDataWithoutSignature.accessKey = this.accessKey;

        // Sắp xếp các trường theo thứ tự alphabet
        const sortedKeys = Object.keys(ipnDataWithoutSignature).sort();
        const alternativeRawSignature = sortedKeys
          .map(key => {
            const value = ipnDataWithoutSignature[key];
            return `${key}=${value !== undefined && value !== null ? value : ''}`;
          })
          .join('&');

        this.logger.debug(`Alternative raw signature string: ${alternativeRawSignature}`);

        // Tạo chữ ký từ chuỗi raw signature thay thế
        const alternativeSignature = crypto.createHmac('sha256', this.secretKey)
          .update(alternativeRawSignature)
          .digest('hex');

        this.logger.debug(`Alternative generated signature: ${alternativeSignature}`);

        // So sánh chữ ký thay thế với chữ ký từ MoMo
        const isAlternativeValid = alternativeSignature === ipnData.signature;

        this.logger.debug(`Alternative signature validation result: ${isAlternativeValid}`);

        // Trả về kết quả của phương pháp thay thế
        return isAlternativeValid;
      }

      // Trả về kết quả của phương pháp chính
      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`, error.stack);
      return false;
    }
  }
}
