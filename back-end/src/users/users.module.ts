import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
// ProfileService is imported via ProfileModule
import { WishlistService } from './services/wishlist.service';
// UserProfileController is moved to ProfileModule
import { WishlistController } from './controllers/wishlist.controller';
import { ProfileModule } from './controllers/profile/profile.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema }
    ]),
    // Import ProfileModule using forwardRef to resolve circular dependency
    forwardRef(() => ProfileModule)
  ],
  // Remove UserProfileController from here
  controllers: [UsersController, WishlistController],
  // ProfileService is provided by ProfileModule
  providers: [UsersService, WishlistService],
  // UsersService is needed by ProfileModule (via forwardRef)
  exports: [UsersService, WishlistService]
})
export class UsersModule { }
