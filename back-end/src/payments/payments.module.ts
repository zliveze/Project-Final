import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { MomoModule } from './momo/momo.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    MomoModule,
  ],
  exports: [
    MongooseModule,
    MomoModule,
  ],
})
export class PaymentsModule {}
