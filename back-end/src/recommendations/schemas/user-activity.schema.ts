import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';

export enum ActivityType {
  SEARCH = 'search',
  VIEW = 'view',
  CLICK = 'click',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  FILTER_USE = 'filter_use',
}

@Schema({ timestamps: true })
export class UserActivity extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: false })
  productId: Product;

  @Prop({ required: true, enum: Object.values(ActivityType) })
  activityType: ActivityType;

  @Prop({ type: Object, required: false })
  metadata: {
    searchQuery?: string;
    filters?: {
      price?: { min?: number; max?: number };
      categoryIds?: string[];
      brandIds?: string[];
      tags?: string[];
      skinType?: string[];
      concerns?: string[];
    };
    timeSpent?: number; // Thời gian tương tác với sản phẩm (giây)
    variantId?: string; // ID của biến thể sản phẩm (nếu có)
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity); 