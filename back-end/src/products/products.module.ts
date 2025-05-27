import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
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
import { WebsocketModule } from '../websocket/websocket.module'; // Import WebsocketModule
import { CampaignsModule } from '../campaigns/campaigns.module'; // Import CampaignsModule
import { RecommendationsModule } from '../recommendations/recommendations.module'; // Import RecommendationsModule

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
    WebsocketModule, // Add WebsocketModule here
    CampaignsModule, // Add CampaignsModule here
    forwardRef(() => RecommendationsModule), // Add RecommendationsModule with circular dependency protection
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads');
          const fs = require('fs');

          console.log(`Upload path: ${uploadPath}`);

          if (!fs.existsSync(uploadPath)) {
            console.log(`Creating directory: ${uploadPath}`);
            try {
              fs.mkdirSync(uploadPath, { recursive: true, mode: 0o777 });
              console.log(`Directory created successfully`);
            } catch (error) {
              console.error(`Error creating directory: ${error.message}`);
            }
          } else {
            console.log(`Directory already exists`);
            try {
              fs.accessSync(uploadPath, fs.constants.W_OK);
              console.log(`Directory is writable`);
            } catch (error) {
              console.error(`Directory is not writable: ${error.message}`);
            }
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-');
          console.log(`Generated filename: ${filename}`);
          cb(null, filename);
        },
      }),
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
