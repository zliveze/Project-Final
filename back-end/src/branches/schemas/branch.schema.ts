import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({
  timestamps: true,
  collection: 'branches',
})
export class Branch {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, index: true })
  address: string;

  @Prop({ index: true })
  contact: string;

  @Prop({ required: true, index: true })
  provinceCode: string;

  @Prop({ required: true, index: true })
  districtCode: string;

  @Prop({ required: true, index: true })
  wardCode: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

// Compound indexes for better search performance
BranchSchema.index({ name: 'text', address: 'text', contact: 'text' });
BranchSchema.index({ provinceCode: 1, districtCode: 1, wardCode: 1 });
BranchSchema.index({ createdAt: -1 });
BranchSchema.index({ updatedAt: -1 });
