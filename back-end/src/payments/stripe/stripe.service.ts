import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { PendingOrder, PendingOrderDocument } from '../schemas/pending-order.schema';
import { CreateStripePaymentDto } from './dto';
import { OrdersService } from '../../orders/orders.service';
import { CartsService } from '../../carts/carts.service';
import { PaymentStatus, OrderStatus } from '../../orders/schemas/order.schema';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly cartsService: CartsService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PendingOrder.name) private pendingOrderModel: Model<PendingOrderDocument>,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
    });
    this.logger.log('Stripe payment service initialized');
  }

  /**
   * Tạo một Stripe Checkout Session
   */
  async createCheckoutSession(createStripePaymentDto: CreateStripePaymentDto): Promise<any> {
    try {
      this.logger.log(`Creating Stripe checkout session`);
      const { amount, currency, orderId, description, metadata, orderData, returnUrl } = createStripePaymentDto;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://project-final-livid.vercel.app';

      // Kiểm tra xem có phải đơn hàng tạm thời không (bắt đầu bằng YM hoặc là 'new')
      const isTemporaryOrder = orderId && (orderId.startsWith('YM') || orderId === 'new');
      this.logger.debug(`Is temporary order: ${isTemporaryOrder}`);

      // Tạo requestId và sessionId cho Stripe
      const requestId = `stripe_${new Date().getTime()}`;
      const stripeSessionId = requestId;
      this.logger.debug(`Generated requestId: ${requestId}`);

      // Tạo orderNumber nếu là đơn hàng mới
      let orderNumber = '';
      if (!orderId || orderId === 'new' || isTemporaryOrder) {
        // Tạo mã đơn hàng theo định dạng YMyyMMddxxxx
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        orderNumber = `YM${year}${month}${day}${random}`;
        this.logger.debug(`Generated order number: ${orderNumber}`);
      } else {
        // Nếu là đơn hàng đã tồn tại, lấy orderNumber từ database
        try {
          const order = await this.ordersService.findOne(orderId);
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
        : (description || 'Thanh toán đơn hàng Yumin');
      this.logger.debug(`Using orderInfo: ${orderInfo}`);

      // Tạo extraData để lưu thông tin đơn hàng
      const isNewOrderValue = !orderId || orderId === 'new' || (isTemporaryOrder || false);
      const extraData = Buffer.from(JSON.stringify({
        orderId,
        orderNumber,
        isNewOrder: isNewOrderValue
      })).toString('base64');

      // Tạo Checkout Session với Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: orderInfo,
                description: `Mã đơn hàng: ${orderNumber || 'Đang tạo...'}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: returnUrl || `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/payments?canceled=true`,
        metadata: {
          orderId: orderId || 'new',
          orderNumber,
          requestId,
          extraData,
          isNewOrder: String(isNewOrderValue),
          ...metadata,
        },
      });

      this.logger.debug(`Stripe session created: ${session.id}`);

      // Lưu thông tin đơn hàng tạm thời nếu là đơn hàng mới
      if (orderData && (!orderId || orderId === 'new' || isTemporaryOrder)) {
        const pendingOrderData = {
          userId: orderData.userId,
          orderData: orderData,
          requestId: requestId,
          stripeSessionId: session.id,
        };
        
        await this.pendingOrderModel.create(pendingOrderData);
        this.logger.log(`Created pending order for requestId ${requestId}`);
      }

      // Lưu thông tin payment vào database
      const paymentData: any = {
        userId: orderData?.userId || '000000000000000000000000',
        amount: amount,
        method: 'stripe',
        status: PaymentStatus.PENDING,
        requestId: requestId,
        transactionId: session.id,
        paymentDetails: {
          orderInfo: orderInfo,
          extraData: extraData,
          sessionId: session.id,
          payUrl: session.url,
          currency,
        },
      };

      // Thêm orderId nếu không phải đơn hàng mới
      if (orderId && orderId !== 'new' && !isTemporaryOrder) {
        paymentData.orderId = orderId;
      }

      await this.paymentModel.create(paymentData);
      this.logger.log(`Stripe payment created with requestId ${requestId}`);

      return {
        id: session.id,
        url: session.url,
        amount,
        currency,
        status: session.status,
      };
    } catch (error) {
      this.logger.error(`Error creating Stripe checkout session: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể tạo phiên thanh toán Stripe');
    }
  }

  /**
   * Tạo một payment intent mới với Stripe
   */
  async createPaymentIntent(createStripePaymentDto: CreateStripePaymentDto): Promise<any> {
    try {
      this.logger.log(`Creating Stripe payment intent`);
      const { amount, currency, orderId, description, metadata, orderData } = createStripePaymentDto;

      // Kiểm tra xem có phải đơn hàng tạm thời không (bắt đầu bằng YM hoặc là 'new')
      const isTemporaryOrder = orderId && (orderId.startsWith('YM') || orderId === 'new');
      this.logger.debug(`Is temporary order: ${isTemporaryOrder}`);

      // Tạo requestId và paymentIntentId cho Stripe
      const requestId = `stripe_${new Date().getTime()}`;
      this.logger.debug(`Generated requestId: ${requestId}`);

      // Tạo orderNumber nếu là đơn hàng mới
      let orderNumber = '';
      if (!orderId || orderId === 'new' || isTemporaryOrder) {
        // Tạo mã đơn hàng theo định dạng YMyyMMddxxxx
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        orderNumber = `YM${year}${month}${day}${random}`;
        this.logger.debug(`Generated order number: ${orderNumber}`);
      } else {
        // Nếu là đơn hàng đã tồn tại, lấy orderNumber từ database
        try {
          const order = await this.ordersService.findOne(orderId);
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
        : (description || 'Thanh toán đơn hàng Yumin');
      this.logger.debug(`Using orderInfo: ${orderInfo}`);

      // Tạo extraData để lưu thông tin đơn hàng
      const isNewOrderValue = !orderId || orderId === 'new' || (isTemporaryOrder || false);
      const extraData = Buffer.from(JSON.stringify({
        orderId,
        orderNumber,
        isNewOrder: isNewOrderValue
      })).toString('base64');

      // Tạo payment intent với Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        description: orderInfo,
        metadata: {
          orderId: orderId || 'new',
          orderNumber,
          requestId,
          extraData,
          isNewOrder: String(isNewOrderValue),
          ...metadata,
        },
      });

      this.logger.debug(`Stripe payment intent created: ${paymentIntent.id}`);

      // Lưu thông tin đơn hàng tạm thời nếu là đơn hàng mới
      if (orderData && (!orderId || orderId === 'new' || isTemporaryOrder)) {
        const pendingOrderData = {
          userId: orderData.userId,
          orderData: orderData,
          requestId: requestId,
          stripePaymentIntentId: paymentIntent.id,
        };
        
        await this.pendingOrderModel.create(pendingOrderData);
        this.logger.log(`Created pending order for requestId ${requestId}`);
      }

      // Lưu thông tin payment vào database
      const paymentData: any = {
        userId: orderData?.userId || '000000000000000000000000',
        amount: amount,
        method: 'stripe',
        status: PaymentStatus.PENDING,
        requestId: requestId,
        transactionId: paymentIntent.id,
        paymentDetails: {
          orderInfo: orderInfo,
          extraData: extraData,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          currency,
        },
      };

      // Thêm orderId nếu không phải đơn hàng mới
      if (orderId && orderId !== 'new' && !isTemporaryOrder) {
        paymentData.orderId = orderId;
      }

      await this.paymentModel.create(paymentData);
      this.logger.log(`Stripe payment created with requestId ${requestId}`);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error(`Error creating Stripe payment intent: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể tạo payment intent với Stripe');
    }
  }

  /**
   * Xử lý webhook từ Stripe
   */
  async handleWebhookEvent(signature: string, payload: Buffer): Promise<any> {
    this.logger.log(`===== STRIPE WEBHOOK EVENT RECEIVED =====`);
    let event: Stripe.Event;

    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
      }

      // Xác thực webhook từ Stripe và gán vào biến event đã khai báo
      this.logger.debug('Verifying Stripe signature...');
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      this.logger.debug('Stripe signature verified successfully.');
    } catch (error) {
      // Log lỗi chi tiết từ Stripe signature verification
      this.logger.error(`!!! Stripe webhook signature verification failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }

    // Nếu xác thực thành công, tiếp tục xử lý event
    // Không cần kiểm tra if (!event) ở đây nữa vì nếu constructEvent lỗi, nó sẽ throw error và bị bắt bởi catch bên trên.

    try {
      // Sử dụng biến event đã được gán giá trị ở trên
      this.logger.log(`Processing verified Stripe webhook event: ${event.type}`);
      this.logger.debug(`Event data: ${JSON.stringify(event.data.object)}`);

      // Xử lý các loại event khác nhau
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        case 'checkout.session.completed':
          return this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          return { received: true };
      } // Added closing brace for switch
    } catch (processingError) {
       // Log lỗi trong quá trình xử lý event sau khi đã xác thực
       this.logger.error(`Error processing Stripe webhook event after verification: ${processingError.message}`, processingError.stack);
       // Quyết định xem có nên throw lỗi hay không, tùy thuộc vào logic mong muốn
       // throw new InternalServerErrorException('Error processing webhook event');
       // Hoặc chỉ trả về thành công để Stripe không gửi lại webhook
       return { received: true, error: 'Processing failed after verification' };
    }
  } // Added closing brace for handleWebhookEvent method

  /**
   * Xử lý khi payment intent thành công
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<any> {
    try {
      this.logger.log(`===== PROCESSING PAYMENT INTENT SUCCEEDED =====`);
      this.logger.debug(`Payment intent data: ${JSON.stringify(paymentIntent)}`);

      const { id, metadata } = paymentIntent;
      const { orderId, requestId, extraData: encodedExtraData, isNewOrder: isNewOrderStr } = metadata || {};

      if (!requestId) {
        this.logger.warn(`Payment intent ${id} succeeded but no requestId found in metadata`);
        return { received: true };
      }

      // Cập nhật trạng thái payment trong database
      this.logger.debug(`Updating payment status to PAID for requestId: ${requestId}`);
      const payment = await this.paymentModel.findOneAndUpdate(
        { requestId: requestId },
        {
          status: PaymentStatus.PAID,
          transactionId: id,
          paymentDetails: {
            $set: {
              paymentIntentId: id,
              responseTime: new Date(),
              status: 'succeeded'
            }
          }
        },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with requestId ${requestId} not found in database`);
        return { received: true };
      }

      // Giải mã extraData
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

      let extraDataObj: ParsedData = {};

      if (encodedExtraData) {
        try {
          const decodedData = Buffer.from(encodedExtraData, 'base64').toString();
          extraDataObj = JSON.parse(decodedData) as ExtraData;
          this.logger.debug(`Decoded extraData: ${JSON.stringify(extraDataObj)}`);
        } catch (error) {
          this.logger.error(`Error decoding extraData: ${error.message}`, error.stack);
        }
      }

      // Xác định xem có phải đơn hàng mới không
      const isNewOrder = isNewOrderStr === 'true' || extraDataObj.isNewOrder === true;
      this.logger.debug(`Is new order: ${isNewOrder}`);

      if (isNewOrder) {
        // Tạo đơn hàng mới từ dữ liệu tạm thời
        this.logger.debug(`Handling as NEW order. Finding pending order for requestId: ${requestId}`);
        const pendingOrder = await this.pendingOrderModel.findOne({ requestId: requestId });

        if (!pendingOrder) {
          this.logger.error(`!!! Pending order not found for requestId: ${requestId} !!!`);
          return { message: 'Không tìm thấy thông tin đơn hàng tạm thời' };
        }

        // Chuẩn bị dữ liệu đơn hàng
        const orderData = pendingOrder.orderData as any;

        // Thêm thông tin thanh toán vào đơn hàng
        const orderDataWithPayment = {
          ...orderData,
          paymentMethod: 'stripe',
          paymentStatus: PaymentStatus.PAID,
          metadata: {
            ...(orderData.metadata || {}),
            stripePaymentIntentId: id,
            paidAt: new Date()
          }
        };

        // Tạo đơn hàng mới với dữ liệu từ pendingOrder
        this.logger.debug('Calling ordersService.create...');
        const newOrder = await this.ordersService.create(orderDataWithPayment as any, pendingOrder.userId);
        this.logger.log(`Successfully created new order: ${newOrder._id}`);

        // Tạo vận đơn Viettel Post
        this.logger.debug(`Creating ViettelPost shipment for new order: ${newOrder._id}`);
        try {
          await this.ordersService.createViettelPostShipment(newOrder);
          this.logger.log(`Successfully created ViettelPost shipment for order: ${newOrder._id}`);
        } catch (shipmentError) {
           this.logger.error(`!!! Error creating ViettelPost shipment for new order ${newOrder._id}: ${shipmentError.message} !!!`, shipmentError.stack);
           // Không throw lỗi, tiếp tục xử lý
        }

        // Cập nhật orderId trong payment
        this.logger.debug(`Updating payment record with new orderId: ${newOrder._id}`);
        payment.orderId = newOrder._id as Types.ObjectId;
        await payment.save();

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
      } else if (orderId && orderId !== 'new') {
        // Cập nhật đơn hàng hiện có
        this.logger.debug(`Handling EXISTING order: ${orderId}`);

        try {
          const existingOrder = await this.ordersService.findOne(orderId);

          if (!existingOrder) {
            this.logger.error(`!!! Order ${orderId} not found !!!`);
            return { message: 'Không tìm thấy thông tin đơn hàng' };
          }

          // Cập nhật đơn hàng hiện có (chỉ cập nhật nếu chưa được xác nhận)
          if (existingOrder.status === OrderStatus.PENDING) {
            this.logger.debug(`Updating order status to CONFIRMED for order: ${orderId}`);
            await this.ordersService.updateStatus(
              orderId,
              OrderStatus.CONFIRMED
            );
            this.logger.log(`Successfully updated status for order: ${orderId}`);

            // Cập nhật trạng thái thanh toán
            await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);
            this.logger.log(`Successfully updated payment status for order: ${orderId}`);

            // Tạo vận đơn Viettel Post nếu chưa có
            if (!existingOrder.trackingCode) {
              this.logger.debug(`Creating ViettelPost shipment for order: ${orderId}`);
              try {
                await this.ordersService.createViettelPostShipment(existingOrder);
                this.logger.log(`Successfully created ViettelPost shipment for order: ${orderId}`);
              } catch (shipmentError) {
                this.logger.error(`!!! Error creating ViettelPost shipment: ${shipmentError.message} !!!`, shipmentError.stack);
                // Không throw lỗi, tiếp tục xử lý
              }
            } else {
              this.logger.warn(`Order ${orderId} already has tracking code ${existingOrder.trackingCode}. Skipping shipment creation.`);
            }

            // Xóa giỏ hàng của người dùng
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
          } else {
            this.logger.warn(`Order ${orderId} status is already ${existingOrder.status}. Skipping status update.`);
          }
        } catch (error) {
          this.logger.error(`!!! Error processing existing order ${orderId}: ${error.message} !!!`, error.stack);
        }
      } else {
        this.logger.error(`!!! Invalid or missing orderId in metadata and no pending order found. Cannot process order. RequestId: ${requestId} !!!`);
      }

      this.logger.log(`===== PAYMENT INTENT SUCCEEDED PROCESSING COMPLETE for RequestId: ${requestId} =====`);
      return { success: true, payment };
    } catch (error) {
      this.logger.error(`Error handling payment_intent.succeeded: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xử lý payment_intent.succeeded');
    }
  }

  /**
   * Xử lý khi payment intent thất bại
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<any> {
    try {
      this.logger.log(`===== PROCESSING PAYMENT INTENT FAILED =====`);
      this.logger.debug(`Payment intent data: ${JSON.stringify(paymentIntent)}`);

      const { id, metadata } = paymentIntent;
      const { orderId, requestId } = metadata || {};

      if (!requestId) {
        this.logger.warn(`Payment intent ${id} failed but no requestId found in metadata`);
        return { received: true };
      }

      // Cập nhật trạng thái payment trong database
      this.logger.debug(`Updating payment status to FAILED for requestId: ${requestId}`);
      const payment = await this.paymentModel.findOneAndUpdate(
        { requestId: requestId },
        {
          status: PaymentStatus.FAILED,
          transactionId: id,
          paymentDetails: {
            $set: {
              paymentIntentId: id,
              responseTime: new Date(),
              status: 'failed',
              error: paymentIntent.last_payment_error?.message || 'Unknown error'
            }
          }
        },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with requestId ${requestId} not found in database`);
        return { received: true };
      }

      // Nếu có orderId và không phải đơn hàng mới, cập nhật trạng thái đơn hàng
      if (orderId && orderId !== 'new') {
        this.logger.debug(`Updating payment status to FAILED for order: ${orderId}`);
        await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.FAILED);
        this.logger.log(`Successfully updated payment status for order: ${orderId}`);
      } else {
        // Nếu là đơn hàng mới, xóa đơn hàng tạm thời
        this.logger.debug(`Finding and deleting pending order for requestId: ${requestId}`);
        const pendingOrder = await this.pendingOrderModel.findOneAndDelete({ requestId: requestId });

        if (pendingOrder) {
          this.logger.log(`Deleted pending order for requestId: ${requestId}`);
        } else {
          this.logger.warn(`No pending order found for requestId: ${requestId}`);
        }
      }

      this.logger.log(`===== PAYMENT INTENT FAILED PROCESSING COMPLETE for RequestId: ${requestId} =====`);
      return { success: true, payment };
    } catch (error) {
      this.logger.error(`Error handling payment_intent.payment_failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xử lý payment_intent.payment_failed');
    }
  }

  /**
   * Xử lý khi checkout session hoàn thành
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<any> {
    try {
      this.logger.log(`===== PROCESSING CHECKOUT SESSION COMPLETED =====`);
      this.logger.debug(`Checkout session data: ${JSON.stringify(session)}`);

      const { id, metadata, payment_intent } = session;
      const { orderId, requestId, extraData: encodedExtraData, isNewOrder: isNewOrderStr } = metadata || {};

      if (!requestId) {
        this.logger.warn(`Checkout session ${id} completed but no requestId found in metadata`);
        return { received: true };
      }

      // Cập nhật trạng thái payment trong database
      this.logger.debug(`Updating payment status to PAID for requestId: ${requestId}`);
      const payment = await this.paymentModel.findOneAndUpdate(
        { requestId: requestId },
        {
          status: PaymentStatus.PAID,
          transactionId: id,
          paymentDetails: {
            $set: {
              sessionId: id,
              paymentIntentId: typeof payment_intent === 'string' ? payment_intent : undefined,
              responseTime: new Date(),
              status: 'completed'
            }
          }
        },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with requestId ${requestId} not found in database`);
        return { received: true };
      }

      // Giải mã extraData
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

      let extraDataObj: ParsedData = {};

      if (encodedExtraData) {
        try {
          const decodedData = Buffer.from(encodedExtraData, 'base64').toString();
          extraDataObj = JSON.parse(decodedData) as ExtraData;
          this.logger.debug(`Decoded extraData: ${JSON.stringify(extraDataObj)}`);
        } catch (error) {
          this.logger.error(`Error decoding extraData: ${error.message}`, error.stack);
        }
      }

      // Xác định xem có phải đơn hàng mới không
      const isNewOrder = isNewOrderStr === 'true' || extraDataObj.isNewOrder === true;
      this.logger.debug(`Is new order: ${isNewOrder}`);

      if (isNewOrder) {
        // Tạo đơn hàng mới từ dữ liệu tạm thời
        this.logger.debug(`Handling as NEW order. Finding pending order for requestId: ${requestId}`);
        const pendingOrder = await this.pendingOrderModel.findOne({ requestId: requestId });

        if (!pendingOrder) {
          this.logger.error(`!!! Pending order not found for requestId: ${requestId} !!!`);
          return { message: 'Không tìm thấy thông tin đơn hàng tạm thời' };
        }

        // Chuẩn bị dữ liệu đơn hàng
        const orderData = pendingOrder.orderData as any;

        // Thêm thông tin thanh toán vào đơn hàng
        const orderDataWithPayment = {
          ...orderData,
          paymentMethod: 'stripe',
          paymentStatus: PaymentStatus.PAID,
          metadata: {
            ...(orderData.metadata || {}),
            stripeSessionId: id,
            stripePaymentIntentId: typeof payment_intent === 'string' ? payment_intent : undefined,
            paidAt: new Date()
          }
        };

        // Tạo đơn hàng mới với dữ liệu từ pendingOrder
        this.logger.debug('Calling ordersService.create...');
        const newOrder = await this.ordersService.create(orderDataWithPayment as any, pendingOrder.userId);
        this.logger.log(`Successfully created new order: ${newOrder._id}`);

        // Tạo vận đơn Viettel Post
        this.logger.debug(`Creating ViettelPost shipment for new order: ${newOrder._id}`);
        try {
          await this.ordersService.createViettelPostShipment(newOrder);
          this.logger.log(`Successfully created ViettelPost shipment for order: ${newOrder._id}`);
        } catch (shipmentError) {
           this.logger.error(`!!! Error creating ViettelPost shipment for new order ${newOrder._id}: ${shipmentError.message} !!!`, shipmentError.stack);
           // Không throw lỗi, tiếp tục xử lý
        }

        // Cập nhật orderId trong payment
        this.logger.debug(`Updating payment record with new orderId: ${newOrder._id}`);
        payment.orderId = newOrder._id as Types.ObjectId;
        await payment.save();

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
      } else if (orderId && orderId !== 'new') {
        // Cập nhật đơn hàng hiện có
        this.logger.debug(`Handling EXISTING order: ${orderId}`);

        try {
          const existingOrder = await this.ordersService.findOne(orderId);

          if (!existingOrder) {
            this.logger.error(`!!! Order ${orderId} not found !!!`);
            return { message: 'Không tìm thấy thông tin đơn hàng' };
          }

          // Cập nhật đơn hàng hiện có (chỉ cập nhật nếu chưa được xác nhận)
          if (existingOrder.status === OrderStatus.PENDING) {
            this.logger.debug(`Updating order status to CONFIRMED for order: ${orderId}`);
            await this.ordersService.updateStatus(
              orderId,
              OrderStatus.CONFIRMED
            );
            this.logger.log(`Successfully updated status for order: ${orderId}`);

            // Cập nhật trạng thái thanh toán
            await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);
            this.logger.log(`Successfully updated payment status for order: ${orderId}`);

            // Tạo vận đơn Viettel Post nếu chưa có
            if (!existingOrder.trackingCode) {
              this.logger.debug(`Creating ViettelPost shipment for order: ${orderId}`);
              try {
                await this.ordersService.createViettelPostShipment(existingOrder);
                this.logger.log(`Successfully created ViettelPost shipment for order: ${orderId}`);
              } catch (shipmentError) {
                this.logger.error(`!!! Error creating ViettelPost shipment: ${shipmentError.message} !!!`, shipmentError.stack);
                // Không throw lỗi, tiếp tục xử lý
              }
            } else {
              this.logger.warn(`Order ${orderId} already has tracking code ${existingOrder.trackingCode}. Skipping shipment creation.`);
            }

            // Xóa giỏ hàng của người dùng
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
          } else {
            this.logger.warn(`Order ${orderId} status is already ${existingOrder.status}. Skipping status update.`);
          }
        } catch (error) {
          this.logger.error(`!!! Error processing existing order ${orderId}: ${error.message} !!!`, error.stack);
        }
      } else {
        this.logger.error(`!!! Invalid or missing orderId in metadata and no pending order found. Cannot process order. RequestId: ${requestId} !!!`);
      }

      this.logger.log(`===== CHECKOUT SESSION COMPLETED PROCESSING COMPLETE for RequestId: ${requestId} =====`);
      return { success: true, payment };
    } catch (error) {
      this.logger.error(`Error handling checkout.session.completed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xử lý checkout.session.completed');
    }
  }

  /**
   * Xác nhận thanh toán (phương thức này chỉ dùng cho frontend cũ, nên giữ lại để tương thích)
   */
  async confirmPayment(paymentIntentId: string, orderId: string): Promise<any> {
    try {
      this.logger.log(`Manual confirmation of payment intent ${paymentIntentId} for order ${orderId}`);

      // Kiểm tra payment intent có tồn tại không
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        throw new BadRequestException(`Payment intent ${paymentIntentId} not found`);
      }

      // Kiểm tra trạng thái payment intent
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(`Payment intent ${paymentIntentId} has not succeeded yet`);
      }

      // Cập nhật trạng thái payment trong database
      const payment = await this.paymentModel.findOneAndUpdate(
        { transactionId: paymentIntentId },
        { status: PaymentStatus.PAID },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with transactionId ${paymentIntentId} not found in database`);
      }

      // Cập nhật trạng thái đơn hàng
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);

      // Tìm đơn hàng để kiểm tra trạng thái
      const order = await this.ordersService.findOne(orderId);

      // Tạo vận đơn Viettel Post nếu chưa có
      if (order && !order.trackingCode) {
        this.logger.debug(`Creating ViettelPost shipment for order: ${orderId}`);
        try {
          await this.ordersService.createViettelPostShipment(order);
          this.logger.log(`Successfully created ViettelPost shipment for order: ${orderId}`);
        } catch (shipmentError) {
          this.logger.error(`!!! Error creating ViettelPost shipment: ${shipmentError.message} !!!`, shipmentError.stack);
          // Không throw lỗi, tiếp tục xử lý
        }
      }

      // Xóa giỏ hàng của người dùng
      if (order && order.userId) {
        this.logger.debug(`Clearing cart for user: ${order.userId}`);
        try {
          await this.cartsService.clearCart(order.userId.toString());
          this.logger.log(`Successfully cleared cart for user: ${order.userId}`);
        } catch (cartError) {
          this.logger.error(`!!! Error clearing cart for user ${order.userId}: ${cartError.message} !!!`, cartError.stack);
          // Không throw lỗi, tiếp tục xử lý
        }
      }

      return { success: true, payment };
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xác nhận thanh toán');
    }
  }
}
