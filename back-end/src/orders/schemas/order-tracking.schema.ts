import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { OrderStatus } from './order.schema';

export type OrderTrackingDocument = OrderTracking & Document;

// Định nghĩa schema cho trạng thái trong lịch sử theo dõi
@Schema({ _id: false })
export class TrackingHistoryItem {
  @Prop({ 
    type: String, 
    enum: Object.values(OrderStatus), 
    required: true 
  })
  status: OrderStatus;

  @Prop()
  description: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  location: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin' })
  updatedBy: Types.ObjectId;
}

// Định nghĩa schema cho thông tin đơn vị vận chuyển
@Schema({ _id: false })
export class ShippingCarrier {
  @Prop({ required: true, default: 'ViettelPost' })
  name: string;

  @Prop({ required: true })
  trackingNumber: string;

  @Prop()
  trackingUrl: string;
}

// Định nghĩa schema chính cho theo dõi đơn hàng
@Schema({ timestamps: true })
export class OrderTracking {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Order', 
    required: true, 
    unique: true 
  })
  orderId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(OrderStatus), 
    default: OrderStatus.PENDING 
  })
  status: OrderStatus;

  @Prop({ type: String })
  trackingCode: string;

  @Prop({ type: Object })
  carrier: ShippingCarrier;

  @Prop({ type: [{ type: Object }], default: [] })
  history: TrackingHistoryItem[];

  @Prop()
  estimatedDelivery: Date;

  @Prop()
  actualDelivery: Date;

  @Prop({ type: Object })
  details: Record<string, any>; // Lưu trữ thông tin chi tiết từ API Viettel Post
}

export const OrderTrackingSchema = SchemaFactory.createForClass(OrderTracking);

// Tạo các index để tối ưu truy vấn
OrderTrackingSchema.index({ orderId: 1 }, { unique: true });
OrderTrackingSchema.index({ status: 1 });
OrderTrackingSchema.index({ 'carrier.trackingNumber': 1 });
OrderTrackingSchema.index({ createdAt: -1 });
OrderTrackingSchema.index({ estimatedDelivery: 1 });
OrderTrackingSchema.index({ actualDelivery: 1 });
