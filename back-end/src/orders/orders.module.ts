import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersUserController } from './orders-user.controller';
import { ShippingController } from './shipping.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderTracking, OrderTrackingSchema } from './schemas/order-tracking.schema';
import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderTracking.name, schema: OrderTrackingSchema },
    ]),
    SharedModule, // Import SharedModule để sử dụng ViettelPostService
    ConfigModule, // Import ConfigModule để sử dụng ConfigService
    ProductsModule, // Import ProductsModule để sử dụng ProductsService
  ],
  controllers: [OrdersAdminController, OrdersUserController, ShippingController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
