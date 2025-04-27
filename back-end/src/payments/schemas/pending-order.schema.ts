import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type PendingOrderDocument = PendingOrder & Document;

@Schema({ timestamps: true })
export class PendingOrder {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  orderData: MongooseSchema.Types.Mixed;

  @Prop({ required: true })
  requestId: string;

  @Prop({ required: false })
  momoOrderId: string;

  @Prop()
  stripeSessionId: string;

  @Prop()
  stripePaymentIntentId: string;

  @Prop({ type: Date, default: Date.now, expires: 3600 }) // Tự động xóa sau 1 giờ
  createdAt: Date;
}

export const PendingOrderSchema = SchemaFactory.createForClass(PendingOrder);
