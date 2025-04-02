import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({
  timestamps: true,
  collection: 'brands',
})
export class Brand {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    type: {
      url: { type: String, required: true },
      alt: { type: String, required: false },
      publicId: { type: String, required: false },
    },
    required: true,
  })
  logo: {
    url: string;
    alt: string;
    publicId: string;
  };

  @Prop()
  origin: string;

  @Prop()
  website: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: string;

  @Prop({
    type: {
      facebook: { type: String, required: false },
      instagram: { type: String, required: false },
      youtube: { type: String, required: false },
    },
    default: {},
  })
  socialMedia: {
    facebook: string;
    instagram: string;
    youtube: string;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const BrandSchema = SchemaFactory.createForClass(Brand); 