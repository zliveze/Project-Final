import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BrandsModule } from '../brands/brands.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { EventsModule } from '../events/events.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    UsersModule,
    AuthModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '60m', // Thời gian sống của admin token ngắn hơn
        },
      }),
    }),
    forwardRef(() => EventsModule),
    forwardRef(() => CampaignsModule),
  ],
  controllers: [AdminController, AdminUsersController, AdminReviewsController, AdminProductsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 