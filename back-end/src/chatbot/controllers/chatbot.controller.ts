import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from '../services/chatbot.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  SendMessageDto,
  ChatResponseDto,
  GetChatHistoryDto,
  ChatHistoryResponseDto,
  FeedbackDto,
  SearchProductsDto,
  ProductRecommendationDto,
} from '../dto/chat.dto';

@ApiTags('Chatbot AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Gửi tin nhắn cho AI chatbot',
    description: 'Gửi tin nhắn và nhận phản hồi từ AI chatbot với gợi ý sản phẩm và thông tin liên quan'
  })
  @ApiResponse({
    status: 200,
    description: 'Phản hồi thành công từ AI chatbot',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async sendMessage(
    @Request() req: any,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ChatResponseDto> {
    try {
      // Ưu tiên userId từ token, nếu không có thì lấy từ request body
      const userId = req.user?.id || sendMessageDto.userId;
      
      this.logger.log(`User ${userId} sending message to chatbot`);
      
      if (!userId) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng');
      }
      
      if (!sendMessageDto.message?.trim()) {
        throw new BadRequestException('Tin nhắn không được để trống');
      }

      const response = await this.chatbotService.sendMessage(
        userId,
        sendMessageDto,
      );

      // Cải thiện định dạng ngày cho events
      if (response.relatedEvents && response.relatedEvents.length > 0) {
        response.relatedEvents = response.relatedEvents.map(event => ({
          ...event,
          startDateFormatted: new Date(event.startDate).toLocaleDateString('vi-VN'),
          endDateFormatted: new Date(event.endDate).toLocaleDateString('vi-VN'),
          durationText: `Từ ${new Date(event.startDate).toLocaleDateString('vi-VN')} đến ${new Date(event.endDate).toLocaleDateString('vi-VN')}`,
        }));
      }

      this.logger.log(`Message processed successfully for user ${userId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error in sendMessage: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Lấy lịch sử chat',
    description: 'Lấy lịch sử chat của người dùng với phân trang'
  })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử chat được trả về thành công',
    type: ChatHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async getChatHistory(
    @Request() req: any,
    @Query() getChatHistoryDto: GetChatHistoryDto,
  ): Promise<ChatHistoryResponseDto> {
    try {
      // Ưu tiên userId từ token, nếu không có thì lấy từ request query
      const userId = req.user?.id || getChatHistoryDto.userId;
      
      this.logger.log(`User ${userId} requesting chat history`);
      
      if (!userId) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng');
      }
      
      return await this.chatbotService.getChatHistory(
        userId,
        getChatHistoryDto,
      );
    } catch (error) {
      this.logger.error(`Error in getChatHistory: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('search-products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Tìm kiếm sản phẩm thông qua chatbot',
    description: 'Tìm kiếm sản phẩm với các bộ lọc thông minh'
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả tìm kiếm sản phẩm',
    type: [Object],
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu tìm kiếm không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async searchProducts(
    @Request() req: any,
    @Body() searchProductsDto: SearchProductsDto,
  ): Promise<any[]> {
    try {
      this.logger.log(`User ${req.user.id} searching products: ${searchProductsDto.query}`);
      
      if (!searchProductsDto.query?.trim()) {
        throw new BadRequestException('Từ khóa tìm kiếm không được để trống');
      }

      return await this.chatbotService.searchProducts(searchProductsDto);
    } catch (error) {
      this.logger.error(`Error in searchProducts: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('feedback/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Đánh giá tin nhắn chatbot',
    description: 'Đánh giá tin nhắn từ chatbot có hữu ích hay không'
  })
  @ApiResponse({
    status: 200,
    description: 'Phản hồi đã được ghi nhận',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu phản hồi không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tin nhắn',
  })
  async provideFeedback(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() feedbackDto: FeedbackDto,
  ): Promise<{ message: string }> {
    try {
      // Ưu tiên userId từ token, nếu không có thì lấy từ request body
      const userId = req.user?.id || feedbackDto.userId;
      
      this.logger.log(`User ${userId} providing feedback for message ${messageId}`);
      
      if (!userId) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng');
      }
      
      if (!messageId?.trim()) {
        throw new BadRequestException('ID tin nhắn không hợp lệ');
      }

      await this.chatbotService.provideFeedback(
        userId,
        messageId,
        feedbackDto,
      );

      return { message: 'Phản hồi đã được ghi nhận thành công' };
    } catch (error) {
      this.logger.error(`Error in provideFeedback: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Public()
  @Get('health')
  @ApiOperation({ 
    summary: 'Kiểm tra trạng thái chatbot',
    description: 'Kiểm tra xem chatbot service có hoạt động bình thường không'
  })
  @ApiResponse({
    status: 200,
    description: 'Chatbot hoạt động bình thường',
  })
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error in healthCheck: ${error.message}`, error.stack);
      throw error;
    }
  }
} 