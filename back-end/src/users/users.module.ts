import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { ProfileService } from './services/profile.service';
import { UserProfileController } from './controllers/user-profile/user-profile.controller';
import { ProfileModule } from './controllers/profile/profile.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProfileModule
  ],
  // Đảo ngược thứ tự: UserProfileController trước UsersController
  controllers: [UserProfileController, UsersController], 
  providers: [UsersService, ProfileService],
  exports: [UsersService, ProfileService]
})
export class UsersModule { }
