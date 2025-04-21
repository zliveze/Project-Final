import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Cập nhật AddressDocument để bao gồm _id
export type AddressDocument = Address & Document & { _id: Types.ObjectId };

@Schema({ _id: true, timestamps: true })
export class Address {
  // Khai báo _id để TypeScript nhận biết
  _id: Types.ObjectId;

  @Prop({ required: true })
  addressLine: string;

  @Prop({ required: true })
  wardName: string;

  @Prop({ required: true })
  wardCode: string;

  @Prop({ required: true })
  districtName: string;

  @Prop({ required: true })
  districtCode: string;

  @Prop({ required: true })
  provinceName: string;

  @Prop({ required: true })
  provinceCode: string;

  @Prop()
  postalCode?: string;

  @Prop({ default: 'Việt Nam' })
  country: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
