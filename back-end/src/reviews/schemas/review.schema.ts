import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

// Schema cho hình ảnh đánh giá
export class ReviewImage {
  @Prop({ required: true })
  url: string;

  @Prop()
  alt?: string;

  @Prop()
  publicId?: string;
}

// Mở rộng định nghĩa ReviewDocument để bao gồm _id và timestamps
export interface ReviewDocument extends Review, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Review {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true
  })
  userId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true
  })
  productId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ProductVariant'
  })
  variantId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productImage: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [{ type: Object }], default: [] })
  images: ReviewImage[];

  @Prop({ default: 0 })
  likes: number;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: []
  })
  likedBy: Types.ObjectId[];

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata: Record<string, any>;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Thêm các indexes để tối ưu hóa truy vấn
ReviewSchema.index({ userId: 1 }); // Index cho truy vấn tìm reviews theo người dùng
ReviewSchema.index({ productId: 1 }); // Index cho truy vấn tìm reviews theo sản phẩm
ReviewSchema.index({ status: 1 }); // Index cho truy vấn lọc theo trạng thái
ReviewSchema.index({ rating: 1 }); // Index cho truy vấn lọc theo rating
ReviewSchema.index({ createdAt: -1 }); // Index cho sắp xếp theo thời gian tạo
ReviewSchema.index({ isDeleted: 1 }); // Index cho lọc những review đã xóa
ReviewSchema.index({ productId: 1, status: 1 }); // Compound index cho truy vấn phổ biến
ReviewSchema.index({ productId: 1, status: 1, isDeleted: 1 }); // Compound index toàn diện
ReviewSchema.index({ userId: 1, isDeleted: 1 }); // Compound index cho truy vấn người dùng
ReviewSchema.index({ productId: 1, rating: 1, status: 1 }); // Compound index cho phân tích rating