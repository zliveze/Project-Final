import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
  collection: 'categories',
})
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', default: null })
  parentId: string;

  @Prop({ default: 1 })
  level: number;

  @Prop({
    type: {
      url: { type: String, required: true },
      alt: { type: String, required: false },
      publicId: { type: String, required: false },
    },
    required: false,
  })
  image: {
    url: string;
    alt: string;
    publicId: string;
  };

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category); 