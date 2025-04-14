import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);

  constructor(private readonly websocketGateway: WebsocketGateway) {}

  emitImportProgress(userId: string, progress: number, status: string, message?: string) {
    try {
      this.websocketGateway.sendImportProgress({
        userId,
        progress,
        status,
        message
      });
    } catch (error) {
      this.logger.error(`Lỗi khi gửi cập nhật tiến độ: ${error.message}`);
    }
  }
}
