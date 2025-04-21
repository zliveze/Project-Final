import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({
  timestamps: true,
  collection: 'branches',
})
export class Branch {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  contact: string;

  @Prop({ required: true }) // Mã tỉnh/thành phố theo ViettelPost
  provinceCode: string;

  @Prop({ required: true }) // Mã quận/huyện theo ViettelPost
  districtCode: string;

  @Prop({ required: true }) // Mã phường/xã theo ViettelPost
  wardCode: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
