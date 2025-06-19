import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsAdminController } from './products-admin.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { Variant, VariantSchema } from './schemas/variant.schema'; // Import Variant schema
import { Brand, BrandSchema } from '../brands/schemas/brand.schema'; // Import Brand schema
import { Category, CategorySchema } from '../categories/schemas/category.schema'; // Import Category schema
import { Branch, BranchSchema } from '../branches/schemas/branch.schema'; // Import Branch schema
import { Order, OrderSchema } from '../orders/schemas/order.schema'; // Import Order schema
import { CloudinaryModule } from '../cloudinary';
import { EventsModule } from '../events/events.module'; // Import EventsModule
import { CampaignsModule } from '../campaigns/campaigns.module'; // Import CampaignsModule
import { RecommendationsModule } from '../recommendations/recommendations.module'; // Import RecommendationsModule
import { TasksModule } from '../tasks/tasks.module'; // Import TasksModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Variant.name, schema: VariantSchema }, // Register Variant schema
      { name: Brand.name, schema: BrandSchema }, // Register Brand schema
      { name: Category.name, schema: CategorySchema }, // Register Category schema
      { name: Branch.name, schema: BranchSchema }, // Register Branch schema
      { name: Order.name, schema: OrderSchema }, // Register Order schema
    ]),
    CloudinaryModule,
    EventsModule, // Add EventsModule here
    CampaignsModule, // Add CampaignsModule here
    forwardRef(() => RecommendationsModule), // Add RecommendationsModule with circular dependency protection
    TasksModule, // Add TasksModule here
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|jpg)$/)) {
          return cb(new Error('Chỉ hỗ trợ file hình ảnh (JPG, PNG, GIF)'), false);
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [ProductsController, ProductsAdminController],
  providers: [ProductsService],
  // Export MongooseModule to make ProductModel and VariantModel available to other modules
  exports: [ProductsService, MongooseModule],
})
export class ProductsModule {}
