import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { PendingOrder, PendingOrderSchema } from '../schemas/pending-order.schema';
import { OrdersModule } from '../../orders/orders.module';
import { CartsModule } from '../../carts/carts.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PendingOrder.name, schema: PendingOrderSchema },
    ]),
    OrdersModule,
    CartsModule,
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
