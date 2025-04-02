import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoriesAdminController } from './categories-admin.controller';
import { CategoriesUserController } from './categories-user.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
    CloudinaryModule
  ],
  controllers: [CategoriesAdminController, CategoriesUserController],
  providers: [CategoriesService],
  exports: [CategoriesService]
})
export class CategoriesModule {}
