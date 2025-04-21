import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ViettelPostTokenDocument = ViettelPostToken & Document;

@Schema({
  timestamps: true,
})
export class ViettelPostToken {
  @Prop({ required: true })
  token: string;

  @Prop()
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ViettelPostTokenSchema = SchemaFactory.createForClass(ViettelPostToken); 