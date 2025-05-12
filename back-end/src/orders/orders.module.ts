import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersUserController } from './orders-user.controller';
import { ShippingController } from './shipping.controller';
import { WebhookController } from './webhook.controller'; // Import WebhookController
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderTracking, OrderTrackingSchema } from './schemas/order-tracking.schema';
import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from '../products/products.module';
import { BranchesModule } from '../branches/branches.module'; // Import BranchesModule
import { VouchersModule } from '../vouchers/vouchers.module'; // Import VouchersModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderTracking.name, schema: OrderTrackingSchema },
    ]),
    SharedModule, // Import SharedModule để sử dụng ViettelPostService
    ConfigModule, // Import ConfigModule để sử dụng ConfigService
    ProductsModule, // Import ProductsModule để sử dụng ProductsService
    BranchesModule, // Add BranchesModule here
    VouchersModule, // Import VouchersModule
  ],
  controllers: [OrdersAdminController, OrdersUserController, ShippingController, WebhookController], // Add WebhookController
  providers: [OrdersService],
  exports: [
    OrdersService,
    MongooseModule // Export MongooseModule để các module khác có thể inject OrderModel
  ],
})
export class OrdersModule {}
