import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { MomoController } from './momo.controller';
import { MomoService } from './momo.service';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { OrdersModule } from '../../orders/orders.module';
import { PendingOrder, PendingOrderSchema } from './schemas/pending-order.schema';
import { CartsModule } from '../../carts/carts.module';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PendingOrder.name, schema: PendingOrderSchema }
    ]),
    OrdersModule,
    CartsModule,
  ],
  controllers: [MomoController],
  providers: [MomoService],
  exports: [MomoService],
})
export class MomoModule {}
