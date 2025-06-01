import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../schemas/chat-message.schema';

export class SendMessageDto {
  @ApiProperty({ 
    description: 'Nội dung tin nhắn từ người dùng',
    example: 'Tôi có da dầu, bạn có thể gợi ý sản phẩm nào phù hợp không?'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ 
    description: 'ID phiên chat (nếu không có sẽ tạo mới)',
    example: 'session_123456789'
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ 
    description: 'ID người dùng (sử dụng khi gọi từ frontend)',
    example: '64a1b2c3d4e5f6g7h8i9j0k1'
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Thông tin về loại da của người dùng',
    example: 'da dầu'
  })
  @IsString()
  @IsOptional()
  skinType?: string;

  @ApiPropertyOptional({ 
    description: 'Các vấn đề về da mà người dùng quan tâm',
    type: [String],
    example: ['mụn', 'lỗ chân lông to']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  concerns?: string[];

  @ApiPropertyOptional({ 
    description: 'Ngân sách tối đa',
    example: 500000
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ 
    description: 'Thương hiệu ưa thích',
    type: [String],
    example: ['L\'Oreal', 'Maybelline']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredBrands?: string[];
}

export class ChatResponseDto {
  @ApiProperty({ 
    description: 'ID tin nhắn',
    example: '64a1b2c3d4e5f6g7h8i9j0k1'
  })
  messageId: string;

  @ApiProperty({ 
    description: 'ID phiên chat',
    example: 'session_123456789'
  })
  sessionId: string;

  @ApiProperty({ 
    description: 'Nội dung phản hồi từ AI',
    example: 'Với da dầu, tôi gợi ý bạn những sản phẩm sau...'
  })
  response: string;

  @ApiProperty({ 
    description: 'Loại tin nhắn',
    enum: MessageType
  })
  type: MessageType;

  @ApiPropertyOptional({ 
    description: 'Danh sách sản phẩm được gợi ý',
    type: [Object]
  })
  recommendedProducts?: Array<{
    id: string;
    name: string;
    price: number;
    currentPrice?: number;
    brand: string;
    imageUrl?: string;
    reason: string;
  }>;

  @ApiPropertyOptional({ 
    description: 'Thông tin danh mục liên quan',
    type: [Object]
  })
  relatedCategories?: Array<{
    id: string;
    name: string;
    description: string;
    level: number;
  }>;

  @ApiPropertyOptional({ 
    description: 'Thông tin thương hiệu liên quan',
    type: [Object]
  })
  relatedBrands?: Array<{
    id: string;
    name: string;
    description: string;
    origin: string;
  }>;

  @ApiPropertyOptional({ 
    description: 'Thông tin sự kiện liên quan',
    type: [Object]
  })
  relatedEvents?: Array<{
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    discountInfo: string;
    products?: Array<{
      productId: string;
      productName: string;
      adjustedPrice: number;
      originalPrice: number;
      image: string;
    }>;
  }>;

  @ApiPropertyOptional({ 
    description: 'Thông tin chiến dịch liên quan',
    type: [Object]
  })
  relatedCampaigns?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    startDate: Date;
    endDate: Date;
    products?: Array<{
      productId: string;
      productName: string;
      adjustedPrice: number;
      originalPrice: number;
      image: string;
    }>;
  }>;

  @ApiPropertyOptional({ 
    description: 'Metadata về phản hồi',
    type: Object
  })
  metadata?: {
    userIntent?: string;
    confidence?: number;
    processingTime?: number;
    contextUsed?: string[];
  };

  @ApiProperty({ 
    description: 'Thời gian tạo tin nhắn'
  })
  createdAt: Date;
}

export class GetChatHistoryDto {
  @ApiPropertyOptional({ 
    description: 'ID phiên chat cụ thể',
    example: 'session_123456789'
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
  
  @ApiPropertyOptional({ 
    description: 'ID người dùng (sử dụng khi gọi từ frontend)',
    example: '64a1b2c3d4e5f6g7h8i9j0k1'
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Số trang',
    example: 1,
    default: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Số tin nhắn mỗi trang',
    example: 20,
    default: 20
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class ChatHistoryResponseDto {
  @ApiProperty({ 
    description: 'Danh sách tin nhắn',
    type: [Object]
  })
  messages: Array<{
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    type: MessageType;
    attachedProducts?: any[];
    attachedCategories?: any[];
    attachedBrands?: any[];
    attachedEvents?: any[];
    metadata?: any;
    isHelpful?: boolean;
    feedback?: string;
    createdAt: Date;
  }>;

  @ApiProperty({ 
    description: 'Thông tin phân trang'
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty({ 
    description: 'ID phiên chat'
  })
  sessionId: string;
}

export class FeedbackDto {
  @ApiProperty({ 
    description: 'ID tin nhắn cần đánh giá',
    example: '64a1b2c3d4e5f6g7h8i9j0k1'
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ 
    description: 'Tin nhắn có hữu ích không',
    example: true
  })
  @IsBoolean()
  isHelpful: boolean;

  @ApiPropertyOptional({ 
    description: 'Phản hồi chi tiết từ người dùng',
    example: 'Thông tin rất hữu ích, cảm ơn!'
  })
  @IsString()
  @IsOptional()
  feedback?: string;
  
  @ApiPropertyOptional({ 
    description: 'ID người dùng (sử dụng khi gọi từ frontend)',
    example: '64a1b2c3d4e5f6g7h8i9j0k1'
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class SearchProductsDto {
  @ApiProperty({ 
    description: 'Từ khóa tìm kiếm',
    example: 'serum vitamin c'
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ 
    description: 'Loại da',
    example: 'da dầu'
  })
  @IsString()
  @IsOptional()
  skinType?: string;

  @ApiPropertyOptional({ 
    description: 'Vấn đề da',
    type: [String],
    example: ['mụn', 'thâm nám']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  concerns?: string[];

  @ApiPropertyOptional({ 
    description: 'Ngân sách tối đa',
    example: 1000000
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ 
    description: 'ID thương hiệu',
    example: '64a1b2c3d4e5f6g7h8i9j0k1'
  })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ 
    description: 'Số lượng sản phẩm tối đa trả về',
    example: 10,
    default: 10
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}

export class ProductRecommendationDto {
  @ApiPropertyOptional({ 
    description: 'Loại da',
    example: 'da dầu'
  })
  @IsString()
  @IsOptional()
  skinType?: string;

  @ApiPropertyOptional({ 
    description: 'Vấn đề da',
    type: [String],
    example: ['mụn', 'lỗ chân lông to']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  concerns?: string[];

  @ApiPropertyOptional({ 
    description: 'Ngân sách tối đa',
    example: 500000
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ 
    description: 'Thương hiệu ưa thích',
    type: [String],
    example: ['L\'Oreal', 'Maybelline']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredBrands?: string[];

  @ApiPropertyOptional({ 
    description: 'Loại sản phẩm cần tìm',
    example: 'serum'
  })
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional({ 
    description: 'Số lượng sản phẩm gợi ý',
    example: 5,
    default: 5
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 5;
}

export class ChatSessionDto {
  @ApiProperty({ 
    description: 'ID phiên chat'
  })
  sessionId: string;

  @ApiProperty({ 
    description: 'Ngày tạo phiên'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Ngày cập nhật gần nhất'
  })
  lastMessageAt: Date;

  @ApiProperty({ 
    description: 'Số lượng tin nhắn trong phiên'
  })
  messageCount: number;

  @ApiPropertyOptional({ 
    description: 'Tin nhắn cuối cùng (preview)'
  })
  lastMessage?: string;
} 