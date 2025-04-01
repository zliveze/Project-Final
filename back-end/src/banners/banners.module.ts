import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannersService } from './banners.service';
import { BannersAdminController } from './banners-admin.controller';
import { BannersUserController } from './banners-user.controller';
import { Banner, BannerSchema } from './schemas/banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
    ]),
  ],
  controllers: [BannersAdminController, BannersUserController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}