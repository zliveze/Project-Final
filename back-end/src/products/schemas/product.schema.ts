import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

// Schema for product image
export class ProductImage {
  @Prop({ required: true })
  url: string;

  @Prop()
  alt: string;

  @Prop()
  publicId: string;

  @Prop({ default: false })
  isPrimary: boolean;
}

// Schema for product variant options
export class VariantOptions {
  @Prop()
  color: string;

  @Prop({ type: [String], default: [] }) // Array of shade options
  shades: string[];

  @Prop({ type: [String], default: [] }) // Array of size options
  sizes: string[];
}

// Schema for variant combination
export class VariantCombination {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  combinationId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  attributes: Record<string, string>; // Ví dụ: { shade: 'Đỏ', size: 'Mini' }

  @Prop({ type: Number })
  price: number; // Giá riêng cho tổ hợp

  @Prop({ type: Number, default: 0 })
  additionalPrice: number; // Giá chênh lệch so với biến thể gốc (tùy chọn)

  @Prop({ type: Number })
  promotionPrice: number; // Giá khuyến mãi

  @Prop({
    type: {
      type: { type: String, enum: ['event', 'campaign'] },
      id: { type: String },
      name: { type: String },
      adjustedPrice: { type: Number }
    }
  })
  promotion: {
    type: 'event' | 'campaign';
    id: string;
    name: string;
    adjustedPrice: number;
  };
}

// Schema for product variant
export class ProductVariant {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  variantId: Types.ObjectId;

  @Prop({ required: true, unique: true, sparse: true })
  sku: string;

  @Prop()
  name: string;

  @Prop({ type: VariantOptions })
  options: VariantOptions;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Number })
  promotionPrice: number; // Giá khuyến mãi

  @Prop({
    type: {
      type: { type: String, enum: ['event', 'campaign'] },
      id: { type: String },
      name: { type: String },
      adjustedPrice: { type: Number }
    }
  })
  promotion: {
    type: 'event' | 'campaign';
    id: string;
    name: string;
    adjustedPrice: number;
  };

  @Prop({ type: [ProductImage] })
  images: ProductImage[];

  @Prop({ type: [VariantCombination], default: [] })
  combinations: VariantCombination[]; // Mảng tổ hợp biến thể
}

// Schema for product inventory
export class ProductInventory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ default: 5 })
  lowStockThreshold: number;
}

// Schema for variant inventory
export class VariantInventory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  variantId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ default: 5 })
  lowStockThreshold: number;
}

// Schema for combination inventory
export class CombinationInventory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  variantId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  combinationId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ default: 5 })
  lowStockThreshold: number;
}

// Schema for product description
export class ProductDescription {
  @Prop()
  short: string;

  @Prop()
  full: string;
}

// Schema for product SEO
export class ProductSEO {
  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];
}

// Schema for product cosmetic info
export class CosmeticInfo {
  @Prop({ type: [String], default: [] })
  skinType: string[];

  @Prop({ type: [String], default: [] })
  concerns: string[];

  @Prop({ type: [String], default: [] })
  ingredients: string[];

  @Prop({
    type: {
      value: { type: Number },
      unit: { type: String },
    },
  })
  volume: {
    value: number;
    unit: string;
  };

  @Prop()
  usage: string;

  @Prop()
  madeIn: string;

  @Prop({
    type: {
      shelf: { type: Number },
      afterOpening: { type: Number },
    },
  })
  expiry: {
    shelf: number;
    afterOpening: number;
  };
}

// Schema for product flags
export class ProductFlags {
  @Prop({ default: false })
  isBestSeller: boolean;

  @Prop({ default: false })
  isNew: boolean;

  @Prop({ default: false })
  isOnSale: boolean;

  @Prop({ default: false })
  hasGifts: boolean;
}

// Schema for product gift conditions
export class GiftConditions {
  @Prop({ type: Number })
  minPurchaseAmount: number;

  @Prop({ type: Number })
  minQuantity: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Number })
  limitedQuantity: number;
}

// Schema for product gift
export class ProductGift {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  giftId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    type: {
      url: { type: String },
      alt: { type: String },
    },
  })
  image: {
    url: string;
    alt: string;
  };

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ type: Number })
  value: number;

  @Prop({ enum: ['product', 'sample', 'voucher', 'other'], default: 'product' })
  type: string;

  @Prop({ type: GiftConditions })
  conditions: GiftConditions;

  @Prop({ enum: ['active', 'inactive', 'out_of_stock'], default: 'active' })
  status: string;
}

// Schema for product reviews
export class ProductReviews {
  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  reviewCount: number;
}

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ sparse: true }) // Mã vạch, có thể không phải sản phẩm nào cũng có
  barcode?: string;

  @Prop({ type: ProductDescription })
  description: ProductDescription;

  @Prop({ type: ProductSEO })
  seo: ProductSEO;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ type: Number })
  currentPrice: number;

  @Prop({ type: Number, default: 0 }) // Giá vốn của sản phẩm
  costPrice?: number;

  @Prop({ enum: ['active', 'out_of_stock', 'discontinued'], default: 'active' })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand' })
  brandId: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }] })
  categoryIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: CosmeticInfo })
  cosmetic_info: CosmeticInfo;

  @Prop({ type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ type: [ProductImage], default: [] })
  images: ProductImage[];

  @Prop({ type: [ProductInventory], default: [] })
  inventory: ProductInventory[];

  @Prop({ type: [VariantInventory], default: [] })
  variantInventory: VariantInventory[];

  @Prop({ type: [CombinationInventory], default: [] })
  combinationInventory: CombinationInventory[];

  @Prop({ type: ProductReviews, default: {} })
  reviews: ProductReviews;

  @Prop({ type: ProductFlags, default: {} })
  flags: ProductFlags;

  @Prop({ type: [ProductGift], default: [] })
  gifts: ProductGift[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }] })
  relatedProducts: Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }] })
  relatedEvents: Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Campaign' }] })
  relatedCampaigns: Types.ObjectId[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Number, default: 0 })
  soldCount: number;

  @Prop({ type: Number }) // Trọng lượng
  weightValue?: number;

  @Prop() // Đơn vị trọng lượng, ví dụ: 'g', 'kg'
  weightUnit?: string;

  @Prop({ type: Number, default: 0 }) // Điểm tích lũy
  loyaltyPoints?: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Add text index for search functionality
ProductSchema.index(
  {
    name: 'text',
    'description.short': 'text',
    'description.full': 'text',
    'tags': 'text',
    'cosmetic_info.ingredients': 'text'
  },
  {
    weights: {
      name: 10,
      'description.short': 5,
      'description.full': 3,
      'tags': 2,
      'cosmetic_info.ingredients': 1
    }
  }
);

// Add single field indexes for common query fields
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ name: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ currentPrice: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryIds: 1 });
ProductSchema.index({ 'flags.isBestSeller': 1 });
ProductSchema.index({ 'flags.isNew': 1 });
ProductSchema.index({ 'flags.isOnSale': 1 });
ProductSchema.index({ 'flags.hasGifts': 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ updatedAt: -1 });

// Add compound indexes for common query combinations
ProductSchema.index({ status: 1, brandId: 1 });
ProductSchema.index({ status: 1, categoryIds: 1 });
ProductSchema.index({ status: 1, 'flags.isBestSeller': 1 });
ProductSchema.index({ status: 1, 'flags.isNew': 1 });
ProductSchema.index({ status: 1, 'flags.isOnSale': 1 });
ProductSchema.index({ price: 1, status: 1 });
