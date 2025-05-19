import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export class ProductInEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductVariant' })
  variantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  combinationId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  adjustedPrice: number;

  @Prop({ type: Object })
  variantAttributes: Record<string, string>;

  // Thêm các trường mới
  @Prop()
  name: string;

  @Prop()
  image: string;

  @Prop()
  originalPrice: number;

  @Prop()
  sku: string;

  @Prop()
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  brandId: MongooseSchema.Types.ObjectId;

  @Prop()
  brand: string;

  @Prop()
  variantName: string;

  @Prop()
  variantSku: string;

  @Prop()
  variantPrice: number;

  @Prop()
  combinationPrice: number;
}

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: [ProductInEvent], default: [] })
  products: ProductInEvent[];
}

export const EventSchema = SchemaFactory.createForClass(Event);