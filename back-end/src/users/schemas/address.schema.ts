import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose'; // Import Types

// Cập nhật AddressDocument để bao gồm _id
export type AddressDocument = Address & Document & { _id: Types.ObjectId };

@Schema({ _id: true, timestamps: true })
export class Address {
  // Khai báo _id để TypeScript nhận biết
  _id: Types.ObjectId;

  // addressId không cần thiết vì Mongoose sẽ tự tạo _id
  // @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  // addressId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  addressLine: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  state?: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  postalCode?: string;

  @Prop({ default: false })
  isDefault?: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

// Nếu cần tạo index
// AddressSchema.index({ /* fields */ });
