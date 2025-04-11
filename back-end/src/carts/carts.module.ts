// back-end/src/carts/carts.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for guards
import { ProductsModule } from '../products/products.module'; // Import ProductsModule for models

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: Cart.name, schema: CartSchema }
        // Product and Variant models are provided by ProductsModule via its exports
    ]),
    AuthModule, // Make AuthModule exports (like JwtStrategy/Guard) available
    ProductsModule, // Make ProductsModule exports (like ProductModel, VariantModel) available
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService] // Export service if needed by other modules (e.g., OrdersModule)
})
export class CartsModule {}
