import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsService } from './brands.service';
import { BrandsAdminController } from './brands-admin.controller';
import { BrandsUserController } from './brands-user.controller';
import { Brand, BrandSchema } from './schemas/brand.schema';
import { CloudinaryModule } from '../cloudinary';
import { ProductsModule } from '../products/products.module'; // Import ProductsModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Brand.name, schema: BrandSchema },
    ]),
    CloudinaryModule,
    ProductsModule, // Add ProductsModule here
  ],
  controllers: [BrandsAdminController, BrandsUserController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
