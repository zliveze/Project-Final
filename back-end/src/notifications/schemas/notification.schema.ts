import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['voucher', 'shipping', 'promotion', 'system'] })
  type: string;

  @Prop()
  link: string;

  @Prop({ required: true, default: 0 })
  priority: number;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  backgroundColor: string;

  @Prop()
  textColor: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification); 