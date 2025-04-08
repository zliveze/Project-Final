import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsAdminController } from './products-admin.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
    CloudinaryModule,
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
  exports: [ProductsService],
})
export class ProductsModule {}
