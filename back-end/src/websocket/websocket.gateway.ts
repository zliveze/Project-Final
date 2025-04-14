import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  namespace: '/',
  transports: ['websocket', 'polling']
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  /**
   * Gửi cập nhật tiến độ xử lý import Excel
   */
  sendImportProgress(data: { userId: string, progress: number, status: string, message?: string }) {
    this.logger.log(`Sending import progress: ${JSON.stringify(data)}`);

    try {
      // Gửi đến tất cả client với userId
      this.server.emit(`import-progress-${data.userId}`, {
        progress: data.progress,
        status: data.status,
        message: data.message
      });

      // Gửi đến tất cả client không có userId
      this.server.emit('import-progress', {
        progress: data.progress,
        status: data.status,
        message: data.message
      });

      // Log để debug
      this.logger.log(`Event emitted: import-progress-${data.userId} and import-progress`);

      // Nếu là trạng thái hoàn thành, gửi thêm nhiều lần để đảm bảo client nhận được
      if (data.status === 'completed' && data.progress === 100) {
        // Gửi lại nhiều lần với khoảng thời gian khác nhau
        [500, 1000, 2000, 3000].forEach((delay) => {
          setTimeout(() => {
            this.logger.log(`Re-sending completed event for user ${data.userId} after ${delay}ms`);
            // Gửi lại cả hai sự kiện
            this.server.emit(`import-progress-${data.userId}`, {
              progress: data.progress,
              status: data.status,
              message: data.message
            });

            this.server.emit('import-progress', {
              progress: data.progress,
              status: data.status,
              message: data.message
            });
          }, delay);
        });

        // Gửi cho tất cả các client đã kết nối
        for (const [clientId, client] of this.clients.entries()) {
          this.logger.log(`Sending directly to client ${clientId}`);
          // Gửi trực tiếp đến client cả hai sự kiện
          client.emit(`import-progress-${data.userId}`, {
            progress: data.progress,
            status: data.status,
            message: data.message
          });

          client.emit('import-progress', {
            progress: data.progress,
            status: data.status,
            message: data.message
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error sending import progress: ${error.message}`);
    }
  }
}
