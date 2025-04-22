import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentMethod {
  COD = 'cod',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  STRIPE = 'stripe',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Định nghĩa schema cho sản phẩm trong đơn hàng
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Variant' })
  variantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: Object })
  options: Record<string, string>;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}

// Định nghĩa schema cho voucher trong đơn hàng
@Schema({ _id: false })
export class OrderVoucher {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Voucher' })
  voucherId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  discountAmount: number;

  @Prop()
  code: string;
}

// Định nghĩa schema cho địa chỉ giao hàng
@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  addressLine1: string;

  @Prop()
  addressLine2: string;

  @Prop({ required: true })
  ward: string;

  @Prop()
  wardCode: string;

  @Prop({ required: true })
  district: string;

  @Prop()
  districtCode: string;

  @Prop({ required: true })
  province: string;

  @Prop()
  provinceCode: string;

  @Prop()
  postalCode: string;

  @Prop({ default: 'Vietnam' })
  country: string;
}

// Định nghĩa schema chính cho đơn hàng
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User | Types.ObjectId;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: [{ type: Object }], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number; // Tổng tiền sản phẩm trước thuế và phí

  @Prop({ min: 0, default: 0 })
  tax: number;

  @Prop({ min: 0, default: 0 })
  shippingFee: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number; // Tổng tiền trước khi áp dụng voucher

  @Prop({ type: Object })
  voucher: OrderVoucher;

  @Prop({ required: true, min: 0 })
  finalPrice: number; // Tổng tiền sau khi áp dụng voucher

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Prop({ type: Object, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.COD
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentId: string; // ID giao dịch thanh toán (nếu có)

  @Prop()
  trackingCode: string; // Mã vận đơn

  @Prop()
  shippingServiceCode: string; // Mã dịch vụ vận chuyển

  @Prop()
  notes: string; // Ghi chú của khách hàng

  @Prop({ type: Object })
  metadata: Record<string, any>; // Dữ liệu bổ sung
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Tạo các index để tối ưu truy vấn
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentMethod: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ 'items.productId': 1 });
OrderSchema.index({ trackingCode: 1 });

// Compound indexes
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentMethod: 1, paymentStatus: 1 });
