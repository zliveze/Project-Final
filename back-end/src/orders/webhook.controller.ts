import { Controller, Post, Body, HttpCode, HttpStatus, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
    import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
    import { ConfigService } from '@nestjs/config';
    import { OrdersService } from './orders.service';
    import { ViettelPostWebhookDto } from './dto/viettelpost-webhook.dto';

    @ApiTags('Webhooks')
    @Controller('webhook')
    export class WebhookController {
      private readonly logger = new Logger(WebhookController.name);
      private readonly viettelPostWebhookToken: string | undefined; // Allow undefined

      constructor(
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
      ) {
        // Lấy token webhook từ biến môi trường
        this.viettelPostWebhookToken = this.configService.get<string>('VIETTELPOST_WEBHOOK_TOKEN');
        if (!this.viettelPostWebhookToken) {
          this.logger.warn('VIETTELPOST_WEBHOOK_TOKEN is not configured in environment variables.');
        }
      }

      @Post('viettelpost')
      @HttpCode(HttpStatus.OK) // ViettelPost thường mong đợi 200 OK
      @ApiOperation({ summary: 'Nhận webhook cập nhật trạng thái từ Viettel Post' })
      @ApiBody({ type: ViettelPostWebhookDto })
      @ApiResponse({ status: 200, description: 'Webhook đã được xử lý thành công' })
      @ApiResponse({ status: 400, description: 'Dữ liệu webhook không hợp lệ' })
      @ApiResponse({ status: 403, description: 'Token không hợp lệ' })
      async handleViettelPostWebhook(@Body() webhookDto: ViettelPostWebhookDto): Promise<{ message: string }> {
        this.logger.log('Received ViettelPost webhook');
        this.logger.debug(`Webhook Payload: ${JSON.stringify(webhookDto)}`);

        // 1. Xác thực Token (nếu đã cấu hình)
        if (this.viettelPostWebhookToken && webhookDto.TOKEN !== this.viettelPostWebhookToken) {
          this.logger.warn(`Invalid ViettelPost webhook token received: ${webhookDto.TOKEN}`);
          throw new ForbiddenException('Invalid webhook token');
        } else if (!this.viettelPostWebhookToken) {
          this.logger.warn('Skipping webhook token validation as VIETTELPOST_WEBHOOK_TOKEN is not set.');
        }

        // 2. Kiểm tra dữ liệu DATA có tồn tại không
        if (!webhookDto.DATA) {
          this.logger.error('ViettelPost webhook payload is missing DATA field.');
          throw new BadRequestException('Missing DATA field in webhook payload');
        }

        // 3. Gọi service để xử lý dữ liệu webhook
        try {
          await this.ordersService.handleViettelPostWebhook(webhookDto.DATA);
          this.logger.log(`Successfully processed ViettelPost webhook for order: ${webhookDto.DATA.ORDER_NUMBER}`);
          return { message: 'Webhook processed successfully' };
        } catch (error) {
          this.logger.error(`Error processing ViettelPost webhook: ${error.message}`, error.stack);
          // Ném lỗi để NestJS trả về lỗi 500 hoặc lỗi cụ thể nếu là BadRequestException, NotFoundException,...
          throw error;
        }
      }
    }
