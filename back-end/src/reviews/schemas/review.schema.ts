import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

// Schema cho hình ảnh đánh giá
export class ReviewImage {
  @Prop({ required: true })
  url: string;

  @Prop()
  alt: string;
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