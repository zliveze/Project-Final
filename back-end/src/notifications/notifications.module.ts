import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsAdminController } from './notifications-admin.controller';
import { NotificationsUserController } from './notifications-user.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationsAdminController, NotificationsUserController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {} 