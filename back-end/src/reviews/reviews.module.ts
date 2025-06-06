import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// Không cần tạo thư mục khi sử dụng memoryStorage
// const uploadDir = './uploads/reviews';
// if (!fs.existsSync('./uploads')) {
//   fs.mkdirSync('./uploads');
// }
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    CloudinaryModule,
    WebsocketModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
      },
    }),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}