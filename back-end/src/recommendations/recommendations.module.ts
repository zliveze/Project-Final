import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsService } from './services/recommendations.service';
import { UserActivityService } from './services/user-activity.service';
import { RecommendationsController } from './controllers/recommendations.controller';
import { UserActivity, UserActivitySchema } from './schemas/user-activity.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    forwardRef(() => ProductsModule),
    UsersModule,
  ],
  providers: [RecommendationsService, UserActivityService],
  controllers: [RecommendationsController],
  exports: [RecommendationsService, UserActivityService],
})
export class RecommendationsModule {}