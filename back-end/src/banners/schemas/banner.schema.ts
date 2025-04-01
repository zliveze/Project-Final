import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true })
  title: string;

  @Prop()
  campaignId: string;

  @Prop({ required: true })
  desktopImage: string;

  @Prop()
  desktopImagePublicId: string;

  @Prop({ required: true })
  mobileImage: string;

  @Prop()
  mobileImagePublicId: string;

  @Prop()
  alt: string;

  @Prop()
  href: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner); 