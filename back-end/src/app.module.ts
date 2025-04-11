import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './common/mail/mail.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BannersModule } from './banners/banners.module';
import { CloudinaryModule } from './cloudinary';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { BranchesModule } from './branches/branches.module';
import { ProductsModule } from './products/products.module';
import { VouchersModule } from './vouchers/vouchers.module'; // Import VouchersModule
import { EventsModule } from './events/events.module'; // Import EventsModule
import { CampaignsModule } from './campaigns/campaigns.module'; // Import CampaignsModule
import { CartsModule } from './carts/carts.module'; // Import CartsModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    AdminModule,
    MailModule,
    ReviewsModule,
    NotificationsModule,
    BannersModule,
    BrandsModule,
    CloudinaryModule,
    CategoriesModule,
    BranchesModule,
    ProductsModule,
    VouchersModule, // Add VouchersModule here
    EventsModule, // Add EventsModule here
    CampaignsModule, // Add CampaignsModule here
    CartsModule, // Add CartsModule here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
