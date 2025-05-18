import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CampaignDocument = Campaign & Document;

class CampaignProduct {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Product' })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductVariant' })
  variantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true })
  adjustedPrice: number;
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

  @Prop({ type: [CampaignProduct], default: [] })
  products: CampaignProduct[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);