import { Module, forwardRef } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { UserProfileController } from '../user-profile/user-profile.controller'; // Import UserProfileController
import { ProfileService } from '../../services/profile.service';
import { UsersModule } from '../../users.module';

@Module({
  imports: [forwardRef(() => UsersModule)], // Still need UsersModule for ProfileService dependency
  controllers: [ProfileController, UserProfileController], // Add UserProfileController here
  providers: [ProfileService],
  exports: [ProfileService]
})
export class ProfileModule {}
