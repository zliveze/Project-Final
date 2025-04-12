import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { WishlistService } from './services/wishlist.service'; // Correct path
import { WishlistController } from './controllers/wishlist.controller'; // Correct path
import { ProfileModule } from './controllers/profile/profile.module';
import { Product, ProductSchema } from '../products/schemas/product.schema'; // Ensure ProductSchema is imported

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema } // Ensure Product schema is registered
    ]),
    // Import ProfileModule using forwardRef to resolve circular dependency
    forwardRef(() => ProfileModule) // Keep ProfileModule if needed elsewhere
  ],
  controllers: [UsersController, WishlistController], // Add WishlistController
  providers: [UsersService, WishlistService], // Add WishlistService
  exports: [UsersService, WishlistService] // Export WishlistService if needed by other modules
})
export class UsersModule { }
