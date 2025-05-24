import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface VoucherDocument extends Voucher, Document {
  _id: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Voucher {
  @Prop({ required: true, unique: true })
  code: string; // Mã giảm giá

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  discountType: string; // ["percentage", "fixed"]

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 0 })
  minimumOrderValue: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  usageLimit: number; // Tổng số lần sử dụng

  @Prop({ default: 0 })
  usedCount: number; // Số lần đã sử dụng

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  usedByUsers: Types.ObjectId[]; // ID người dùng đã áp dụng voucher

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  applicableProducts: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  applicableCategories: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Brand' }], default: [] })
  applicableBrands: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Event' }], default: [] })
  applicableEvents: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Campaign' }], default: [] })
  applicableCampaigns: Types.ObjectId[];

  @Prop({
    type: {
      all: { type: Boolean, default: true },
      new: { type: Boolean, default: false },
      specific: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
      levels: { type: [String], default: [] }
    },
    default: { all: true, new: false, specific: [], levels: [] }
  })
  applicableUserGroups: {
    all: boolean;
    new: boolean;
    specific: Types.ObjectId[];
    levels: string[];
  };

  @Prop({ default: true })
  isActive: boolean;

  // createdAt and updatedAt are handled by timestamps: true
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);

// Indexing for faster queries
VoucherSchema.index({ endDate: 1 });
VoucherSchema.index({ isActive: 1 });
VoucherSchema.index({ 'applicableUserGroups.all': 1 });
VoucherSchema.index({ 'applicableUserGroups.new': 1 });
VoucherSchema.index({ 'applicableUserGroups.specific': 1 });
