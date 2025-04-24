import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['cod', 'bank_transfer', 'credit_card', 'stripe', 'momo'] })
  method: string;

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  status: string;

  @Prop()
  transactionId: string;

  @Prop()
  requestId: string;

  @Prop()
  momoOrderId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  paymentDetails: Record<string, any>;

  @Prop({ type: [{ type: Object }], default: [] })
  refundHistory: Array<{
    amount: number;
    reason: string;
    status: string;
    processedAt: Date;
  }>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Tạo các index để tối ưu truy vấn
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ method: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ requestId: 1 });
PaymentSchema.index({ momoOrderId: 1 });
PaymentSchema.index({ transactionId: 1 });

// Compound indexes
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ method: 1, status: 1 });
