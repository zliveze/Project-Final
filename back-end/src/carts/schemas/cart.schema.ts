import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose'; // Import Types
import { User } from '../../users/schemas/user.schema'; // Assuming you have a User schema
import { Product } from '../../products/schemas/product.schema'; // Assuming you have a Product schema
// Remove unused Variant import
// import { Variant } from '../../products/schemas/variant.schema';

export type CartDocument = Cart & Document;

@Schema({ _id: false }) // No separate _id for subdocument
export class CartItem { // Add export here
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) // Use Types.ObjectId
  productId: Types.ObjectId;

  @Prop({ type: String, default: '' }) // Optional for products without variants
  variantId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ type: Object }) // Flexible options
  selectedOptions: Record<string, string>;

  @Prop({ required: true })
  price: number; // Store the price at the time of adding to cart
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: User | MongooseSchema.Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  totalAmount: number; // This will likely be calculated dynamically
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Calculate totalAmount before saving (optional, can also be done in service)
// CartSchema.pre<CartDocument>('save', function (next) {
//   this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   next();
// });
