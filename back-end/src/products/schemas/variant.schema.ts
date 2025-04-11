// back-end/src/products/schemas/variant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from './product.schema'; // Reference the Product schema

export type VariantDocument = Variant & Document;

@Schema({ timestamps: true })
export class Variant {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Product | MongooseSchema.Types.ObjectId;

  @Prop({ type: Object, required: true }) // e.g., { color: 'Red', size: 'M' }
  options: Record<string, string>;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ unique: true, sparse: true }) // Optional SKU, unique if provided
  sku?: string;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);

// Compound index for faster lookups based on product and options
VariantSchema.index({ productId: 1, options: 1 }, { unique: true });
