import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CampaignDocument = Campaign & Document;

// Định nghĩa schema cho tổ hợp biến thể trong chiến dịch
export class CombinationInCampaign {
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

// Định nghĩa schema cho biến thể trong chiến dịch
export class VariantInCampaign {
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

  @Prop({ type: [CombinationInCampaign], default: [] })
  combinations: CombinationInCampaign[];
}

// Định nghĩa schema cho sản phẩm trong chiến dịch
export class ProductInCampaign {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  adjustedPrice: number;

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

  @Prop({ type: [VariantInCampaign], default: [] })
  variants: VariantInCampaign[];
}

@Schema({ timestamps: true })
export class Campaign {
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['Hero Banner', 'Sale Event'] })
  type: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: [ProductInCampaign], default: [] })
  products: ProductInCampaign[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);