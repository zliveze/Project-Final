import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { CreateStripePaymentDto } from './dto';
import { OrdersService } from '../../orders/orders.service';
import { PaymentStatus } from '../../orders/schemas/order.schema';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
    });
  }

  /**
   * Tạo một Stripe Checkout Session
   */
  async createCheckoutSession(createStripePaymentDto: CreateStripePaymentDto): Promise<any> {
    try {
      const { amount, currency, orderId, description, metadata } = createStripePaymentDto;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      // Tạo Checkout Session với Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: description || 'Đơn hàng Yumin',
                description: `Đơn hàng #${orderId}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${frontendUrl}/payments?canceled=true`,
        metadata: {
          orderId: orderId || null,
          ...metadata,
        },
      });

      // Lưu thông tin payment vào database
      const payment = new this.paymentModel({
        orderId,
        amount,
        method: 'stripe',
        status: 'pending',
        transactionId: session.id,
        paymentDetails: {
          sessionId: session.id,
          currency,
        },
      });

      await payment.save();

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
      const { amount, currency, orderId, description, metadata } = createStripePaymentDto;

      // Tạo payment intent với Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        description: description || 'Thanh toán đơn hàng Yumin',
        metadata: {
          orderId: orderId || null,
          ...metadata,
        },
      });

      // Lưu thông tin payment vào database
      const payment = new this.paymentModel({
        orderId,
        amount,
        method: 'stripe',
        status: 'pending',
        transactionId: paymentIntent.id,
        paymentDetails: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          currency,
        },
      });

      await payment.save();

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
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
      }

      // Xác thực webhook từ Stripe
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.log(`Received Stripe webhook event: ${event.type}`);

      // Xử lý các loại event khác nhau
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object);
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object);
        case 'checkout.session.completed':
          return this.handleCheckoutSessionCompleted(event.data.object);
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          return { received: true };
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe webhook: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Xử lý khi payment intent thành công
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<any> {
    try {
      const { id, metadata } = paymentIntent;
      const { orderId } = metadata || {};

      if (!orderId) {
        this.logger.warn(`Payment intent ${id} succeeded but no orderId found in metadata`);
        return { received: true };
      }

      // Cập nhật trạng thái payment trong database
      const payment = await this.paymentModel.findOneAndUpdate(
        { transactionId: id },
        { status: 'completed' },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with transactionId ${id} not found in database`);
      }

      // Cập nhật trạng thái đơn hàng
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);

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
      const { id, metadata } = paymentIntent;
      const { orderId } = metadata || {};

      if (!orderId) {
        this.logger.warn(`Payment intent ${id} failed but no orderId found in metadata`);
        return { received: true };
      }

      // Cập nhật trạng thái payment trong database
      const payment = await this.paymentModel.findOneAndUpdate(
        { transactionId: id },
        { status: 'failed' },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with transactionId ${id} not found in database`);
      }

      // Cập nhật trạng thái đơn hàng
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.FAILED);

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
      const { id, metadata } = session;
      const { orderId } = metadata || {};

      if (!orderId) {
        this.logger.warn(`Checkout session ${id} completed but no orderId found in metadata`);
        return { received: true };
      }

      // Cập nhật trạng thái payment trong database
      const payment = await this.paymentModel.findOneAndUpdate(
        { transactionId: id },
        { status: 'completed' },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with transactionId ${id} not found in database`);
      }

      // Cập nhật trạng thái đơn hàng
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);

      return { success: true, payment };
    } catch (error) {
      this.logger.error(`Error handling checkout.session.completed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xử lý checkout.session.completed');
    }
  }

  /**
   * Xác nhận thanh toán
   */
  async confirmPayment(paymentIntentId: string, orderId: string): Promise<any> {
    try {
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
        { status: 'completed' },
        { new: true },
      );

      if (!payment) {
        this.logger.warn(`Payment with transactionId ${paymentIntentId} not found in database`);
      }

      // Cập nhật trạng thái đơn hàng
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);

      return { success: true, payment };
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Không thể xác nhận thanh toán');
    }
  }
}
