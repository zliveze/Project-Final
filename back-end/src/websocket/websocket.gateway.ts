import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'https://project-final-livid.vercel.app',
    credentials: true
  },
  namespace: '/',
  transports: ['websocket', 'polling']
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  // Lưu trữ thông tin về các client đã kết nối
  private clients: Map<string, Socket> = new Map();

  // Lưu trữ mapping giữa userId và socketId
  private userSockets: Map<string, string[]> = new Map();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Xóa client khỏi danh sách clients
    this.clients.delete(client.id);

    // Xóa client khỏi userSockets mapping
    this.userSockets.forEach((socketIds, userId) => {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    });
  }

  // Xử lý sự kiện khi người dùng tham gia vào phòng của họ
  @SubscribeMessage('joinUserRoom')
  handleJoinRoom(client: Socket, payload: { userId: string }) {
    try {
      const { userId } = payload;
      if (!userId) {
        this.logger.warn(`Client ${client.id} attempted to join room without userId`);
        return;
      }

      this.logger.log(`Client ${client.id} joining room for user ${userId}`);

      // Thêm socketId vào mapping với userId
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }

      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds && !userSocketIds.includes(client.id)) {
        userSocketIds.push(client.id);
      }

      // Tham gia vào phòng dựa trên userId
      client.join(`user-${userId}`);

      // Tham gia vào phòng admin nếu client có role admin
      if (client.handshake.query.role === 'admin' || client.handshake.query.role === 'superadmin') {
        client.join('admin-room');
        this.logger.log(`Admin client ${client.id} joined admin-room`);
      }
    } catch (error) {
      this.logger.error(`Error in handleJoinRoom: ${error.message}`);
    }
  }

  /**
   * Gửi cập nhật tiến độ xử lý import Excel
   */
  sendImportProgress(data: { userId: string, progress: number, status: string, message?: string, summary?: any }) {
    this.logger.log(`Sending import progress: ${JSON.stringify(data)}`);

    try {
      // Gửi đến tất cả client với userId
      this.server.emit(`import-progress-${data.userId}`, {
        progress: data.progress,
        status: data.status,
        message: data.message,
        summary: data.summary
      });

      // Gửi đến tất cả client không có userId
      this.server.emit('import-progress', {
        progress: data.progress,
        status: data.status,
        message: data.message,
        summary: data.summary
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
              message: data.message,
              summary: data.summary
            });

            this.server.emit('import-progress', {
              progress: data.progress,
              status: data.status,
              message: data.message,
              summary: data.summary
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
            message: data.message,
            summary: data.summary
          });

          client.emit('import-progress', {
            progress: data.progress,
            status: data.status,
            message: data.message,
            summary: data.summary
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error sending import progress: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo khi trạng thái đánh giá thay đổi
   */
  sendReviewStatusUpdated(data: {
    reviewId: string,
    userId: string,
    productId: string,
    status: 'pending' | 'approved' | 'rejected',
    review?: any
  }) {
    try {
      this.logger.log(`Sending review status update: ${JSON.stringify(data)}`);

      // Gửi thông báo đến phòng của người dùng cụ thể
      this.server.to(`user-${data.userId}`).emit('reviewStatusUpdated', {
        reviewId: data.reviewId,
        productId: data.productId,
        status: data.status,
        review: data.review
      });

      // Gửi thông báo đến phòng admin
      this.server.to('admin-room').emit('reviewStatusUpdated', {
        reviewId: data.reviewId,
        userId: data.userId,
        productId: data.productId,
        status: data.status,
        review: data.review
      });

      // Gửi thông báo đến tất cả người dùng đang xem sản phẩm này
      this.server.emit(`product-${data.productId}-review-updated`, {
        reviewId: data.reviewId,
        status: data.status,
        review: data.review
      });

    } catch (error) {
      this.logger.error(`Error sending review status update: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo khi có đánh giá mới được tạo
   */
  sendNewReviewCreated(data: {
    reviewId: string,
    userId: string,
    productId: string,
    review: any
  }) {
    try {
      this.logger.log(`Sending new review notification: ${JSON.stringify(data)}`);

      // Gửi thông báo đến phòng admin
      this.server.to('admin-room').emit('newReviewCreated', {
        reviewId: data.reviewId,
        userId: data.userId,
        productId: data.productId,
        review: data.review
      });

    } catch (error) {
      this.logger.error(`Error sending new review notification: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo khi đánh giá bị xóa
   */
  sendReviewDeleted(data: {
    reviewId: string,
    userId: string,
    productId: string
  }) {
    try {
      this.logger.log(`Sending review deleted notification: ${JSON.stringify(data)}`);

      // Gửi thông báo đến phòng của người dùng cụ thể
      this.server.to(`user-${data.userId}`).emit('reviewDeleted', {
        reviewId: data.reviewId,
        productId: data.productId
      });

      // Gửi thông báo đến phòng admin
      this.server.to('admin-room').emit('reviewDeleted', {
        reviewId: data.reviewId,
        userId: data.userId,
        productId: data.productId
      });

      // Gửi thông báo đến tất cả người dùng đang xem sản phẩm này
      this.server.emit(`product-${data.productId}-review-deleted`, {
        reviewId: data.reviewId
      });

    } catch (error) {
      this.logger.error(`Error sending review deleted notification: ${error.message}`);
    }
  }
}
