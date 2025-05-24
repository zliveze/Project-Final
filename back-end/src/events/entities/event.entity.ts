import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Định nghĩa schema cho tổ hợp biến thể trong sự kiện
export class CombinationInEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  combinationId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  attributes: Record<string, string>;

  @Prop()
  combinationPrice: number;

  @Prop({ required: true })
  adjustedPrice: number;

  @Prop()
  originalPrice: number;
}

// Định nghĩa schema cho biến thể trong sự kiện
export class VariantInEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductVariant' })
  variantId: MongooseSchema.Types.ObjectId;

  @Prop()
  variantName: string;

  @Prop()
  variantSku: string;

  @Prop({ type: Object })
  variantAttributes: Record<string, string>;

  @Prop()
  variantPrice: number;

  @Prop({ required: true })
  adjustedPrice: number;

  @Prop()
  originalPrice: number;

  @Prop()
  image: string;

  @Prop({ type: [CombinationInEvent], default: [] })
  combinations: CombinationInEvent[];
}

// Định nghĩa schema cho sản phẩm trong sự kiện
export class ProductInEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  adjustedPrice: number;

  @Prop()
  name: string;

  @Prop()
  slug: string;

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

  @Prop({ type: [VariantInEvent], default: [] })
  variants: VariantInEvent[];
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