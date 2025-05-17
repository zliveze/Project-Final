import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);

  constructor(private readonly websocketGateway: WebsocketGateway) {}

  emitImportProgress(userId: string, progress: number, status: string, message?: string, summary?: any) {
    try {
      this.websocketGateway.sendImportProgress({
        userId,
        progress,
        status,
        message,
        summary
      });
    } catch (error) {
      this.logger.error(`Lỗi khi gửi cập nhật tiến độ: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo khi trạng thái đánh giá thay đổi
   */
  emitReviewStatusUpdated(reviewId: string, userId: string, productId: string, status: 'pending' | 'approved' | 'rejected', review?: any) {
    try {
      this.websocketGateway.sendReviewStatusUpdated({
        reviewId,
        userId,
        productId,
        status,
        review
      });
    } catch (error) {
      this.logger.error(`Lỗi khi gửi thông báo cập nhật trạng thái đánh giá: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo khi có đánh giá mới được tạo
   */
  emitNewReviewCreated(reviewId: string, userId: string, productId: string, review: any) {
    try {
      this.websocketGateway.sendNewReviewCreated({
        reviewId,
        userId,
        productId,
        review
      });
    } catch (error) {
      this.logger.error(`Lỗi khi gửi thông báo đánh giá mới: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo khi đánh giá bị xóa
   */
  emitReviewDeleted(reviewId: string, userId: string, productId: string) {
    try {
      this.websocketGateway.sendReviewDeleted({
        reviewId,
        userId,
        productId
      });
    } catch (error) {
      this.logger.error(`Lỗi khi gửi thông báo xóa đánh giá: ${error.message}`);
    }
  }
}
