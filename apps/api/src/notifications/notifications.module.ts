import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

@Global()
@Module({
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService, AdminNotificationsService],
  exports: [NotificationsService, AdminNotificationsService],
})
export class NotificationsModule {}
