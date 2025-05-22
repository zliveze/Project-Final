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
import { OrdersModule } from './orders/orders.module'; // Import OrdersModule
import { PaymentsModule } from './payments/payments.module'; // Import PaymentsModule
import { CommonModule } from './common/common.module';
import { WebsocketModule } from './websocket/websocket.module'; // Import WebsocketModule
import { SharedModule } from './shared/shared.module'; // Import SharedModule
import { RecommendationsModule } from './recommendations/recommendations.module'; // Import RecommendationsModule
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserActivityInterceptor } from './recommendations/interceptors/user-activity.interceptor';

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
    OrdersModule, // Add OrdersModule here
    PaymentsModule, // Add PaymentsModule here
    CommonModule,
    WebsocketModule, // Add WebsocketModule here
    SharedModule, // Add SharedModule here
    RecommendationsModule, // Add RecommendationsModule here
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserActivityInterceptor,
    },
  ],
})
export class AppModule {}
