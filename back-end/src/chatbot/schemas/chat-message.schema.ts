import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  PRODUCT_RECOMMENDATION = 'product_recommendation',
  SEARCH_RESULT = 'search_result',
  CATEGORY_INFO = 'category_info',
  BRAND_INFO = 'brand_info',
  EVENT_INFO = 'event_info',
  ERROR = 'error'
}

@Schema()
export class AttachedProduct {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  price: number;

  @Prop()
  currentPrice?: number;

  @Prop()
  brand: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  reason?: string; // Lý do gợi ý sản phẩm này
}

@Schema()
export class AttachedCategory {
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description?: string;

  @Prop()
  level: number;
}

@Schema()
export class AttachedBrand {
  @Prop({ type: Types.ObjectId, ref: 'Brand' })
  brandId: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description?: string;

  @Prop()
  origin?: string;
}

@Schema()
export class AttachedEvent {
  @Prop({ type: Types.ObjectId, ref: 'Event' })
  eventId: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  description?: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  discountInfo?: string;
}

@Schema()
export class MessageMetadata {
  @Prop()
  userIntent?: string; // Ý định của người dùng (search, recommendation, question, etc.)

  @Prop()
  confidence?: number; // Độ tin cậy của phản hồi AI (0-1)

  @Prop()
  processingTime?: number; // Thời gian xử lý (ms)

  @Prop()
  contextUsed?: string[]; // Loại context đã sử dụng (products, categories, brands, etc.)

  @Prop()
  searchQuery?: string; // Query tìm kiếm nếu có

  @Prop()
  skinType?: string; // Loại da nếu user cung cấp

  @Prop()
  concerns?: string[]; // Các vấn đề da nếu user cung cấp

  @Prop({ type: Object })
  filters?: Record<string, any>; // Các bộ lọc đã áp dụng

  @Prop()
  errorCode?: string; // Mã lỗi nếu có

  @Prop()
  errorMessage?: string; // Thông báo lỗi nếu có
}

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  sessionId: string; // ID phiên chat

  @Prop({ enum: MessageRole, required: true })
  role: MessageRole;

  @Prop({ enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [AttachedProduct], default: [] })
  attachedProducts: AttachedProduct[];

  @Prop({ type: [AttachedCategory], default: [] })
  attachedCategories: AttachedCategory[];

  @Prop({ type: [AttachedBrand], default: [] })
  attachedBrands: AttachedBrand[];

  @Prop({ type: [AttachedEvent], default: [] })
  attachedEvents: AttachedEvent[];

  @Prop({ type: MessageMetadata })
  metadata: MessageMetadata;

  @Prop({ default: false })
  isHelpful?: boolean; // Người dùng đánh giá tin nhắn có hữu ích không

  @Prop()
  feedback?: string; // Phản hồi từ người dùng

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Indexes for better performance
ChatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });
ChatMessageSchema.index({ userId: 1, createdAt: -1 });
ChatMessageSchema.index({ sessionId: 1, createdAt: -1 });
ChatMessageSchema.index({ type: 1 });
ChatMessageSchema.index({ 'metadata.userIntent': 1 });
ChatMessageSchema.index({ isDeleted: 1 }); 