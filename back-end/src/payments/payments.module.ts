import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { MomoModule } from './momo/momo.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    MomoModule,
    StripeModule,
  ],
  exports: [
    MongooseModule,
    MomoModule,
    StripeModule,
  ],
})
export class PaymentsModule {}
