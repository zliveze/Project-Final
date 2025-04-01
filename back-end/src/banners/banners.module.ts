import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannersService } from './banners.service';
import { BannersAdminController } from './banners-admin.controller';
import { BannersUserController } from './banners-user.controller';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [BannersAdminController, BannersUserController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}