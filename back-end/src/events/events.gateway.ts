import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'https://project-final-livid.vercel.app',
    credentials: true
  }
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);
  
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

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
    this.server.emit(`import-progress-${data.userId}`, {
      progress: data.progress,
      status: data.status,
      message: data.message
    });
  }
}
