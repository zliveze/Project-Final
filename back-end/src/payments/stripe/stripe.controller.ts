import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  RawBodyRequest,
  BadRequestException,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateStripePaymentDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('payments/stripe')
@Controller('payments/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo phiên thanh toán Stripe Checkout' })
  @ApiResponse({ status: 201, description: 'Phiên thanh toán đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createCheckoutSession(
    @Body() createStripePaymentDto: CreateStripePaymentDto,
    @CurrentUser('userId') userId: string,
  ) {
    // Thêm userId vào metadata
    const metadata = {
      ...createStripePaymentDto.metadata,
      userId,
    };

    return this.stripeService.createCheckoutSession({
      ...createStripePaymentDto,
      metadata,
    });
  }

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo payment intent với Stripe' })
  @ApiResponse({ status: 201, description: 'Payment intent đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createPaymentIntent(
    @Body() createStripePaymentDto: CreateStripePaymentDto,
    @CurrentUser('userId') userId: string,
  ) {
    // Thêm userId vào metadata
    const metadata = {
      ...createStripePaymentDto.metadata,
      userId,
    };

    return this.stripeService.createPaymentIntent({
      ...createStripePaymentDto,
      metadata,
    });
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook từ Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook đã được xử lý thành công' })
  @ApiResponse({ status: 400, description: 'Webhook không hợp lệ' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const payload = request.rawBody;
    if (!payload) {
      throw new BadRequestException('Missing request body');
    }

    return this.stripeService.handleWebhookEvent(signature, payload);
  }

  @Post('confirm/:paymentIntentId/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác nhận thanh toán' })
  @ApiResponse({ status: 200, description: 'Thanh toán đã được xác nhận thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async confirmPayment(
    @Param('paymentIntentId') paymentIntentId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.stripeService.confirmPayment(paymentIntentId, orderId);
  }
}
